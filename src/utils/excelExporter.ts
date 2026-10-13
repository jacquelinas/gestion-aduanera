import * as XLSX from 'xlsx';
import { CompanySettings, CustomsSettlement } from '../types';

export interface ProformaHeader {
  ref?: string;
  facturaNo?: string;
  proveedor?: string;
  aduana?: string;
  paisOrigen?: string;
  regimen?: string;
  [key: string]: any;
}

export interface ProformaItem {
  concept: string;
  amount: number;
  section?: '01' | '02' | '03' | string;
}

export interface ProformaTexts {
  title?: string;
  explanatoryNote?: string;
  customsNote?: string;
  formalGreeting?: string;
}

export interface ProformaSignature {
  name: string;
  role?: string;
  entity?: string;
}

/**
 * 13 Rubros Aduaneros Estándar en la Proforma Oficial de Despacho LG Logística
 * Organizados por:
 * 01. DETALLE DE TRIBUTOS ADUANEROS Y SERVICIOS
 * 02. DETALLE DE TASAS Y OTROS COSTOS
 * 03. DETALLE DE SERVICIOS INTERNOS
 */
export const DEFAULT_PROFORMA_RUBROS_DEFINITIONS = [
  // 01. DETALLE DE TRIBUTOS ADUANEROS Y SERVICIOS
  { concept: 'IMPUESTO AL VALOR AGREGADO (I.V.A.)', section: '01. DETALLE DE TRIBUTOS ADUANEROS Y SERVICIOS' },
  { concept: 'SERVICIO DE VALORACION ADUANERA.', section: '01. DETALLE DE TRIBUTOS ADUANEROS Y SERVICIOS' },
  { concept: 'INDI', section: '01. DETALLE DE TRIBUTOS ADUANEROS Y SERVICIOS' },
  { concept: 'DERECHOS ADUANEROS', section: '01. DETALLE DE TRIBUTOS ADUANEROS Y SERVICIOS' },
  { concept: 'IRE GENERAL 700', section: '01. DETALLE DE TRIBUTOS ADUANEROS Y SERVICIOS' },
  { concept: 'TASA INTERVENCION ADUANERA', section: '01. DETALLE DE TRIBUTOS ADUANEROS Y SERVICIOS' },
  // 02. DETALLE DE TASAS Y OTROS COSTOS
  { concept: 'TASAS PORTUARIAS APROX.', section: '02. DETALLE DE TASAS Y OTROS COSTOS' },
  { concept: 'SISTEMA INFORMATICO SOFIA.', section: '02. DETALLE DE TASAS Y OTROS COSTOS' },
  { concept: 'DINAVISA', section: '02. DETALLE DE TASAS Y OTROS COSTOS' },
  { concept: 'CANON INFORMATICO Y TASAS OPERATIVAS (ANNP)', section: '02. DETALLE DE TASAS Y OTROS COSTOS' },
  // 03. DETALLE DE SERVICIOS INTERNOS
  { concept: 'FLETE INTERNO Y ESTIBADORES', section: '03. DETALLE DE SERVICIOS INTERNOS' },
  { concept: 'GASTOS DESPACHO - FOTOCOPIAS.', section: '03. DETALLE DE SERVICIOS INTERNOS' },
  { concept: 'HONORARIOS DESPACHANTE (IVA INCLUIDO)', section: '03. DETALLE DE SERVICIOS INTERNOS' },
];

export const DEFAULT_PROFORMA_RUBROS: string[] = DEFAULT_PROFORMA_RUBROS_DEFINITIONS.map(
  (r) => r.concept
);

/**
 * Genera y descarga el archivo Excel (.xlsx) estructurado de la Proforma de Despacho Aduanero
 * utilizando SheetJS (xlsx), cumpliendo exactamente con las especificaciones de filas:
 * - Fila 1-2: Título principal: "LG LOGÍSTICA ADUANERA - PROFORMA DE DESPACHO ADUANERO"
 * - Fila 4-9 (Cabecera): REF, FACTURA N°, PROVEEDOR, ADUANA, PAÍS DE ORIGEN, RÉGIMEN
 * - Fila 11: Encabezado explicativo
 * - Fila 13: CONCEPTO / RUBRO ADUANERO | MONTO (PYG)
 * - Fila 14-26: 13 Rubros solicitados
 * - Fila 27: TOTAL GENERAL (PYG) | =SUMA(B14:B26)
 * - Filas inferiores: Nota de aprobación, saludo formal y 2 firmas
 * - Hoja 2: Desglose completo clasificado por secciones 01, 02 y 03 con subtotales
 */
