import React from 'react';
import {
  Printer,
  Download,
  ArrowLeft,
  CheckCircle2,
  FileDown,
  FileSpreadsheet,
  FileText,
  Edit,
} from 'lucide-react';
import { CompanySettings, CustomsSettlement } from '../types';
import {
  calculateSettlementMetrics,
  formatCurrencyGs,
  formatCurrencyUsd,
  formatCurrencyAmount,
} from '../utils/formatters';
import { renderCorporateLogoPngDataUrl } from '../utils/logoRenderer';
import { exportSettlementToPdf } from '../utils/pdfExporter';
import { exportSettlementToExcel } from '../utils/excelExporter';

interface PrintInvoiceDocumentProps {
  settlement: CustomsSettlement;
  company: CompanySettings;
  onBackToEditor?: () => void;
  onExportStandaloneHtml?: () => void;
  onExportPdfFile?: () => void;
  onExportExcelFile?: () => void;
  onMarkAsSent?: () => void;
  isStandaloneView?: boolean;
  showTopActionBar?: boolean;
}

export const PrintInvoiceDocument: React.FC<PrintInvoiceDocumentProps> = ({
  settlement,
  company,
  onBackToEditor,
  onExportStandaloneHtml,
  onExportPdfFile,
  onExportExcelFile,
  onMarkAsSent,
  isStandaloneView = false,
  showTopActionBar = false,
}) => {
  const metrics = calculateSettlementMetrics(settlement);
  const effectiveLogoSrc =
    company.logoUrl && company.logoUrl.trim() !== ''
      ? company.logoUrl
      : renderCorporateLogoPngDataUrl(company.logoText, company.name);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (onExportPdfFile) {
      onExportPdfFile();
    } else {
      exportSettlementToPdf(settlement, company);
    }
  };

  const handleDownloadExcel = () => {
    if (onExportExcelFile) {
      onExportExcelFile();
    } else {
      exportSettlementToExcel(settlement, company);
    }
  };

  return (
    <div className="space-y-4">
      {/* BARRA DE ACCIONES EN LA PARTE SUPERIOR DE LA VISTA PREVIA */}
      {(isStandaloneView || showTopActionBar) && (
        <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white text-slate-900 px-4 sm:px-5 py-3.5 rounded-lg border border-slate-300 shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            {onBackToEditor && (
              <button
                type="button"
                onClick={onBackToEditor}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
                title="Abre el formulario de edición de campos y rubros"
              >
                <Edit className="w-3.5 h-3.5 text-blue-600" />
                <span>Editar Datos</span>
              </button>
            )}
            <div className="text-xs text-slate-700 hidden sm:block">
              <span className="font-semibold text-slate-900">
                Documento Oficial Encuadrado (1 Hoja A4)
              </span>
              <span className="mx-2 text-slate-400">·</span>
              <span className="font-mono tabular-nums text-slate-950 font-bold">
                Liquidación Nº {settlement.sequentialNumber}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onMarkAsSent && settlement.status !== 'Enviada' && (
              <button
                type="button"
                onClick={onMarkAsSent}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Registrar Envío</span>
              </button>
            )}

            {/* [Editar Datos] (Si no se muestra a la izquierda en vista modal) */}
            {!onBackToEditor && (
              <button
                type="button"
                onClick={onBackToEditor}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
                title="Abre el formulario de edición de campos y rubros"
              >
                <Edit className="w-3.5 h-3.5 text-blue-600" />
                <span>Editar Datos</span>
              </button>
            )}

            {/* [Descargar PDF] */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
              title="Genera el documento A4 formateado"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>

            {/* [Descargar Excel (.xlsx)] */}
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
              title="Dispara la descarga inmediata del archivo de Excel estructurado (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>Descargar Excel (.xlsx)</span>
            </button>

            {onExportStandaloneHtml && (
              <button
                type="button"
                onClick={onExportStandaloneHtml}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Descargar archivo HTML interactivo"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">HTML Único</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Imprimir documento oficial en 1 sola hoja A4"
            >
              <Printer className="w-3.5 h-3.5 text-slate-700" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      )}

      {/* Printable Invoice / Settlement Sheet — Clean White & Light-Gray Framed Layout with Black Text */}
      <div className="print-container bg-white border border-slate-400 rounded-md p-4 sm:p-6 max-w-5xl mx-auto text-slate-950">
        {/* 1. DATOS DE LA EMPRESA (Encuadrado en fondo claro con Logo LG y Texto Negro) */}
        <div className="print-compact-header grid grid-cols-1 sm:grid-cols-12 border border-slate-400 rounded-sm mb-3 bg-white overflow-hidden">
          <div className="sm:col-span-9 flex flex-col sm:flex-row items-start sm:items-center gap-3.5 p-3">
            <div className="w-28 h-16 sm:w-32 sm:h-18 bg-white border border-slate-300 rounded-xs p-1 flex items-center justify-center shrink-0">
              <img
                src={effectiveLogoSrc}
                alt={`Logo ${company.name}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0 text-slate-950">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-950">
                  {company.name}
                </h1>
                <span className="text-slate-400 font-bold">·</span>
                <span className="text-xs font-mono tabular-nums font-bold text-slate-950">
                  RUC {company.ruc}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-800 mt-0.5">
                {company.slogan} · {company.phone} · {company.email}
              </p>
              {company.address && (
                <p className="text-[10.5px] text-slate-700 mt-0.5">
                  {company.address}
                </p>
              )}
            </div>
          </div>

          <div className="sm:col-span-3 border-t sm:border-t-0 sm:border-l border-slate-400 bg-slate-100 p-3 flex flex-col justify-center sm:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
              Liquidación de Despacho
            </span>
            <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-slate-950 block">
              Nº {settlement.sequentialNumber}
            </span>
            <span className="text-[10.5px] font-mono tabular-nums text-slate-800 block mt-0.5">
              Fecha: {settlement.date}
            </span>
          </div>
        </div>

        {/* 2. CUATRO COLUMNAS ENCUADRADAS: Datos del Cliente | Despacho | Datos Liquidación | Contenido */}
        <div className="print-compact-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-slate-400 rounded-sm mb-3 text-[11px] bg-white divide-y sm:divide-y-0 sm:divide-x divide-slate-400 overflow-hidden">
          {/* Columna 1: Datos del Cliente */}
          <div className="print-compact-card flex flex-col">
            <div className="bg-slate-100 border-b border-slate-400 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-950">
              Datos del Cliente
            </div>
            <div className="p-2.5 space-y-0.5 text-slate-950">
              <div>
                <span className="font-semibold text-slate-700">Cliente:</span>{' '}
                <strong className="text-slate-950 break-words">
                  {settlement.clientName || '—'}
                </strong>
              </div>
              <div>
                <span className="font-semibold text-slate-700">RUC:</span>{' '}
                <span className="font-mono tabular-nums font-bold text-slate-950">
                  {settlement.clientRuc || '—'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Dirección:</span>{' '}
                <span className="text-slate-900 break-words">
                  {settlement.clientAddress || '—'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Ref.:</span>{' '}
                <span className="text-slate-900 break-words">
                  {settlement.clientContact || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Columna 2: Despacho */}
          <div className="print-compact-card flex flex-col">
            <div className="bg-slate-100 border-b border-slate-400 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-950">
              Despacho
            </div>
            <div className="p-2.5 space-y-0.5 text-slate-950 text-[10.5px] leading-snug">
              <div>
                <span className="font-semibold text-slate-700">Despacho Nº:</span>{' '}
                <strong className="font-mono tabular-nums text-slate-950">
                  {settlement.dispatchNumber || '—'}
                </strong>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Remitente:</span>{' '}
                <span className="font-medium text-slate-950 break-words">
                  {settlement.senderName || '—'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Régimen:</span>{' '}
                <span
                  className="font-mono font-bold text-slate-950 bg-slate-100 px-1 py-0.2 rounded border border-slate-300"
                  title={settlement.customsRegime ? `Régimen: ${settlement.customsRegime}` : undefined}
                >
                  {settlement.customsRegime || 'IC04'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Proforma:</span>{' '}
                <span className="font-mono tabular-nums text-slate-900">
                  {settlement.proformaNumber || '—'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Origen:</span>{' '}
                <span className="text-slate-900 font-medium">
                  {settlement.originCountry || settlement.senderCountry || '—'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Procedencia:</span>{' '}
                <span className="text-slate-900 font-medium">
                  {settlement.provenanceCountry || settlement.senderCountry || '—'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Vía:</span>{' '}
                <span className="text-slate-900 font-medium">
                  {settlement.transportMode || 'Marítimo'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Doc. Transporte:</span>{' '}
                <span className="font-mono tabular-nums text-slate-900 break-words">
                  {settlement.senderReference || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Columna 3: Datos Liquidación */}
          <div className="print-compact-card flex flex-col">
            <div className="bg-slate-100 border-b border-slate-400 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-950">
              Datos Liquidación
            </div>
            <div className="p-2.5 space-y-1 text-slate-950 text-[10.5px]">
              <div className="flex justify-between gap-1">
                <span className="font-semibold text-slate-700">Fecha:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-950">
                  {settlement.date}
                </span>
              </div>
              <div className="flex justify-between gap-1">
                <span className="font-semibold text-slate-700">Proveedor:</span>
                <span className="font-medium text-slate-950 text-right break-words">
                  {settlement.supplierName || settlement.senderName || '—'}
                </span>
              </div>
              <div className="flex justify-between gap-1">
                <span className="font-semibold text-slate-700">Nro. Factura:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-950">
                  {settlement.invoiceNumber || '—'}
                </span>
              </div>
              <div className="flex justify-between gap-1">
                <span className="font-semibold text-slate-700">Condición de venta:</span>
                <span className="font-mono font-bold text-slate-950 bg-slate-100 px-1 rounded border border-slate-300">
                  {settlement.incoterm || settlement.saleCondition || 'FOB'}
                </span>
              </div>
            </div>
          </div>

          {/* Columna 4: Contenido */}
          <div className="print-compact-card flex flex-col bg-slate-50/70">
            <div className="bg-slate-100 border-b border-slate-400 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-950">
              Contenido
            </div>
            <div className="p-2 space-y-0.5 text-slate-950 text-[10px] sm:text-[10.5px]">
              <div className="flex justify-between gap-1">
                <span className="font-semibold text-slate-700">Divisa:</span>
                <strong className="font-mono text-slate-950">
                  {settlement.currency || 'USD'}
                </strong>
              </div>
              <div className="flex justify-between gap-1">
                <span className="font-semibold text-slate-700">Tipo de Cambio:</span>
                <strong className="font-mono tabular-nums text-slate-950">
                  Gs. {formatCurrencyGs(settlement.exchangeRate)}
                </strong>
              </div>
              <div className="flex justify-between gap-1">
                <span className="font-semibold text-slate-700">Valor FC:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-950">
                  {settlement.currency || 'USD'} {formatCurrencyAmount(metrics.fobAmount, settlement.currency || 'USD')}
                </span>
              </div>
              <div className="flex justify-between gap-1">
                <span className="font-semibold text-slate-700">Flete:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-950">
                  {settlement.currency || 'USD'} {formatCurrencyAmount(metrics.freightAmount, settlement.currency || 'USD')}
                </span>
              </div>
              <div className="flex justify-between gap-1">
                <span className="font-semibold text-slate-700">Seguro:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-950">
                  {settlement.currency || 'USD'} {formatCurrencyAmount(metrics.insuranceAmount, settlement.currency || 'USD')}
                </span>
              </div>
              <div className="flex justify-between gap-1">
                <span className="font-semibold text-slate-700">Ajustes a incluir:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-950">
                  {settlement.currency || 'USD'} {formatCurrencyAmount(metrics.adjustmentAmount, settlement.currency || 'USD')}
                </span>
              </div>
              <div className="flex justify-between gap-1">
                <span className="font-semibold text-slate-700">Ajustes a deducir:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-950">
                  {settlement.currency || 'USD'} {formatCurrencyAmount(metrics.deductionAmount || 0, settlement.currency || 'USD')}
                </span>
              </div>
              <div className="flex justify-between gap-1 border-t border-slate-300 pt-0.5 mt-0.5 font-semibold text-slate-950">
                <span>CIF ({settlement.currency || 'USD'}):</span>
                <span className="font-mono tabular-nums">
                  {settlement.currency || 'USD'} {formatCurrencyAmount(metrics.cifAmount, settlement.currency || 'USD')}
                </span>
              </div>
              <div className="flex justify-between gap-1 font-bold text-slate-950">
                <span>CIF (Gs.):</span>
                <span className="font-mono tabular-nums">
                  Gs. {formatCurrencyGs(metrics.cifGs)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. LIQUIDACIÓN DE DERECHOS Y GASTOS SOBRE MERCADERÍA A SER TRANSPORTADA (6 Columnas Encuadradas) */}
        <div className="border border-slate-400 rounded-sm overflow-hidden mb-3 bg-white">
          <div className="bg-slate-100 border-b border-slate-400 text-slate-950 px-3 py-1 text-[10.5px] font-bold uppercase tracking-wide">
            Liquidación de Derechos y Gastos Sobre Mercadería a ser Transportada
          </div>
          <div className="overflow-x-auto">
            <table className="print-compact-table w-full text-left border-collapse text-[10px] sm:text-[11px] text-slate-950">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-400 text-[9.5px] sm:text-[10px] font-bold text-slate-950 divide-x divide-slate-300">
                  <th className="py-1 px-1.5 sm:px-2.5 text-center w-12 sm:w-16">Bultos</th>
                  <th className="py-1 px-1.5 sm:px-2.5 text-center w-16 sm:w-28">Unid.</th>
                  <th className="py-1 px-1.5 sm:px-2.5">Descripción</th>
                  <th className="py-1 px-1.5 sm:px-2.5 text-center w-20 sm:w-28">Part Arancel</th>
                  <th className="py-1 px-1.5 sm:px-2.5 text-right w-22 sm:w-32">Valor</th>
                  <th className="py-1 px-1.5 sm:px-2.5 text-right w-14 sm:w-32">
                    <span className="sm:hidden">Aranc. %</span>
                    <span className="hidden sm:inline">Porc. Arancelaria %</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {(!settlement.merchandiseItems ||
                  settlement.merchandiseItems.length === 0) ? (
                  <tr className="divide-x divide-slate-300">
                    <td
                      colSpan={6}
                      className="py-1.5 px-3 text-center text-slate-700"
                    >
                      1 · BULTOS · MERCADERÍA SEGÚN FACTURA COMERCIAL Nº{' '}
                      {settlement.invoiceNumber || 'S/N'} · Valor CIF Gs.{' '}
                      {formatCurrencyGs(metrics.cifGs)}
                    </td>
                  </tr>
                ) : (
                  settlement.merchandiseItems.map((m) => (
                    <tr key={m.id} className="divide-x divide-slate-300">
                      <td className="py-1 px-1.5 sm:px-2.5 text-center font-mono tabular-nums font-semibold">
                        {m.packages}
                      </td>
                      <td className="py-1 px-1.5 sm:px-2.5 text-center font-medium">
                        {m.unit}
                      </td>
                      <td className="py-1 px-1.5 sm:px-2.5 font-semibold text-slate-950 break-words">
                        {m.description}
                      </td>
                      <td className="py-1 px-1.5 sm:px-2.5 text-center font-mono tabular-nums">
                        {m.tariffCode}
                      </td>
                      <td className="py-1 px-1.5 sm:px-2.5 text-right font-mono tabular-nums font-bold">
                        {formatCurrencyGs(m.valueGs)}
                      </td>
                      <td className="py-1 px-1.5 sm:px-2.5 text-right font-mono tabular-nums">
                        {m.tariffPercent}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. SECCIONES DE 3 COLUMNAS ENCUADRADAS (Descripción | Datos Adicionales | Valor) */}
        <div className="print-compact-sections space-y-2.5 mb-3">
          {/* 4A. 01. DETALLE DE TRIBUTOS ADUANEROS Y SERVICIOS — Liquidación De Despacho */}
          <div className="border border-slate-400 rounded-sm overflow-hidden bg-white">
            <div className="bg-slate-100 border-b border-slate-400 text-slate-950 px-3 py-1 text-[10.5px] font-bold flex flex-wrap justify-between items-center">
              <span>01. DETALLE DE TRIBUTOS ADUANEROS Y SERVICIOS</span>
              <span className="text-slate-800 font-semibold">
                Liquidación De Despacho
              </span>
            </div>
            <table className="print-compact-table w-full text-left border-collapse text-[10.5px] sm:text-[11px] text-slate-950">
              <thead>
                <tr className="border-b border-slate-400 text-[10px] font-bold text-slate-950 bg-slate-50 divide-x divide-slate-300">
                  <th className="py-1 px-2 sm:px-3">Descripción</th>
                  <th className="py-1 px-2 sm:px-3 w-28 sm:w-56">Datos Adicionales</th>
                  <th className="py-1 px-2 sm:px-3 w-24 sm:w-40 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {settlement.customsDuties.map((item) => (
                  <tr key={item.id} className="divide-x divide-slate-300">
                    <td className="py-1 px-2 sm:px-3 font-medium text-slate-950 break-words">
                      {item.description}
                    </td>
                    <td className="py-1 px-2 sm:px-3 font-mono tabular-nums text-slate-800 break-all sm:break-normal">
                      {item.documentRef || 'S/ DESPACHO'}
                    </td>
                    <td className="py-1 px-2 sm:px-3 text-right font-mono tabular-nums font-semibold text-slate-950">
                      {formatCurrencyGs(item.amountGs)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t border-slate-400 font-bold text-slate-950 divide-x divide-slate-300">
                  <td colSpan={2} className="py-1 px-2 sm:px-3 text-right">
                    Total:
                  </td>
                  <td className="py-1 px-2 sm:px-3 text-right font-mono tabular-nums">
                    {formatCurrencyGs(metrics.totalDutiesGs)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 4B. 02. DETALLE DE TASAS Y OTROS COSTOS */}
          <div className="border border-slate-400 rounded-sm overflow-hidden bg-white">
            <div className="bg-slate-100 border-b border-slate-400 text-slate-950 px-3 py-1 text-[10.5px] font-bold">
              02. DETALLE DE TASAS Y OTROS COSTOS
            </div>
            <table className="print-compact-table w-full text-left border-collapse text-[10.5px] sm:text-[11px] text-slate-950">
              <thead>
                <tr className="border-b border-slate-400 text-[10px] font-bold text-slate-950 bg-slate-50 divide-x divide-slate-300">
                  <th className="py-1 px-2 sm:px-3">Descripción</th>
                  <th className="py-1 px-2 sm:px-3 w-28 sm:w-56">Datos Adicionales</th>
                  <th className="py-1 px-2 sm:px-3 w-24 sm:w-40 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {settlement.ratesAndCosts.map((item) => (
                  <tr key={item.id} className="divide-x divide-slate-300">
                    <td className="py-1 px-2 sm:px-3 font-medium text-slate-950 break-words">
                      {item.description}
                    </td>
                    <td className="py-1 px-2 sm:px-3 font-mono tabular-nums text-slate-800 break-all sm:break-normal">
                      {item.documentRef || '—'}
                    </td>
                    <td className="py-1 px-2 sm:px-3 text-right font-mono tabular-nums font-semibold text-slate-950">
                      {formatCurrencyGs(item.amountGs)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t border-slate-400 font-bold text-slate-950 divide-x divide-slate-300">
                  <td colSpan={2} className="py-1 px-2 sm:px-3 text-right">
                    Total:
                  </td>
                  <td className="py-1 px-2 sm:px-3 text-right font-mono tabular-nums">
                    {formatCurrencyGs(metrics.totalRatesGs)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 4C. 03. DETALLE DE SERVICIOS INTERNOS + TOTAL GENERAL, RECIBIDO Y SALDO */}
          <div className="border border-slate-400 rounded-sm overflow-hidden bg-white">
            <div className="bg-slate-100 border-b border-slate-400 text-slate-950 px-3 py-1 text-[10.5px] font-bold">
              03. DETALLE DE SERVICIOS INTERNOS
            </div>
            <table className="print-compact-table w-full text-left border-collapse text-[10.5px] sm:text-[11px] text-slate-950">
              <thead>
                <tr className="border-b border-slate-400 text-[10px] font-bold text-slate-950 bg-slate-50 divide-x divide-slate-300">
                  <th className="py-1 px-2 sm:px-3">Descripción</th>
                  <th className="py-1 px-2 sm:px-3 w-28 sm:w-56">Datos Adicionales</th>
                  <th className="py-1 px-2 sm:px-3 w-24 sm:w-40 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {settlement.internalServices.map((item) => (
                  <tr key={item.id} className="divide-x divide-slate-300">
                    <td className="py-1 px-2 sm:px-3 font-medium text-slate-950 break-words">
                      {item.description}
                    </td>
                    <td className="py-1 px-2 sm:px-3 font-mono tabular-nums text-slate-800 break-all sm:break-normal">
                      {item.documentRef || ''}
                    </td>
                    <td className="py-1 px-2 sm:px-3 text-right font-mono tabular-nums font-semibold text-slate-950">
                      {formatCurrencyGs(item.amountGs)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="font-bold text-[11px] text-slate-950">
                <tr className="bg-slate-50 border-t border-slate-400 divide-x divide-slate-300">
                  <td colSpan={2} className="py-1 px-3 text-right">
                    Total:
                  </td>
                  <td className="py-1 px-3 text-right font-mono tabular-nums">
                    {formatCurrencyGs(metrics.totalServicesGs)}
                  </td>
                </tr>
                <tr className="bg-slate-200/80 border-t border-slate-400 divide-x divide-slate-300">
                  <td colSpan={2} className="py-1.5 px-3 text-right">
                    Total General:
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono tabular-nums text-xs">
                    {formatCurrencyGs(metrics.grandTotalGs)}
                  </td>
                </tr>
                <tr className="bg-white border-t border-slate-300 divide-x divide-slate-300">
                  <td colSpan={2} className="py-1 px-3 text-right">
                    Recibido:
                  </td>
                  <td className="py-1 px-3 text-right font-mono tabular-nums">
                    {formatCurrencyGs(metrics.amountReceivedGs)}
                  </td>
                </tr>
                <tr className="bg-slate-100 border-t-2 border-slate-500 divide-x divide-slate-300">
                  <td colSpan={2} className="py-1.5 px-3 text-right">
                    Saldo:
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono tabular-nums text-xs">
                    {formatCurrencyGs(Math.abs(metrics.balanceGs))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 4D. 04. DETALLE DE MONTOS RECIBIDOS */}
          {settlement.receivedPayments && settlement.receivedPayments.length > 0 && (
            <div className="border border-slate-400 rounded-sm overflow-hidden bg-white">
              <div className="bg-slate-100 border-b border-slate-400 text-slate-950 px-3 py-1 text-[10.5px] font-bold">
                04. DETALLE DE MONTOS RECIBIDOS
              </div>
              <table className="print-compact-table w-full text-left border-collapse text-[10.5px] sm:text-[11px] text-slate-950">
                <thead>
                  <tr className="border-b border-slate-400 text-[10px] font-bold text-slate-950 bg-slate-50 divide-x divide-slate-300">
                    <th className="py-1 px-2 sm:px-3 w-28 sm:w-32">Método</th>
                    <th className="py-1 px-2 sm:px-3">Detalle (Banco y N° Transacción / N° Recibo)</th>
                    <th className="py-1 px-2 sm:px-3 w-24 sm:w-32">Fecha</th>
                    <th className="py-1 px-2 sm:px-3 w-24 sm:w-36 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {settlement.receivedPayments.map((p) => (
                    <tr key={p.id} className="divide-x divide-slate-300">
                      <td className="py-1 px-2 sm:px-3 font-semibold text-slate-900">
                        {p.method || 'Transferencia'}
                      </td>
                      <td className="py-1 px-2 sm:px-3 font-medium text-slate-950 break-words">
                        {p.description ||
                          (p.method === 'Efectivo'
                            ? 'Recibo de Caja Oficial'
                            : 'Transferencia Bancaria')}
                      </td>
                      <td className="py-1 px-2 sm:px-3 font-mono tabular-nums text-slate-800">
                        {p.date || '—'}
                      </td>
                      <td className="py-1 px-2 sm:px-3 text-right font-mono tabular-nums font-semibold text-slate-950">
                        {formatCurrencyGs(p.amountGs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 border-t border-slate-400 font-bold text-slate-950 divide-x divide-slate-300">
                    <td colSpan={3} className="py-1 px-2 sm:px-3 text-right">
                      Total Recibido:
                    </td>
                    <td className="py-1 px-2 sm:px-3 text-right font-mono tabular-nums">
                      {formatCurrencyGs(metrics.amountReceivedGs)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* 5. MONTO EN LETRAS Y OBSERVACIÓN (Encuadrados con fondo claro y texto negro) */}
        <div className="print-compact-footer border border-slate-400 rounded-sm bg-white text-[11px] text-slate-950 divide-y divide-slate-300">
          <div className="px-3 py-2 bg-slate-50">
            <span className="font-bold text-slate-950">Monto en Letras: </span>
            <span className="font-mono font-bold text-slate-950 uppercase">
              {metrics.computedAmountInWords}
            </span>
          </div>

          <div className="px-3 py-2 bg-white">
            <span className="font-bold text-slate-950">Observación: </span>
            <span className="text-slate-950 whitespace-pre-line font-medium">
              {settlement.notes || 'Sin observaciones adicionales.'}
            </span>
          </div>

          <div className="print-compact-signatures grid grid-cols-2 gap-8 px-6 pt-6 pb-2.5 bg-white">
            <div className="border-t border-slate-500 pt-1 text-center">
              <span className="block font-bold text-slate-950 text-[10.5px]">
                Firma y Sello Despachante
              </span>
              <span className="text-[10px] text-slate-700">{company.name}</span>
            </div>
            <div className="border-t border-slate-500 pt-1 text-center">
              <span className="block font-bold text-slate-950 text-[10.5px]">
                Conformidad del Cliente
              </span>
              <span className="text-[10px] text-slate-700">
                {settlement.clientName || 'Importador'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
