import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Building2,
  TrendingUp,
  Receipt,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye,
  Download,
  Filter,
  Search,
  Calendar,
  CreditCard,
  X,
  Package,
  Layers,
  Sparkles,
  Printer,
  ChevronRight,
  ArrowUpRight,
  ArrowRightLeft,
  Banknote,
  Users,
  FileSpreadsheet,
  Clock,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompanySettings, CustomsSettlement } from '../types';
import { calculateSettlementMetrics } from '../utils/formatters';
import { exportToExcel } from '../utils/excelExporter';

// ==========================================
// 📋 MODELO DE DATOS Y TIPOS (TypeScript)
// ==========================================

export interface CompanyInfo {
  ruc: string;
  razonSocial: string;
  direccion: string;
  telefono: string;
  correo: string;
  logoText?: string;
}

export interface ClientInfo {
  id: string;
  ruc: string;
  razonSocial: string;
  direccion: string;
  telefono: string;
}

export interface PaymentDetail {
  id: string;
  fecha: string; // YYYY-MM-DD
  numLiquidacion?: string; // N° de Liquidación vinculada (ej. "001/2026")
  concepto: string; // Concepto del pago (ej. "Anticipo de tributos aduaneros", "Despacho #1")
  detallePago: string; // Detalle: Banco y N° de transacción o N° de Recibo de Caja
  metodoPago: 'Transferencia' | 'Efectivo' | string;
  monto: number; // Valor (Gs.)
}

export interface Settlement {
  id: string;
  numLiquidacion: string; // ej. "001/2026"
  fecha: string;
  cliente: ClientInfo;
  volumenDespachos: number;
  montoTotalGeneral: number;
  montoRecibido: number;
  pagos: PaymentDetail[];
  estado: 'PENDIENTE' | 'PAGADO' | 'SALDO_A_FAVOR';
}

export const DEFAULT_LG_COMPANY: CompanyInfo = {
  razonSocial: 'LG Logística Aduanera',
  ruc: '80045219-4',
  direccion: 'Avda. Monseñor Rodríguez Km 4.5, Ciudad del Este — Paraguay',
  telefono: '+595 61 570 120 / +595 983 450 900',
  correo: 'operaciones@lgaduanas.com.py',
  logoText: 'LG',
};

// ==========================================
// 🇵🇾 DATOS MOCK REALISTAS DE PARAGUAY (PYG)
// ==========================================

const CLIENTES_MOCK: ClientInfo[] = [
  {
    id: 'cli-1',
    ruc: '80019284-3',
    razonSocial: 'PETRA Import & Export S.R.L.',
    direccion: 'Av. Aviadores del Chaco 2050, Complejo WTC Torre 2, Asunción',
    telefono: '+595 21 620 900',
  },
  {
    id: 'cli-2',
    ruc: '80023491-7',
    razonSocial: 'Laboratorios Farmacéuticos del Paraná S.A.E.C.A.',
    direccion: 'Ruta PY02 Km 14, San Lorenzo',
    telefono: '+595 21 588 300',
  },
  {
    id: 'cli-3',
    ruc: '80071209-5',
    razonSocial: 'Agroindustrial del Este S.A.',
    direccion: 'Supercarretera Km 8, Hernandarias — Alto Paraná',
    telefono: '+595 61 599 100',
  },
  {
    id: 'cli-4',
    ruc: '80034981-2',
    razonSocial: 'Comercializadora Guaraní de Alimentos S.A.',
    direccion: 'Av. Eusebio Ayala 3450, Asunción',
    telefono: '+595 21 511 400',
  },
  {
    id: 'cli-5',
    ruc: '80088921-6',
    razonSocial: 'Tecnología & Redes del Chaco S.A.',
    direccion: 'Teniente Fariña 820, Fernando de la Mora',
    telefono: '+595 21 520 850',
  },
  {
    id: 'cli-6',
    ruc: '80067420-1',
    razonSocial: 'Comercial San Roque S.R.L. (Ejemplo Audio)',
    direccion: 'Ruta PY01 Km 20, Capiatá — Central',
    telefono: '+595 21 570 330',
  },
];

export const SETTLEMENTS_MOCK: Settlement[] = [
  {
    id: 's-001',
    numLiquidacion: '001/2026',
    fecha: '2026-01-18',
    cliente: CLIENTES_MOCK[0],
    volumenDespachos: 4,
    montoTotalGeneral: 18500000,
    montoRecibido: 18500000,
    estado: 'PAGADO',
    pagos: [
      {
        id: 'p-101',
        fecha: '2026-01-10',
        numLiquidacion: '001/2026',
        concepto: 'Anticipo tributos aduaneros y tasas',
        detallePago: 'Banco Itaú — Transacción SIPAP #147772927',
        metodoPago: 'Transferencia',
        monto: 10000000,
      },
      {
        id: 'p-102',
        fecha: '2026-01-18',
        numLiquidacion: '001/2026',
        concepto: 'Cancelación saldo final despacho',
        detallePago: 'Banco Itaú — Transacción SIPAP #147890212',
        metodoPago: 'Transferencia',
        monto: 8500000,
      },
    ],
  },
  {
    id: 's-002',
    numLiquidacion: '002/2026',
    fecha: '2026-02-12',
    cliente: CLIENTES_MOCK[1],
    volumenDespachos: 6,
    montoTotalGeneral: 42295242,
    montoRecibido: 42295242,
    estado: 'PAGADO',
    pagos: [
      {
        id: 'p-201',
        fecha: '2026-02-05',
        numLiquidacion: '002/2026',
        concepto: 'Anticipo derechos aduaneros y tasas DINAC',
        detallePago: 'Banco Continental — Transacción SIPAP #99418204',
        metodoPago: 'Transferencia',
        monto: 25000000,
      },
      {
        id: 'p-202',
        fecha: '2026-02-12',
        numLiquidacion: '002/2026',
        concepto: 'Honorarios profesionales y gastos operativos',
        detallePago: 'Banco Continental — Transacción SIPAP #99422019',
        metodoPago: 'Transferencia',
        monto: 17295242,
      },
    ],
  },
  {
    id: 's-003',
    numLiquidacion: '003/2026',
    fecha: '2026-03-22',
    cliente: CLIENTES_MOCK[2],
    volumenDespachos: 3,
    montoTotalGeneral: 26800000,
    montoRecibido: 20000000,
    estado: 'PENDIENTE',
    pagos: [
      {
        id: 'p-301',
        fecha: '2026-03-15',
        numLiquidacion: '003/2026',
        concepto: 'Anticipo importación implementos agrícolas',
        detallePago: 'Banco Sudameris — Transacción #8812903',
        metodoPago: 'Transferencia',
        monto: 20000000,
      },
    ],
  },
  {
    id: 's-004',
    numLiquidacion: '004/2026',
    fecha: '2026-04-14',
    cliente: CLIENTES_MOCK[3],
    volumenDespachos: 5,
    montoTotalGeneral: 31200000,
    montoRecibido: 32000000,
    estado: 'SALDO_A_FAVOR',
    pagos: [
      {
        id: 'p-401',
        fecha: '2026-04-08',
        numLiquidacion: '004/2026',
        concepto: 'Anticipo contingencia y tributos aduaneros',
        detallePago: 'Banco GNB — Transacción #7731290',
        metodoPago: 'Transferencia',
        monto: 20000000,
      },
      {
        id: 'p-402',
        fecha: '2026-04-14',
        numLiquidacion: '004/2026',
        concepto: 'Cobro de ajuste de liquidación en caja',
        detallePago: 'Recibo Oficial de Caja Nº 00482 — Tesorería Central',
        metodoPago: 'Efectivo',
        monto: 12000000,
      },
    ],
  },
  {
    id: 's-005',
    numLiquidacion: '005/2026',
    fecha: '2026-05-20',
    cliente: CLIENTES_MOCK[4],
    volumenDespachos: 2,
    montoTotalGeneral: 15400000,
    montoRecibido: 10000000,
    estado: 'PENDIENTE',
    pagos: [
      {
        id: 'p-501',
        fecha: '2026-05-12',
        numLiquidacion: '005/2026',
        concepto: 'Entrega inicial para trámite aduanero',
        detallePago: 'Recibo Oficial de Caja Nº 00519 — Ventanilla Administración',
        metodoPago: 'Efectivo',
        monto: 10000000,
      },
    ],
  },
  {
    id: 's-006',
    numLiquidacion: '006/2026',
    fecha: '2026-06-25',
    cliente: CLIENTES_MOCK[0],
    volumenDespachos: 7,
    montoTotalGeneral: 48900000,
    montoRecibido: 48900000,
    estado: 'PAGADO',
    pagos: [
      {
        id: 'p-601',
        fecha: '2026-06-15',
        numLiquidacion: '006/2026',
        concepto: 'Anticipo 7 contenedores puerto Terport',
        detallePago: 'Banco Itaú — Transacción SIPAP #150992381',
        metodoPago: 'Transferencia',
        monto: 30000000,
      },
      {
        id: 'p-602',
        fecha: '2026-06-25',
        numLiquidacion: '006/2026',
        concepto: 'Liquidación fletes marítimos y tasas aduaneras',
        detallePago: 'Banco Itaú — Transacción SIPAP #151044912',
        metodoPago: 'Transferencia',
        monto: 18900000,
      },
    ],
  },
  {
    id: 's-007',
    numLiquidacion: '007/2026',
    fecha: '2026-07-19',
    cliente: CLIENTES_MOCK[1],
    volumenDespachos: 4,
    montoTotalGeneral: 29750000,
    montoRecibido: 22000000,
    estado: 'PENDIENTE',
    pagos: [
      {
        id: 'p-701',
        fecha: '2026-07-10',
        numLiquidacion: '007/2026',
        concepto: 'Anticipo carga refrigerada Silvio Pettirossi',
        detallePago: 'Banco Continental — Transacción SIPAP #849201',
        metodoPago: 'Transferencia',
        monto: 22000000,
      },
    ],
  },
  {
    id: 's-008',
    numLiquidacion: '008/2026',
    fecha: '2026-08-14',
    cliente: CLIENTES_MOCK[2],
    volumenDespachos: 8,
    montoTotalGeneral: 56300000,
    montoRecibido: 56300000,
    estado: 'PAGADO',
    pagos: [
      {
        id: 'p-801',
        fecha: '2026-08-02',
        numLiquidacion: '008/2026',
        concepto: 'Anticipo 8 despachos Puente de la Amistad',
        detallePago: 'Banco Sudameris — Transacción #9102482',
        metodoPago: 'Transferencia',
        monto: 35000000,
      },
      {
        id: 'p-802',
        fecha: '2026-08-14',
        numLiquidacion: '008/2026',
        concepto: 'Cancelación saldo liquidación en caja CDE',
        detallePago: 'Recibo Oficial de Caja Nº 00604 — Caja Regional Ciudad del Este',
        metodoPago: 'Efectivo',
        monto: 21300000,
      },
    ],
  },
  {
    id: 's-009',
    numLiquidacion: '009/2026',
    fecha: '2026-09-28',
    cliente: CLIENTES_MOCK[3],
    volumenDespachos: 5,
    montoTotalGeneral: 38600000,
    montoRecibido: 30000000,
    estado: 'PENDIENTE',
    pagos: [
      {
        id: 'p-901',
        fecha: '2026-09-18',
        numLiquidacion: '009/2026',
        concepto: 'Anticipo importación insumos alimenticios',
        detallePago: 'Banco GNB — Transacción #7849102',
        metodoPago: 'Transferencia',
        monto: 30000000,
      },
    ],
  },
  {
    id: 's-010',
    numLiquidacion: '010/2026',
    fecha: '2026-10-09',
    cliente: CLIENTES_MOCK[0],
    volumenDespachos: 3,
    montoTotalGeneral: 4666885,
    montoRecibido: 5293767,
    estado: 'SALDO_A_FAVOR',
    pagos: [
      {
        id: 'p-1001',
        fecha: '2026-10-02',
        numLiquidacion: '010/2026',
        concepto: 'Anticipo transferencia total PETRA Import',
        detallePago: 'Banco Itaú — Transacción SIPAP #147772927',
        metodoPago: 'Transferencia',
        monto: 5293767,
      },
    ],
  },
  // Caso de estudio del audio del cliente:
  // Transferencia de 10.000.000 Gs., Despacho 1 de 7.000.000 Gs., Despacho 2 de 4.000.000 Gs., Saldo 1.000.000 Gs. a cuenta LG
  {
    id: 's-011',
    numLiquidacion: '011/2026',
    fecha: '2026-05-10',
    cliente: CLIENTES_MOCK[5],
    volumenDespachos: 1,
    montoTotalGeneral: 7000000,
    montoRecibido: 7000000,
    estado: 'PAGADO',
    pagos: [
      {
        id: 'p-1101',
        fecha: '2026-05-08',
        numLiquidacion: '011/2026',
        concepto: 'Anticipo global (Asignado a Despacho 1 de 7M)',
        detallePago: 'Banco Continental — Transacción SIPAP #948201 (Parte 1 de Transf. 10M)',
        metodoPago: 'Transferencia',
        monto: 7000000,
      },
    ],
  },
  {
    id: 's-012',
    numLiquidacion: '012/2026',
    fecha: '2026-06-15',
    cliente: CLIENTES_MOCK[5],
    volumenDespachos: 1,
    montoTotalGeneral: 4000000,
    montoRecibido: 3000000,
    estado: 'PENDIENTE',
    pagos: [
      {
        id: 'p-1201',
        fecha: '2026-05-08',
        numLiquidacion: '012/2026',
        concepto: 'Remanente anticipo global (Asignado a Despacho 2 de 4M)',
        detallePago: 'Banco Continental — Transacción SIPAP #948201 (Parte 2 de Transf. 10M)',
        metodoPago: 'Transferencia',
        monto: 3000000,
      },
    ],
  },
];

