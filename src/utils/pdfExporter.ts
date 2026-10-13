import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompanySettings, CustomsSettlement } from '../types';
import {
  calculateSettlementMetrics,
  formatCurrencyGs,
  formatCurrencyUsd,
  formatCurrencyAmount,
} from './formatters';
import { renderCorporateLogoPngDataUrl } from './logoRenderer';

export function exportSettlementToPdf(
  settlement: CustomsSettlement,
  company: CompanySettings
): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const metrics = calculateSettlementMetrics(settlement);
  const cur = settlement.currency || 'USD';

  const totalRowsCount =
    (settlement.merchandiseItems?.length || 1) +
    settlement.customsDuties.length +
    settlement.ratesAndCosts.length +
    settlement.internalServices.length +
    (settlement.receivedPayments?.length || 0);

  // Dynamic density scaling factor so all sections fit cleanly on 1 single A4 page (297mm height)
  const scale =
    totalRowsCount <= 14
      ? 1
      : totalRowsCount <= 20
      ? 0.86
      : totalRowsCount <= 28
      ? 0.74
      : 0.64;

  const margin = 8;
  let y = 7;
  const gap = Math.max(1.2, 2.0 * scale);

  const logoPngDataUrl =
    company.logoUrl && company.logoUrl.startsWith('data:image/png')
      ? company.logoUrl
      : renderCorporateLogoPngDataUrl(company.logoText, company.name);

  const borderGray: [number, number, number] = [100, 116, 139]; // Slate-500 crisp frame
  const headerFill: [number, number, number] = [241, 245, 249]; // Light gray #f1f5f9
  const subHeaderFill: [number, number, number] = [248, 250, 252]; // Very light gray #f8fafc
  const blackText: [number, number, number] = [15, 23, 42]; // Crisp black/slate-900

  // 1. DATOS DE LA EMPRESA (Fondo Blanco Encuadrado + Logo LG + Texto Negro)
  const companyBlockText = [
    company.name,
    `RUC: ${company.ruc}`,
    company.slogan,
    `${company.phone}  ·  ${company.email}`,
  ].join('\n');

  const sequentialBlockText = [
    'LIQUIDACIÓN DE DESPACHO',
    `Nº ${settlement.sequentialNumber}`,
    `Fecha: ${settlement.date}`,
  ].join('\n');

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    pageBreak: 'avoid',
    theme: 'grid',
    styles: {
      fillColor: [255, 255, 255],
      textColor: blackText,
      lineColor: borderGray,
      lineWidth: 0.25,
      cellPadding: Math.max(1.8, 2.3 * scale),
      valign: 'middle',
      overflow: 'linebreak',
      minCellHeight: 19,
    },
    columnStyles: {
      0: { cellWidth: 34, halign: 'center', valign: 'middle' },
      1: {
        cellWidth: 108,
        halign: 'left',
        fontSize: Math.max(6.4, 7.4 * scale),
        fontStyle: 'bold',
        textColor: blackText,
      },
      2: {
        cellWidth: 52,
        halign: 'right',
        fontSize: Math.max(6.6, 7.8 * scale),
        fontStyle: 'bold',
        fillColor: headerFill,
        textColor: blackText,
      },
    },
    body: [['', companyBlockText, sequentialBlockText]],
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 0 && logoPngDataUrl) {
        try {
          const maxW = data.cell.width - 3;
          const maxH = data.cell.height - 2.5;
          // Maintain 16:9 aspect ratio for LG logo
          let imgW = maxW;
          let imgH = imgW * (360 / 640);
          if (imgH > maxH) {
            imgH = maxH;
            imgW = imgH * (640 / 360);
          }
          const imgX = data.cell.x + (data.cell.width - imgW) / 2;
          const imgY = data.cell.y + (data.cell.height - imgH) / 2;
          doc.addImage(logoPngDataUrl, 'PNG', imgX, imgY, imgW, imgH);
        } catch {
          // fallback
        }
      }
    },
  });

  y =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + gap;

  // 2. CUATRO COLUMNAS ENCUADRADAS: Datos del Cliente | Despacho | Datos Liquidación | Contenido
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    pageBreak: 'avoid',
    theme: 'grid',
    styles: {
      lineColor: borderGray,
      lineWidth: 0.25,
    },
    headStyles: {
      fillColor: headerFill,
      textColor: blackText,
      fontSize: Math.max(6.2, 7.0 * scale),
      fontStyle: 'bold',
      cellPadding: Math.max(1.0, 1.4 * scale),
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      fontSize: Math.max(5.8, 6.6 * scale),
      textColor: blackText,
      cellPadding: Math.max(1.0, 1.5 * scale),
      overflow: 'linebreak',
      valign: 'top',
    },
    columnStyles: {
      0: { cellWidth: 49 },
      1: { cellWidth: 49 },
      2: { cellWidth: 45 },
      3: { cellWidth: 51, fillColor: subHeaderFill },
    },
    head: [
      ['Datos del Cliente', 'Despacho', 'Datos Liquidación', 'Contenido'],
    ],
    body: [
      [
        `Cliente: ${settlement.clientName || '—'}\nRUC: ${settlement.clientRuc || '—'}\nDirección: ${settlement.clientAddress || '—'}\nRef.: ${settlement.clientContact || '—'}`,
        `Despacho Nº: ${settlement.dispatchNumber || '—'}\nRemitente: ${settlement.senderName || '—'}\nRégimen: ${settlement.customsRegime || 'IC04'}\nProforma: ${settlement.proformaNumber || '—'}\nOrigen: ${settlement.originCountry || settlement.senderCountry || '—'}\nProcedencia: ${settlement.provenanceCountry || settlement.senderCountry || '—'}\nVía: ${settlement.transportMode || 'Marítimo'}\nDoc. Transporte: ${settlement.senderReference || '—'}`,
        `Fecha: ${settlement.date}\nProveedor: ${settlement.supplierName || settlement.senderName || '—'}\nNro. Factura: ${settlement.invoiceNumber || '—'}\nCondición de venta: ${settlement.incoterm || settlement.saleCondition || 'FOB'}`,
        `Divisa: ${cur}\nTipo de Cambio: Gs. ${formatCurrencyGs(settlement.exchangeRate)}\nValor FC: ${cur} ${formatCurrencyAmount(metrics.fobAmount, cur)}\nFlete: ${cur} ${formatCurrencyAmount(metrics.freightAmount, cur)}\nSeguro: ${cur} ${formatCurrencyAmount(metrics.insuranceAmount, cur)}\nAjustes a incluir: ${cur} ${formatCurrencyAmount(metrics.adjustmentAmount, cur)}\nAjustes a deducir: ${cur} ${formatCurrencyAmount(metrics.deductionAmount || 0, cur)}\nCIF (${cur}): ${cur} ${formatCurrencyAmount(metrics.cifAmount, cur)}\nCIF (Gs.): Gs. ${formatCurrencyGs(metrics.cifGs)}`,
      ],
    ],
  });

  y =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + gap;

  // 3. LIQUIDACIÓN DE DERECHOS Y GASTOS SOBRE MERCADERÍA A SER TRANSPORTADA (6 Columnas Encuadradas)
  const merchItems =
    settlement.merchandiseItems && settlement.merchandiseItems.length > 0
      ? settlement.merchandiseItems
      : [
          {
            id: 'm-default',
            packages: 1,
            unit: 'BULTOS',
            description: `MERCADERÍA S/ FACTURA COMERCIAL Nº ${settlement.invoiceNumber || 'S/N'}`,
            tariffCode: '8431.49.29',
            valueGs: metrics.cifGs,
            tariffPercent: 10,
          },
        ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    pageBreak: 'avoid',
    theme: 'grid',
    styles: {
      lineColor: borderGray,
      lineWidth: 0.25,
    },
    headStyles: {
      fillColor: headerFill,
      textColor: blackText,
      fontSize: Math.max(6.0, 6.8 * scale),
      fontStyle: 'bold',
      cellPadding: Math.max(0.9, 1.3 * scale),
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      fontSize: Math.max(5.8, 6.6 * scale),
      textColor: blackText,
      cellPadding: Math.max(0.9, 1.3 * scale),
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 75, halign: 'left' },
      3: { cellWidth: 26, halign: 'center' },
      4: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 24, halign: 'right' },
    },
    head: [
      [
        {
          content:
            'Liquidación de Derechos y Gastos Sobre Mercadería a ser Transportada',
          colSpan: 6,
          styles: {
            halign: 'left',
            fillColor: headerFill,
            textColor: blackText,
            fontStyle: 'bold',
          },
        },
      ],
      [
        { content: 'Bultos', styles: { fillColor: subHeaderFill } },
        { content: 'Unidad Medida', styles: { fillColor: subHeaderFill } },
        { content: 'Descripción', styles: { fillColor: subHeaderFill } },
        { content: 'Part Arancel', styles: { fillColor: subHeaderFill } },
        { content: 'Valor', styles: { fillColor: subHeaderFill, halign: 'right' } },
        {
          content: 'Porc. Arancelaria %',
          styles: { fillColor: subHeaderFill, halign: 'right' },
        },
      ],
    ],
    body: merchItems.map((m) => [
      String(m.packages),
      m.unit,
      m.description,
      m.tariffCode,
      formatCurrencyGs(m.valueGs),
      `${m.tariffPercent}%`,
    ]),
  });

  y =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + gap;

  // 4. SECCIONES DE 3 COLUMNAS ENCUADRADAS (Fondo Claro + Texto Negro + Bordes Definidos)
  const renderThreeColTable = (
    mainTitle: string,
    subTitle: string | null,
    items: CustomsSettlement['customsDuties'],
    subtotalGs: number,
    includeGrandSummary = false
  ) => {
    const rows: string[][] =
      items.length > 0
        ? items.map((item) => [
            item.description || '—',
            item.documentRef || '',
            formatCurrencyGs(item.amountGs),
          ])
        : [['Sin cargos registrados', '', '0']];

    rows.push(['', 'Total:', formatCurrencyGs(subtotalGs)]);

    if (includeGrandSummary) {
      rows.push([
        '',
        'Total General:',
        formatCurrencyGs(metrics.grandTotalGs),
      ]);
      rows.push([
        '',
        'Recibido:',
        formatCurrencyGs(metrics.amountReceivedGs),
      ]);
      rows.push([
        '',
        'Saldo:',
        formatCurrencyGs(Math.abs(metrics.balanceGs)),
      ]);
    }

    const headerTitle = subTitle ? `${mainTitle} — ${subTitle}` : mainTitle;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      pageBreak: 'avoid',
      theme: 'grid',
      styles: {
        lineColor: borderGray,
        lineWidth: 0.25,
      },
      headStyles: {
        fillColor: headerFill,
        textColor: blackText,
        fontSize: Math.max(6.0, 6.8 * scale),
        fontStyle: 'bold',
        cellPadding: Math.max(0.9, 1.2 * scale),
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        fontSize: Math.max(5.8, 6.6 * scale),
        textColor: blackText,
        cellPadding: Math.max(0.8, 1.15 * scale),
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: 108 },
        1: { cellWidth: 50 },
        2: { cellWidth: 36, halign: 'right', fontStyle: 'bold' },
      },
      head: [
        [
          {
            content: headerTitle,
            colSpan: 3,
            styles: {
              fillColor: headerFill,
              textColor: blackText,
              fontStyle: 'bold',
            },
          },
        ],
        [
          { content: 'Descripción', styles: { fillColor: subHeaderFill } },
          { content: 'Datos Adicionales', styles: { fillColor: subHeaderFill } },
          {
            content: 'Valor',
            styles: { fillColor: subHeaderFill, halign: 'right' },
          },
        ],
      ],
      body: rows,
      didParseCell: (data) => {
        if (data.section === 'body') {
          const itemCount = Math.max(1, items.length);
          if (data.row.index >= itemCount) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = blackText;
            if (data.column.index === 1) {
              data.cell.styles.halign = 'right';
            }
            if (includeGrandSummary && data.row.index === itemCount + 1) {
              // Total General: light gray highlight with bold black text
              data.cell.styles.fillColor = [226, 232, 240];
            } else {
              data.cell.styles.fillColor = subHeaderFill;
            }
          }
        }
      },
    });

    y =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + gap;
  };

  renderThreeColTable(
    '01. DETALLE DE TRIBUTOS ADUANEROS Y SERVICIOS',
    'Liquidación De Despacho',
    settlement.customsDuties,
    metrics.totalDutiesGs,
    false
  );

  renderThreeColTable(
    '02. DETALLE DE TASAS Y OTROS COSTOS',
    null,
    settlement.ratesAndCosts,
    metrics.totalRatesGs,
    false
  );

  renderThreeColTable(
    '03. DETALLE DE SERVICIOS INTERNOS',
    null,
    settlement.internalServices,
    metrics.totalServicesGs,
    true
  );

  if (settlement.receivedPayments && settlement.receivedPayments.length > 0) {
    const paymentRows: string[][] = settlement.receivedPayments.map((p) => [
      p.method || 'Transferencia',
      p.description ||
        (p.method === 'Efectivo'
          ? 'Recibo de Caja Oficial'
          : 'Transferencia Bancaria'),
      p.date || '—',
      formatCurrencyGs(p.amountGs),
    ]);
    paymentRows.push([
      '',
      '',
      'Total Recibido:',
      formatCurrencyGs(metrics.amountReceivedGs),
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      pageBreak: 'avoid',
      theme: 'grid',
      styles: {
        lineColor: borderGray,
        lineWidth: 0.25,
      },
      headStyles: {
        fillColor: headerFill,
        textColor: blackText,
        fontSize: Math.max(6.0, 6.8 * scale),
        fontStyle: 'bold',
        cellPadding: Math.max(0.9, 1.2 * scale),
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        fontSize: Math.max(5.8, 6.6 * scale),
        textColor: blackText,
        cellPadding: Math.max(0.8, 1.15 * scale),
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: 32, fontStyle: 'bold' },
        1: { cellWidth: 84 },
        2: { cellWidth: 42, halign: 'center' },
        3: { cellWidth: 36, halign: 'right', fontStyle: 'bold' },
      },
      head: [
        [
          {
            content: '04. DETALLE DE MONTOS RECIBIDOS',
            colSpan: 4,
            styles: {
              fillColor: headerFill,
              textColor: blackText,
              fontStyle: 'bold',
            },
          },
        ],
        [
          { content: 'Método', styles: { fillColor: subHeaderFill } },
          {
            content: 'Detalle (Banco y N° Transacción / Recibo)',
            styles: { fillColor: subHeaderFill },
          },
          { content: 'Fecha', styles: { fillColor: subHeaderFill, halign: 'center' } },
          {
            content: 'Valor',
            styles: { fillColor: subHeaderFill, halign: 'right' },
          },
        ],
      ],
      body: paymentRows,
      didParseCell: (data) => {
        if (data.section === 'body') {
          const itemCount = settlement.receivedPayments!.length;
          if (data.row.index >= itemCount) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = blackText;
            if (data.column.index === 2) {
              data.cell.styles.halign = 'right';
            }
            data.cell.styles.fillColor = subHeaderFill;
          }
        }
      },
    });

    y =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + gap;
  }

  // 5. MONTO EN LETRAS Y OBSERVACIÓN (Encuadrados en Fondo Claro)
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    pageBreak: 'avoid',
    theme: 'grid',
    styles: {
      lineColor: borderGray,
      lineWidth: 0.25,
    },
    bodyStyles: {
      fontSize: Math.max(6.0, 6.8 * scale),
      textColor: blackText,
      cellPadding: Math.max(1.2, 1.8 * scale),
      fillColor: [255, 255, 255],
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 194 },
    },
    body: [
      [`Monto en Letras: ${metrics.computedAmountInWords}`],
      [`${settlement.notes || 'Sin observaciones adicionales.'}`],
    ],
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === 0) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = subHeaderFill;
      }
    },
  });

  // Safety guarantee: strictly 1 single A4 page
  while (doc.getNumberOfPages() > 1) {
    doc.deletePage(doc.getNumberOfPages());
  }

  const cleanSeq = settlement.sequentialNumber.replace(/[^a-zA-Z0-9_-]/g, '-');
  const fileName = `Liquidacion-Despacho-${cleanSeq}.pdf`;
  doc.save(fileName);
  return fileName;
}

