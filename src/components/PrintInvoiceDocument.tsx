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
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white text-slate-900 px-4 sm:px-5 py-3.5 rounded-lg border border-slate-300 shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            {onBackToEditor && (
              <button
                type="button"
                onClick={onBackToEditor}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al Editor</span>
              </button>
            )}
            <div className="text-xs text-slate-700">
              <span className="font-medium">Documento Oficial Encuadrado (1 Hoja A4)</span>
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
            <button
              type="button"
              onClick={onExportStandaloneHtml}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>HTML Único</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-700" />
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
            <div className="p-2.5 space-y-0.5 text-slate-950">
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
                <span className="font-semibold text-slate-700">Procedencia:</span>{' '}
                <span className="text-slate-900">
                  {settlement.senderCountry || '—'} ({settlement.transportMode})
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Aduana:</span>{' '}
                <span className="text-slate-900 break-words">
                  {settlement.customsOffice || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Columna 3: Datos Liquidación */}
          <div className="print-compact-card flex flex-col">
            <div className="bg-slate-100 border-b border-slate-400 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-950">
              Datos Liquidación
            </div>
            <div className="p-2.5 space-y-0.5 text-slate-950">
              <div className="flex justify-between gap-1">
                <span className="font-semibold text-slate-700">Liquidación Nº:</span>
                <strong className="font-mono tabular-nums text-slate-950">
                  {settlement.sequentialNumber}
                </strong>
              </div>
              <div className="flex justify-between gap-1">
                <span className="font-semibold text-slate-700">Fecha:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-950">
                  {settlement.date}
                </span>
              </div>
              <div className="flex justify-between gap-1">
                <span className="font-semibold text-slate-700">Nro. Factura:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-950">
                  {settlement.invoiceNumber || '—'}
                </span>
              </div>
              <div className="flex justify-between gap-1">
                <span className="font-semibold text-slate-700">Nro. Proforma:</span>
                <span className="font-mono tabular-nums text-slate-900">
                  {settlement.proformaNumber || '—'}
                </span>
              </div>
              <div className="flex justify-between gap-1">
                <span className="font-semibold text-slate-700">Cotiz. Dólar:</span>
                <strong className="font-mono tabular-nums text-slate-950">
                  Gs. {formatCurrencyGs(settlement.exchangeRate)}
                </strong>
              </div>
            </div>
          </div>

          {/* Columna 4: Contenido (Valor FOB, Seguro, Flete, Valor Ajust a incluir, CIF) */}
          <div className="print-compact-card flex flex-col bg-slate-50/70">
            <div className="bg-slate-100 border-b border-slate-400 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-950">
              Contenido
            </div>
            <div className="p-2.5 space-y-0.5 text-slate-950">
              <div className="flex justify-between gap-1">
                <span className="font-semibold text-slate-700">Valor FOB:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-950">
                  USD {formatCurrencyUsd(metrics.fobUsd)}
                </span>
              </div>
              <div className="flex justify-between gap-1">
                <span className="font-semibold text-slate-700">Seguro:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-950">
                  USD {formatCurrencyUsd(metrics.insuranceUsd)}
                </span>
              </div>
              <div className="flex justify-between gap-1">
                <span className="font-semibold text-slate-700">Flete:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-950">
                  USD {formatCurrencyUsd(metrics.freightUsd)}
                </span>
              </div>
              <div className="flex justify-between gap-1">
                <span className="font-semibold text-slate-700">Valor Ajust a incluir:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-950">
                  USD {formatCurrencyUsd(metrics.adjustmentUsd)}
                </span>
              </div>
              <div className="flex justify-between gap-1 border-t border-slate-400 pt-0.5 mt-0.5 font-bold text-slate-950">
                <span>CIF (Gs. {formatCurrencyGs(metrics.cifGs)}):</span>
                <span className="font-mono tabular-nums">
                  USD {formatCurrencyUsd(metrics.cifUsd)}
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
            <table className="print-compact-table w-full text-left border-collapse text-[11px] text-slate-950">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-400 text-[10px] font-bold text-slate-950 divide-x divide-slate-300">
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
                      <td className="py-1 px-2.5 text-center font-mono tabular-nums font-semibold">
                        {m.packages}
                      </td>
                      <td className="py-1 px-2.5 text-center font-medium">
                        {m.unit}
                      </td>
                      <td className="py-1 px-2.5 font-semibold text-slate-950">
                        {m.description}
                      </td>
                      <td className="py-1 px-2.5 text-center font-mono tabular-nums">
                        {m.tariffCode}
                      </td>
                      <td className="py-1 px-2.5 text-right font-mono tabular-nums font-bold">
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

        {/* 4. SECCIONES DE 3 COLUMNAS ENCUADRADAS (Descripción | Datos Adicionales | Valor) */}
        <div className="print-compact-sections space-y-2.5 mb-3">
          {/* 4A. DETALLE DE TRIBUTOS ADUANEROS Y SERVICIOS — Liquidación De Despacho */}
          <div className="border border-slate-400 rounded-sm overflow-hidden bg-white">
            <div className="bg-slate-100 border-b border-slate-400 text-slate-950 px-3 py-1 text-[10.5px] font-bold flex flex-wrap justify-between items-center">
              <span>DETALLE DE TRIBUTOS ADUANEROS Y SERVICIOS</span>
              <span className="text-slate-800 font-semibold">
                Liquidación De Despacho
              </span>
            </div>
            <table className="print-compact-table w-full text-left border-collapse text-[11px] text-slate-950">
              <thead>
                <tr className="border-b border-slate-400 text-[10px] font-bold text-slate-950 bg-slate-50 divide-x divide-slate-300">
                  <th className="py-1 px-3">Descripción</th>
                  <th className="py-1 px-3 w-56">Datos Adicionales</th>
                  <th className="py-1 px-3 w-40 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {settlement.customsDuties.map((item) => (
                  <tr key={item.id} className="divide-x divide-slate-300">
                    <td className="py-1 px-3 font-medium text-slate-950">
                      {item.description}
                    </td>
                    <td className="py-1 px-3 font-mono tabular-nums text-slate-800">
                      {item.documentRef || 'S/ DESPACHO'}
                    </td>
                    <td className="py-1 px-3 text-right font-mono tabular-nums font-semibold text-slate-950">
                      {formatCurrencyGs(item.amountGs)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t border-slate-400 font-bold text-slate-950 divide-x divide-slate-300">
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
          <div className="border border-slate-400 rounded-sm overflow-hidden bg-white">
            <div className="bg-slate-100 border-b border-slate-400 text-slate-950 px-3 py-1 text-[10.5px] font-bold">
              DETALLE DE TASAS Y OTROS COSTOS
            </div>
            <table className="print-compact-table w-full text-left border-collapse text-[11px] text-slate-950">
              <thead>
                <tr className="border-b border-slate-400 text-[10px] font-bold text-slate-950 bg-slate-50 divide-x divide-slate-300">
                  <th className="py-1 px-3">Descripción</th>
                  <th className="py-1 px-3 w-56">Datos Adicionales</th>
                  <th className="py-1 px-3 w-40 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {settlement.ratesAndCosts.map((item) => (
                  <tr key={item.id} className="divide-x divide-slate-300">
                    <td className="py-1 px-3 font-medium text-slate-950">
                      {item.description}
                    </td>
                    <td className="py-1 px-3 font-mono tabular-nums text-slate-800">
                      {item.documentRef || '—'}
                    </td>
                    <td className="py-1 px-3 text-right font-mono tabular-nums font-semibold text-slate-950">
                      {formatCurrencyGs(item.amountGs)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t border-slate-400 font-bold text-slate-950 divide-x divide-slate-300">
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
          <div className="border border-slate-400 rounded-sm overflow-hidden bg-white">
            <div className="bg-slate-100 border-b border-slate-400 text-slate-950 px-3 py-1 text-[10.5px] font-bold">
              DETALLE DE SERVICIOS INTERNOS
            </div>
            <table className="print-compact-table w-full text-left border-collapse text-[11px] text-slate-950">
              <thead>
                <tr className="border-b border-slate-400 text-[10px] font-bold text-slate-950 bg-slate-50 divide-x divide-slate-300">
                  <th className="py-1 px-3">Descripción</th>
                  <th className="py-1 px-3 w-56">Datos Adicionales</th>
                  <th className="py-1 px-3 w-40 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {settlement.internalServices.map((item) => (
                  <tr key={item.id} className="divide-x divide-slate-300">
                    <td className="py-1 px-3 font-medium text-slate-950">
                      {item.description}
                    </td>
                    <td className="py-1 px-3 font-mono tabular-nums text-slate-800">
                      {item.documentRef || ''}
                    </td>
                    <td className="py-1 px-3 text-right font-mono tabular-nums font-semibold text-slate-950">
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
