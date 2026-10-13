import { CompanySettings, CustomsSettlement } from '../types';
import { renderCorporateLogoPngDataUrl } from './logoRenderer';

export function formatCurrencyGs(value: number): string {
  return new Intl.NumberFormat('es-PY', {
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}

export function formatCurrencyUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatCurrencyAmount(value: number, currency = 'USD'): string {
  if (currency === 'PYG') {
    return new Intl.NumberFormat('es-PY', {
      maximumFractionDigits: 0,
    }).format(Math.round(value || 0));
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

/**
 * Convierte un número entero en Guaraníes a letras en mayúsculas (ej. 4666885 -> "CUATRO MILLONES SEISCIENTOS SESENTA Y SEIS MIL OCHOCIENTOS OCHENTA Y CINCO.-")
 */
export function numberToSpanishWords(num: number): string {
  const n = Math.abs(Math.round(num || 0));
  if (n === 0) return 'CERO.-';

  const unidades = [
    '',
    'UN',
    'DOS',
    'TRES',
    'CUATRO',
    'CINCO',
    'SEIS',
    'SIETE',
    'OCHO',
    'NUEVE',
  ];
  const especiales = [
    'DIEZ',
    'ONCE',
    'DOCE',
    'TRECE',
    'CATORCE',
    'QUINCE',
    'DIECISEIS',
    'DIECISIETE',
    'DIECIOCHO',
    'DIECINUEVE',
  ];
  const decenas = [
    '',
    'DIEZ',
    'VEINTE',
    'TREINTA',
    'CUARENTA',
    'CINCUENTA',
    'SESENTA',
    'SETENTA',
    'OCHENTA',
    'NOVENTA',
  ];
  const centenas = [
    '',
    'CIENTO',
    'DOSCIENTOS',
    'TRESCIENTOS',
    'CUATROCIENTOS',
    'QUINIENTOS',
    'SEISCIENTOS',
    'SETECIENTOS',
    'OCHOCIENTOS',
    'NOVECIENTOS',
  ];

  function convertGroup(val: number): string {
    if (val === 0) return '';
    if (val === 100) return 'CIEN';

    const c = Math.floor(val / 100);
    const rest = val % 100;
    const d = Math.floor(rest / 10);
    const u = rest % 10;

    let out = '';
    if (c > 0) out += centenas[c] + ' ';

    if (rest > 0) {
      if (rest < 10) {
        out += unidades[rest];
      } else if (rest < 20) {
        out += especiales[rest - 10];
      } else if (rest === 20) {
        out += 'VEINTE';
      } else if (rest < 30) {
        out += 'VEINTI' + unidades[u];
      } else {
        out += decenas[d];
        if (u > 0) out += ' Y ' + unidades[u];
      }
    }
    return out.trim();
  }

  const millones = Math.floor(n / 1000000);
  const miles = Math.floor((n % 1000000) / 1000);
  const resto = n % 1000;

  const parts: string[] = [];

  if (millones > 0) {
    if (millones === 1) {
      parts.push('UN MILLON');
    } else {
      parts.push(`${convertGroup(millones)} MILLONES`);
    }
  }

  if (miles > 0) {
    if (miles === 1) {
      parts.push('MIL');
    } else {
      parts.push(`${convertGroup(miles)} MIL`);
    }
  }

  if (resto > 0) {
    let restoStr = convertGroup(resto);
    if (restoStr.endsWith('UN')) {
      restoStr = restoStr.slice(0, -2) + 'UNO';
    }
    if (miles > 0 && resto > 0) {
      parts[parts.length - 1] = parts[parts.length - 1] + ',';
    }
    parts.push(restoStr);
  }

  return `${parts.join(' ')}. -`;
}

export function calculateSettlementMetrics(settlement: CustomsSettlement) {
  const currency = settlement.currency || 'USD';
  const fobAmount = Number(settlement.fobUsd) || 0;
  const insuranceAmount = Number(settlement.insuranceUsd) || 0;
  const freightAmount = Number(settlement.freightUsd) || 0;
  const adjustmentAmount = Number(settlement.adjustmentUsd) || 0;
  const deductionAmount = Number(settlement.deductionUsd) || 0;

  // Fórmula aduanera: CIF = Valor FC + Flete + Seguro + Ajustes a incluir - Ajustes a deducir
  const cifAmount = Math.max(0, fobAmount + insuranceAmount + freightAmount + adjustmentAmount - deductionAmount);
  const cifGs = Math.round(cifAmount * (Number(settlement.exchangeRate) || 0));

  const totalDutiesGs = settlement.customsDuties.reduce(
    (sum, item) => sum + (Number(item.amountGs) || 0),
    0
  );
  const totalRatesGs = settlement.ratesAndCosts.reduce(
    (sum, item) => sum + (Number(item.amountGs) || 0),
    0
  );
  const totalServicesGs = settlement.internalServices.reduce(
    (sum, item) => sum + (Number(item.amountGs) || 0),
    0
  );

  const internalVatGs = Math.round(
    settlement.internalServices
      .filter((i) => i.taxable && i.amountGs > 0)
      .reduce((sum, i) => sum + (Number(i.amountGs) || 0), 0) / 11
  );

  const grandTotalGs = totalDutiesGs + totalRatesGs + totalServicesGs;
  const grandTotalForeign =
    settlement.exchangeRate > 0 ? grandTotalGs / settlement.exchangeRate : 0;

  // 04. DETALLE DE MONTOS RECIBIDOS: suma de todos los pagos si la lista existe
  const hasReceivedPayments =
    Array.isArray(settlement.receivedPayments) &&
    settlement.receivedPayments.length > 0;

  const totalPaymentsFromItems = hasReceivedPayments
    ? settlement.receivedPayments!.reduce(
        (sum, p) => sum + (Number(p.amountGs) || 0),
        0
      )
    : null;

  const amountReceivedGs =
    totalPaymentsFromItems !== null
      ? totalPaymentsFromItems
      : Number(settlement.amountReceived) || 0;

  const balanceGs = grandTotalGs - amountReceivedGs;
  const balanceForeign =
    settlement.exchangeRate > 0 ? balanceGs / settlement.exchangeRate : 0;

  const computedAmountInWords =
    settlement.amountInWords && settlement.amountInWords.trim() !== ''
      ? settlement.amountInWords
      : numberToSpanishWords(grandTotalGs);

  return {
    currency,
    saleCondition: settlement.saleCondition || settlement.incoterm || 'FOB',
    fobAmount,
    fcAmount: fobAmount,
    insuranceAmount,
    freightAmount,
    adjustmentAmount,
    deductionAmount,
    cifAmount,
    fobUsd: fobAmount,
    fcUsd: fobAmount,
    insuranceUsd: insuranceAmount,
    freightUsd: freightAmount,
    adjustmentUsd: adjustmentAmount,
    deductionUsd: deductionAmount,
    cifUsd: cifAmount,
    cifGs,
    totalDutiesGs,
    totalRatesGs,
    totalServicesGs,
    internalVatGs,
    grandTotalGs,
    grandTotalUsd: grandTotalForeign,
    amountReceivedGs,
    balanceGs,
    balanceUsd: balanceForeign,
    computedAmountInWords,
  };
}

export function generateStandaloneInteractiveHtml(
  currentSettlement: CustomsSettlement,
  history: CustomsSettlement[],
  company: CompanySettings
): string {
  const companyWithLogo: CompanySettings = {
    ...company,
    logoUrl:
      company.logoUrl && company.logoUrl.trim() !== ''
        ? company.logoUrl
        : renderCorporateLogoPngDataUrl(company.logoText, company.name),
  };
  const metrics = calculateSettlementMetrics(currentSettlement);
  const cur = currentSettlement.currency || 'USD';
  const fob = Number(currentSettlement.fobUsd) || 0;
  const seg = Number(currentSettlement.insuranceUsd) || 0;
  const fle = Number(currentSettlement.freightUsd) || 0;
  const aju = Number(currentSettlement.adjustmentUsd) || 0;
  const ded = Number(currentSettlement.deductionUsd) || 0;
  const cifForeign = Math.max(0, fob + seg + fle + aju - ded);
  const cifGs = Math.round(cifForeign * (Number(currentSettlement.exchangeRate) || 0));

  const merchRowsHtml = (currentSettlement.merchandiseItems || [])
    .map(
      (m) => `
        <tr class="border-b border-slate-300 divide-x divide-slate-300 text-[11px] text-slate-950">
          <td class="py-1 px-2 text-center tabular-nums font-semibold">${m.packages}</td>
          <td class="py-1 px-2 text-center">${m.unit}</td>
          <td class="py-1 px-2 font-semibold text-slate-950">${m.description}</td>
          <td class="py-1 px-2 text-center tabular-nums">${m.tariffCode}</td>
          <td class="py-1 px-2 text-right tabular-nums font-bold">${formatCurrencyGs(m.valueGs)}</td>
          <td class="py-1 px-2 text-right tabular-nums">${m.tariffPercent}%</td>
        </tr>`
    )
    .join('');

  const render3ColRows = (items: typeof currentSettlement.customsDuties) =>
    items
      .map(
        (item) => `
        <tr class="border-b border-slate-300 divide-x divide-slate-300 text-[11px] text-slate-950">
          <td class="py-1 px-3 font-medium text-slate-950">${item.description}</td>
          <td class="py-1 px-3 text-slate-800 tabular-nums">${item.documentRef || '—'}</td>
          <td class="py-1 px-3 text-right tabular-nums font-semibold text-slate-950">${formatCurrencyGs(item.amountGs)}</td>
        </tr>`
      )
      .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${company.name} — Liquidación ${currentSettlement.sequentialNumber}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Plus+Jakarta+Sans:wght@600;700&family=Public+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Public Sans', sans-serif; }
    h1, h2, h3, .font-display { font-family: 'Plus Jakarta Sans', sans-serif; }
    .tabular-nums { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
    @media print {
      @page { size: A4 portrait; margin: 6mm; }
      .no-print { display: none !important; }
      html, body { background: white !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
      .print-sheet {
        box-shadow: none !important;
        border: 1px solid #94a3b8 !important;
        margin: 0 !important;
        padding: 4mm !important;
        max-width: 100% !important;
        max-height: 284mm !important;
        overflow: hidden !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      table th, table td {
        padding-top: 0.8mm !important;
        padding-bottom: 0.8mm !important;
        font-size: 9px !important;
        line-height: 1.15 !important;
      }
    }
  </style>
</head>
<body class="bg-slate-100 text-slate-950 p-4 md:p-6">
  <div class="max-w-5xl mx-auto">
    <div class="no-print flex flex-wrap items-center justify-between gap-4 mb-4 bg-white text-slate-950 border border-slate-300 px-5 py-3 rounded-lg">
      <div>
        <span class="text-xs uppercase tracking-wider text-slate-500 block">Liquidación Oficial de Despacho</span>
        <strong class="text-sm font-display">${company.name} — Liquidación Nº ${currentSettlement.sequentialNumber}</strong>
      </div>
      <div class="flex items-center gap-3">
        <button onclick="window.print()" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md transition cursor-pointer">
          Imprimir / Guardar PDF (1 Hoja)
        </button>
      </div>
    </div>

    <div id="doc-root" class="print-sheet bg-white border border-slate-400 rounded-md p-5 md:p-6 text-slate-950">
      <!-- 1. Datos de la Empresa Encuadrados -->
      <div class="grid grid-cols-12 border border-slate-400 rounded-sm mb-3 bg-white overflow-hidden">
        <div class="col-span-9 flex items-center gap-3.5 p-3">
          <div class="w-28 h-16 bg-white border border-slate-300 rounded-xs p-1 flex items-center justify-center shrink-0">
            <img src="${companyWithLogo.logoUrl}" alt="${company.name}" class="w-full h-full object-contain" />
          </div>
          <div>
            <h1 class="text-base font-bold text-slate-950">${company.name} · RUC ${company.ruc}</h1>
            <p class="text-[11px] text-slate-800 font-medium">${company.slogan} · ${company.phone} · ${company.email}</p>
            <p class="text-[10px] text-slate-700">${company.address || ''}</p>
          </div>
        </div>
        <div class="col-span-3 border-l border-slate-400 bg-slate-100 p-3 text-right flex flex-col justify-center">
          <span class="text-[10px] font-bold uppercase text-slate-700">Liquidación de Despacho</span>
          <span class="text-base font-bold tabular-nums text-slate-950">Nº ${currentSettlement.sequentialNumber}</span>
          <span class="text-[10px] tabular-nums text-slate-800">Fecha: ${currentSettlement.date}</span>
        </div>
      </div>

      <!-- 2. 4 Columnas Encuadradas: Datos del Cliente | Despacho | Datos Liquidación | Contenido -->
      <div class="grid grid-cols-4 border border-slate-400 rounded-sm mb-3 text-[10.5px] bg-white divide-x divide-slate-400 overflow-hidden">
        <div class="flex flex-col">
          <div class="bg-slate-100 border-b border-slate-400 px-2 py-1 font-bold uppercase text-slate-950">Datos del Cliente</div>
          <div class="p-2 space-y-0.5">
            <p><strong>Cliente:</strong> ${currentSettlement.clientName || '—'}</p>
            <p><strong>RUC:</strong> <span class="tabular-nums font-bold">${currentSettlement.clientRuc || '—'}</span></p>
            <p><strong>Dirección:</strong> ${currentSettlement.clientAddress || '—'}</p>
            <p><strong>Ref.:</strong> ${currentSettlement.clientContact || '—'}</p>
          </div>
        </div>
        <div class="flex flex-col">
          <div class="bg-slate-100 border-b border-slate-400 px-2 py-1 font-bold uppercase text-slate-950">Despacho</div>
          <div class="p-2 space-y-0.5 text-[10px]">
            <p><strong>Despacho Nº:</strong> <span class="tabular-nums font-bold">${currentSettlement.dispatchNumber || '—'}</span></p>
            <p><strong>Remitente:</strong> ${currentSettlement.senderName || '—'}</p>
            <p><strong>Régimen:</strong> <span class="font-mono font-bold bg-slate-100 px-1 border border-slate-300 rounded">${currentSettlement.customsRegime || 'IC04'}</span></p>
            <p><strong>Proforma:</strong> <span class="tabular-nums">${currentSettlement.proformaNumber || '—'}</span></p>
            <p><strong>Origen:</strong> <span class="font-medium">${currentSettlement.originCountry || currentSettlement.senderCountry || '—'}</span></p>
            <p><strong>Procedencia:</strong> <span class="font-medium">${currentSettlement.provenanceCountry || currentSettlement.senderCountry || '—'}</span></p>
            <p><strong>Vía:</strong> ${currentSettlement.transportMode || 'Marítimo'}</p>
            <p><strong>Doc. Transporte:</strong> <span class="tabular-nums">${currentSettlement.senderReference || '—'}</span></p>
          </div>
        </div>
        <div class="flex flex-col">
          <div class="bg-slate-100 border-b border-slate-400 px-2 py-1 font-bold uppercase text-slate-950">Datos Liquidación</div>
          <div class="p-2 space-y-1 text-[10px]">
            <div class="flex justify-between"><span><strong>Fecha:</strong></span><span class="tabular-nums font-semibold">${currentSettlement.date}</span></div>
            <div class="flex justify-between"><span><strong>Proveedor:</strong></span><span class="font-medium">${currentSettlement.supplierName || currentSettlement.senderName || '—'}</span></div>
            <div class="flex justify-between"><span><strong>Nro. Factura:</strong></span><span class="tabular-nums font-semibold">${currentSettlement.invoiceNumber || '—'}</span></div>
            <div class="flex justify-between"><span><strong>Condición de venta:</strong></span><span class="font-mono font-bold bg-slate-100 px-1 border border-slate-300 rounded">${currentSettlement.incoterm || currentSettlement.saleCondition || 'FOB'}</span></div>
          </div>
        </div>
        <div class="flex flex-col bg-slate-50/70">
          <div class="bg-slate-100 border-b border-slate-400 px-2 py-1 font-bold uppercase text-slate-950">Contenido</div>
          <div class="p-2 space-y-0.5 text-[10px]">
            <div class="flex justify-between"><span>Divisa:</span><span class="tabular-nums font-bold">${cur}</span></div>
            <div class="flex justify-between"><span>Tipo de Cambio:</span><span class="tabular-nums font-bold">Gs. ${formatCurrencyGs(currentSettlement.exchangeRate)}</span></div>
            <div class="flex justify-between"><span>Valor FC:</span><span class="tabular-nums font-semibold">${cur} ${formatCurrencyAmount(fob, cur)}</span></div>
            <div class="flex justify-between"><span>Flete:</span><span class="tabular-nums font-semibold">${cur} ${formatCurrencyAmount(fle, cur)}</span></div>
            <div class="flex justify-between"><span>Seguro:</span><span class="tabular-nums font-semibold">${cur} ${formatCurrencyAmount(seg, cur)}</span></div>
            <div class="flex justify-between"><span>Ajustes a incluir:</span><span class="tabular-nums font-semibold">${cur} ${formatCurrencyAmount(aju, cur)}</span></div>
            <div class="flex justify-between"><span>Ajustes a deducir:</span><span class="tabular-nums font-semibold">${cur} ${formatCurrencyAmount(ded, cur)}</span></div>
            <div class="flex justify-between border-t border-slate-300 pt-0.5 mt-0.5 font-semibold text-slate-950"><span>CIF (${cur}):</span><span class="tabular-nums">${cur} ${formatCurrencyAmount(cifForeign, cur)}</span></div>
            <div class="flex justify-between font-bold text-slate-950"><span>CIF (Gs.):</span><span class="tabular-nums">Gs. ${formatCurrencyGs(cifGs)}</span></div>
          </div>
        </div>
      </div>

      <!-- 3. Liquidación de Derechos y Gastos Sobre Mercadería a ser Transportada (6 columnas encuadradas) -->
      <div class="border border-slate-400 rounded-sm overflow-hidden mb-3 bg-white">
        <div class="bg-slate-100 border-b border-slate-400 text-slate-950 px-3 py-1 text-[10.5px] font-bold uppercase">
          Liquidación de Derechos y Gastos Sobre Mercadería a ser Transportada
        </div>
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-400 divide-x divide-slate-300 text-[10px] font-bold text-slate-950">
              <th class="py-1 px-2 text-center w-16">Bultos</th>
              <th class="py-1 px-2 text-center w-24">Unidad Medida</th>
              <th class="py-1 px-2">Descripción</th>
              <th class="py-1 px-2 text-center w-28">Part Arancel</th>
              <th class="py-1 px-2 text-right w-32">Valor</th>
              <th class="py-1 px-2 text-right w-28">Porc. Arancelaria %</th>
            </tr>
          </thead>
          <tbody>${merchRowsHtml}</tbody>
        </table>
      </div>

      <!-- 4. Tablas de 3 columnas encuadradas -->
      <div class="space-y-2.5 mb-3">
        <div class="border border-slate-400 rounded-sm overflow-hidden bg-white">
          <div class="bg-slate-100 border-b border-slate-400 text-slate-950 px-3 py-1 text-[10.5px] font-bold flex justify-between">
            <span>01. DETALLE DE TRIBUTOS ADUANEROS Y SERVICIOS — Liquidación De Despacho</span>
          </div>
          <table class="w-full text-left border-collapse">
            <thead><tr class="bg-slate-50 border-b border-slate-400 divide-x divide-slate-300 text-[10px] font-bold text-slate-950"><th class="py-1 px-3">Descripción</th><th class="py-1 px-3 w-52">Datos Adicionales</th><th class="py-1 px-3 text-right w-36">Valor</th></tr></thead>
            <tbody>${render3ColRows(currentSettlement.customsDuties)}</tbody>
            <tfoot><tr class="bg-slate-100 border-t border-slate-400 divide-x divide-slate-300 text-[11px] font-bold text-slate-950"><td colspan="2" class="py-1 px-3 text-right">Total:</td><td class="py-1 px-3 text-right tabular-nums">${formatCurrencyGs(metrics.totalDutiesGs)}</td></tr></tfoot>
          </table>
        </div>

        <div class="border border-slate-400 rounded-sm overflow-hidden bg-white">
          <div class="bg-slate-100 border-b border-slate-400 text-slate-950 px-3 py-1 text-[10.5px] font-bold">
            02. DETALLE DE TASAS Y OTROS COSTOS
          </div>
          <table class="w-full text-left border-collapse">
            <thead><tr class="bg-slate-50 border-b border-slate-400 divide-x divide-slate-300 text-[10px] font-bold text-slate-950"><th class="py-1 px-3">Descripción</th><th class="py-1 px-3 w-52">Datos Adicionales</th><th class="py-1 px-3 text-right w-36">Valor</th></tr></thead>
            <tbody>${render3ColRows(currentSettlement.ratesAndCosts)}</tbody>
            <tfoot><tr class="bg-slate-100 border-t border-slate-400 divide-x divide-slate-300 text-[11px] font-bold text-slate-950"><td colspan="2" class="py-1 px-3 text-right">Total:</td><td class="py-1 px-3 text-right tabular-nums">${formatCurrencyGs(metrics.totalRatesGs)}</td></tr></tfoot>
          </table>
        </div>

        <div class="border border-slate-400 rounded-sm overflow-hidden bg-white">
          <div class="bg-slate-100 border-b border-slate-400 text-slate-950 px-3 py-1 text-[10.5px] font-bold">
            03. DETALLE DE SERVICIOS INTERNOS
          </div>
          <table class="w-full text-left border-collapse">
            <thead><tr class="bg-slate-50 border-b border-slate-400 divide-x divide-slate-300 text-[10px] font-bold text-slate-950"><th class="py-1 px-3">Descripción</th><th class="py-1 px-3 w-52">Datos Adicionales</th><th class="py-1 px-3 text-right w-36">Valor</th></tr></thead>
            <tbody>${render3ColRows(currentSettlement.internalServices)}</tbody>
            <tfoot class="text-[11px] font-bold text-slate-950">
              <tr class="bg-slate-50 border-t border-slate-400 divide-x divide-slate-300"><td colspan="2" class="py-1 px-3 text-right">Total:</td><td class="py-1 px-3 text-right tabular-nums">${formatCurrencyGs(metrics.totalServicesGs)}</td></tr>
              <tr class="bg-slate-200/80 border-t border-slate-400 divide-x divide-slate-300"><td colspan="2" class="py-1 px-3 text-right">Total General:</td><td class="py-1 px-3 text-right tabular-nums">${formatCurrencyGs(metrics.grandTotalGs)}</td></tr>
              <tr class="bg-white border-t border-slate-300 divide-x divide-slate-300"><td colspan="2" class="py-1 px-3 text-right">Recibido:</td><td class="py-1 px-3 text-right tabular-nums">${formatCurrencyGs(metrics.amountReceivedGs)}</td></tr>
              <tr class="bg-slate-100 border-t-2 border-slate-500 divide-x divide-slate-300"><td colspan="2" class="py-1 px-3 text-right">Saldo:</td><td class="py-1 px-3 text-right tabular-nums">${formatCurrencyGs(Math.abs(metrics.balanceGs))}</td></tr>
            </tfoot>
          </table>
        </div>

        ${
          currentSettlement.receivedPayments && currentSettlement.receivedPayments.length > 0
            ? `<div class="border border-slate-400 rounded-sm overflow-hidden bg-white">
                <div class="bg-slate-100 border-b border-slate-400 text-slate-950 px-3 py-1 text-[10.5px] font-bold">
                  04. DETALLE DE MONTOS RECIBIDOS
                </div>
                <table class="w-full text-left border-collapse">
                  <thead><tr class="bg-slate-50 border-b border-slate-400 divide-x divide-slate-300 text-[10px] font-bold text-slate-950"><th class="py-1 px-3 w-32">Método</th><th class="py-1 px-3">Detalle (Banco y N° Transacción / Recibo)</th><th class="py-1 px-3 w-36">Fecha</th><th class="py-1 px-3 text-right w-36">Valor</th></tr></thead>
                  <tbody>${currentSettlement.receivedPayments
                    .map(
                      (p) =>
                        `<tr class="divide-x divide-slate-300 border-b border-slate-200"><td class="py-1 px-3 font-semibold">${p.method || 'Transferencia'}</td><td class="py-1 px-3 font-medium">${p.description || (p.method === 'Efectivo' ? 'Recibo de Caja Oficial' : 'Transferencia Bancaria')}</td><td class="py-1 px-3 tabular-nums font-mono text-slate-800">${p.date || '—'}</td><td class="py-1 px-3 text-right tabular-nums font-semibold">${formatCurrencyGs(p.amountGs)}</td></tr>`
                    )
                    .join('')}</tbody>
                  <tfoot><tr class="bg-slate-100 border-t border-slate-400 divide-x divide-slate-300 text-[11px] font-bold text-slate-950"><td colspan="3" class="py-1 px-3 text-right">Total Recibido:</td><td class="py-1 px-3 text-right tabular-nums">${formatCurrencyGs(metrics.amountReceivedGs)}</td></tr></tfoot>
                </table>
              </div>`
            : ''
        }
      </div>

      <!-- 5. Monto en Letras y Observación Encuadrados -->
      <div class="border border-slate-400 rounded-sm text-[10.5px] bg-white divide-y divide-slate-300 text-slate-950">
        <div class="p-2.5 bg-slate-50"><strong>Monto en Letras:</strong> <span class="uppercase font-bold">${metrics.computedAmountInWords}</span></div>
        <div class="p-2.5 bg-white"><strong>Observación:</strong> <span class="whitespace-pre-line font-medium">${currentSettlement.notes || 'Sin observaciones adicionales.'}</span></div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
