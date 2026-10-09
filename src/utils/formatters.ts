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
  const fobUsd = Number(settlement.fobUsd) || 0;
  const insuranceUsd = Number(settlement.insuranceUsd) || 0;
  const freightUsd = Number(settlement.freightUsd) || 0;
  const adjustmentUsd = Number(settlement.adjustmentUsd) || 0;

  const cifUsd = fobUsd + insuranceUsd + freightUsd + adjustmentUsd;
  const cifGs = Math.round(cifUsd * (Number(settlement.exchangeRate) || 0));

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
  const grandTotalUsd =
    settlement.exchangeRate > 0 ? grandTotalGs / settlement.exchangeRate : 0;

  const amountReceivedGs = Number(settlement.amountReceived) || 0;
  const balanceGs = grandTotalGs - amountReceivedGs;
  const balanceUsd =
    settlement.exchangeRate > 0 ? balanceGs / settlement.exchangeRate : 0;

  const computedAmountInWords =
    settlement.amountInWords && settlement.amountInWords.trim() !== ''
      ? settlement.amountInWords
      : numberToSpanishWords(grandTotalGs);

  return {
    fobUsd,
    insuranceUsd,
    freightUsd,
    adjustmentUsd,
    cifUsd,
    cifGs,
    totalDutiesGs,
    totalRatesGs,
    totalServicesGs,
    internalVatGs,
    grandTotalGs,
    grandTotalUsd,
    amountReceivedGs,
    balanceGs,
    balanceUsd,
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
  const safeCompanyJson = JSON.stringify(companyWithLogo).replace(/</g, '\\u003c');
  const safeCurrentJson = JSON.stringify(currentSettlement).replace(/</g, '\\u003c');
  const safeHistoryJson = JSON.stringify(history).replace(/</g, '\\u003c');
  const metrics = calculateSettlementMetrics(currentSettlement);

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
        border: 1px solid #cbd5e1 !important;
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
<body class="bg-slate-100 text-slate-900 p-4 md:p-6">
  <div class="max-w-5xl mx-auto">
    <div class="no-print flex flex-wrap items-center justify-between gap-4 mb-4 bg-slate-900 text-white px-5 py-3 rounded-lg">
      <div>
        <span class="text-xs uppercase tracking-wider text-slate-400 block">Liquidación Oficial de Despacho</span>
        <strong class="text-sm font-display">${company.name} — Liquidación Nº <span id="top-seq">${currentSettlement.sequentialNumber}</span></strong>
      </div>
      <div class="flex items-center gap-3">
        <button onclick="window.print()" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md transition cursor-pointer">
          Imprimir / Guardar PDF (1 Hoja)
        </button>
      </div>
    </div>

    <div id="doc-root" class="print-sheet bg-white border border-slate-300 shadow-sm rounded-lg p-5 md:p-7"></div>
  </div>

  <script>
    const company = ${safeCompanyJson};
    const settlement = ${safeCurrentJson};
    const history = ${safeHistoryJson};
    const words = ${JSON.stringify(metrics.computedAmountInWords)};

    function fmtGs(n) {
      return new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(Math.round(n || 0));
    }
    function fmtUsd(n) {
      return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
    }

    function render() {
      const fob = Number(settlement.fobUsd) || 0;
      const seg = Number(settlement.insuranceUsd) || 0;
      const fle = Number(settlement.freightUsd) || 0;
      const aju = Number(settlement.adjustmentUsd) || 0;
      const cifUsd = fob + seg + fle + aju;
      const cifGs = Math.round(cifUsd * (Number(settlement.exchangeRate) || 0));
      const tDuties = settlement.customsDuties.reduce((a, b) => a + (Number(b.amountGs) || 0), 0);
      const tRates = settlement.ratesAndCosts.reduce((a, b) => a + (Number(b.amountGs) || 0), 0);
      const tServices = settlement.internalServices.reduce((a, b) => a + (Number(b.amountGs) || 0), 0);
      const grandTotal = tDuties + tRates + tServices;
      const received = Number(settlement.amountReceived) || 0;
      const balance = Math.abs(grandTotal - received);

      const renderMerchRows = (items) => (items || []).map((m) => \`
        <tr class="border-b border-slate-200 text-[11px]">
          <td class="py-1 px-2 text-center tabular-nums">\${m.packages}</td>
          <td class="py-1 px-2 text-center">\${m.unit}</td>
          <td class="py-1 px-2 font-medium text-slate-900">\${m.description}</td>
          <td class="py-1 px-2 text-center tabular-nums">\${m.tariffCode}</td>
          <td class="py-1 px-2 text-right tabular-nums">\${fmtGs(m.valueGs)}</td>
          <td class="py-1 px-2 text-right tabular-nums">\${m.tariffPercent}%</td>
        </tr>
      \`).join('');

      const render3ColRows = (items) => items.map((item) => \`
        <tr class="border-b border-slate-200 text-[11px]">
          <td class="py-1 px-3 font-medium text-slate-900">\${item.description}</td>
          <td class="py-1 px-3 text-slate-600 tabular-nums">\${item.documentRef || '—'}</td>
          <td class="py-1 px-3 text-right tabular-nums font-semibold text-slate-900">\${fmtGs(item.amountGs)}</td>
        </tr>
      \`).join('');

      document.getElementById('doc-root').innerHTML = \`
        <!-- 1. Datos de la Empresa -->
        <div class="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-3 gap-4">
          <div class="flex items-center gap-3.5">
            <img src="\${company.logoUrl}" alt="\${company.name}" class="w-14 h-14 bg-slate-900 p-1 rounded-lg object-contain shrink-0" />
            <div>
              <h1 class="text-base font-bold text-slate-900">\${company.name}</h1>
              <p class="text-[11px] text-slate-600">\${company.slogan}</p>
              <p class="text-[10px] text-slate-500">\${company.address} · Tel: \${company.phone} · Email: \${company.email} · <strong>RUC: \${company.ruc}</strong></p>
            </div>
          </div>
        </div>

        <!-- 2. 4 Columnas: Datos del Cliente | Despacho | Datos Liquidación | Contenido -->
        <div class="grid grid-cols-4 gap-2 mb-3 text-[10.5px]">
          <div class="border border-slate-300 rounded p-2">
            <div class="font-bold uppercase text-slate-700 border-b border-slate-200 pb-1 mb-1">Datos del Cliente</div>
            <p><strong>Cliente:</strong> \${settlement.clientName}</p>
            <p><strong>RUC:</strong> <span class="tabular-nums">\${settlement.clientRuc}</span></p>
            <p><strong>Dirección:</strong> \${settlement.clientAddress || '—'}</p>
            <p><strong>Ref.:</strong> \${settlement.clientContact || '—'}</p>
          </div>
          <div class="border border-slate-300 rounded p-2">
            <div class="font-bold uppercase text-slate-700 border-b border-slate-200 pb-1 mb-1">Despacho</div>
            <p><strong>Nro Despacho:</strong> <span class="tabular-nums">\${settlement.dispatchNumber}</span></p>
            <p><strong>Exportador:</strong> \${settlement.senderName}</p>
            <p><strong>Procedencia:</strong> \${settlement.senderCountry}</p>
            <p><strong>Aduana:</strong> \${settlement.customsOffice}</p>
          </div>
          <div class="border border-slate-300 rounded p-2">
            <div class="font-bold uppercase text-slate-700 border-b border-slate-200 pb-1 mb-1">Datos Liquidación</div>
            <p><strong>Liquidación Nº:</strong> <span class="tabular-nums font-bold">\${settlement.sequentialNumber}</span></p>
            <p><strong>Fecha:</strong> <span class="tabular-nums">\${settlement.date}</span></p>
            <p><strong>Factura Nº:</strong> <span class="tabular-nums">\${settlement.invoiceNumber}</span></p>
            <p><strong>Cotiz. Dólar:</strong> <span class="tabular-nums">Gs. \${fmtGs(settlement.exchangeRate)}</span></p>
          </div>
          <div class="border border-slate-300 rounded p-2 bg-slate-50">
            <div class="font-bold uppercase text-slate-700 border-b border-slate-200 pb-1 mb-1">Contenido</div>
            <div class="flex justify-between"><span>Valor FOB:</span><span class="tabular-nums font-semibold">USD \${fmtUsd(fob)}</span></div>
            <div class="flex justify-between"><span>Seguro:</span><span class="tabular-nums font-semibold">USD \${fmtUsd(seg)}</span></div>
            <div class="flex justify-between"><span>Flete:</span><span class="tabular-nums font-semibold">USD \${fmtUsd(fle)}</span></div>
            <div class="flex justify-between"><span>Valor Ajust a incluir:</span><span class="tabular-nums font-semibold">USD \${fmtUsd(aju)}</span></div>
            <div class="flex justify-between border-t border-slate-300 pt-0.5 mt-0.5 font-bold text-slate-900"><span>CIF (Gs. \${fmtGs(cifGs)}):</span><span class="tabular-nums">USD \${fmtUsd(cifUsd)}</span></div>
          </div>
        </div>

        <!-- 3. Liquidación de Derechos y Gastos Sobre Mercadería a ser Transportada (6 columnas) -->
        <div class="border border-slate-300 rounded overflow-hidden mb-3">
          <div class="bg-slate-900 text-white px-3 py-1 text-[10.5px] font-bold uppercase">
            Liquidación de Derechos y Gastos Sobre Mercadería a ser Transportada
          </div>
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-100 border-b border-slate-300 text-[10px] font-bold text-slate-700">
                <th class="py-1 px-2 text-center w-16">Bultos</th>
                <th class="py-1 px-2 text-center w-24">Unidad Medida</th>
                <th class="py-1 px-2">Descripción</th>
                <th class="py-1 px-2 text-center w-28">Part Arancel</th>
                <th class="py-1 px-2 text-right w-32">Valor</th>
                <th class="py-1 px-2 text-right w-28">Porc. Arancelaria %</th>
              </tr>
            </thead>
            <tbody>\${renderMerchRows(settlement.merchandiseItems)}</tbody>
          </table>
        </div>

        <!-- 4. Tablas de 3 columnas -->
        <div class="space-y-2.5 mb-3">
          <div class="border border-slate-300 rounded overflow-hidden">
            <div class="bg-slate-800 text-white px-3 py-1 text-[10.5px] font-bold flex justify-between">
              <span>DETALLE DE TRIBUTOS ADUANEROS Y SERVICIOS — Liquidación De Despacho</span>
            </div>
            <table class="w-full text-left border-collapse">
              <thead><tr class="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600"><th class="py-1 px-3">Descripción</th><th class="py-1 px-3 w-52">Datos Adicionales</th><th class="py-1 px-3 text-right w-36">Valor</th></tr></thead>
              <tbody>\${render3ColRows(settlement.customsDuties)}</tbody>
              <tfoot><tr class="bg-slate-100 border-t border-slate-300 text-[11px] font-bold"><td colspan="2" class="py-1 px-3 text-right">Total:</td><td class="py-1 px-3 text-right tabular-nums">\${fmtGs(tDuties)}</td></tr></tfoot>
            </table>
          </div>

          <div class="border border-slate-300 rounded overflow-hidden">
            <div class="bg-slate-800 text-white px-3 py-1 text-[10.5px] font-bold">
              DETALLE DE TASAS Y OTROS COSTOS
            </div>
            <table class="w-full text-left border-collapse">
              <thead><tr class="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600"><th class="py-1 px-3">Descripción</th><th class="py-1 px-3 w-52">Datos Adicionales</th><th class="py-1 px-3 text-right w-36">Valor</th></tr></thead>
              <tbody>\${render3ColRows(settlement.ratesAndCosts)}</tbody>
              <tfoot><tr class="bg-slate-100 border-t border-slate-300 text-[11px] font-bold"><td colspan="2" class="py-1 px-3 text-right">Total:</td><td class="py-1 px-3 text-right tabular-nums">\${fmtGs(tRates)}</td></tr></tfoot>
            </table>
          </div>

          <div class="border border-slate-300 rounded overflow-hidden">
            <div class="bg-slate-800 text-white px-3 py-1 text-[10.5px] font-bold">
              DETALLE DE SERVICIOS INTERNOS
            </div>
            <table class="w-full text-left border-collapse">
              <thead><tr class="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600"><th class="py-1 px-3">Descripción</th><th class="py-1 px-3 w-52">Datos Adicionales</th><th class="py-1 px-3 text-right w-36">Valor</th></tr></thead>
              <tbody>\${render3ColRows(settlement.internalServices)}</tbody>
              <tfoot class="text-[11px] font-bold">
                <tr class="bg-slate-100 border-t border-slate-300"><td colspan="2" class="py-1 px-3 text-right">Total:</td><td class="py-1 px-3 text-right tabular-nums">\${fmtGs(tServices)}</td></tr>
                <tr class="bg-slate-900 text-white"><td colspan="2" class="py-1 px-3 text-right">Total General:</td><td class="py-1 px-3 text-right tabular-nums">\${fmtGs(grandTotal)}</td></tr>
                <tr class="bg-slate-50 border-t border-slate-200"><td colspan="2" class="py-1 px-3 text-right">Recibido:</td><td class="py-1 px-3 text-right tabular-nums">\${fmtGs(received)}</td></tr>
                <tr class="bg-slate-100 border-t border-slate-300"><td colspan="2" class="py-1 px-3 text-right">Saldo:</td><td class="py-1 px-3 text-right tabular-nums">\${fmtGs(balance)}</td></tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- 5. Monto en Letras y Observación -->
        <div class="border border-slate-300 rounded p-2.5 text-[10.5px] space-y-1.5 bg-slate-50">
          <div><strong>Monto en Letras:</strong> <span class="uppercase font-medium">\${words}</span></div>
          <div class="border-t border-slate-200 pt-1"><strong>Observación:</strong> <span class="whitespace-pre-line">\${settlement.notes}</span></div>
        </div>
      \`;
    }
    render();
  </script>
</body>
</html>`;
}