// Helper para formatear Guaraníes
function formatGs(amount: number): string {
  return Math.round(amount).toLocaleString('es-PY');
}

// ==========================================
// 📄 GENERADOR DE PDF OFICIAL A4 (jsPDF)
// ==========================================

export function exportToPDF(
  settlement: Settlement,
  company: CompanyInfo = DEFAULT_LG_COMPANY
): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const margin = 12;
  const saldo = settlement.montoTotalGeneral - settlement.montoRecibido;
  const esSaldoAFavor = saldo < 0;
  const esPagado = saldo === 0;

  // 1. ENCABEZADO: LG LOGÍSTICA ADUANERA (Izquierda) + CLIENTE (Derecha)
  const headerLeftText = [
    company.razonSocial.toUpperCase(),
    `RUC: ${company.ruc}`,
    company.direccion,
    `Tel.: ${company.telefono}`,
    `Email: ${company.correo}`,
  ].join('\n');

  const headerRightText = [
    'DATOS DEL CLIENTE / IMPORTADOR',
    settlement.cliente.razonSocial,
    `RUC: ${settlement.cliente.ruc}`,
    settlement.cliente.direccion,
    `Tel.: ${settlement.cliente.telefono}`,
  ].join('\n');

  autoTable(doc, {
    startY: 12,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      lineColor: [100, 116, 139],
      lineWidth: 0.25,
      cellPadding: 2.5,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: {
        cellWidth: 100,
        fillColor: [248, 250, 252],
        textColor: [15, 23, 42],
        fontSize: 7.5,
      },
      1: {
        cellWidth: 86,
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontSize: 7.5,
      },
    },
    body: [[headerLeftText, headerRightText]],
    didParseCell: (data) => {
      data.cell.styles.fontStyle = 'bold';
    },
  });

  const nextY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3;

  // 2. BLOQUE DE RESUMEN DE LA LIQUIDACIÓN
  const estadoLabel = esPagado
    ? 'CANCELADO (100% PAGADO)'
    : esSaldoAFavor
    ? 'SALDO A FAVOR DEL CLIENTE'
    : 'PENDIENTE DE COBRO (A CUENTA LG)';

  autoTable(doc, {
    startY: nextY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      lineColor: [100, 116, 139],
      lineWidth: 0.25,
      cellPadding: 2.2,
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 28, halign: 'center' },
      1: { cellWidth: 26, halign: 'center' },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 32, halign: 'right' },
      4: { cellWidth: 32, halign: 'right' },
      5: { cellWidth: 42, halign: 'center' },
    },
    head: [
      [
        'Nº LIQUIDACIÓN',
        'FECHA EMISIÓN',
        'CANT. DESPACHOS',
        'MONTO TOTAL (GS.)',
        'TOTAL RECIBIDO (GS.)',
        'ESTADO DE CUENTA',
      ],
    ],
    body: [
      [
        settlement.numLiquidacion,
        settlement.fecha,
        `${settlement.volumenDespachos} despacho(s)`,
        formatGs(settlement.montoTotalGeneral),
        formatGs(settlement.montoRecibido),
        estadoLabel,
      ],
    ],
  });

  const table1Y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

  // 3. TABLA 1: DESGLOSE DETALLADO DE MONTOS RECIBIDOS Y ANTICIPOS
  // Columnas: FECHA / N° DE LIQUIDACIÓN / CONCEPTO / DETALLE DEL PAGO / MEDIO DE PAGO / VALOR (GS.)
  const paymentRows: (string | { content: string; styles?: any })[][] =
    settlement.pagos.length > 0
      ? settlement.pagos.map((p) => [
          p.fecha,
          p.numLiquidacion || settlement.numLiquidacion,
          p.concepto || 'Anticipo / Pago a cuenta',
          p.detallePago || (p.metodoPago === 'Efectivo' ? 'Recibo Oficial de Caja' : 'Transferencia Bancaria SIPAP'),
          p.metodoPago,
          formatGs(p.monto),
        ])
      : [['—', settlement.numLiquidacion, 'Sin pagos o anticipos registrados', '—', '—', '0']];

  autoTable(doc, {
    startY: table1Y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      lineColor: [148, 163, 184],
      lineWidth: 0.2,
      fontSize: 7,
      cellPadding: 1.8,
    },
    headStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 46 },
      3: { cellWidth: 50 },
      4: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
    },
    head: [
      [
        {
          content: 'DESGLOSE DETALLADO DE MONTOS RECIBIDOS Y ANTICIPOS',
          colSpan: 6,
          styles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
        },
      ],
      [
        'FECHA',
        'N° DE LIQUIDACIÓN',
        'CONCEPTO',
        'DETALLE DEL PAGO',
        'MEDIO DE PAGO',
        'VALOR (GS.)',
      ],
    ],
    body: [
      ...paymentRows,
      [
        { content: '', colSpan: 4 },
        {
          content: 'Total Recibido:',
          styles: { fontStyle: 'bold', halign: 'right' },
        },
        {
          content: `Gs. ${formatGs(settlement.montoRecibido)}`,
          styles: { fontStyle: 'bold', halign: 'right' },
        },
      ],
    ],
  });

  const table2Y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

  // 4. TABLA 2: RESUMEN FINANCIERO Y CONCILIACIÓN DE SALDO FINAL
  const saldoFinalTexto = esPagado
    ? 'Gs. 0 (Cancelado 100% — Cuenta al Día)'
    : esSaldoAFavor
    ? `Gs. ${formatGs(Math.abs(saldo))} (A Favor del Cliente — Crédito Próximos Despachos)`
    : `Gs. ${formatGs(saldo)} (A Favor de LG Logística — Pendiente a Cuenta LG)`;

  autoTable(doc, {
    startY: table2Y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      lineColor: [100, 116, 139],
      lineWidth: 0.25,
      fontSize: 8,
      cellPadding: 2.2,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 122, fontStyle: 'bold' },
      1: { cellWidth: 64, halign: 'right', fontStyle: 'bold' },
    },
    head: [
      [
        {
          content: 'RESUMEN FINANCIERO Y CONCILIACIÓN DE SALDO FINAL',
          colSpan: 2,
        },
      ],
    ],
    body: [
      [
        'MONTO TOTAL GENERAL DE LA LIQUIDACIÓN ADUANERA:',
        `Gs. ${formatGs(settlement.montoTotalGeneral)}`,
      ],
      [
        'TOTAL DE MONTOS RECIBIDOS / ANTICIPOS DEL CLIENTE:',
        `Gs. ${formatGs(settlement.montoRecibido)}`,
      ],
      [
        esSaldoAFavor
          ? 'SALDO A FAVOR DEL CLIENTE (DEVOLUCIÓN O CRÉDITO FUTURO):'
          : esPagado
          ? 'ESTADO DE CONCILIACIÓN FINAL:'
          : 'SALDO A FAVOR DE LG LOGÍSTICA (PENDIENTE DE COBRO A CUENTA LG):',
        saldoFinalTexto,
      ],
    ],
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === 2) {
        if (esSaldoAFavor) {
          data.cell.styles.fillColor = [220, 252, 231];
          data.cell.styles.textColor = [22, 101, 52];
        } else if (esPagado) {
          data.cell.styles.fillColor = [241, 245, 249];
          data.cell.styles.textColor = [15, 23, 42];
        } else {
          data.cell.styles.fillColor = [254, 242, 242];
          data.cell.styles.textColor = [153, 27, 27];
        }
      }
    },
  });

  const footerY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // 5. PIE DE PÁGINA Y FIRMAS
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Documento oficial emitido por ${company.razonSocial}. Impreso el: ${new Date().toLocaleDateString('es-PY')} ${new Date().toLocaleTimeString('es-PY')}`,
    margin,
    footerY
  );
  doc.text(
    'Firma Autorizada LG Logística: ___________________________          Recibido Conforme Cliente: ___________________________',
    margin,
    footerY + 10
  );

  const cleanSeq = settlement.numLiquidacion.replace(/[^a-zA-Z0-9_-]/g, '-');
  const fileName = `Reporte-Liquidacion-LG-${cleanSeq}.pdf`;
  doc.save(fileName);
  return fileName;
}

// ==========================================
// 📑 GENERADOR DE EXTRACTO CONSOLIDADO POR CLIENTE (A4 jsPDF)
// ==========================================

export function exportClientStatementPDF(
  client: ClientInfo,
  clientSettlements: Settlement[],
  dateFrom: string,
  dateTo: string,
  company: CompanyInfo = DEFAULT_LG_COMPANY
): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const margin = 12;

  // Cálculos consolidados de la cuenta del cliente
  const totalGeneral = clientSettlements.reduce(
    (sum, s) => sum + s.montoTotalGeneral,
    0
  );
  const totalRecibido = clientSettlements.reduce(
    (sum, s) => sum + s.montoRecibido,
    0
  );
  const totalDespachos = clientSettlements.reduce(
    (sum, s) => sum + s.volumenDespachos,
    0
  );
  const saldoNeto = totalGeneral - totalRecibido;
  const esSaldoAFavor = saldoNeto < 0;
  const esPagado = saldoNeto === 0;

  // 1. ENCABEZADO OFICIAL
  const headerLeftText = [
    company.razonSocial.toUpperCase(),
    `RUC: ${company.ruc}`,
    company.direccion,
    `Tel.: ${company.telefono}`,
    `Email: ${company.correo}`,
  ].join('\n');

  const headerRightText = [
    'EXTRACTO DE CUENTA CORRIENTE Y LIQUIDACIONES',
    `Cliente: ${client.razonSocial}`,
    `RUC: ${client.ruc}`,
    `Dirección: ${client.direccion}`,
    `Período: ${dateFrom} al ${dateTo}`,
  ].join('\n');

  autoTable(doc, {
    startY: 12,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      lineColor: [100, 116, 139],
      lineWidth: 0.25,
      cellPadding: 2.5,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: {
        cellWidth: 95,
        fillColor: [248, 250, 252],
        textColor: [15, 23, 42],
        fontSize: 7.5,
      },
      1: {
        cellWidth: 91,
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontSize: 7.5,
      },
    },
    body: [[headerLeftText, headerRightText]],
    didParseCell: (data) => {
      data.cell.styles.fontStyle = 'bold';
    },
  });

  let nextY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

  // 2. TABLA 1: RESUMEN DE TODAS LAS LIQUIDACIONES Y DESPACHOS DEL CLIENTE
  // Columnas: Nº LIQUIDACIÓN / FECHA EMISIÓN / CANT. DESPACHOS / MONTO TOTAL (GS.) / TOTAL RECIBIDO (GS.) / ESTADO DE CUENTA
  const settlementRows: (string | { content: string; styles?: any })[][] =
    clientSettlements.length > 0
      ? clientSettlements.map((s) => {
          const diff = s.montoTotalGeneral - s.montoRecibido;
          const stLabel =
            diff === 0
              ? 'CANCELADO (100%)'
              : diff < 0
              ? `A FAVOR (${formatGs(Math.abs(diff))})`
              : `PENDIENTE (${formatGs(diff)})`;

          return [
            s.numLiquidacion,
            s.fecha,
            `${s.volumenDespachos} desp.`,
            formatGs(s.montoTotalGeneral),
            formatGs(s.montoRecibido),
            stLabel,
          ];
        })
      : [['—', '—', '0 desp.', '0', '0', 'Sin liquidaciones en el período']];

  autoTable(doc, {
    startY: nextY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      lineColor: [100, 116, 139],
      lineWidth: 0.2,
      cellPadding: 2,
      fontSize: 7.5,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 26, halign: 'center' },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 34, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 34, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 38, halign: 'center', fontStyle: 'bold' },
    },
    head: [
      [
        {
          content: 'HISTORIAL DE LIQUIDACIONES Y DESPACHOS DEL PERÍODO',
          colSpan: 6,
          styles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
        },
      ],
      [
        'Nº LIQUIDACIÓN',
        'FECHA EMISIÓN',
        'CANT. DESPACHOS',
        'MONTO TOTAL (GS.)',
        'TOTAL RECIBIDO (GS.)',
        'ESTADO DE CUENTA',
      ],
    ],
    body: [
      ...settlementRows,
      [
        {
          content: 'TOTAL CONSOLIDADO:',
          colSpan: 2,
          styles: { fontStyle: 'bold', halign: 'right' },
        },
        {
          content: `${totalDespachos} despachos`,
          styles: { fontStyle: 'bold', halign: 'center' },
        },
        {
          content: `Gs. ${formatGs(totalGeneral)}`,
          styles: { fontStyle: 'bold', halign: 'right' },
        },
        {
          content: `Gs. ${formatGs(totalRecibido)}`,
          styles: { fontStyle: 'bold', halign: 'right' },
        },
        {
          content: esPagado
            ? 'CANCELADO'
            : esSaldoAFavor
            ? `+Gs. ${formatGs(Math.abs(saldoNeto))} A FAVOR`
            : `Gs. ${formatGs(saldoNeto)} PENDIENTE`,
          styles: {
            fontStyle: 'bold',
            halign: 'center',
            fillColor: esSaldoAFavor
              ? [220, 252, 231]
              : esPagado
              ? [241, 245, 249]
              : [254, 242, 242],
            textColor: esSaldoAFavor
              ? [22, 101, 52]
              : esPagado
              ? [15, 23, 42]
              : [153, 27, 27],
          },
        },
      ],
    ],
  });

  nextY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

  // 3. TABLA 2: DESGLOSE DETALLADO DE MONTOS RECIBIDOS Y ANTICIPOS (TODOS LOS PAGOS)
  // Columnas: FECHA / N° DE LIQUIDACIÓN / CONCEPTO / DETALLE DEL PAGO / MEDIO DE PAGO / VALOR (GS.)
  const allPayments: {
    fecha: string;
    numLiquidacion: string;
    concepto: string;
    detallePago: string;
    metodoPago: string;
    monto: number;
  }[] = [];

  for (const s of clientSettlements) {
    for (const p of s.pagos) {
      allPayments.push({
        fecha: p.fecha,
        numLiquidacion: p.numLiquidacion || s.numLiquidacion,
        concepto: p.concepto || 'Anticipo tributos / gastos',
        detallePago:
          p.detallePago ||
          (p.metodoPago === 'Efectivo'
            ? 'Recibo Oficial de Caja'
            : 'Transferencia Bancaria SIPAP'),
        metodoPago: p.metodoPago,
        monto: p.monto,
      });
    }
  }

  allPayments.sort((a, b) => a.fecha.localeCompare(b.fecha));

  const clientPaymentRows: (string | { content: string; styles?: any })[][] =
    allPayments.length > 0
      ? allPayments.map((p) => [
          p.fecha,
          p.numLiquidacion,
          p.concepto,
          p.detallePago,
          p.metodoPago,
          formatGs(p.monto),
        ])
      : [['—', '—', 'Sin pagos o anticipos registrados en el período', '—', '—', '0']];

  autoTable(doc, {
    startY: nextY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      lineColor: [148, 163, 184],
      lineWidth: 0.2,
      fontSize: 7,
      cellPadding: 1.8,
    },
    headStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 46 },
      3: { cellWidth: 50 },
      4: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
    },
    head: [
      [
        {
          content: 'DESGLOSE DETALLADO DE MONTOS RECIBIDOS Y ANTICIPOS',
          colSpan: 6,
          styles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
        },
      ],
      [
        'FECHA',
        'N° DE LIQUIDACIÓN',
        'CONCEPTO',
        'DETALLE DEL PAGO',
        'MEDIO DE PAGO',
        'VALOR (GS.)',
      ],
    ],
    body: [
      ...clientPaymentRows,
      [
        { content: '', colSpan: 4 },
        {
          content: 'Total Efectivamente Recibido:',
          styles: { fontStyle: 'bold', halign: 'right' },
        },
        {
          content: `Gs. ${formatGs(totalRecibido)}`,
          styles: { fontStyle: 'bold', halign: 'right' },
        },
      ],
    ],
  });

  nextY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

  // 4. TABLA 3: RESUMEN FINANCIERO Y CONCILIACIÓN DE SALDO FINAL
  const saldoFinalClienteTexto = esPagado
    ? 'Gs. 0 (Cancelado 100% — Cuenta al Día)'
    : esSaldoAFavor
    ? `Gs. ${formatGs(Math.abs(saldoNeto))} (A Favor del Cliente — Crédito Próximos Despachos)`
    : `Gs. ${formatGs(saldoNeto)} (Saldo a Favor de LG — Pendiente a Cuenta LG)`;

  autoTable(doc, {
    startY: nextY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      lineColor: [100, 116, 139],
      lineWidth: 0.25,
      fontSize: 8,
      cellPadding: 2.2,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 122, fontStyle: 'bold' },
      1: { cellWidth: 64, halign: 'right', fontStyle: 'bold' },
    },
    head: [
      [
        {
          content: 'RESUMEN FINANCIERO Y CONCILIACIÓN DE SALDO FINAL',
          colSpan: 2,
        },
      ],
    ],
    body: [
      [
        'MONTO TOTAL GENERAL DE LAS LIQUIDACIONES ADUANERAS (TODOS LOS DESPACHOS):',
        `Gs. ${formatGs(totalGeneral)}`,
      ],
      [
        'TOTAL DE MONTOS RECIBIDOS / ANTICIPOS EFECTIVAMENTE INGRESADOS:',
        `Gs. ${formatGs(totalRecibido)}`,
      ],
      [
        esSaldoAFavor
          ? 'SALDO A FAVOR DEL CLIENTE (PARA DEVOLUCIÓN O PRÓXIMOS DESPACHOS):'
          : esPagado
          ? 'ESTADO DE CONCILIACIÓN FINAL:'
          : 'SALDO A FAVOR DE LG LOGÍSTICA (PENDIENTE DE COBRO A CUENTA LG):',
        saldoFinalClienteTexto,
      ],
    ],
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === 2) {
        if (esSaldoAFavor) {
          data.cell.styles.fillColor = [220, 252, 231];
          data.cell.styles.textColor = [22, 101, 52];
        } else if (esPagado) {
          data.cell.styles.fillColor = [241, 245, 249];
          data.cell.styles.textColor = [15, 23, 42];
        } else {
          data.cell.styles.fillColor = [254, 242, 242];
          data.cell.styles.textColor = [153, 27, 27];
        }
      }
    },
  });

  const footerY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // 5. PIE DE PÁGINA Y FIRMAS
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Documento oficial de extracto emitido por ${company.razonSocial}. Impreso el: ${new Date().toLocaleDateString('es-PY')} ${new Date().toLocaleTimeString('es-PY')}`,
    margin,
    footerY
  );
  doc.text(
    'Firma Autorizada LG Logística: ___________________________          Recibido Conforme Cliente: ___________________________',
    margin,
    footerY + 10
  );

  const cleanName = client.razonSocial.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 25);
  const fileName = `Extracto-Cuenta-LG-${cleanName}-${dateFrom.slice(0, 4)}.pdf`;
  doc.save(fileName);
  return fileName;
}