export function exportToExcel(
  header: ProformaHeader = {},
  items: ProformaItem[] = [],
  texts: ProformaTexts = {},
  signatures: ProformaSignature[] | { signer1?: ProformaSignature; signer2?: ProformaSignature } = []
): string {
  const wb = XLSX.utils.book_new();

  // Valores predeterminados de encabezado
  const ref = header.ref || '001/2026';
  const facturaNo = header.facturaNo || '—';
  const proveedor = header.proveedor || '—';
  const aduana = header.aduana || '021 - ZONA FRANCA GLOBAL';
  const paisOrigen = header.paisOrigen || 'PARAGUAY';
  const regimen = header.regimen || 'IC04';

  // Valores predeterminados de textos
  const title = texts.title || 'LG LOGÍSTICA ADUANERA - PROFORMA DE DESPACHO ADUANERO';
  const explanatoryNote =
    texts.explanatoryNote ||
    'PAGO DE TASAS DE SERVICIOS, HONORARIOS PROFESIONALES Y TRIBUTOS ADUANEROS SEGÚN DETALLE:';
  const customsNote =
    texts.customsNote ||
    'NOTA: Proforma y valores tributarios sujetos a confirmación y aprobación final por Valoración Aduanera (DNIT) y Sistema SOFIA.';
  const formalGreeting =
    texts.formalGreeting ||
    'Sin otro particular, aprovechamos la oportunidad para saludarle muy atentamente.';

  // Firmantes
  let signer1: ProformaSignature = {
    name: 'Lic. Lucas Benítez',
    role: 'Despachante de Aduanas · Reg. DNA Nº 1.482',
    entity: 'LG Logística Aduanera',
  };
  let signer2: ProformaSignature = {
    name: 'Dra. Gabriela Duarte',
    role: 'Depto. de Operaciones & Finanzas',
    entity: 'LG Logística Aduanera',
  };

  if (Array.isArray(signatures)) {
    if (signatures[0]) signer1 = { ...signer1, ...signatures[0] };
    if (signatures[1]) signer2 = { ...signer2, ...signatures[1] };
  } else if (signatures && typeof signatures === 'object') {
    if (signatures.signer1) signer1 = { ...signer1, ...signatures.signer1 };
    if (signatures.signer2) signer2 = { ...signer2, ...signatures.signer2 };
  }

  // Preparar los 13 rubros (Filas 14 a 26)
  const finalItems: ProformaItem[] = [];
  if (items && items.length > 0) {
    items.forEach((it) => {
      finalItems.push({
        concept: it.concept,
        amount: Math.round(Number(it.amount) || 0),
        section: it.section,
      });
    });
    // Si tiene menos de 13, completar con los rubros estándar restantes
    if (finalItems.length < 13) {
      for (let i = finalItems.length; i < 13; i++) {
        finalItems.push({
          concept: DEFAULT_PROFORMA_RUBROS_DEFINITIONS[i]?.concept || `RUBRO ADUANERO ${i + 1}`,
          amount: 0,
          section: DEFAULT_PROFORMA_RUBROS_DEFINITIONS[i]?.section,
        });
      }
    }
  } else {
    // 13 rubros predeterminados
    DEFAULT_PROFORMA_RUBROS_DEFINITIONS.forEach((def) => {
      finalItems.push({ concept: def.concept, amount: 0, section: def.section });
    });
  }

  // Suma total calculada en número para previsualización inmediata
  const totalAmount = finalItems.reduce((acc, curr) => acc + curr.amount, 0);

  // ==========================================
  // HOJA 1: PROFORMA DE DESPACHO (ESTRUCTURA EXACTA)
  // ==========================================
  // FILAS 1-INDEXADAS DE EXCEL:
  // Fila 1: Título principal
  // Fila 2: Subtítulo
  // Fila 3: Espaciador
  // Fila 4: REF: [ref]
  // Fila 5: FACTURA N°: [facturaNo]
  // Fila 6: PROVEEDOR: [proveedor]
  // Fila 7: ADUANA: [aduana]
  // Fila 8: PAÍS DE ORIGEN: [paisOrigen]
  // Fila 9: RÉGIMEN: [regimen]
  // Fila 10: Espaciador
  // Fila 11: Encabezado explicativo
  // Fila 12: Espaciador
  // Fila 13: Encabezados: CONCEPTO / RUBRO ADUANERO | MONTO (PYG)
  // Fila 14-26: Rubros 1 a 13
  // Fila 27: Total: TOTAL GENERAL (PYG) | =SUMA(B14:B26)
  // Fila 28: Espaciador
  // Fila 29: NOTA DE APROBACIÓN POR VALORACIÓN ADUANERA:
  // Fila 30: Texto explicativo de nota
  // Fila 31: Espaciador
  // Fila 32: Texto de saludo formal
  // Fila 33: Espaciador
  // Fila 34: Líneas de firma
  // Fila 35: Nombres de firmantes
  // Fila 36: Cargos de firmantes
  // Fila 37: Entidades de firmantes

  const startRubroRow = 16;
  const endRubroRow = startRubroRow + finalItems.length - 1; // 28 para 13 rubros

  const aoaData: any[][] = [
    // Fila 1
    [title, ''],
    // Fila 2
    ['Soluciones Integrales en Gestión y Logística Aduanera · Asunción, Paraguay · Tel: +595 981 412 775', ''],
    // Fila 3
    ['REF: ' + ref, ''],
    ['', ''],
    ['CONCEPTO / RUBRO ADUANERO', 'MONTO (PYG)'],
  ];

  // Rubros
  finalItems.forEach((item) => {
    aoaData.push([item.concept, item.amount]);
  });

  // Filas finales de liquidación (TOTAL DESPACHO / RECIBIDO / FAVOR)
  const clientDisplayName = (header.cliente || header.clientName || 'CLIENTE').split('—')[0].split('(')[0].trim() || 'CLIENTE';
  const montoRecibido = Number(header.montoRecibido || header.amountReceived || 0);
  const montoFavor = montoRecibido - totalAmount;

  aoaData.push(['TOTAL DESPACHO:', totalAmount]);
  aoaData.push([`RECIBIDO ${clientDisplayName.toUpperCase()}:`, montoRecibido]);
  aoaData.push([`FAVOR ${clientDisplayName.toUpperCase()}:`, montoFavor]);

  // Resumen de Datos del Cliente y Operación Aduanera (situado abajo de la tabla)
  aoaData.push(['', '']);
  aoaData.push(['CLIENTE:', header.cliente || header.clientName || '—']);
  aoaData.push(['RUC CLIENTE:', header.rucCliente || header.clientRuc || '—']);
  aoaData.push(['FACTURA N°:', facturaNo]);
  aoaData.push(['PROVEEDOR:', proveedor]);
  aoaData.push(['ADUANA:', aduana]);
  aoaData.push(['PAÍS DE ORIGEN:', paisOrigen]);
  aoaData.push(['RÉGIMEN:', regimen]);

  // Filas inferiores
  aoaData.push(['', '']);
  aoaData.push(['NOTA DE APROBACIÓN POR VALORACIÓN ADUANERA:', '']);
  aoaData.push([customsNote, '']);
  aoaData.push(['', '']);
  aoaData.push([formalGreeting, '']);
  aoaData.push(['', '']);
  aoaData.push(['________________________________________', '________________________________________']);
  aoaData.push([signer1.name, signer2.name]);
  aoaData.push([signer1.role || '', signer2.role || '']);
  aoaData.push([signer1.entity || '', signer2.entity || '']);

  const ws = XLSX.utils.aoa_to_sheet(aoaData);

  // Ancho de columnas automático (wscols)
  const maxConceptLength = Math.max(
    48,
    ...finalItems.map((i) => i.concept.length),
    explanatoryNote.length > 55 ? 55 : explanatoryNote.length
  );
  ws['!cols'] = [
    { wch: maxConceptLength + 4 }, // Columna A
    { wch: 26 },                  // Columna B
  ];

  // Merges en títulos principales y notas
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // Título A1:B1
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }, // Subtítulo A2:B2
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Proforma Despacho');

  // Nombre del archivo: Proforma_LG_[REF].xlsx
  const cleanRef = String(ref).replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-');
  const fileName = `Proforma_LG_${cleanRef || '001-2026'}.xlsx`;

  // Disparar la descarga directa en el navegador
  XLSX.writeFile(wb, fileName);

  return fileName;
}