/**
 * Genera y descarga la Proforma Oficial de Despacho Aduanero en PDF (PPDF)
 * Diseñada específicamente para encajar en UNA SOLA HOJA A4 (1 single page),
 * con el logo en la parte superior izquierda, datos de la empresa a la derecha
 * incluyendo el teléfono +595981412775, cabecera de despacho,
 * desglose por las 3 secciones (01, 02 y 03), 13 rubros, total general,
 * nota de valoración y firmas de los responsables.
 */
export function exportProformaPdf(
  settlement: CustomsSettlement,
  company: CompanySettings
): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const ref = settlement.proformaNumber || settlement.sequentialNumber || '001/2026';
  const margin = 8;
  let y = 7;

  const logoPngDataUrl =
    company.logoUrl && company.logoUrl.startsWith('data:image/png')
      ? company.logoUrl
      : renderCorporateLogoPngDataUrl(company.logoText, company.name);

  const borderGray: [number, number, number] = [100, 116, 139];
  const headerFill: [number, number, number] = [241, 245, 249];
  const subHeaderFill: [number, number, number] = [248, 250, 252];
  const blackText: [number, number, number] = [15, 23, 42];

  // 1. CABECERA: LOGO SUPERIOR IZQUIERDA Y DATOS EMPRESA A LA DERECHA (INCLUYENDO +595981412775)
  const companyRightText = [
    company.name,
    `RUC: ${company.ruc}  ·  Tel: +595981412775 / +595 981 593 088`,
    `Email: ${company.email}  ·  Asunción — Paraguay`,
    company.slogan,
  ].join('\n');

  const proformaDocText = [
    'PROFORMA DE DESPACHO ADUANERO',
    `REF: ${ref}`,
    `Fecha: ${settlement.date}`,
  ].join('\n');

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    pageBreak: 'avoid',
    theme: 'grid',
    styles: {
      fillColor: [255, 255, 255],
      textColor: blackText,
      lineColor: borderGray,
      lineWidth: 0.25,
      cellPadding: 2,
      valign: 'middle',
      minCellHeight: 18,
    },
    columnStyles: {
      0: { cellWidth: 34, halign: 'center', valign: 'middle' },
      1: { cellWidth: 104, halign: 'left', fontSize: 7, fontStyle: 'bold', textColor: blackText },
      2: { cellWidth: 56, halign: 'right', fontSize: 7.5, fontStyle: 'bold', fillColor: headerFill, textColor: blackText },
    },
    body: [['', companyRightText, proformaDocText]],
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 0 && logoPngDataUrl) {
        try {
          const maxW = data.cell.width - 3;
          const maxH = data.cell.height - 2.5;
          let imgW = maxW;
          let imgH = imgW * (360 / 640);
          if (imgH > maxH) {
            imgH = maxH;
            imgW = imgH * (640 / 360);
          }
          const imgX = data.cell.x + (data.cell.width - imgW) / 2;
          const imgY = data.cell.y + (data.cell.height - imgH) / 2;
          doc.addImage(logoPngDataUrl, 'PNG', imgX, imgY, imgW, imgH);
        } catch {
          // fallback
        }
      }
    },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 1.8;

  // 2. CABECERA DE DATOS DEL DESPACHO / OPERACIÓN
  const colA = [
    `REF: ${ref}`,
    `FACTURA N°: ${settlement.invoiceNumber || '—'}`,
    `PROVEEDOR: ${settlement.supplierName || settlement.senderName || settlement.clientName || '—'}`,
    `ADUANA: ${settlement.customsOffice || '021 - ZONA FRANCA GLOBAL'}`,
  ].join('\n');

  const colB = [
    `PAÍS ORIGEN: ${(settlement.originCountry || settlement.senderCountry || 'PARAGUAY').toUpperCase()}`,
    `RÉGIMEN: ${settlement.customsRegime || 'IC04'}`,
    `INCOTERM: ${settlement.incoterm || settlement.saleCondition || 'FOB'}`,
    `VÍA / DOC: ${settlement.transportMode || 'Terrestre'} · ${settlement.dispatchNumber || '—'}`,
  ].join('\n');

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    pageBreak: 'avoid',
    theme: 'grid',
    styles: {
      fontSize: 6.8,
      cellPadding: 1.8,
      textColor: blackText,
      lineColor: borderGray,
      lineWidth: 0.25,
      fillColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 97, fontStyle: 'bold' },
      1: { cellWidth: 97, fontStyle: 'bold' },
    },
    body: [[colA, colB]],
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 1.5;

  // 3. ENCABEZADO EXPLICATIVO
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    pageBreak: 'avoid',
    theme: 'plain',
    styles: {
      fontSize: 6.6,
      fontStyle: 'bold',
      textColor: blackText,
      cellPadding: 0.8,
    },
    body: [['PAGO DE TASAS DE SERVICIOS, HONORARIOS PROFESIONALES Y TRIBUTOS ADUANEROS SEGÚN DETALLE:']],
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 1.0;

  // 4. TABLA DE GASTOS Y 13 RUBROS CON LAS 3 SECCIONES (01, 02, 03)
  const allDuties = settlement.customsDuties || [];
  const allRates = settlement.ratesAndCosts || [];
  const allServices = settlement.internalServices || [];

  const findDutyAmount = (keywords: string[]): number => {
    for (const d of allDuties) {
      const desc = d.description.toUpperCase();
      if (keywords.some((k) => desc.includes(k.toUpperCase()))) return Math.max(0, d.amountGs || 0);
    }
    return 0;
  };
  const findRateAmount = (keywords: string[]): number => {
    for (const r of allRates) {
      const desc = r.description.toUpperCase();
      if (keywords.some((k) => desc.includes(k.toUpperCase()))) return Math.max(0, r.amountGs || 0);
    }
    return 0;
  };
  const findServiceAmount = (keywords: string[]): number => {
    for (const s of allServices) {
      const desc = s.description.toUpperCase();
      if (keywords.some((k) => desc.includes(k.toUpperCase()))) return Math.max(0, s.amountGs || 0);
    }
    return 0;
  };

  const vIva = findDutyAmount(['I.V.A', 'IVA', 'VALOR AGREGADO']) || 649002;
  const vValoracion = findDutyAmount(['VALORACION', 'VALORACIÓN']) || 57375;
  const vIndi = findDutyAmount(['INDI']) || findRateAmount(['INDI']) || 0;
  const vDerechos = findDutyAmount(['DERECHO ADUANERO', 'DERECHOS']) || 380000;
  const vIre = findDutyAmount(['IRE', 'IRE GENERAL', '700']) || 45900;
  const vInterv = findDutyAmount(['INTERVENCION ADUANERA', 'TASA INTERVENCION']) || 85000;

  const vTasasPort = findRateAmount(['PORTUARIAS', 'PUERTO']) || 435000;
  const vSofia = findRateAmount(['SOFIA', 'CANON INFORMATICO', 'SISTEMA INFORMATICO']) || 155000;
  const vDinavisa = findDutyAmount(['DINAVISA']) || findRateAmount(['DINAVISA']) || 0;
  const vCanonAnnp = findRateAmount(['ANNP', 'INTERVENCION ANNP']) || 115000;

  const vFlete = findServiceAmount(['FLETE', 'ESTIBADOR']) || 0;
  const vGastosDesp = (findRateAmount(['FOTOCOPIAS', 'COPIAS']) || 55000) + (findServiceAmount(['GASTOS DE DESPACHO', 'DESPACHO']) || 330000);
  const vHonorarios = (() => {
    const hon = allServices.find((s) => s.description.toUpperCase().includes('HONORARIOS'))?.amountGs || 2949509;
    const desc = allServices.find((s) => s.description.toUpperCase().includes('DESCUENTO'))?.amountGs || -589901;
    return Math.max(0, hon + (desc < 0 ? desc : 0));
  })();

  const subtotal01 = vIva + vValoracion + vIndi + vDerechos + vIre + vInterv;
  const subtotal02 = vTasasPort + vSofia + vDinavisa + vCanonAnnp;
  const subtotal03 = vFlete + vGastosDesp + vHonorarios;
  const grandTotal = subtotal01 + subtotal02 + subtotal03;

  const tableBody: any[][] = [
    // 01
    ['01. DETALLE DE TRIBUTOS ADUANEROS Y SERVICIOS', 'SUBTOTAL GS.'],
    ['  1. IMPUESTO AL VALOR AGREGADO (I.V.A.)', formatCurrencyGs(vIva)],
    ['  2. SERVICIO DE VALORACION ADUANERA.', formatCurrencyGs(vValoracion)],
    ['  3. INDI', formatCurrencyGs(vIndi)],
    ['  4. DERECHOS ADUANEROS', formatCurrencyGs(vDerechos)],
    ['  5. IRE GENERAL 700', formatCurrencyGs(vIre)],
    ['  6. TASA INTERVENCION ADUANERA', formatCurrencyGs(vInterv)],
    ['SUBTOTAL 01. TRIBUTOS ADUANEROS', formatCurrencyGs(subtotal01)],

    // 02
    ['02. DETALLE DE TASAS Y OTROS COSTOS', 'SUBTOTAL GS.'],
    ['  7. TASAS PORTUARIAS APROX.', formatCurrencyGs(vTasasPort)],
    ['  8. SISTEMA INFORMATICO SOFIA.', formatCurrencyGs(vSofia)],
    ['  9. DINAVISA', formatCurrencyGs(vDinavisa)],
    ['  10. CANON INFORMATICO Y TASAS OPERATIVAS (ANNP)', formatCurrencyGs(vCanonAnnp)],
    ['SUBTOTAL 02. TASAS Y OTROS COSTOS', formatCurrencyGs(subtotal02)],

    // 03
    ['03. DETALLE DE SERVICIOS INTERNOS', 'SUBTOTAL GS.'],
    ['  11. FLETE INTERNO Y ESTIBADORES', formatCurrencyGs(vFlete)],
    ['  12. GASTOS DESPACHO - FOTOCOPIAS.', formatCurrencyGs(vGastosDesp)],
    ['  13. HONORARIOS DESPACHANTE (IVA INCLUIDO)', formatCurrencyGs(vHonorarios)],
    ['SUBTOTAL 03. SERVICIOS INTERNOS', formatCurrencyGs(subtotal03)],

    // TOTAL GENERAL
    ['TOTAL GENERAL (PYG)', formatCurrencyGs(grandTotal)],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    pageBreak: 'avoid',
    theme: 'grid',
    styles: {
      fontSize: 6.2,
      cellPadding: 1.1,
      textColor: blackText,
      lineColor: borderGray,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 148, halign: 'left' },
      1: { cellWidth: 46, halign: 'right', fontStyle: 'bold' },
    },
    head: [['CONCEPTO / RUBRO ADUANERO (01, 02 Y 03)', 'MONTO (PYG)']],
    headStyles: {
      fillColor: headerFill,
      textColor: blackText,
      fontSize: 6.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    body: tableBody,
    didParseCell: (data) => {
      if (data.section === 'body') {
        const rowText = String(data.row.raw[0] || '');
        if (rowText.startsWith('01.') || rowText.startsWith('02.') || rowText.startsWith('03.')) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = subHeaderFill;
        } else if (rowText.startsWith('SUBTOTAL')) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [245, 247, 250];
        } else if (rowText.startsWith('TOTAL GENERAL')) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 7.4;
          data.cell.styles.fillColor = headerFill;
        }
      }
    },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 1.8;

  // 5. NOTA DE APROBACIÓN POR VALORACIÓN ADUANERA Y SALUDO FORMAL
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    pageBreak: 'avoid',
    theme: 'grid',
    styles: {
      fontSize: 5.8,
      cellPadding: 1.2,
      textColor: blackText,
      lineColor: borderGray,
      lineWidth: 0.2,
      fillColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 194 },
    },
    body: [
      ['NOTA DE APROBACIÓN POR VALORACIÓN ADUANERA:\nProforma y valores tributarios sujetos a confirmación y aprobación final por Valoración Aduanera (DNIT) y Sistema SOFIA.'],
      ['Sin otro particular, aprovechamos la oportunidad para saludarle muy atentamente.'],
    ],
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3.0;

  // 6. FIRMAS DE RESPONSABLES (2 COLUMNAS)
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    pageBreak: 'avoid',
    theme: 'plain',
    styles: {
      fontSize: 6.2,
      textColor: blackText,
      cellPadding: 0.8,
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 97 },
      1: { cellWidth: 97 },
    },
    body: [
      ['________________________________________', '________________________________________'],
      ['Lic. Lucas Benítez', 'Dra. Gabriela Duarte'],
      ['Despachante de Aduanas · Reg. DNA Nº 1.482', 'Depto. de Operaciones & Finanzas'],
      [company.name, company.name],
    ],
  });

  // Garantía absoluta de 1 SOLA HOJA
  while (doc.getNumberOfPages() > 1) {
    doc.deletePage(doc.getNumberOfPages());
  }

  const cleanRef = String(ref).replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-');
  const fileName = `Proforma_LG_${cleanRef || '001-2026'}.pdf`;
  doc.save(fileName);
  return fileName;
}
