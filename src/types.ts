export interface CompanySettings {
  name: string;
  slogan: string;
  ruc: string;
  phone: string;
  email: string;
  address: string;
  logoText: string;
  logoUrl?: string;
  bankDetails: string;
  signer1Name?: string;
  signer1Role?: string;
  signer2Name?: string;
  signer2Role?: string;
}

export interface MerchandiseItem {
  id: string;
  packages: number; // Bultos (cantidad numérica)
  unit: string; // Unidad Medida (UN, KG, BULTOS, CAJAS)
  description: string; // Descripción
  tariffCode: string; // Part Arancel (NCM)
  valueGs: number; // Valor
  tariffPercent: number; // Porc. Arancelaria %
}

export interface LineItem {
  id: string;
  code: string;
  description: string; // Descripción (ej. DERECHO ADUANERO, TASAS PORTUARIAS, HONORARIOS PROFESIONALES)
  documentRef: string; // Datos Adicionales (ej. S/ DESPACHO, 001-002-0003447)
  amountGs: number; // Valor (permite positivos o negativos como DESCUENTO HONORARIOS -589.901)
  taxable: boolean;
}

export interface ReceivedPaymentItem {
  id: string;
  method?: 'Transferencia' | 'Efectivo'; // Método de Pago: Transferencia bancaria o Efectivo en caja
  description: string; // Detalle: Si es Transferencia -> Banco y N° de transacción; Si es Efectivo -> N° de Recibo de Caja
  date: string; // Fecha (despliega calendario YYYY-MM-DD)
  amountGs: number; // Valor (Gs.)
}

export interface CustomsSettlement {
  id: string;
  sequentialNumber: string; // ej. "001/2026"
  date: string;
  status: 'Emitida' | 'Borrador' | 'Pagada' | 'Enviada';

  // Columna 1: Datos del Cliente
  clientName: string;
  clientRuc: string;
  clientAddress: string;
  clientContact: string;

  // Columna 2: Despacho & Remitente
  senderName: string;
  senderCountry: string; // compatibilidad
  originCountry?: string; // País de Origen (donde se fabricó/produjo)
  provenanceCountry?: string; // País de Procedencia (desde donde se embarcó)
  senderReference: string;
  transportMode: 'Marítimo' | 'Aéreo' | 'Terrestre' | 'Multimodal';
  customsOffice: string; // Administración Aduanera / Predio (ej. "021 - Zona Franca Global")
  customsCode?: string; // Cód. SOFIA (ej. "021")
  customsRegime?: string; // Cód. Régimen (ej. "IC04")
  incoterm?: string; // Término de Comercio Internacional (ej. "FOB")

  // Columna 3: Datos Liquidación
  invoiceNumber: string; // Nro Factura
  supplierName?: string; // Proveedor / Exportador
  dispatchNumber: string; // Despacho
  proformaNumber: string; // Nro Proforma
  exchangeRate: number; // Cotización

  // Columna 4: Contenido y Base Imponible
  currency?: string; // Moneda (USD, EUR, BRL, PYG, etc.)
  saleCondition?: string; // Condición de venta (FOB, CIF, CFR, FCA, EXW, etc.)
  fobUsd: number; // Valor FC (Factura Comercial) / FOB
  fcUsd?: number; // Valor FC (Factura Comercial)
  insuranceUsd: number; // Seguro
  freightUsd: number; // Flete
  adjustmentUsd?: number; // Valor Ajust a incluir
  deductionUsd?: number; // Ajuste a deducir

  // Sección Mercadería: Liquidación de Derechos y Gastos Sobre Mercadería a ser Transportada (6 columnas)
  merchandiseItems: MerchandiseItem[];

  // Tablas de 3 columnas (Descripción | Datos Adicionales | Valor)
  customsDuties: LineItem[]; // DETALLE DE TRIBUTOS ADUANEROS Y SERVICIOS — Liquidación De Despacho
  ratesAndCosts: LineItem[]; // DETALLE DE TASAS Y OTROS COSTOS
  internalServices: LineItem[]; // DETALLE DE SERVICIOS INTERNOS

  // 04. DETALLE DE MONTOS RECIBIDOS (Descripción | Fecha | Valor Gs.)
  receivedPayments?: ReceivedPaymentItem[];

  // Liquidación Financiera
  amountReceived: number; // Recibido (suma de montos recibidos)
  amountInWords?: string; // Monto en Letras (se autocalcula si está vacío, o editable)
  notes: string; // Observación (ej. Observación a Favor de PETRA 626.882.- ...)
  signer1Name?: string;
  signer1Role?: string;
  signer2Name?: string;
  signer2Role?: string;
  createdAt: string;
}