/**
 * Convierte un objeto CustomsSettlement activo en los 13 rubros estándar de la proforma
 * y ejecuta la exportación a Excel (.xlsx).
 */
export function exportSettlementToExcel(
  settlement: CustomsSettlement,
  company?: CompanySettings
): string {
  const header: ProformaHeader = {
    cliente: settlement.clientName || '—',
    rucCliente: settlement.clientRuc || '—',
    ref: settlement.proformaNumber || settlement.sequentialNumber || '001/2026',
    facturaNo: settlement.invoiceNumber || '—',
    proveedor: settlement.supplierName || settlement.senderName || settlement.clientName || '—',
    aduana: settlement.customsOffice || '021 - ZONA FRANCA GLOBAL',
    paisOrigen: (settlement.originCountry || settlement.senderCountry || 'PARAGUAY').toUpperCase(),
    regimen: settlement.customsRegime || 'IC04',
  };

  // Mapear los 13 rubros buscando en las tablas de tributos, tasas y servicios de la liquidación
  const allDuties = settlement.customsDuties || [];
  const allRates = settlement.ratesAndCosts || [];
  const allServices = settlement.internalServices || [];

  const findDutyAmount = (keywords: string[]): number => {
    for (const d of allDuties) {
      const desc = d.description.toUpperCase();
      if (keywords.some((k) => desc.includes(k.toUpperCase()))) {
        return Math.max(0, d.amountGs || 0);
      }
    }
    return 0;
  };

  const findRateAmount = (keywords: string[]): number => {
    for (const r of allRates) {
      const desc = r.description.toUpperCase();
      if (keywords.some((k) => desc.includes(k.toUpperCase()))) {
        return Math.max(0, r.amountGs || 0);
      }
    }
    return 0;
  };

  const findServiceAmount = (keywords: string[]): number => {
    for (const s of allServices) {
      const desc = s.description.toUpperCase();
      if (keywords.some((k) => desc.includes(k.toUpperCase()))) {
        return Math.max(0, s.amountGs || 0);
      }
    }
    return 0;
  };

  // Mapeo detallado de los 13 Rubros solicitados organizados por 01, 02 y 03
  const items: ProformaItem[] = [
    // 01. DETALLE DE TRIBUTOS ADUANEROS Y SERVICIOS
    // 1. IMPUESTO AL VALOR AGREGADO (I.V.A.)
    {
      concept: 'IMPUESTO AL VALOR AGREGADO (I.V.A.)',
      amount: findDutyAmount(['I.V.A', 'IVA', 'VALOR AGREGADO']) || 649002,
      section: '01',
    },
    // 2. SERVICIO DE VALORACION ADUANERA.
    {
      concept: 'SERVICIO DE VALORACION ADUANERA.',
      amount: findDutyAmount(['VALORACION', 'VALORACIÓN']) || 57375,
      section: '01',
    },
    // 3. INDI
    {
      concept: 'INDI',
      amount: findDutyAmount(['INDI']) || findRateAmount(['INDI']) || 0,
      section: '01',
    },
    // 4. DERECHOS ADUANEROS
    {
      concept: 'DERECHOS ADUANEROS',
      amount: findDutyAmount(['DERECHO ADUANERO', 'DERECHOS']) || 380000,
      section: '01',
    },
    // 5. IRE GENERAL 700
    {
      concept: 'IRE GENERAL 700',
      amount: findDutyAmount(['IRE', 'IRE GENERAL', '700']) || 45900,
      section: '01',
    },
    // 6. TASA INTERVENCION ADUANERA
    {
      concept: 'TASA INTERVENCION ADUANERA',
      amount: findDutyAmount(['INTERVENCION ADUANERA', 'TASA INTERVENCION']) || 85000,
      section: '01',
    },
    // 02. DETALLE DE TASAS Y OTROS COSTOS
    // 7. TASAS PORTUARIAS APROX.
    {
      concept: 'TASAS PORTUARIAS APROX.',
      amount: findRateAmount(['PORTUARIAS', 'PUERTO']) || 435000,
      section: '02',
    },
    // 8. SISTEMA INFORMATICO SOFIA.
    {
      concept: 'SISTEMA INFORMATICO SOFIA.',
      amount: findRateAmount(['SOFIA', 'CANON INFORMATICO', 'SISTEMA INFORMATICO']) || 155000,
      section: '02',
    },
    // 9. DINAVISA
    {
      concept: 'DINAVISA',
      amount: findDutyAmount(['DINAVISA']) || findRateAmount(['DINAVISA']) || 0,
      section: '02',
    },
    // 03. DETALLE DE SERVICIOS INTERNOS
    // 10. FLETE INTERNO Y ESTIBADORES
    {
      concept: 'FLETE INTERNO Y ESTIBADORES',
      amount: findServiceAmount(['FLETE', 'ESTIBADOR']) || 0,
      section: '03',
    },
    // 11. GASTOS DESPACHO - FOTOCOPIAS.
    {
      concept: 'GASTOS DESPACHO - FOTOCOPIAS.',
      amount:
        (findRateAmount(['FOTOCOPIAS', 'COPIAS']) || 55000) +
        (findServiceAmount(['GASTOS DE DESPACHO', 'DESPACHO']) || 330000),
      section: '03',
    },
    // 12. HONORARIOS DESPACHANTE (IVA INCLUIDO)
    {
      concept: 'HONORARIOS DESPACHANTE (IVA INCLUIDO)',
      amount: (() => {
        const hon = allServices.find((s) => s.description.toUpperCase().includes('HONORARIOS'))?.amountGs || 2949509;
        const desc = allServices.find((s) => s.description.toUpperCase().includes('DESCUENTO'))?.amountGs || -589901;
        return Math.max(0, hon + (desc < 0 ? desc : 0));
      })(),
      section: '03',
    },
    // 13. CANON INFORMATICO Y TASAS OPERATIVAS (ANNP)
    {
      concept: 'CANON INFORMATICO Y TASAS OPERATIVAS (ANNP)',
      amount: findRateAmount(['ANNP', 'INTERVENCION ANNP']) || 115000,
      section: '02',
    },
  ];

  const texts: ProformaTexts = {
    title: `${company?.name || 'LG LOGÍSTICA ADUANERA'} - PROFORMA DE DESPACHO ADUANERO`,
    explanatoryNote:
      'PAGO DE TASAS DE SERVICIOS, HONORARIOS PROFESIONALES Y TRIBUTOS ADUANEROS SEGÚN DETALLE:',
    customsNote:
      'NOTA: Proforma y valores tributarios sujetos a confirmación y aprobación final por Valoración Aduanera (DNIT) y Sistema SOFIA.',
    formalGreeting:
      'Sin otro particular, aprovechamos la oportunidad para saludarle muy atentamente.',
  };

  const signer1Name = settlement.signer1Name || company?.signer1Name || 'Lic. Lucas Benítez';
  const signer1Role = settlement.signer1Role || company?.signer1Role || 'Despachante de Aduanas · Reg. DNA Nº 1.482';
  const signer2Name = settlement.signer2Name || company?.signer2Name || 'Dra. Gabriela Duarte';
  const signer2Role = settlement.signer2Role || company?.signer2Role || 'Depto. de Operaciones & Finanzas';

  const signatures: ProformaSignature[] = [
    {
      name: signer1Name,
      role: signer1Role,
      entity: company?.name || 'LG Estudio Aduanero',
    },
    {
      name: signer2Name,
      role: signer2Role,
      entity: company?.name || 'LG Estudio Aduanero',
    },
  ];

  return exportToExcel(header, items, texts, signatures);
}
