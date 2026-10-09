import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompanySettings, CustomsSettlement } from '../types';
import {
  calculateSettlementMetrics,
  formatCurrencyGs,
  formatCurrencyUsd,
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

  const totalRowsCount =
    (settlement.merchandiseItems?.length || 1) +
    settlement.customsDuties.length +
    settlement.ratesAndCosts.length +
    settlement.internalServices.length;

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
        `Despacho Nº: ${settlement.dispatchNumber || '—'}\nRemitente: ${settlement.senderName || '—'}\nProcedencia: ${settlement.senderCountry || '—'} (${settlement.transportMode})\nAduana: ${settlement.customsOffice || '—'}`,
        `Liquidación Nº: ${settlement.sequentialNumber}\nFecha: ${settlement.date}\nNro. Factura: ${settlement.invoiceNumber || '—'}\nNro. Proforma: ${settlement.proformaNumber || '—'}\nCotiz. Dólar: Gs. ${formatCurrencyGs(settlement.exchangeRate)}`,
        `Valor FOB:   USD ${formatCurrencyUsd(metrics.fobUsd)}\nSeguro:       USD ${formatCurrencyUsd(metrics.insuranceUsd)}\nFlete:          USD ${formatCurrencyUsd(metrics.freightUsd)}\nValor Ajust a incluir: USD ${formatCurrencyUsd(metrics.adjustmentUsd)}\n-------------------------------------------\nCIF (USD):   USD ${formatCurrencyUsd(metrics.cifUsd)}\nCIF (Gs.):    Gs. ${formatCurrencyGs(metrics.cifGs)}`,
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
    'DETALLE DE TRIBUTOS ADUANEROS Y SERVICIOS',
    'Liquidación De Despacho',
    settlement.customsDuties,
    metrics.totalDutiesGs,
    false
  );

  renderThreeColTable(
    'DETALLE DE TASAS Y OTROS COSTOS',
    null,
    settlement.ratesAndCosts,
    metrics.totalRatesGs,
    false
  );

  renderThreeColTable(
    'DETALLE DE SERVICIOS INTERNOS',
    null,
    settlement.internalServices,
    metrics.totalServicesGs,
    true
  );

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
