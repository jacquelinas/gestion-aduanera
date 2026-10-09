import React from 'react';
import { Printer, Download, ArrowLeft, CheckCircle2, FileDown } from 'lucide-react';
import { CompanySettings, CustomsSettlement } from '../types';
import {
  calculateSettlementMetrics,
  formatCurrencyGs,
  formatCurrencyUsd,
} from '../utils/formatters';
import { renderCorporateLogoPngDataUrl } from '../utils/logoRenderer';

interface PrintInvoiceDocumentProps {
  settlement: CustomsSettlement;
  company: CompanySettings;
  onBackToEditor?: () => void;
  onExportStandaloneHtml: () => void;
  onExportPdfFile: () => void;
  onMarkAsSent?: () => void;
  isStandaloneView?: boolean;
}

export const PrintInvoiceDocument: React.FC<PrintInvoiceDocumentProps> = ({
  settlement,
  company,
  onBackToEditor,
  onExportStandaloneHtml,
  onExportPdfFile,
  onMarkAsSent,
  isStandaloneView = false,
}) => {
  const metrics = calculateSettlementMetrics(settlement);
  const effectiveLogoSrc =
    company.logoUrl && company.logoUrl.trim() !== ''
      ? company.logoUrl
      : renderCorporateLogoPngDataUrl(company.logoText, company.name);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Action Toolbar (Hidden in print) */}
      {isStandaloneView && (
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white px-4 sm:px-5 py-3.5 rounded-lg border border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            {onBackToEditor && (
              <button
                type="button"
                onClick={onBackToEditor}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al Editor</span>
              </button>
            )}
            <div className="text-xs text-slate-300">
              <span>Documento Oficial (Formato 1 Hoja A4)</span>
              <span className="mx-2 text-slate-600">·</span>
              <span className="font-mono tabular-nums text-white font-semibold">
                Liquidación Nº {settlement.sequentialNumber}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onMarkAsSent && settlement.status !== 'Enviada' && (
              <button
                type="button"
                onClick={onMarkAsSent}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Registrar Envío</span>
              </button>
            )}
            <button
              type="button"
              onClick={onExportStandaloneHtml}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>HTML Único</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Imprimir (1 Hoja)</span>
            </button>
            <button
              type="button"
              onClick={onExportPdfFile}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Descargar PDF (1 Hoja)</span>
            </button>
          </div>
        </div>
      )}

      {/* Printable Invoice / Settlement Sheet — Exact Customs Format Fitted to 1 Page */}
      <div className="print-container bg-white border border-slate-300 rounded-lg p-4 sm:p-6 max-w-5xl mx-auto text-slate-900">
        {/* 1. DATOS DE LA EMPRESA (con Logo Orgánico) */}
        <div className="print-compact-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 mb-3 border-b-2 border-slate-900">
          <div className="flex items-center gap-3.5 min-w-0">
            <img
              src={effectiveLogoSrc}
              alt={`Logo ${company.name}`}
              referrerPolicy="no-referrer"
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-lg border border-slate-200 bg-slate-900 p-1 shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 break-words">
                {company.name}
              </h1>
              <p className="text-[11px] font-medium text-slate-600 break-words">
                {company.slogan}
              </p>
              <p className="text-[10.5px] text-slate-500 break-words">
                {company.address}
              </p>
              <p className="text-[10.5px] text-slate-600 mt-0.5">
                <strong>RUC:</strong>{' '}
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {company.ruc}
                </span>
                {' · '}
                <strong>Tel:</strong> {company.phone}
                {' · '}
                <strong>Email:</strong> {company.email}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-left sm:text-right border border-slate-300 bg-slate-50 rounded px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Liquidación de Despacho
            </span>
            <span className="text-base sm:text-lg font-bold font-mono tabular-nums text-slate-900 block">
              Nº {settlement.sequentialNumber}
            </span>
          </div>
        </div>

        {/* 2. CUATRO COLUMNAS: Datos del Cliente | Despacho | Datos Liquidación | Contenido */}
        <div className="print-compact-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3 text-[11px]">
          {/* Columna 1: Datos del Cliente */}
          <div className="print-compact-card border border-slate-300 rounded p-2.5 bg-white">
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-1.5">
              Datos del Cliente
            </div>
            <div className="space-y-0.5">
              <div>
                <span className="text-slate-500">Cliente:</span>{' '}
                <strong className="text-slate-900 break-words">
                  {settlement.clientName || '—'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">RUC:</span>{' '}
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {settlement.clientRuc || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Dirección:</span>{' '}
                <span className="text-slate-700 break-words">
                  {settlement.clientAddress || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Ref.:</span>{' '}
                <span className="text-slate-700 break-words">
                  {settlement.clientContact || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Columna 2: Despacho */}
          <div className="print-compact-card border border-slate-300 rounded p-2.5 bg-white">
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-1.5">
              Despacho
            </div>
            <div className="space-y-0.5">
              <div>
                <span className="text-slate-500">Despacho Nº:</span>{' '}
                <strong className="font-mono tabular-nums text-slate-900">
                  {settlement.dispatchNumber || '—'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Remitente:</span>{' '}
                <span className="font-medium text-slate-900 break-words">
                  {settlement.senderName || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Procedencia:</span>{' '}
                <span className="text-slate-700">
                  {settlement.senderCountry || '—'} ({settlement.transportMode})
                </span>
              </div>
              <div>
                <span className="text-slate-500">Aduana:</span>{' '}
                <span className="text-slate-700 break-words">
                  {settlement.customsOffice || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Columna 3: Datos Liquidación */}
          <div className="print-compact-card border border-slate-300 rounded p-2.5 bg-white">
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-1.5">
              Datos Liquidación
            </div>
            <div className="space-y-0.5">
              <div className="flex justify-between gap-1">
                <span className="text-slate-500">Liquidación Nº:</span>
                <strong className="font-mono tabular-nums text-slate-900">
                  {settlement.sequentialNumber}
                </strong>
              </div>
              <div className="flex justify-between gap-1">
                <span className="text-slate-500">Fecha:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {settlement.date}
                </span>
              </div>
              <div className="flex justify-between gap-1">
                <span className="text-slate-500">Nro. Factura:</span>
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {settlement.invoiceNumber || '—'}
                </span>
              </div>
              <div className="flex justify-between gap-1">
                <span className="text-slate-500">Nro. Proforma:</span>
                <span className="font-mono tabular-nums text-slate-700">
                  {settlement.proformaNumber || '—'}
                </span>
              </div>
              <div className="flex justify-between gap-1">
                <span className="text-slate-500">Cotiz. Dólar:</span>
                <strong className="font-mono tabular-nums text-slate-900">
                  Gs. {formatCurrencyGs(settlement.exchangeRate)}
                </strong>
              </div>
            </div>
          </div>

          {/* Columna 4: Contenido (Valor FOB, Seguro, Flete, Valor Ajust a incluir, CIF) */}
          <div className="print-compact-card border border-slate-300 rounded p-2.5 bg-slate-50">
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-1.5">
              Contenido
            </div>
            <div className="space-y-0.5">
              <div className="flex justify-between gap-1">
                <span className="text-slate-600">Valor FOB:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  USD {formatCurrencyUsd(metrics.fobUsd)}
                </span>
              </div>
              <div className="flex justify-between gap-1">
                <span className="text-slate-600">Seguro:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  USD {formatCurrencyUsd(metrics.insuranceUsd)}
                </span>
              </div>
              <div className="flex justify-between gap-1">
                <span className="text-slate-600">Flete:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  USD {formatCurrencyUsd(metrics.freightUsd)}
                </span>
              </div>
              <div className="flex justify-between gap-1">
                <span className="text-slate-600">Valor Ajust a incluir:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  USD {formatCurrencyUsd(metrics.adjustmentUsd)}
                </span>
              </div>
              <div className="flex justify-between gap-1 border-t border-slate-300 pt-0.5 mt-0.5 font-bold text-slate-900">
                <span>CIF (Gs. {formatCurrencyGs(metrics.cifGs)}):</span>
                <span className="font-mono tabular-nums">
                  USD {formatCurrencyUsd(metrics.cifUsd)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. LIQUIDACIÓN DE DERECHOS Y GASTOS SOBRE MERCADERÍA A SER TRANSPORTADA (6 Columnas) */}
        <div className="border border-slate-300 rounded overflow-hidden mb-3">
          <div className="bg-slate-900 text-white px-3 py-1 text-[10.5px] font-bold uppercase tracking-wide">
            Liquidación de Derechos y Gastos Sobre Mercadería a ser Transportada
          </div>
          <div className="overflow-x-auto">
            <table className="print-compact-table w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold text-slate-700">
                  <th className="py-1 px-2.5 text-center w-16">Bultos</th>
                  <th className="py-1 px-2.5 text-center w-28">Unidad Medida</th>
                  <th className="py-1 px-2.5">Descripción</th>
                  <th className="py-1 px-2.5 text-center w-28">Part Arancel</th>
                  <th className="py-1 px-2.5 text-right w-32">Valor</th>
                  <th className="py-1 px-2.5 text-right w-32">
                    Porc. Arancelaria %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(!settlement.merchandiseItems ||
                  settlement.merchandiseItems.length === 0) ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-1.5 px-3 text-center text-slate-400"
                    >
                      1 · BULTOS · MERCADERÍA SEGÚN FACTURA COMERCIAL Nº{' '}
                      {settlement.invoiceNumber || 'S/N'} · Valor CIF Gs.{' '}
                      {formatCurrencyGs(metrics.cifGs)}
                    </td>
                  </tr>
                ) : (
                  settlement.merchandiseItems.map((m) => (
                    <tr key={m.id}>
                      <td className="py-1 px-2.5 text-center font-mono tabular-nums font-semibold">
                        {m.packages}
                      </td>
                      <td className="py-1 px-2.5 text-center font-medium">
                        {m.unit}
                      </td>
                      <td className="py-1 px-2.5 font-semibold text-slate-900">
                        {m.description}
                      </td>
                      <td className="py-1 px-2.5 text-center font-mono tabular-nums">
                        {m.tariffCode}
                      </td>
                      <td className="py-1 px-2.5 text-right font-mono tabular-nums font-semibold">
                        {formatCurrencyGs(m.valueGs)}
                      </td>
                      <td className="py-1 px-2.5 text-right font-mono tabular-nums">
                        {m.tariffPercent}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. SECCIONES DE 3 COLUMNAS (Descripción | Datos Adicionales | Valor) */}
        <div className="print-compact-sections space-y-2.5 mb-3">
          {/* 4A. DETALLE DE TRIBUTOS ADUANEROS Y SERVICIOS — Liquidación De Despacho */}
          <div className="border border-slate-300 rounded overflow-hidden">
            <div className="bg-slate-800 text-white px-3 py-1 text-[10.5px] font-bold flex flex-wrap justify-between items-center">
              <span>DETALLE DE TRIBUTOS ADUANEROS Y SERVICIOS</span>
              <span className="text-sky-300 font-normal">
                Liquidación De Despacho
              </span>
            </div>
            <table className="print-compact-table w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-600 bg-slate-50">
                  <th className="py-1 px-3">Descripción</th>
                  <th className="py-1 px-3 w-56">Datos Adicionales</th>
                  <th className="py-1 px-3 w-40 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {settlement.customsDuties.map((item) => (
                  <tr key={item.id}>
                    <td className="py-1 px-3 font-medium text-slate-900">
                      {item.description}
                    </td>
                    <td className="py-1 px-3 font-mono tabular-nums text-slate-600">
                      {item.documentRef || 'S/ DESPACHO'}
                    </td>
                    <td className="py-1 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {formatCurrencyGs(item.amountGs)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t border-slate-300 font-bold text-slate-900">
                  <td colSpan={2} className="py-1 px-3 text-right">
                    Total:
                  </td>
                  <td className="py-1 px-3 text-right font-mono tabular-nums">
                    {formatCurrencyGs(metrics.totalDutiesGs)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 4B. DETALLE DE TASAS Y OTROS COSTOS */}
          <div className="border border-slate-300 rounded overflow-hidden">
            <div className="bg-slate-800 text-white px-3 py-1 text-[10.5px] font-bold">
              DETALLE DE TASAS Y OTROS COSTOS
            </div>
            <table className="print-compact-table w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-600 bg-slate-50">
                  <th className="py-1 px-3">Descripción</th>
                  <th className="py-1 px-3 w-56">Datos Adicionales</th>
                  <th className="py-1 px-3 w-40 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {settlement.ratesAndCosts.map((item) => (
                  <tr key={item.id}>
                    <td className="py-1 px-3 font-medium text-slate-900">
                      {item.description}
                    </td>
                    <td className="py-1 px-3 font-mono tabular-nums text-slate-600">
                      {item.documentRef || '—'}
                    </td>
                    <td className="py-1 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {formatCurrencyGs(item.amountGs)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t border-slate-300 font-bold text-slate-900">
                  <td colSpan={2} className="py-1 px-3 text-right">
                    Total:
                  </td>
                  <td className="py-1 px-3 text-right font-mono tabular-nums">
                    {formatCurrencyGs(metrics.totalRatesGs)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 4C. DETALLE DE SERVICIOS INTERNOS + TOTAL GENERAL, RECIBIDO Y SALDO */}
          <div className="border border-slate-300 rounded overflow-hidden">
            <div className="bg-slate-800 text-white px-3 py-1 text-[10.5px] font-bold">
              DETALLE DE SERVICIOS INTERNOS
            </div>
            <table className="print-compact-table w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-600 bg-slate-50">
                  <th className="py-1 px-3">Descripción</th>
                  <th className="py-1 px-3 w-56">Datos Adicionales</th>
                  <th className="py-1 px-3 w-40 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {settlement.internalServices.map((item) => (
                  <tr key={item.id}>
                    <td className="py-1 px-3 font-medium text-slate-900">
                      {item.description}
                    </td>
                    <td className="py-1 px-3 font-mono tabular-nums text-slate-600">
                      {item.documentRef || ''}
                    </td>
                    <td
                      className={`py-1 px-3 text-right font-mono tabular-nums font-semibold ${
                        item.amountGs < 0 ? 'text-red-700' : 'text-slate-900'
                      }`}
                    >
                      {formatCurrencyGs(item.amountGs)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="font-bold text-[11px]">
                <tr className="bg-slate-100 border-t border-slate-300 text-slate-900">
                  <td colSpan={2} className="py-1 px-3 text-right">
                    Total:
                  </td>
                  <td className="py-1 px-3 text-right font-mono tabular-nums">
                    {formatCurrencyGs(metrics.totalServicesGs)}
                  </td>
                </tr>
                <tr className="bg-slate-900 text-white">
                  <td colSpan={2} className="py-1.5 px-3 text-right">
                    Total General:
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono tabular-nums text-xs">
                    {formatCurrencyGs(metrics.grandTotalGs)}
                  </td>
                </tr>
                <tr className="bg-slate-50 border-t border-slate-200 text-slate-800">
                  <td colSpan={2} className="py-1 px-3 text-right">
                    Recibido:
                  </td>
                  <td className="py-1 px-3 text-right font-mono tabular-nums text-emerald-700">
                    {formatCurrencyGs(metrics.amountReceivedGs)}
                  </td>
                </tr>
                <tr className="bg-slate-100 border-t-2 border-slate-900 text-slate-900">
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
        </div>

        {/* 5. MONTO EN LETRAS Y OBSERVACIÓN */}
        <div className="print-compact-footer border border-slate-300 rounded p-3 bg-slate-50 space-y-2 text-[11px]">
          <div>
            <span className="font-bold text-slate-900">Monto en Letras: </span>
            <span className="font-mono font-semibold text-slate-800 uppercase">
              {metrics.computedAmountInWords}
            </span>
          </div>

          <div className="border-t border-slate-200 pt-1.5">
            <span className="font-bold text-slate-900">Observación: </span>
            <span className="text-slate-800 whitespace-pre-line font-medium">
              {settlement.notes || 'Sin observaciones adicionales.'}
            </span>
          </div>

          <div className="print-compact-signatures grid grid-cols-2 gap-8 pt-5 border-t border-slate-200 mt-2">
            <div className="border-t border-slate-400 pt-1 text-center">
              <span className="block font-semibold text-slate-800 text-[10.5px]">
                Firma y Sello Despachante
              </span>
              <span className="text-[10px] text-slate-500">{company.name}</span>
            </div>
            <div className="border-t border-slate-400 pt-1 text-center">
              <span className="block font-semibold text-slate-800 text-[10.5px]">
                Conformidad del Cliente
              </span>
              <span className="text-[10px] text-slate-500">
                {settlement.clientName || 'Importador'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
