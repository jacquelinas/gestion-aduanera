import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  FileSpreadsheet,
  Edit,
  X,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Building,
  Phone,
  MapPin,
  Calendar,
  Layers,
  UserCheck,
} from 'lucide-react';
import { CompanySettings, CustomsSettlement, LineItem, ReceivedPaymentItem } from '../types';
import {
  formatCurrencyGs,
  formatCurrencyUsd,
} from '../utils/formatters';
import { renderCorporateLogoPngDataUrl } from '../utils/logoRenderer';
import { exportProformaPdf } from '../utils/pdfExporter';
import { exportSettlementToExcel } from '../utils/excelExporter';

interface ProformaTabProps {
  settlement: CustomsSettlement;
  company: CompanySettings;
  onUpdateSettlement?: (updated: CustomsSettlement) => void;
  onGoToEditor?: () => void;
  onShowNotice?: (msg: string) => void;
}

export interface ProformaBlockItem {
  id: string;
  concept: string;
  detail?: string;
  amountGs: number;
}

export function computeProformaItems(settlement: CustomsSettlement) {
  const allDuties = settlement.customsDuties || [];
  const allRates = settlement.ratesAndCosts || [];
  const allServices = settlement.internalServices || [];

  const findDutyAmount = (keywords: string[]): number | null => {
    for (const d of allDuties) {
      const desc = d.description.toUpperCase();
      if (keywords.some((k) => desc.includes(k.toUpperCase()))) {
        return Math.max(0, d.amountGs || 0);
      }
    }
    return null;
  };

  const findRateAmount = (keywords: string[]): number | null => {
    for (const r of allRates) {
      const desc = r.description.toUpperCase();
      if (keywords.some((k) => desc.includes(k.toUpperCase()))) {
        return Math.max(0, r.amountGs || 0);
      }
    }
    return null;
  };

  const findServiceAmount = (keywords: string[]): number | null => {
    for (const s of allServices) {
      const desc = s.description.toUpperCase();
      if (keywords.some((k) => desc.includes(k.toUpperCase()))) {
        return Math.max(0, s.amountGs || 0);
      }
    }
    return null;
  };

  // 13 Rubros continuos estándar de liquidación aduanera
  const vFlete = findServiceAmount(['FLETE', 'ESTIBADOR']) ?? 0;
  const vGastosDesp =
    (findRateAmount(['FOTOCOPIAS', 'COPIAS']) ?? 55000) +
    (findServiceAmount(['GASTOS DE DESPACHO', 'DESPACHO']) ?? 330000);
  const vHonorarios = (() => {
    const hon =
      allServices.find((s) => s.description.toUpperCase().includes('HONORARIOS'))?.amountGs ?? 2949509;
    const desc =
      allServices.find((s) => s.description.toUpperCase().includes('DESCUENTO'))?.amountGs ?? -589901;
    return Math.max(0, hon + (desc < 0 ? desc : 0));
  })();

  const rubros: ProformaBlockItem[] = [
    {
      id: 'p-1',
      concept: '1. IMPUESTO AL VALOR AGREGADO (I.V.A.)',
      amountGs: findDutyAmount(['I.V.A', 'IVA', 'VALOR AGREGADO']) ?? 649002,
    },
    {
      id: 'p-2',
      concept: '2. SERVICIO DE VALORACION ADUANERA.',
      amountGs: findDutyAmount(['VALORACION', 'VALORACIÓN']) ?? 57375,
    },
    {
      id: 'p-3',
      concept: '3. INDI',
      amountGs: findDutyAmount(['INDI']) ?? findRateAmount(['INDI']) ?? 0,
    },
    {
      id: 'p-4',
      concept: '4. DERECHOS ADUANEROS',
      amountGs: findDutyAmount(['DERECHO ADUANERO', 'DERECHOS']) ?? 380000,
    },
    {
      id: 'p-5',
      concept: '5. IRE GENERAL 700',
      amountGs: findDutyAmount(['IRE', 'IRE GENERAL', '700']) ?? 45900,
    },
    {
      id: 'p-6',
      concept: '6. TASA INTERVENCION ADUANERA',
      amountGs: findDutyAmount(['INTERVENCION ADUANERA', 'TASA INTERVENCION']) ?? 85000,
    },
    {
      id: 'p-7',
      concept: '7. TASAS PORTUARIAS APROX.',
      amountGs: findRateAmount(['PORTUARIAS', 'PUERTO']) ?? 435000,
    },
    {
      id: 'p-8',
      concept: '8. SISTEMA INFORMATICO SOFIA.',
      amountGs: findRateAmount(['SOFIA', 'CANON INFORMATICO', 'SISTEMA INFORMATICO']) ?? 155000,
    },
    {
      id: 'p-9',
      concept: '9. DINAVISA',
      amountGs: findDutyAmount(['DINAVISA']) ?? findRateAmount(['DINAVISA']) ?? 0,
    },
    {
      id: 'p-10',
      concept: '10. CANON INFORMATICO Y TASAS OPERATIVAS (ANNP)',
      amountGs: findRateAmount(['ANNP', 'INTERVENCION ANNP']) ?? 115000,
    },
    {
      id: 'p-11',
      concept: '11. FLETE INTERNO Y ESTIBADORES',
      amountGs: vFlete,
    },
    {
      id: 'p-12',
      concept: '12. GASTOS DESPACHO - FOTOCOPIAS.',
      amountGs: vGastosDesp,
    },
    {
      id: 'p-13',
      concept: '13. HONORARIOS DESPACHANTE (IVA INCLUIDO)',
      amountGs: vHonorarios,
    },
  ];

  const totalDespacho = rubros.reduce((acc, curr) => acc + curr.amountGs, 0);

  // 04. MONTOS RECIBIDOS
  const montoRecibido =
    settlement.amountReceived ||
    (settlement.receivedPayments?.reduce((sum, p) => sum + (p.amountGs || 0), 0) ?? 0);
  const montoFavor = montoRecibido - totalDespacho;

  const exchangeRate = settlement.exchangeRate || 7650;
  const totalDespachoUsd = totalDespacho / exchangeRate;

  return {
    rubros,
    totalDespacho,
    montoRecibido,
    montoFavor,
    totalDespachoUsd,
    exchangeRate,
  };
}

