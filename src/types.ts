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
  senderCountry: string;
  senderReference: string;
  transportMode: 'Marítimo' | 'Aéreo' | 'Terrestre' | 'Multimodal';
  customsOffice: string;

  // Columna 3: Datos Liquidación
  invoiceNumber: string; // Nro Factura
  dispatchNumber: string; // Despacho
  proformaNumber: string; // Nro Proforma
  exchangeRate: number; // Cotización Dólar

  // Columna 4: Contenido (Valores en USD)
  fobUsd: number; // Valor FOB
  insuranceUsd: number; // Seguro
  freightUsd: number; // Flete
  adjustmentUsd?: number; // Valor Ajust a incluir

  // Sección Mercadería: Liquidación de Derechos y Gastos Sobre Mercadería a ser Transportada (6 columnas)
  merchandiseItems: MerchandiseItem[];

  // Tablas de 3 columnas (Descripción | Datos Adicionales | Valor)
  customsDuties: LineItem[]; // DETALLE DE TRIBUTOS ADUANEROS Y SERVICIOS — Liquidación De Despacho
  ratesAndCosts: LineItem[]; // DETALLE DE TASAS Y OTROS COSTOS
  internalServices: LineItem[]; // DETALLE DE SERVICIOS INTERNOS

  // Liquidación Financiera
  amountReceived: number; // Recibido
  amountInWords?: string; // Monto en Letras (se autocalcula si está vacío, o editable)
  notes: string; // Observación (ej. Observación a Favor de PETRA 626.882.- ...)
  createdAt: string;
}