// ==========================================
// 📊 COMPONENTE PRINCIPAL DASHBOARD
// ==========================================

interface DashboardSettlementsProps {
  companySettings?: CompanySettings;
  historySettlements?: CustomsSettlement[];
  currentSettlement?: CustomsSettlement;
  onGoToEditor?: () => void;
}

export const DashboardSettlements: React.FC<DashboardSettlementsProps> = ({
  companySettings,
  historySettlements,
  currentSettlement,
  onGoToEditor,
}) => {
  const companyInfo: CompanyInfo = useMemo(() => {
    if (companySettings) {
      return {
        razonSocial: companySettings.name || DEFAULT_LG_COMPANY.razonSocial,
        ruc: companySettings.ruc || DEFAULT_LG_COMPANY.ruc,
        direccion: companySettings.address || DEFAULT_LG_COMPANY.direccion,
        telefono: companySettings.phone || DEFAULT_LG_COMPANY.telefono,
        correo: companySettings.email || DEFAULT_LG_COMPANY.correo,
        logoText: companySettings.logoText || DEFAULT_LG_COMPANY.logoText,
      };
    }
    return DEFAULT_LG_COMPANY;
  }, [companySettings]);

  // Sincronización dinámica de liquidaciones activas y del historial con los datos MOCK
  const initialSettlements = useMemo(() => {
    const dynamic: Settlement[] = [];
    const sourceList = [
      ...(currentSettlement ? [currentSettlement] : []),
      ...(historySettlements || []),
    ];

    const seenSeqs = new Set<string>();
    for (const cs of sourceList) {
      if (!cs || !cs.sequentialNumber || seenSeqs.has(cs.sequentialNumber)) {
        continue;
      }
      seenSeqs.add(cs.sequentialNumber);

      const metrics = calculateSettlementMetrics(cs);
      const total = metrics.grandTotalGs;
      const recibido = metrics.amountReceivedGs;
      const diff = total - recibido;
      const estado: 'PENDIENTE' | 'PAGADO' | 'SALDO_A_FAVOR' =
        diff === 0 ? 'PAGADO' : diff < 0 ? 'SALDO_A_FAVOR' : 'PENDIENTE';

      const pagos: PaymentDetail[] = (cs.receivedPayments || []).map(
        (p, idx) => ({
          id: p.id || `p-dyn-${idx}`,
          fecha: p.date || cs.date,
          numLiquidacion: cs.sequentialNumber,
          concepto: 'Anticipo / Pago de liquidación',
          detallePago:
            p.description ||
            (p.method === 'Efectivo'
              ? 'Recibo Oficial de Caja'
              : 'Transferencia Bancaria SIPAP'),
          metodoPago: p.method || 'Transferencia',
          monto: Number(p.amountGs) || 0,
        })
      );

      if (pagos.length === 0 && recibido > 0) {
        pagos.push({
          id: `p-dyn-auto-${cs.id}`,
          fecha: cs.date,
          numLiquidacion: cs.sequentialNumber,
          concepto: 'Anticipo registrado en liquidación',
          detallePago: 'Transferencia Bancaria SIPAP',
          metodoPago: 'Transferencia',
          monto: recibido,
        });
      }

      dynamic.push({
        id: cs.id,
        numLiquidacion: cs.sequentialNumber,
        fecha: cs.date,
        cliente: {
          id: cs.clientRuc || cs.id,
          ruc: cs.clientRuc || '80019284-3',
          razonSocial: cs.clientName || 'Cliente Importador',
          direccion: cs.clientAddress || 'Asunción, Paraguay',
          telefono: cs.clientContact || '+595 21 600 000',
        },
        volumenDespachos: cs.merchandiseItems?.length || 1,
        montoTotalGeneral: total,
        montoRecibido: recibido,
        pagos,
        estado,
      });
    }

    // Combinar con SETTLEMENTS_MOCK
    const merged = [...dynamic];
    for (const m of SETTLEMENTS_MOCK) {
      if (!merged.some((s) => s.numLiquidacion === m.numLiquidacion)) {
        merged.push(m);
      }
    }
    return merged;
  }, [historySettlements, currentSettlement]);

  const [settlements, setSettlements] = useState<Settlement[]>(initialSettlements);

  // Mantener actualizado settlements si cambian las props
  React.useEffect(() => {
    setSettlements(initialSettlements);
  }, [initialSettlements]);

  const [selectedClient, setSelectedClient] = useState<string>('TODOS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modalSettlement, setModalSettlement] = useState<Settlement | null>(null);
  const [modalTab, setModalTab] = useState<'SINGLE' | 'CLIENT_STATEMENT'>('SINGLE');
  const [notification, setNotification] = useState<string | null>(null);

  // Lista única consolidada de clientes
  const allClients = useMemo(() => {
    return Array.from(
      new Map(
        [
          ...CLIENTES_MOCK,
          ...settlements.map((s) => s.cliente),
        ].map((c) => [c.id, c])
      ).values()
    );
  }, [settlements]);

  // Estado para el módulo y modal de Extracto de Cuenta por Cliente
  const [statementClientId, setStatementClientId] = useState<string>('cli-1');
  const [statementDateFrom, setStatementDateFrom] = useState<string>('2026-01-01');
  const [statementDateTo, setStatementDateTo] = useState<string>('2026-12-31');
  const [isStatementModalOpen, setIsStatementModalOpen] = useState<boolean>(false);

  const activeStatementClient = useMemo(() => {
    return (
      allClients.find((c) => c.id === statementClientId) ||
      allClients[0] ||
      CLIENTES_MOCK[0]
    );
  }, [allClients, statementClientId]);

  const activeStatementSettlements = useMemo(() => {
    return settlements.filter((s) => {
      const match =
        s.cliente.id === activeStatementClient.id ||
        s.cliente.ruc === activeStatementClient.ruc;
      if (!match) return false;
      if (statementDateFrom && s.fecha < statementDateFrom) return false;
      if (statementDateTo && s.fecha > statementDateTo) return false;
      return true;
    });
  }, [settlements, activeStatementClient, statementDateFrom, statementDateTo]);

  const statementMetrics = useMemo(() => {
    const totalGeneral = activeStatementSettlements.reduce(
      (sum, s) => sum + s.montoTotalGeneral,
      0
    );
    const totalRecibido = activeStatementSettlements.reduce(
      (sum, s) => sum + s.montoRecibido,
      0
    );
    const totalDespachos = activeStatementSettlements.reduce(
      (sum, s) => sum + s.volumenDespachos,
      0
    );
    const saldo = totalGeneral - totalRecibido;
    return {
      totalGeneral,
      totalRecibido,
      totalDespachos,
      saldo,
      esSaldoAFavor: saldo < 0,
      esPagado: saldo === 0,
    };
  }, [activeStatementSettlements]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. CÁLCULO DE KPIS
  const kpis = useMemo(() => {
    const totalFacturado = settlements.reduce(
      (sum, s) => sum + s.montoTotalGeneral,
      0
    );
    const totalRecibido = settlements.reduce(
      (sum, s) => sum + s.montoRecibido,
      0
    );
    const saldoPendiente = settlements.reduce((sum, s) => {
      const diff = s.montoTotalGeneral - s.montoRecibido;
      return sum + (diff > 0 ? diff : 0);
    }, 0);
    const totalDespachos = settlements.reduce(
      (sum, s) => sum + s.volumenDespachos,
      0
    );

    return {
      totalFacturado,
      totalRecibido,
      saldoPendiente,
      totalDespachos,
    };
  }, [settlements]);

  // 2. DATOS PARA GRÁFICO 1: COMPARATIVA MENSUAL (TOTAL VS. RECIBIDO)
  const monthlyFinancialData = useMemo(() => {
    const months = [
      { key: '01', mes: 'Ene' },
      { key: '02', mes: 'Feb' },
      { key: '03', mes: 'Mar' },
      { key: '04', mes: 'Abr' },
      { key: '05', mes: 'May' },
      { key: '06', mes: 'Jun' },
      { key: '07', mes: 'Jul' },
      { key: '08', mes: 'Ago' },
      { key: '09', mes: 'Set' },
      { key: '10', mes: 'Oct' },
    ];

    return months.map((m) => {
      const inMonth = settlements.filter((s) => s.fecha.startsWith(`2026-${m.key}`));
      const totalGeneral = inMonth.reduce(
        (sum, s) => sum + s.montoTotalGeneral,
        0
      );
      const recibido = inMonth.reduce((sum, s) => sum + s.montoRecibido, 0);
      const despachos = inMonth.reduce((sum, s) => sum + s.volumenDespachos, 0);
      const saldo = Math.max(0, totalGeneral - recibido);

      return {
        mes: m.mes,
        'Monto Total General': totalGeneral,
        'Monto Recibido': recibido,
        'Saldo Pendiente': saldo,
        despachos,
      };
    });
  }, [settlements]);

  // 3. DATOS PARA GRÁFICO 2: VOLUMEN DE DESPACHOS MENSUALES
  const monthlyVolumeData = useMemo(() => {
    return monthlyFinancialData.map((d) => ({
      mes: d.mes,
      despachos: d.despachos,
    }));
  }, [monthlyFinancialData]);

  // 4. FILTRADO DE TABLA
  const filteredSettlements = useMemo(() => {
    return settlements.filter((s) => {
      const matchesClient =
        selectedClient === 'TODOS' || s.cliente.id === selectedClient;
      const matchesStatus =
        selectedStatus === 'TODOS' || s.estado === selectedStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.numLiquidacion.toLowerCase().includes(q) ||
        s.cliente.razonSocial.toLowerCase().includes(q) ||
        s.cliente.ruc.toLowerCase().includes(q);

      return matchesClient && matchesStatus && matchesSearch;
    });
  }, [settlements, selectedClient, selectedStatus, searchQuery]);

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-16 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl border border-sky-400 flex items-center gap-3 animate-fade-in text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* PERFIL ACTIVO DE LG LOGÍSTICA ADUANERA Y ENCABEZADO */}
      <section className="bg-slate-900 text-white rounded-xl border border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xl tracking-wider shadow-inner shrink-0 border border-blue-400/30">
              {companyInfo.logoText || 'LG'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-display">
                  {companyInfo.razonSocial}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10.5px] font-mono font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  RUC: {companyInfo.ruc}
                </span>
                <span className="px-2 py-0.5 rounded text-[10.5px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Panel Ejecutivo
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{companyInfo.direccion}</span>
                <span>·</span>
                <span>{companyInfo.telefono}</span>
                <span>·</span>
                <span className="text-sky-300">{companyInfo.correo}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onGoToEditor && (
              <button
                type="button"
                onClick={onGoToEditor}
                className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Nueva Liquidación</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 1. CUATRO TARJETAS DE KPIS RÁPIDOS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Facturado */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Facturado
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono tabular-nums text-xl sm:text-2xl font-bold text-slate-900 block">
              Gs. {formatGs(kpis.totalFacturado)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Suma de monto total general de liquidaciones
            </span>
          </div>
        </div>

        {/* Total Recibido */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Recibido
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono tabular-nums text-xl sm:text-2xl font-bold text-emerald-800 block">
              Gs. {formatGs(kpis.totalRecibido)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Monto efectivamente cobrado y conciliado
            </span>
          </div>
        </div>

        {/* Saldo Global Pendiente */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Saldo Pendiente
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono tabular-nums text-xl sm:text-2xl font-bold text-amber-700 block">
              Gs. {formatGs(kpis.saldoPendiente)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Diferencia acumulada pendiente de cobro por LG
            </span>
          </div>
        </div>

        {/* Cantidad Total de Despachos */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Despachos
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono tabular-nums text-xl sm:text-2xl font-bold text-slate-900 block">
              {kpis.totalDespachos} despachos
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Volumen gestionado a través de aduanas
            </span>
          </div>
        </div>
      </section>

      {/* 2. PANEL DE VISUALIZACIÓN DE DATOS (GRÁFICOS RECHARTS) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico 1: Barras Comparativas Mensuales (Total vs. Recibido) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Comparativa Mensual: Monto Total vs. Monto Recibido
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Permite detectar visualmente los meses con saldos pendientes acumulados en Guaraníes
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
              Ejercicio Fiscal 2026
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyFinancialData}
                margin={{ top: 10, right: 10, left: 15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="mes"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `Gs. ${formatGs(Number(value) || 0)}`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
                <Bar
                  dataKey="Monto Total General"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                  name="Monto Total General"
                />
                <Bar
                  dataKey="Monto Recibido"
                  fill="#059669"
                  radius={[4, 4, 0, 0]}
                  name="Monto Efectivamente Recibido"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Volumen de Despachos Mensuales */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Volumen de Despachos
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Cant./Mes
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Cantidad total de despachos aduaneros gestionados por mes
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyVolumeData}
                margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="mes"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value: any) => [`${value} despachos`, 'Volumen']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                />
                <Bar
                  dataKey="despachos"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  name="Cantidad de Despachos"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Mes con mayor actividad:</span>
            <span className="font-bold text-slate-900">Agosto (8 despachos)</span>
          </div>
        </div>
      </section>

      {/* MÓDULO ESPECIAL: EXTRACTO DE CUENTA CORRIENTE Y CONCILIACIÓN POR CLIENTE */}
      <section className="bg-white border-2 border-slate-300 rounded-xl overflow-hidden shadow-sm">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/30 text-sky-300 border border-blue-400/30 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2 font-display">
                  Extracto de Cuenta Corriente y Conciliación por Cliente
                </h2>
                <span className="px-2 py-0.5 rounded text-[10.5px] font-mono font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  Historial Anual / Periódico
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Consolida todas las liquidaciones realizadas para un mismo cliente, todos los fondos efectivamente ingresados (transferencias y efectivo) y el saldo neto resultante (a favor del cliente o a favor de LG).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsStatementModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-600 rounded-lg transition-colors cursor-pointer"
              title="Abrir extracto de cuenta interactivo en pantalla"
            >
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span>Ver Extracto en Pantalla</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const f = exportClientStatementPDF(
                  activeStatementClient,
                  activeStatementSettlements,
                  statementDateFrom,
                  statementDateTo,
                  companyInfo
                );
                showToast(`Extracto oficial descargado: ${f}`);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer shadow-xs"
              title="Generar y descargar documento oficial A4 en PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Extracto PDF A4</span>
            </button>
          </div>
        </div>

        {/* Panel de Controles: Selector de Cliente y Rango de Fechas */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
            {/* Selector de Cliente */}
            <div className="md:col-span-5">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Seleccionar Cliente / Importador:</span>
                <span className="text-[10.5px] font-mono text-slate-500 font-normal">
                  RUC: {activeStatementClient.ruc}
                </span>
              </label>
              <select
                value={statementClientId}
                onChange={(e) => setStatementClientId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
              >
                {allClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.razonSocial} (RUC: {c.ruc})
                  </option>
                ))}
              </select>
            </div>

            {/* Rango Desde */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Fecha Desde</span>
              </label>
              <input
                type="date"
                value={statementDateFrom}
                onChange={(e) => setStatementDateFrom(e.target.value)}
                className="w-full px-2.5 py-2 text-xs font-mono font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* Rango Hasta */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Fecha Hasta</span>
              </label>
              <input
                type="date"
                value={statementDateTo}
                onChange={(e) => setStatementDateTo(e.target.value)}
                className="w-full px-2.5 py-2 text-xs font-mono font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* Presets Rápidos */}
            <div className="md:col-span-3 flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setStatementDateFrom('2026-01-01');
                  setStatementDateTo('2026-12-31');
                }}
                className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-md border transition-colors cursor-pointer ${
                  statementDateFrom === '2026-01-01' && statementDateTo === '2026-12-31'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Año 2026
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatementDateFrom('2026-07-01');
                  setStatementDateTo('2026-12-31');
                }}
                className="px-2 py-1.5 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              >
                2º Semestre
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatementDateFrom('2026-01-01');
                  setStatementDateTo('2026-12-31');
                }}
                className="px-2 py-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
              >
                Todo
              </button>
            </div>
          </div>
        </div>

        {/* Tarjetas de Resumen Financiero y Conciliación del Cliente Seleccionado */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white">
          {/* Card 1: Total Liquidaciones */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-600 text-xs font-semibold uppercase tracking-wider">
              <span>Total Liquidaciones ({activeStatementSettlements.length})</span>
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2.5">
              <span className="font-mono text-xl sm:text-2xl font-bold text-slate-900 block">
                Gs. {formatGs(statementMetrics.totalGeneral)}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {statementMetrics.totalDespachos} despacho(s) aduanero(s) registrados
              </span>
            </div>
          </div>

          {/* Card 2: Total Fondos Recibidos */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-600 text-xs font-semibold uppercase tracking-wider">
              <span>Fondos Ingresados / Pagos</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2.5">
              <span className="font-mono text-xl sm:text-2xl font-bold text-emerald-800 block">
                Gs. {formatGs(statementMetrics.totalRecibido)}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Transferencias bancarias + pagos en caja
              </span>
            </div>
          </div>

          {/* Card 3: Saldo Final Conciliado */}
          <div
            className={`p-3.5 rounded-xl border flex flex-col justify-between ${
              statementMetrics.esSaldoAFavor
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                : statementMetrics.saldo > 0
                ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                : 'bg-slate-100 border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
              <span>
                {statementMetrics.esSaldoAFavor
                  ? 'Saldo a Favor del Cliente'
                  : statementMetrics.saldo > 0
                  ? 'Saldo a Cuenta LG (Pendiente)'
                  : 'Conciliación al Día'}
              </span>
              <AlertCircle
                className={`w-4 h-4 ${
                  statementMetrics.esSaldoAFavor
                    ? 'text-emerald-700'
                    : statementMetrics.saldo > 0
                    ? 'text-rose-700'
                    : 'text-slate-600'
                }`}
              />
            </div>
            <div className="mt-2.5">
              <span
                className={`font-mono text-xl sm:text-2xl font-bold block ${
                  statementMetrics.esSaldoAFavor
                    ? 'text-emerald-800'
                    : statementMetrics.saldo > 0
                    ? 'text-rose-800'
                    : 'text-slate-800'
                }`}
              >
                {statementMetrics.esPagado
                  ? 'Gs. 0'
                  : statementMetrics.esSaldoAFavor
                  ? `+Gs. ${formatGs(Math.abs(statementMetrics.saldo))}`
                  : `Gs. ${formatGs(statementMetrics.saldo)}`}
              </span>
              <span className="text-[11px] font-medium mt-1 block opacity-90">
                {statementMetrics.esSaldoAFavor
                  ? 'Crédito disponible para futuros despachos o devolución'
                  : statementMetrics.saldo > 0
                  ? 'Saldo pendiente de cobro por LG Logística Aduanera'
                  : 'Todas las liquidaciones 100% canceladas'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TABLA DE LIQUIDACIONES Y GESTIÓN DE SALDOS */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {/* Cabecera y Filtros */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              <span>Resumen de Liquidaciones y Saldos</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Identifique saldos a favor del cliente o saldos pendientes de pago a LG Logística Aduanera
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-300">
              {filteredSettlements.length} de {settlements.length} liquidaciones
            </span>
          </div>
        </div>

        {/* Barra de Filtros interactiva */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar Nº o Cliente..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtro por Cliente */}
          <div>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
            >
              <option value="TODOS">Todos los Clientes</option>
              {Array.from(
                new Map(
                  [
                    ...CLIENTES_MOCK,
                    ...settlements.map((s) => s.cliente),
                  ].map((c) => [c.id, c])
                ).values()
              ).map((cli) => (
                <option key={cli.id} value={cli.id}>
                  {cli.razonSocial}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Estado */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="PENDIENTE">Pendientes (Saldo a Cobrar)</option>
              <option value="PAGADO">Pagados (100% Cancelados)</option>
              <option value="SALDO_A_FAVOR">Saldo a Favor del Cliente</option>
            </select>
          </div>

          {/* Botón reset filtros */}
          <div className="flex items-center justify-end">
            {(selectedClient !== 'TODOS' ||
              selectedStatus !== 'TODOS' ||
              searchQuery !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedClient('TODOS');
                  setSelectedStatus('TODOS');
                  setSearchQuery('');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer"
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        </div>

        {/* Tabla Desktop y Tablet */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/75 text-slate-600 font-semibold">
                <th className="py-3 px-4">N° Liq. / Fecha</th>
                <th className="py-3 px-4">Cliente / RUC</th>
                <th className="py-3 px-3 text-center">Despachos</th>
                <th className="py-3 px-4 text-right">Monto Total</th>
                <th className="py-3 px-4 text-right min-w-[220px]">
                  Monto Recibido & Detalle Pagos
                </th>
                <th className="py-3 px-4 text-right">Saldo Final</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSettlements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    No se encontraron liquidaciones con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredSettlements.map((s) => {
                  const saldo = s.montoTotalGeneral - s.montoRecibido;
                  const esSaldoAFavor = saldo < 0;
                  const esPagado = saldo === 0;

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-4 align-middle">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {s.numLiquidacion}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500">
                          {s.fecha}
                        </div>
                      </td>

                      <td className="py-3 px-4 align-middle">
                        <div className="font-semibold text-slate-900">
                          {s.cliente.razonSocial}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="font-mono text-[11px] text-slate-500">
                            RUC: {s.cliente.ruc}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setStatementClientId(s.cliente.id);
                              setIsStatementModalOpen(true);
                            }}
                            className="px-1.5 py-0.5 text-[9.5px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors cursor-pointer inline-flex items-center gap-0.5"
                            title="Ver extracto de cuenta corriente consolidado de este cliente"
                          >
                            <Users className="w-2.5 h-2.5" />
                            <span>Extracto</span>
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-3 align-middle text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold border border-slate-200">
                          {s.volumenDespachos}
                        </span>
                      </td>

                      <td className="py-3 px-4 align-middle text-right font-mono font-semibold text-slate-900">
                        Gs. {formatGs(s.montoTotalGeneral)}
                      </td>

                      <td className="py-3 px-4 align-middle text-right">
                        <div className="font-mono font-bold text-emerald-800 text-xs">
                          Gs. {formatGs(s.montoRecibido)}
                        </div>
                        {s.pagos && s.pagos.length > 0 && (
                          <div className="mt-1 flex flex-col gap-1 items-end">
                            {s.pagos.map((p) => {
                              const isTransfer = p.metodoPago === 'Transferencia';
                              return (
                                <div
                                  key={p.id}
                                  className="inline-flex items-center gap-1.5 text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 transition-colors max-w-[240px]"
                                  title={`${p.metodoPago}: ${p.concepto} — Gs. ${formatGs(p.monto)} (${p.fecha})`}
                                >
                                  <span
                                    className={`font-bold px-1.5 py-0.2 rounded text-[9px] uppercase tracking-wider shrink-0 ${
                                      isTransfer
                                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    }`}
                                  >
                                    {p.metodoPago}
                                  </span>
                                  <span className="truncate font-medium text-slate-700">
                                    {p.concepto}
                                  </span>
                                  <span className="font-mono font-bold text-emerald-800 shrink-0">
                                    {formatGs(p.monto)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 align-middle text-right font-mono font-bold">
                        {esPagado ? (
                          <span className="text-slate-500">Gs. 0</span>
                        ) : esSaldoAFavor ? (
                          <span className="text-emerald-700 block">
                            +Gs. {formatGs(Math.abs(saldo))}
                            <span className="text-[10px] font-sans font-medium block text-emerald-600">
                              (A favor cliente)
                            </span>
                          </span>
                        ) : (
                          <span className="text-rose-700 block">
                            Gs. {formatGs(saldo)}
                            <span className="text-[10px] font-sans font-medium block text-rose-600">
                              (Pendiente a LG)
                            </span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 align-middle text-center">
                        {s.estado === 'PAGADO' && (
                          <span className="px-2 py-0.5 text-[10.5px] font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Pagado
                          </span>
                        )}
                        {s.estado === 'PENDIENTE' && (
                          <span className="px-2 py-0.5 text-[10.5px] font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                            Pendiente
                          </span>
                        )}
                        {s.estado === 'SALDO_A_FAVOR' && (
                          <span className="px-2 py-0.5 text-[10.5px] font-semibold rounded-full bg-sky-100 text-sky-800 border border-sky-300">
                            Saldo a Favor
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 align-middle text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setModalSettlement(s);
                              setModalTab('SINGLE');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-300 rounded transition-colors cursor-pointer"
                            title="Ver desglose de pagos detallados"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span className="hidden sm:inline">Desglose</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const fName = exportToPDF(s, companyInfo);
                              showToast(`Reporte PDF generado: ${fName}`);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors cursor-pointer shadow-xs"
                            title="Generar e imprimir reporte oficial PDF A4"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const clientList = settlements.filter(
                                (item) =>
                                  item.cliente.id === s.cliente.id ||
                                  item.cliente.ruc === s.cliente.ruc
                              );
                              const fName = exportClientStatementPDF(
                                s.cliente,
                                clientList,
                                statementDateFrom,
                                statementDateTo,
                                companyInfo
                              );
                              showToast(`Extracto consolidado descargado: ${fName}`);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-colors cursor-pointer"
                            title="Descargar Extracto Consolidado de todas las liquidaciones del cliente"
                          >
                            <Users className="w-3 h-3 text-indigo-600" />
                            <span className="hidden xl:inline">Extracto</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. MODAL DETALLE / DESGLOSE DE PAGOS Y EXTRACTO CONSOLIDADO */}
      {modalSettlement && (() => {
        const currentClientSettlements = settlements.filter(
          (item) =>
            item.cliente.id === modalSettlement.cliente.id ||
            item.cliente.ruc === modalSettlement.cliente.ruc
        );
        const clientTotalGeneral = currentClientSettlements.reduce(
          (sum, s) => sum + s.montoTotalGeneral,
          0
        );
        const clientTotalRecibido = currentClientSettlements.reduce(
          (sum, s) => sum + s.montoRecibido,
          0
        );
        const clientTotalDespachos = currentClientSettlements.reduce(
          (sum, s) => sum + s.volumenDespachos,
          0
        );
        const clientSaldoNeto = clientTotalGeneral - clientTotalRecibido;
        const clientEsSaldoAFavor = clientSaldoNeto < 0;
        const clientEsPagado = clientSaldoNeto === 0;

        // Todos los pagos del cliente
        const clientAllPayments: PaymentDetail[] = [];
        for (const s of currentClientSettlements) {
          for (const p of s.pagos) {
            clientAllPayments.push({
              ...p,
              numLiquidacion: p.numLiquidacion || s.numLiquidacion,
            });
          }
        }
        clientAllPayments.sort((a, b) => a.fecha.localeCompare(b.fecha));

        return (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-xs"
            onClick={() => setModalSettlement(null)}
          >
            <div
              className="relative w-full max-w-4xl bg-white border border-slate-300 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white shrink-0 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-sky-500/20 text-sky-400 rounded-md border border-sky-400/30">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Liquidación Nº {modalSettlement.numLiquidacion}</span>
                      <span className="text-slate-400 font-normal">·</span>
                      <span className="text-sky-300">{modalSettlement.cliente.razonSocial}</span>
                    </h3>
                    <p className="text-xs text-slate-300">
                      RUC: {modalSettlement.cliente.ruc} · {modalSettlement.cliente.direccion}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalSettlement(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-md cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Pestañas de Navegación: Esta Liquidación vs Extracto Consolidado del Cliente */}
              <div className="flex items-center border-b border-slate-200 bg-slate-100 px-5 pt-2 gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalTab('SINGLE')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-colors cursor-pointer border-t border-x ${
                    modalTab === 'SINGLE'
                      ? 'bg-white text-blue-700 border-slate-300 border-b-transparent -mb-px'
                      : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent'
                  }`}
                >
                  Esta Liquidación (Nº {modalSettlement.numLiquidacion})
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('CLIENT_STATEMENT')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-colors cursor-pointer border-t border-x inline-flex items-center gap-1.5 ${
                    modalTab === 'CLIENT_STATEMENT'
                      ? 'bg-white text-indigo-700 border-slate-300 border-b-transparent -mb-px'
                      : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    Extracto Consolidado del Cliente ({currentClientSettlements.length} liquidaciones)
                  </span>
                </button>
              </div>

              {/* Contenido Modal */}
              <div className="p-5 overflow-y-auto space-y-5">
                {modalTab === 'SINGLE' ? (
                  <>
                    {/* Resumen Superior de esta liquidación */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-500 block font-medium">Total Liquidación:</span>
                        <span className="font-mono font-bold text-slate-900 text-base">
                          Gs. {formatGs(modalSettlement.montoTotalGeneral)}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {modalSettlement.volumenDespachos} despacho(s)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-medium">Total Recibido:</span>
                        <span className="font-mono font-bold text-emerald-800 text-base">
                          Gs. {formatGs(modalSettlement.montoRecibido)}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {modalSettlement.pagos.length} pago(s) registrado(s)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-medium">Saldo de la Liquidación:</span>
                        <span
                          className={`font-mono font-bold text-base ${
                            modalSettlement.montoTotalGeneral - modalSettlement.montoRecibido > 0
                              ? 'text-rose-700'
                              : modalSettlement.montoTotalGeneral - modalSettlement.montoRecibido < 0
                              ? 'text-emerald-700'
                              : 'text-slate-700'
                          }`}
                        >
                          {modalSettlement.montoTotalGeneral - modalSettlement.montoRecibido === 0
                            ? 'Gs. 0 (Cancelado)'
                            : modalSettlement.montoTotalGeneral - modalSettlement.montoRecibido < 0
                            ? `+Gs. ${formatGs(
                                Math.abs(
                                  modalSettlement.montoTotalGeneral - modalSettlement.montoRecibido
                                )
                              )} (A favor)`
                            : `Gs. ${formatGs(
                                modalSettlement.montoTotalGeneral - modalSettlement.montoRecibido
                              )} (Pendiente LG)`}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Estado: {modalSettlement.estado}
                        </span>
                      </div>
                    </div>

                    {/* Tabla 1: Datos Liquidación */}
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <div className="bg-slate-900 text-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider">
                        Resumen de Liquidación
                      </div>
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                            <th className="py-2 px-3 text-center">Nº LIQUIDACIÓN</th>
                            <th className="py-2 px-3 text-center">FECHA EMISIÓN</th>
                            <th className="py-2 px-3 text-center">CANT. DESPACHOS</th>
                            <th className="py-2 px-3 text-right">MONTO TOTAL (GS.)</th>
                            <th className="py-2 px-3 text-right">TOTAL RECIBIDO (GS.)</th>
                            <th className="py-2 px-3 text-center">ESTADO DE CUENTA</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="divide-x divide-slate-200">
                            <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                              {modalSettlement.numLiquidacion}
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-slate-700">
                              {modalSettlement.fecha}
                            </td>
                            <td className="py-2 px-3 text-center font-medium">
                              {modalSettlement.volumenDespachos} despacho(s)
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                              Gs. {formatGs(modalSettlement.montoTotalGeneral)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                              Gs. {formatGs(modalSettlement.montoRecibido)}
                            </td>
                            <td className="py-2 px-3 text-center font-bold">
                              {modalSettlement.montoTotalGeneral - modalSettlement.montoRecibido === 0
                                ? 'CANCELADO (100%)'
                                : modalSettlement.montoTotalGeneral - modalSettlement.montoRecibido < 0
                                ? `A FAVOR DEL CLIENTE (+${formatGs(
                                    Math.abs(
                                      modalSettlement.montoTotalGeneral -
                                        modalSettlement.montoRecibido
                                    )
                                  )})`
                                : `PENDIENTE DE COBRO (${formatGs(
                                    modalSettlement.montoTotalGeneral -
                                      modalSettlement.montoRecibido
                                  )})`}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Tabla 2: DESGLOSE DETALLADO DE MONTOS RECIBIDOS Y ANTICIPOS con las 6 columnas solicitadas */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          DESGLOSE DETALLADO DE MONTOS RECIBIDOS Y ANTICIPOS ({modalSettlement.pagos.length})
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          (FECHA / N° DE LIQUIDACIÓN / CONCEPTO / DETALLE DEL PAGO / MEDIO DE PAGO / VALOR (GS.))
                        </span>
                      </div>

                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                              <th className="py-2 px-3 w-24 text-center">FECHA</th>
                              <th className="py-2 px-3 w-28 text-center">N° DE LIQUIDACIÓN</th>
                              <th className="py-2 px-3">CONCEPTO</th>
                              <th className="py-2 px-3">DETALLE DEL PAGO</th>
                              <th className="py-2 px-3 w-28 text-center">MEDIO DE PAGO</th>
                              <th className="py-2 px-3 text-right w-32">VALOR (GS.)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {modalSettlement.pagos.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-4 text-center text-slate-500">
                                  Sin pagos registrados para esta liquidación.
                                </td>
                              </tr>
                            ) : (
                              modalSettlement.pagos.map((p) => {
                                const isTransfer = p.metodoPago === 'Transferencia';
                                return (
                                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-2 px-3 font-mono text-center text-slate-800 align-middle">
                                      {p.fecha}
                                    </td>
                                    <td className="py-2 px-3 font-mono font-bold text-center text-slate-900 align-middle">
                                      {p.numLiquidacion || modalSettlement.numLiquidacion}
                                    </td>
                                    <td className="py-2 px-3 font-medium text-slate-900 align-middle">
                                      {p.concepto}
                                    </td>
                                    <td className="py-2 px-3 text-slate-700 align-middle">
                                      {p.detallePago}
                                    </td>
                                    <td className="py-2 px-3 text-center align-middle">
                                      <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold ${
                                          isTransfer
                                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        }`}
                                      >
                                        {isTransfer ? (
                                          <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                                        ) : (
                                          <Banknote className="w-3 h-3 text-emerald-600" />
                                        )}
                                        <span>{p.metodoPago}</span>
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800 align-middle">
                                      Gs. {formatGs(p.monto)}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
                              <td colSpan={5} className="py-2.5 px-3 text-right">
                                Total Efectivamente Recibido:
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-emerald-800">
                                Gs. {formatGs(modalSettlement.montoRecibido)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Tabla 3: RESUMEN FINANCIERO Y CONCILIACIÓN DE SALDO FINAL */}
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <div className="bg-slate-900 text-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider">
                        RESUMEN FINANCIERO Y CONCILIACIÓN DE SALDO FINAL
                      </div>
                      <table className="w-full text-xs">
                        <tbody className="divide-y divide-slate-200">
                          <tr>
                            <td className="py-2.5 px-3.5 font-bold text-slate-700">
                              MONTO TOTAL GENERAL DE LA LIQUIDACIÓN ADUANERA:
                            </td>
                            <td className="py-2.5 px-3.5 font-mono font-bold text-right text-slate-900 text-sm">
                              Gs. {formatGs(modalSettlement.montoTotalGeneral)}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3.5 font-bold text-slate-700">
                              TOTAL DE MONTOS RECIBIDOS / ANTICIPOS DEL CLIENTE:
                            </td>
                            <td className="py-2.5 px-3.5 font-mono font-bold text-right text-emerald-800 text-sm">
                              Gs. {formatGs(modalSettlement.montoRecibido)}
                            </td>
                          </tr>
                          <tr
                            className={
                              modalSettlement.montoTotalGeneral - modalSettlement.montoRecibido < 0
                                ? 'bg-emerald-50 text-emerald-950 font-bold'
                                : modalSettlement.montoTotalGeneral - modalSettlement.montoRecibido > 0
                                ? 'bg-rose-50 text-rose-950 font-bold'
                                : 'bg-slate-100 text-slate-900 font-bold'
                            }
                          >
                            <td className="py-2.5 px-3.5">
                              {modalSettlement.montoTotalGeneral - modalSettlement.montoRecibido < 0
                                ? 'SALDO A FAVOR DEL CLIENTE (DEVOLUCIÓN O CRÉDITO FUTURO):'
                                : modalSettlement.montoTotalGeneral - modalSettlement.montoRecibido > 0
                                ? 'SALDO A FAVOR DE LG LOGÍSTICA (PENDIENTE DE COBRO A CUENTA LG):'
                                : 'ESTADO DE LIQUIDACIÓN CONCILIADO:'}
                            </td>
                            <td className="py-2.5 px-3.5 font-mono text-right text-sm">
                              {modalSettlement.montoTotalGeneral - modalSettlement.montoRecibido === 0
                                ? 'Gs. 0 (Cancelado 100%)'
                                : modalSettlement.montoTotalGeneral - modalSettlement.montoRecibido < 0
                                ? `Gs. ${formatGs(
                                    Math.abs(
                                      modalSettlement.montoTotalGeneral -
                                        modalSettlement.montoRecibido
                                    )
                                  )} (A Favor del Cliente)`
                                : `Gs. ${formatGs(
                                    modalSettlement.montoTotalGeneral -
                                      modalSettlement.montoRecibido
                                  )} (Pendiente a LG)`}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <>
                    {/* VISTA PESTAÑA 2: EXTRACTO CONSOLIDADO DEL CLIENTE */}
                    <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-lg text-xs flex items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-indigo-900 block">
                          Extracto Anual Completo — {modalSettlement.cliente.razonSocial}
                        </span>
                        <span className="text-indigo-700">
                          Consolida todas las liquidaciones realizadas para este cliente en el año fiscal 2026.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const f = exportClientStatementPDF(
                            modalSettlement.cliente,
                            currentClientSettlements,
                            statementDateFrom,
                            statementDateTo,
                            companyInfo
                          );
                          showToast(`Extracto descargado: ${f}`);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-md shadow-xs cursor-pointer inline-flex items-center gap-1.5 text-xs shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar PDF</span>
                      </button>
                    </div>

                    {/* Tabla 1 Consolidada: Todas las liquidaciones del cliente */}
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <div className="bg-slate-900 text-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                        <span>1. Historial de Liquidaciones y Despachos del Cliente</span>
                        <span>{currentClientSettlements.length} liquidaciones</span>
                      </div>
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                            <th className="py-2 px-3 text-center">Nº LIQUIDACIÓN</th>
                            <th className="py-2 px-3 text-center">FECHA EMISIÓN</th>
                            <th className="py-2 px-3 text-center">CANT. DESPACHOS</th>
                            <th className="py-2 px-3 text-right">MONTO TOTAL (GS.)</th>
                            <th className="py-2 px-3 text-right">TOTAL RECIBIDO (GS.)</th>
                            <th className="py-2 px-3 text-right">SALDO (GS.)</th>
                            <th className="py-2 px-3 text-center">ESTADO DE CUENTA</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {currentClientSettlements.map((s) => {
                            const diff = s.montoTotalGeneral - s.montoRecibido;
                            return (
                              <tr key={s.id} className="hover:bg-slate-50">
                                <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                                  {s.numLiquidacion}
                                </td>
                                <td className="py-2 px-3 text-center font-mono text-slate-700">
                                  {s.fecha}
                                </td>
                                <td className="py-2 px-3 text-center font-medium">
                                  {s.volumenDespachos} desp.
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                                  Gs. {formatGs(s.montoTotalGeneral)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                                  Gs. {formatGs(s.montoRecibido)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold">
                                  {diff === 0 ? (
                                    <span className="text-slate-400">Gs. 0</span>
                                  ) : diff < 0 ? (
                                    <span className="text-emerald-700">
                                      +Gs. {formatGs(Math.abs(diff))}
                                    </span>
                                  ) : (
                                    <span className="text-rose-700">
                                      Gs. {formatGs(diff)}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-center font-bold text-[11px]">
                                  {diff === 0 ? (
                                    <span className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                      CANCELADO (100%)
                                    </span>
                                  ) : diff < 0 ? (
                                    <span className="text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                                      A FAVOR CLIENTE
                                    </span>
                                  ) : (
                                    <span className="text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded">
                                      PENDIENTE (A CUENTA LG)
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                            <td colSpan={2} className="py-2 px-3 text-right">
                              TOTAL CONSOLIDADO:
                            </td>
                            <td className="py-2 px-3 text-center">
                              {clientTotalDespachos} despachos
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              Gs. {formatGs(clientTotalGeneral)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-emerald-800">
                              Gs. {formatGs(clientTotalRecibido)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              {clientEsPagado
                                ? 'Gs. 0'
                                : clientEsSaldoAFavor
                                ? `+Gs. ${formatGs(Math.abs(clientSaldoNeto))}`
                                : `Gs. ${formatGs(clientSaldoNeto)}`}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {clientEsPagado ? 'AL DÍA' : clientEsSaldoAFavor ? 'A FAVOR CLIENTE' : 'PENDIENTE LG'}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Tabla 2 Consolidada: DESGLOSE DETALLADO DE MONTOS RECIBIDOS Y ANTICIPOS */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          2. DESGLOSE DETALLADO DE MONTOS RECIBIDOS Y ANTICIPOS DEL CLIENTE ({clientAllPayments.length})
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          (FECHA / N° DE LIQUIDACIÓN / CONCEPTO / DETALLE DEL PAGO / MEDIO DE PAGO / VALOR (GS.))
                        </span>
                      </div>

                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                              <th className="py-2 px-3 w-24 text-center">FECHA</th>
                              <th className="py-2 px-3 w-28 text-center">N° DE LIQUIDACIÓN</th>
                              <th className="py-2 px-3">CONCEPTO</th>
                              <th className="py-2 px-3">DETALLE DEL PAGO</th>
                              <th className="py-2 px-3 w-28 text-center">MEDIO DE PAGO</th>
                              <th className="py-2 px-3 text-right w-32">VALOR (GS.)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {clientAllPayments.map((p) => {
                              const isTransfer = p.metodoPago === 'Transferencia';
                              return (
                                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="py-2 px-3 font-mono text-center text-slate-800 align-middle">
                                    {p.fecha}
                                  </td>
                                  <td className="py-2 px-3 font-mono font-bold text-center text-slate-900 align-middle">
                                    {p.numLiquidacion}
                                  </td>
                                  <td className="py-2 px-3 font-medium text-slate-900 align-middle">
                                    {p.concepto}
                                  </td>
                                  <td className="py-2 px-3 text-slate-700 align-middle">
                                    {p.detallePago}
                                  </td>
                                  <td className="py-2 px-3 text-center align-middle">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold ${
                                        isTransfer
                                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      }`}
                                    >
                                      {isTransfer ? (
                                        <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                                      ) : (
                                        <Banknote className="w-3 h-3 text-emerald-600" />
                                      )}
                                      <span>{p.metodoPago}</span>
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800 align-middle">
                                    Gs. {formatGs(p.monto)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
                              <td colSpan={5} className="py-2.5 px-3 text-right">
                                Total Efectivamente Recibido:
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-emerald-800">
                                Gs. {formatGs(clientTotalRecibido)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Tabla 3 Consolidada: RESUMEN FINANCIERO Y CONCILIACIÓN DE SALDO FINAL */}
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <div className="bg-slate-900 text-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider">
                        3. RESUMEN FINANCIERO Y CONCILIACIÓN DE SALDO FINAL
                      </div>
                      <table className="w-full text-xs">
                        <tbody className="divide-y divide-slate-200">
                          <tr>
                            <td className="py-2.5 px-3.5 font-bold text-slate-700">
                              MONTO TOTAL GENERAL DE TODAS LAS LIQUIDACIONES ADUANERAS:
                            </td>
                            <td className="py-2.5 px-3.5 font-mono font-bold text-right text-slate-900 text-sm">
                              Gs. {formatGs(clientTotalGeneral)}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3.5 font-bold text-slate-700">
                              TOTAL DE MONTOS RECIBIDOS / ANTICIPOS DEL CLIENTE:
                            </td>
                            <td className="py-2.5 px-3.5 font-mono font-bold text-right text-emerald-800 text-sm">
                              Gs. {formatGs(clientTotalRecibido)}
                            </td>
                          </tr>
                          <tr
                            className={
                              clientEsSaldoAFavor
                                ? 'bg-emerald-50 text-emerald-950 font-bold'
                                : clientSaldoNeto > 0
                                ? 'bg-rose-50 text-rose-950 font-bold'
                                : 'bg-slate-100 text-slate-900 font-bold'
                            }
                          >
                            <td className="py-2.5 px-3.5">
                              {clientEsSaldoAFavor
                                ? 'SALDO A FAVOR DEL CLIENTE (DEVOLUCIÓN O CRÉDITO FUTURO):'
                                : clientSaldoNeto > 0
                                ? 'SALDO A FAVOR DE LG LOGÍSTICA (PENDIENTE DE COBRO A CUENTA LG):'
                                : 'ESTADO DE CONCILIACIÓN FINAL:'}
                            </td>
                            <td className="py-2.5 px-3.5 font-mono text-right text-sm">
                              {clientEsPagado
                                ? 'Gs. 0 (Cancelado 100% — Cuenta al Día)'
                                : clientEsSaldoAFavor
                                ? `Gs. ${formatGs(Math.abs(clientSaldoNeto))} (A Favor del Cliente)`
                                : `Gs. ${formatGs(clientSaldoNeto)} (Saldo a Favor de LG — Pendiente a Cuenta LG)`}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* Footer Modal con Botones */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setModalSettlement(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg cursor-pointer"
                >
                  Cerrar
                </button>

                <div className="flex items-center gap-2">
                  {modalTab === 'CLIENT_STATEMENT' ? (
                    <button
                      type="button"
                      onClick={() => {
                        const fName = exportClientStatementPDF(
                          modalSettlement.cliente,
                          currentClientSettlements,
                          statementDateFrom,
                          statementDateTo,
                          companyInfo
                        );
                        showToast(`Extracto oficial descargado: ${fName}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar Extracto Consolidado PDF</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const fName = exportToExcel(
                            {
                              ref: modalSettlement.numLiquidacion,
                              facturaNo: modalSettlement.numLiquidacion,
                              proveedor: modalSettlement.cliente.razonSocial,
                              aduana: '021 - ZONA FRANCA GLOBAL',
                              paisOrigen: 'PARAGUAY',
                              regimen: 'IC04',
                            },
                            [
                              { concept: 'IMPUESTO AL VALOR AGREGADO (I.V.A.)', amount: Math.round(modalSettlement.montoTotalGeneral * 0.42) },
                              { concept: 'SERVICIO DE VALORACION ADUANERA.', amount: Math.round(modalSettlement.montoTotalGeneral * 0.03) },
                              { concept: 'INDI', amount: 0 },
                              { concept: 'DERECHOS ADUANEROS', amount: Math.round(modalSettlement.montoTotalGeneral * 0.18) },
                              { concept: 'IRE GENERAL 700', amount: Math.round(modalSettlement.montoTotalGeneral * 0.02) },
                              { concept: 'TASA INTERVENCION ADUANERA', amount: 85000 },
                              { concept: 'TASAS PORTUARIAS APROX.', amount: 435000 },
                              { concept: 'SISTEMA INFORMATICO SOFIA.', amount: 155000 },
                              { concept: 'DINAVISA', amount: 0 },
                              { concept: 'FLETE INTERNO Y ESTIBADORES', amount: 0 },
                              { concept: 'GASTOS DESPACHO - FOTOCOPIAS.', amount: 385000 },
                              { concept: 'HONORARIOS DESPACHANTE (IVA INCLUIDO)', amount: Math.round(modalSettlement.montoTotalGeneral * 0.25) },
                              { concept: 'CANON INFORMATICO Y TASAS OPERATIVAS', amount: 115000 },
                            ],
                            {
                              title: `${companyInfo.razonSocial} - PROFORMA DE DESPACHO ADUANERO`,
                            }
                          );
                          showToast(`Excel oficial generado: ${fName}`);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg cursor-pointer shadow-xs"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Descargar Excel (.xlsx)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const fName = exportToPDF(modalSettlement, companyInfo);
                          showToast(`PDF oficial generado: ${fName}`);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar Reporte Liquidación PDF</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 5. MODAL INDEPENDIENTE: EXTRACTO DE CUENTA CORRIENTE POR CLIENTE */}
      {isStatementModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-xs"
          onClick={() => setIsStatementModalOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-white border border-slate-300 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-500/20 text-sky-400 rounded-md border border-blue-400/30">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Extracto de Cuenta Corriente — {activeStatementClient.razonSocial}
                  </h3>
                  <p className="text-xs text-slate-300">
                    RUC: {activeStatementClient.ruc} · Período: {statementDateFrom} al {statementDateTo}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsStatementModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido Modal */}
            <div className="p-5 overflow-y-auto space-y-5">
              {/* Tarjetas de Resumen Financiero del Período */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block font-medium">Total Liquidaciones:</span>
                  <span className="font-mono font-bold text-slate-900 text-base">
                    Gs. {formatGs(statementMetrics.totalGeneral)}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {activeStatementSettlements.length} liquidaciones ({statementMetrics.totalDespachos} despachos)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Total Fondos Recibidos:</span>
                  <span className="font-mono font-bold text-emerald-800 text-base">
                    Gs. {formatGs(statementMetrics.totalRecibido)}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Ingresado por transferencias y caja
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Saldo Neto Conciliado:</span>
                  <span
                    className={`font-mono font-bold text-base ${
                      statementMetrics.esSaldoAFavor
                        ? 'text-emerald-700'
                        : statementMetrics.saldo > 0
                        ? 'text-rose-700'
                        : 'text-slate-700'
                    }`}
                  >
                    {statementMetrics.esPagado
                      ? 'Gs. 0 (Al Día)'
                      : statementMetrics.esSaldoAFavor
                      ? `+Gs. ${formatGs(Math.abs(statementMetrics.saldo))} (A Favor Cliente)`
                      : `Gs. ${formatGs(statementMetrics.saldo)} (A Cuenta LG)`}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {statementMetrics.esSaldoAFavor
                      ? 'Saldo a favor para próximos despachos'
                      : statementMetrics.saldo > 0
                      ? 'Saldo pendiente de cobro por LG'
                      : 'Cuenta 100% saldada'}
                  </span>
                </div>
              </div>

              {/* Tabla 1: Historial de Liquidaciones del Cliente */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-900 text-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>1. Historial de Liquidaciones y Despachos Registrados</span>
                  <span>{activeStatementSettlements.length} liquidación(es)</span>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <th className="py-2 px-3 text-center">Nº LIQUIDACIÓN</th>
                      <th className="py-2 px-3 text-center">FECHA EMISIÓN</th>
                      <th className="py-2 px-3 text-center">CANT. DESPACHOS</th>
                      <th className="py-2 px-3 text-right">MONTO TOTAL (GS.)</th>
                      <th className="py-2 px-3 text-right">TOTAL RECIBIDO (GS.)</th>
                      <th className="py-2 px-3 text-right">SALDO (GS.)</th>
                      <th className="py-2 px-3 text-center">ESTADO DE CUENTA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activeStatementSettlements.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-500">
                          No se encontraron liquidaciones para este cliente en el rango seleccionado ({statementDateFrom} al {statementDateTo}).
                        </td>
                      </tr>
                    ) : (
                      activeStatementSettlements.map((s) => {
                        const diff = s.montoTotalGeneral - s.montoRecibido;
                        return (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                              {s.numLiquidacion}
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-slate-700">
                              {s.fecha}
                            </td>
                            <td className="py-2 px-3 text-center font-medium">
                              {s.volumenDespachos} desp.
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                              Gs. {formatGs(s.montoTotalGeneral)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                              Gs. {formatGs(s.montoRecibido)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold">
                              {diff === 0 ? (
                                <span className="text-slate-400">Gs. 0</span>
                              ) : diff < 0 ? (
                                <span className="text-emerald-700">
                                  +Gs. {formatGs(Math.abs(diff))}
                                </span>
                              ) : (
                                <span className="text-rose-700">
                                  Gs. {formatGs(diff)}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-[11px]">
                              {diff === 0 ? (
                                <span className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                  CANCELADO (100%)
                                </span>
                              ) : diff < 0 ? (
                                <span className="text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                                  A FAVOR CLIENTE
                                </span>
                              ) : (
                                <span className="text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded">
                                  PENDIENTE (A CUENTA LG)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {activeStatementSettlements.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                        <td colSpan={2} className="py-2 px-3 text-right">
                          TOTAL CONSOLIDADO:
                        </td>
                        <td className="py-2 px-3 text-center">
                          {statementMetrics.totalDespachos} despachos
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          Gs. {formatGs(statementMetrics.totalGeneral)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-800">
                          Gs. {formatGs(statementMetrics.totalRecibido)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {statementMetrics.esPagado
                            ? 'Gs. 0'
                            : statementMetrics.esSaldoAFavor
                            ? `+Gs. ${formatGs(Math.abs(statementMetrics.saldo))}`
                            : `Gs. ${formatGs(statementMetrics.saldo)}`}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {statementMetrics.esPagado
                            ? 'AL DÍA'
                            : statementMetrics.esSaldoAFavor
                            ? 'A FAVOR CLIENTE'
                            : 'PENDIENTE LG'}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Tabla 2: DESGLOSE DETALLADO DE MONTOS RECIBIDOS Y ANTICIPOS con las 6 columnas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    2. DESGLOSE DETALLADO DE MONTOS RECIBIDOS Y ANTICIPOS (HISTORIAL DE PAGOS)
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    (FECHA / N° DE LIQUIDACIÓN / CONCEPTO / DETALLE DEL PAGO / MEDIO DE PAGO / VALOR (GS.))
                  </span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                        <th className="py-2 px-3 w-24 text-center">FECHA</th>
                        <th className="py-2 px-3 w-28 text-center">N° DE LIQUIDACIÓN</th>
                        <th className="py-2 px-3">CONCEPTO</th>
                        <th className="py-2 px-3">DETALLE DEL PAGO</th>
                        <th className="py-2 px-3 w-28 text-center">MEDIO DE PAGO</th>
                        <th className="py-2 px-3 text-right w-32">VALOR (GS.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(() => {
                        const allP: PaymentDetail[] = [];
                        for (const s of activeStatementSettlements) {
                          for (const p of s.pagos) {
                            allP.push({
                              ...p,
                              numLiquidacion: p.numLiquidacion || s.numLiquidacion,
                            });
                          }
                        }
                        allP.sort((a, b) => a.fecha.localeCompare(b.fecha));

                        if (allP.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="py-4 text-center text-slate-500">
                                Sin pagos registrados en este período.
                              </td>
                            </tr>
                          );
                        }

                        return allP.map((p) => {
                          const isTransfer = p.metodoPago === 'Transferencia';
                          return (
                            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2 px-3 font-mono text-center text-slate-800 align-middle">
                                {p.fecha}
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-center text-slate-900 align-middle">
                                {p.numLiquidacion}
                              </td>
                              <td className="py-2 px-3 font-medium text-slate-900 align-middle">
                                {p.concepto}
                              </td>
                              <td className="py-2 px-3 text-slate-700 align-middle">
                                {p.detallePago}
                              </td>
                              <td className="py-2 px-3 text-center align-middle">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold ${
                                    isTransfer
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}
                                >
                                  {isTransfer ? (
                                    <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                                  ) : (
                                    <Banknote className="w-3 h-3 text-emerald-600" />
                                  )}
                                  <span>{p.metodoPago}</span>
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800 align-middle">
                                Gs. {formatGs(p.monto)}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
                        <td colSpan={5} className="py-2.5 px-3 text-right">
                          Total Efectivamente Recibido:
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-800">
                          Gs. {formatGs(statementMetrics.totalRecibido)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Tabla 3: RESUMEN FINANCIERO Y CONCILIACIÓN DE SALDO FINAL */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-900 text-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider">
                  3. RESUMEN FINANCIERO Y CONCILIACIÓN DE SALDO FINAL
                </div>
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-2.5 px-3.5 font-bold text-slate-700">
                        MONTO TOTAL GENERAL DE TODAS LAS LIQUIDACIONES ADUANERAS:
                      </td>
                      <td className="py-2.5 px-3.5 font-mono font-bold text-right text-slate-900 text-sm">
                        Gs. {formatGs(statementMetrics.totalGeneral)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 font-bold text-slate-700">
                        TOTAL DE MONTOS RECIBIDOS / ANTICIPOS DEL CLIENTE:
                      </td>
                      <td className="py-2.5 px-3.5 font-mono font-bold text-right text-emerald-800 text-sm">
                        Gs. {formatGs(statementMetrics.totalRecibido)}
                      </td>
                    </tr>
                    <tr
                      className={
                        statementMetrics.esSaldoAFavor
                          ? 'bg-emerald-50 text-emerald-950 font-bold'
                          : statementMetrics.saldo > 0
                          ? 'bg-rose-50 text-rose-950 font-bold'
                          : 'bg-slate-100 text-slate-900 font-bold'
                      }
                    >
                      <td className="py-2.5 px-3.5">
                        {statementMetrics.esSaldoAFavor
                          ? 'SALDO A FAVOR DEL CLIENTE (DEVOLUCIÓN O CRÉDITO FUTURO):'
                          : statementMetrics.saldo > 0
                          ? 'SALDO A FAVOR DE LG LOGÍSTICA (PENDIENTE DE COBRO A CUENTA LG):'
                          : 'ESTADO DE CONCILIACIÓN FINAL:'}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-right text-sm">
                        {statementMetrics.esPagado
                          ? 'Gs. 0 (Cancelado 100% — Cuenta al Día)'
                          : statementMetrics.esSaldoAFavor
                          ? `Gs. ${formatGs(Math.abs(statementMetrics.saldo))} (A Favor del Cliente)`
                          : `Gs. ${formatGs(statementMetrics.saldo)} (Saldo a Favor de LG — Pendiente a Cuenta LG)`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Modal con Botones */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsStatementModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg cursor-pointer"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={() => {
                  const fName = exportClientStatementPDF(
                    activeStatementClient,
                    activeStatementSettlements,
                    statementDateFrom,
                    statementDateTo,
                    companyInfo
                  );
                  showToast(`Extracto oficial descargado: ${fName}`);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Extracto PDF A4</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