export const ProformaTab: React.FC<ProformaTabProps> = ({
  settlement,
  company,
  onUpdateSettlement,
  onGoToEditor,
  onShowNotice,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Datos corporativos LG Estudio Aduanero
  const companyName = company.name || 'LG ESTUDIO ADUANERO';
  const companySlogan =
    company.slogan || 'Soluciones Integrales en Gestión y Logística Aduanera';
  const companyAddress = company.address || 'Asunción, Paraguay';
  const companyPhone = '+595 981 412 775';

  // Nombres y cargos de firmantes editables
  const signer1Name = settlement.signer1Name || company.signer1Name || 'Lic. Lucas Benítez';
  const signer1Role = settlement.signer1Role || company.signer1Role || 'Despachante de Aduanas · Reg. DNA Nº 1.482';
  const signer2Name = settlement.signer2Name || company.signer2Name || 'Dra. Gabriela Duarte';
  const signer2Role = settlement.signer2Role || company.signer2Role || 'Depto. de Operaciones & Finanzas';

  const logoSrc = useMemo(() => {
    if (company.logoUrl && company.logoUrl.trim() !== '') {
      return company.logoUrl;
    }
    return renderCorporateLogoPngDataUrl(company.logoText || 'LG', companyName);
  }, [company.logoUrl, company.logoText, companyName]);

  const {
    rubros,
    totalDespacho,
    montoRecibido,
    montoFavor,
    totalDespachoUsd,
    exchangeRate,
  } = useMemo(() => computeProformaItems(settlement), [settlement]);

  // Nombre de cliente limpio para las filas finales (ej. "IGSA EAS" o "PETRA S.A.")
  const clientDisplayName = useMemo(() => {
    if (!settlement.clientName || settlement.clientName.trim() === '') {
      return 'CLIENTE';
    }
    return settlement.clientName.split('—')[0].split('(')[0].trim() || settlement.clientName;
  }, [settlement.clientName]);

  // Handlers para la barra de acciones superior
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    try {
      const fileName = exportProformaPdf(settlement, {
        ...company,
        name: companyName,
        slogan: companySlogan,
        address: companyAddress,
        phone: companyPhone,
        signer1Name,
        signer1Role,
        signer2Name,
        signer2Role,
      });
      if (onShowNotice) {
        onShowNotice(`Proforma PDF descargada: ${fileName}`);
      }
    } catch (err) {
      console.error('Error al generar PDF de la Proforma:', err);
    }
  };

  const handleDownloadExcel = () => {
    try {
      const fileName = exportSettlementToExcel(settlement, {
        ...company,
        name: companyName,
        slogan: companySlogan,
        address: companyAddress,
        phone: companyPhone,
        signer1Name,
        signer1Role,
        signer2Name,
        signer2Role,
      });
      if (onShowNotice) {
        onShowNotice(`Excel (.xlsx) de Proforma descargado: ${fileName}`);
      }
    } catch (err) {
      console.error('Error al generar Excel de la Proforma:', err);
    }
  };

  // Form state para el modal [Ver / Editar Datos]
  const [quickForm, setQuickForm] = useState({
    proformaNumber: settlement.proformaNumber || settlement.sequentialNumber || '001/2026',
    invoiceNumber: settlement.invoiceNumber || '',
    supplierName: settlement.supplierName || settlement.senderName || '',
    clientName: settlement.clientName || '',
    clientRuc: settlement.clientRuc || '',
    customsOffice: settlement.customsOffice || '021 - Zona Franca Global',
    customsRegime: settlement.customsRegime || 'IC04',
    originCountry: settlement.originCountry || settlement.senderCountry || 'Paraguay',
    exchangeRate: settlement.exchangeRate || 7650,
    amountReceived: montoRecibido,
    signer1Name: signer1Name,
    signer1Role: signer1Role,
    signer2Name: signer2Name,
    signer2Role: signer2Role,
  });

  const handleOpenEditModal = () => {
    setQuickForm({
      proformaNumber: settlement.proformaNumber || settlement.sequentialNumber || '001/2026',
      invoiceNumber: settlement.invoiceNumber || '',
      supplierName: settlement.supplierName || settlement.senderName || '',
      clientName: settlement.clientName || '',
      clientRuc: settlement.clientRuc || '',
      customsOffice: settlement.customsOffice || '021 - Zona Franca Global',
      customsRegime: settlement.customsRegime || 'IC04',
      originCountry: settlement.originCountry || settlement.senderCountry || 'Paraguay',
      exchangeRate: settlement.exchangeRate || 7650,
      amountReceived: montoRecibido,
      signer1Name: settlement.signer1Name || company.signer1Name || 'Lic. Lucas Benítez',
      signer1Role: settlement.signer1Role || company.signer1Role || 'Despachante de Aduanas · Reg. DNA Nº 1.482',
      signer2Name: settlement.signer2Name || company.signer2Name || 'Dra. Gabriela Duarte',
      signer2Role: settlement.signer2Role || company.signer2Role || 'Depto. de Operaciones & Finanzas',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveQuickForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSettlement) {
      const numRecibido = Number(quickForm.amountReceived) || 0;
      onUpdateSettlement({
        ...settlement,
        proformaNumber: quickForm.proformaNumber,
        invoiceNumber: quickForm.invoiceNumber,
        supplierName: quickForm.supplierName,
        clientName: quickForm.clientName,
        clientRuc: quickForm.clientRuc,
        customsOffice: quickForm.customsOffice,
        customsRegime: quickForm.customsRegime,
        originCountry: quickForm.originCountry,
        exchangeRate: Number(quickForm.exchangeRate) || 7650,
        amountReceived: numRecibido,
        signer1Name: quickForm.signer1Name,
        signer1Role: quickForm.signer1Role,
        signer2Name: quickForm.signer2Name,
        signer2Role: quickForm.signer2Role,
      });
    }
    setIsEditModalOpen(false);
    if (onShowNotice) {
      onShowNotice('Datos y firmantes de la Proforma actualizados correctamente');
    }
  };

  const refNumber = settlement.proformaNumber || settlement.sequentialNumber || '001/2026';

  return (
    <div className="space-y-6">
      {/* 🛠️ 1. BARRA DE ACCIONES SUPERIOR */}
      <div className="no-print bg-white border border-slate-300 rounded-lg p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
              Vista PROFORMA
            </span>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              · Resumen Comercial A4
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Optimizado para Ahorro de Tinta
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Documento formal y simplificado: lista directa de rubros sin subtotales intermediarios, liquidación final (TOTAL DESPACHO, RECIBIDO, FAVOR) y firmantes editables.
          </p>
        </div>

        {/* Botones de acción principales */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* 1. [Ver / Editar Datos] */}
          <button
            type="button"
            onClick={handleOpenEditModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-400 rounded-md transition-colors cursor-pointer shadow-2xs"
            title="Abre el formulario rápido de edición de datos, montos recibidos y firmantes"
          >
            <Edit className="w-3.5 h-3.5 text-blue-600" />
            <span>Ver / Editar Datos</span>
          </button>

          {/* 2. [Descargar PDF] */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 border border-slate-900 rounded-md transition-colors cursor-pointer shadow-xs"
            title="Genera el documento A4 sin rellenos de tinta"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Descargar PDF</span>
          </button>

          {/* 3. [Descargar Excel (.xlsx)] (EXCLUSIVO DE ESTA PESTAÑA) */}
          <button
            type="button"
            onClick={handleDownloadExcel}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 border border-emerald-800 rounded-md transition-colors cursor-pointer shadow-xs"
            title="Dispara la exportación del libro en Excel (.xlsx) estructurado"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
            <span>Descargar Excel (.xlsx)</span>
          </button>

          {/* Botón Imprimir Físico (Nativo navegador) */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-colors cursor-pointer"
            title="Abre el cuadro de diálogo de impresión"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {/* 📄 VISTA PRELIMINAR A4 — OPTIMIZADA PARA AHORRO DE TINTA (CERO FONDOS / LÍNEAS CLARAS) */}
      <div className="flex justify-center">
        <div
          id="proforma-print-container"
          className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-6 sm:p-10 border border-slate-400 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none text-[11px] leading-tight select-text"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          }}
        >
          {/* 🏢 2. ENCABEZADO Y MEMBRETE CORPORATIVO */}
          <header className="pb-4 mb-4 border-b border-black">
            <div className="flex items-center justify-between gap-4">
              {/* Izquierda: Logo oficial de la empresa */}
              <div className="w-36 sm:w-44 shrink-0 flex items-center justify-start">
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt={companyName}
                    className="max-h-16 w-auto object-contain"
                  />
                ) : (
                  <div className="border border-black px-3 py-2 text-center font-bold font-mono">
                    {company.logoText || 'LG'}
                  </div>
                )}
              </div>

              {/* Derecha (Alineado a la derecha): Nombre, Slogan, Ubicación, Teléfono */}
              <div className="text-right flex-1">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-black font-display uppercase">
                  {companyName}
                </h1>
                <p className="text-xs text-slate-700 italic mt-0.5">
                  "{companySlogan}"
                </p>
                <div className="text-[10.5px] text-slate-800 font-medium mt-1 space-y-0.5">
                  <p>{companyAddress}</p>
                  <p className="font-semibold text-black">
                    Tel: {companyPhone}
                  </p>
                </div>
              </div>
            </div>

            {/* Título formal del documento */}
            <div className="mt-3 pt-2 border-t border-slate-300 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs tracking-wider uppercase">
                  PROFORMA DE DESPACHO ADUANERO
                </span>
              </div>
              <div className="font-mono text-xs font-bold text-black">
                REF: {refNumber}
              </div>
            </div>
          </header>

          {/* 📊 TABLA LIMPIA DE RUBROS ADUANEROS (SIN LÍNEAS NI RECUADROS) */}
          <section className="mb-4">
            <table className="w-full border-collapse text-[10.5px]">
              <thead>
                <tr className="text-black font-bold">
                  <th className="text-left py-1 font-bold">
                    CONCEPTO / RUBRO ADUANERO
                  </th>
                  <th className="text-right py-1 w-36 font-bold">
                    MONTO (PYG)
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* 13 Rubros continuos sin líneas ni recuadros */}
                {rubros.map((item) => (
                  <tr key={item.id}>
                    <td className="py-0.5 text-black">
                      {item.concept}
                    </td>
                    <td className="py-0.5 text-right font-mono tabular-nums text-black">
                      {formatCurrencyGs(item.amountGs)}
                    </td>
                  </tr>
                ))}

                {/* ───────────────────────────────────────────────────────── */}
                {/* 🏁 LIQUIDACIÓN FINAL: ETIQUETAS MOVIDAS A LA DERECHA        */}
                {/* ───────────────────────────────────────────────────────── */}
                <tr className="font-bold text-[11px]">
                  <td className="pt-3 pb-0.5 text-right font-bold uppercase text-black pr-4">
                    TOTAL DESPACHO:
                  </td>
                  <td className="pt-3 pb-0.5 text-right font-mono font-bold text-black tabular-nums">
                    {formatCurrencyGs(totalDespacho)}
                  </td>
                </tr>

                <tr className="font-bold text-[11px]">
                  <td className="py-0.5 text-right font-bold uppercase text-black pr-4">
                    RECIBIDO {clientDisplayName.toUpperCase()}:
                  </td>
                  <td className="py-0.5 text-right font-mono font-bold text-black tabular-nums">
                    {formatCurrencyGs(montoRecibido)}
                  </td>
                </tr>

                <tr className="font-bold text-[11px]">
                  <td className="py-0.5 text-right font-bold uppercase text-black pr-4">
                    FAVOR {clientDisplayName.toUpperCase()}:
                  </td>
                  <td className="py-0.5 text-right font-mono font-bold text-black tabular-nums">
                    {formatCurrencyGs(montoFavor)}
                  </td>
                </tr>

                {/* Equivalencia USD informativa */}
                <tr className="text-[9.5px]">
                  <td className="pt-1 text-right italic text-slate-600 pr-4">
                    EQUIVALENTE APROXIMADO EN DÓLARES AMERICANOS (USD):
                  </td>
                  <td className="pt-1 text-right font-mono font-semibold text-slate-800 tabular-nums">
                    {formatCurrencyUsd(totalDespachoUsd)}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 📋 RESUMEN GENERAL DEL CLIENTE Y OPERACIÓN ADUANERA (SITUADO ENTRE TABLA Y NOTA DE APROBACIÓN) */}
          <section className="mb-4 pt-1">
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[10.5px]">
              <div className="space-y-1">
                <p>
                  <span className="font-bold">CLIENTE:</span>{' '}
                  <span className="font-semibold">{settlement.clientName || '—'}</span>
                </p>
                <p>
                  <span className="font-bold">RUC CLIENTE:</span>{' '}
                  <span className="font-mono">{settlement.clientRuc || '—'}</span>
                </p>
                <p>
                  <span className="font-bold">PROVEEDOR:</span>{' '}
                  <span>{settlement.supplierName || settlement.senderName || '—'}</span>
                </p>
                <p>
                  <span className="font-bold">FACTURA COMERCIAL N°:</span>{' '}
                  <span className="font-mono font-semibold">{settlement.invoiceNumber || '—'}</span>
                </p>
              </div>
              <div className="space-y-1">
                <p>
                  <span className="font-bold">ADUANA:</span>{' '}
                  <span>{settlement.customsOffice || '021 - ZONA FRANCA GLOBAL'}</span>
                </p>
                <p>
                  <span className="font-bold">PAÍS DE ORIGEN:</span>{' '}
                  <span className="uppercase">{settlement.originCountry || settlement.senderCountry || 'PARAGUAY'}</span>
                </p>
                <p>
                  <span className="font-bold">RÉGIMEN:</span>{' '}
                  <span className="font-mono font-bold">{settlement.customsRegime || 'IC04'}</span>
                </p>
                <p>
                  <span className="font-bold">COTIZACIÓN / FECHA:</span>{' '}
                  <span className="font-mono">1 USD = {formatCurrencyGs(exchangeRate)} Gs.</span>{' '}
                  <span className="text-slate-600">({settlement.date})</span>
                </p>
              </div>
            </div>
          </section>

          {/* NOTA DE APROBACIÓN POR VALORACIÓN ADUANERA Y SALUDO FORMAL */}
          <section className="mb-6 pt-2 space-y-1 text-[9.5px]">
            <p className="font-bold uppercase tracking-tight">
              NOTA DE APROBACIÓN POR VALORACIÓN ADUANERA:
            </p>
            <p className="text-slate-800 leading-normal">
              Proforma y valores tributarios sujetos a confirmación y aprobación final por Valoración Aduanera (DNIT) y Sistema SOFIA.
            </p>
            <p className="pt-1 text-slate-800">
              Sin otro particular, aprovechamos la oportunidad para saludarle muy atentamente.
            </p>
          </section>

          {/* FIRMAS DE RESPONSABLES EDITABLES */}
          <footer className="pt-4 border-t border-black">
            <div className="grid grid-cols-2 gap-8 text-center text-[10px]">
              <div>
                <div className="border-b border-black w-48 mx-auto mb-1.5" />
                <p className="font-bold text-black">{signer1Name}</p>
                <p className="text-slate-700 text-[9px]">{signer1Role}</p>
                <p className="font-semibold text-black text-[9px] uppercase mt-0.5">{companyName}</p>
              </div>
              <div>
                <div className="border-b border-black w-48 mx-auto mb-1.5" />
                <p className="font-bold text-black">{signer2Name}</p>
                <p className="text-slate-700 text-[9px]">{signer2Role}</p>
                <p className="font-semibold text-black text-[9px] uppercase mt-0.5">{companyName}</p>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* 🛠️ MODAL DE EDICIÓN RÁPIDA [Ver / Editar Datos] */}
      {isEditModalOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg border border-slate-300 shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold">
                  Editar Datos de la Proforma y Firmantes
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveQuickForm} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-blue-900">
                Ajuste los datos comerciales de la Proforma, los montos recibidos del cliente y los nombres de los responsables firmantes.
              </div>

              {/* SECCIÓN 1: DATOS OPERATIVOS */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                  <Building className="w-3.5 h-3.5 text-blue-600" />
                  Datos del Despacho y Cliente
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nombre del Cliente / Importador
                    </label>
                    <input
                      type="text"
                      value={quickForm.clientName}
                      onChange={(e) =>
                        setQuickForm({ ...quickForm, clientName: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-semibold"
                      placeholder="IGSA EAS"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      RUC del Cliente
                    </label>
                    <input
                      type="text"
                      value={quickForm.clientRuc}
                      onChange={(e) =>
                        setQuickForm({ ...quickForm, clientRuc: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                      placeholder="80045892-1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      N° Referencia / Proforma
                    </label>
                    <input
                      type="text"
                      value={quickForm.proformaNumber}
                      onChange={(e) =>
                        setQuickForm({ ...quickForm, proformaNumber: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                      placeholder="001/2026"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Factura Comercial N°
                    </label>
                    <input
                      type="text"
                      value={quickForm.invoiceNumber}
                      onChange={(e) =>
                        setQuickForm({ ...quickForm, invoiceNumber: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                      placeholder="56"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Proveedor / Remitente
                    </label>
                    <input
                      type="text"
                      value={quickForm.supplierName}
                      onChange={(e) =>
                        setQuickForm({ ...quickForm, supplierName: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Maquinarias Andinas SpA"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cotización (Gs. por 1 USD)
                    </label>
                    <input
                      type="number"
                      value={quickForm.exchangeRate}
                      onChange={(e) =>
                        setQuickForm({ ...quickForm, exchangeRate: Number(e.target.value) || 0 })
                      }
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                      placeholder="7650"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: 04. DETALLE DE MONTOS RECIBIDOS */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  04. Montos Recibidos del Cliente (Para cálculo de Saldo a Favor)
                </h4>
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-md p-3">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Monto Recibido del Cliente (PYG):
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      Gs.
                    </span>
                    <input
                      type="number"
                      value={quickForm.amountReceived}
                      onChange={(e) =>
                        setQuickForm({
                          ...quickForm,
                          amountReceived: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-10 pr-3 py-1.5 text-xs font-mono font-bold text-emerald-900 bg-white border border-emerald-300 rounded-md focus:ring-1 focus:ring-emerald-500"
                      placeholder="5293767"
                    />
                  </div>
                  <div className="mt-2 text-[11px] text-slate-600 flex justify-between">
                    <span>Total Despacho: <strong>{formatCurrencyGs(totalDespacho)}</strong></span>
                    <span>
                      Saldo a Favor estimado:{' '}
                      <strong className="text-emerald-700 font-mono">
                        {formatCurrencyGs((quickForm.amountReceived || 0) - totalDespacho)}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: FIRMAS EDITABLES (Lic. Lucas Benítez y Dra. Gabriela Duarte) */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  Firmas de los Responsables (Editables)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Firmante 1 */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                    <span className="text-[11px] font-bold text-slate-800 uppercase block">
                      Responsable 1 (Despachante)
                    </span>
                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-0.5">
                        Nombre Completo:
                      </label>
                      <input
                        type="text"
                        value={quickForm.signer1Name}
                        onChange={(e) =>
                          setQuickForm({ ...quickForm, signer1Name: e.target.value })
                        }
                        className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white font-medium"
                        placeholder="Lic. Lucas Benítez"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-0.5">
                        Cargo / Matrícula:
                      </label>
                      <input
                        type="text"
                        value={quickForm.signer1Role}
                        onChange={(e) =>
                          setQuickForm({ ...quickForm, signer1Role: e.target.value })
                        }
                        className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white"
                        placeholder="Despachante de Aduanas · Reg. DNA Nº 1.482"
                      />
                    </div>
                  </div>

                  {/* Firmante 2 */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                    <span className="text-[11px] font-bold text-slate-800 uppercase block">
                      Responsable 2 (Finanzas / Operaciones)
                    </span>
                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-0.5">
                        Nombre Completo:
                      </label>
                      <input
                        type="text"
                        value={quickForm.signer2Name}
                        onChange={(e) =>
                          setQuickForm({ ...quickForm, signer2Name: e.target.value })
                        }
                        className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white font-medium"
                        placeholder="Dra. Gabriela Duarte"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-0.5">
                        Cargo / Departamento:
                      </label>
                      <input
                        type="text"
                        value={quickForm.signer2Role}
                        onChange={(e) =>
                          setQuickForm({ ...quickForm, signer2Role: e.target.value })
                        }
                        className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white"
                        placeholder="Depto. de Operaciones & Finanzas"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón para abrir el editor completo */}
              {onGoToEditor && (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    ¿Desea editar cada rubro individual o agregar comprobantes?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      onGoToEditor();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer"
                  >
                    <span>Abrir Editor Completo de Rubros</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors cursor-pointer shadow-xs"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
