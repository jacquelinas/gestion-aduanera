export interface CustomsOffice {
  code: string; // CÓD. SOFIA
  name: string; // ADMINISTRACIÓN ADUANERA
  type: string; // TIPO DE PREDIO
  department: string; // DEPARTAMENTO
}

export interface CustomsRegime {
  num: number; // N°
  code: string; // CÓD.
  description: string; // DESCRIPCIÓN
}

export interface Incoterm {
  code: string; // CÓD.
  name: string; // NOMBRE
  description: string; // DESCRIPCIÓN
}

export interface TradingCountry {
  code: string;
  name: string;
  region: string;
}

// 37 Administraciones y Predios Aduaneros de Paraguay (SOFIA)
export const CUSTOMS_OFFICES: CustomsOffice[] = [
  { code: '002', name: 'Aeropuerto Internacional Silvio Pettirossi', type: 'DINAC (Público Aeroportuario)', department: 'Central' },
  { code: '003', name: 'José Falcón', type: 'ANNP (Público Terrestre/Fluvial)', department: 'Presidente Hayes' },
  { code: '004', name: 'Villeta', type: 'ANNP (Público Fluvial)', department: 'Central' },
  { code: '005', name: 'Ciudad del Este', type: 'ANNP (Público Terrestre/Fluvial)', department: 'Alto Paraná' },
  { code: '006', name: 'Concepción', type: 'ANNP (Público Fluvial)', department: 'Concepción' },
  { code: '007', name: 'Encarnación', type: 'ANNP (Público Fluvial/Terrestre)', department: 'Itapúa' },
  { code: '008', name: 'Pilar', type: 'ANNP (Público Fluvial)', department: 'Ñeembucú' },
  { code: '009', name: 'Saltos del Guairá', type: 'ANNP (Público Terrestre)', department: 'Canindeyú' },
  { code: '010', name: 'Pedro Juan Caballero', type: 'ANNP (Público Terrestre)', department: 'Amambay' },
  { code: '012', name: 'Itá Enramada', type: 'ANNP (Público Fluvial)', department: 'Central' },
  { code: '013', name: 'Aeropuerto Internacional Guaraní', type: 'DINAC (Público Aeroportuario)', department: 'Alto Paraná' },
  { code: '015', name: 'PAKSA', type: 'PRIVADO (Depósito / Terminal)', department: 'Central' },
  { code: '016', name: 'Mariscal Estigarribia / Pozo Hondo', type: 'ANNP (Público Terrestre)', department: 'Boquerón' },
  { code: '017', name: 'Caacupemí - Pilar', type: 'PRIVADO (Puerto Fluvial)', department: 'Ñeembucú' },
  { code: '017', name: 'Caacupemí (San Francisco S.A.)', type: 'PRIVADO (Puerto Fluvial)', department: 'Central' },
  { code: '018', name: 'Terminal de Cargas Km 12 (ALGESA)', type: 'PRIVADO (Depósito / Terminal)', department: 'Alto Paraná' },
  { code: '019', name: 'TERPORT (Terminales Portuarias S.A.)', type: 'PRIVADO (Puerto Fluvial)', department: 'Central' },
  { code: '020', name: 'Santa Helena', type: 'ANNP (Paso Fronterizo)', department: 'Alto Paraná' },
  { code: '021', name: 'Zona Franca Global', type: 'PRIVADO (Zona Franca)', department: 'Alto Paraná' },
  { code: '022', name: 'Zona Franca Trans Trade', type: 'PRIVADO (Zona Franca)', department: 'Alto Paraná' },
  { code: '023', name: 'Puerto Campestre S.A.', type: 'PRIVADO (Puerto Fluvial)', department: 'Alto Paraná' },
  { code: '024', name: 'Puertos y Estibajes (Fénix)', type: 'PRIVADO (Puerto Fluvial)', department: 'Central' },
  { code: '025', name: 'Chaco\'í', type: 'PRIVADO (Puerto / Terminal)', department: 'Presidente Hayes' },
  { code: '026', name: 'GICAL', type: 'PRIVADO (Depósito / Terminal)', department: 'Central' },
  { code: '027', name: 'CEREGRAL S.A.E.C.A.', type: 'PRIVADO (Depósito / Terminal)', department: 'Central' },
  { code: '029', name: 'CODESA', type: 'PRIVADO (Depósito / Terminal)', department: 'Central' },
  { code: '030', name: 'Solución Logística S.A.', type: 'PRIVADO (Puerto / Depósito)', department: 'Central' },
  { code: '031', name: 'EMPEDRIL S.A. (Puerto San José)', type: 'PRIVADO (Puerto Fluvial)', department: 'Central' },
  { code: '032', name: 'Puerto Seguro Fluvial', type: 'PRIVADO (Puerto Fluvial)', department: 'Central' },
  { code: '033', name: 'CBS Logistic Group', type: 'PRIVADO (Depósito / Terminal)', department: 'Central' },
  { code: '034', name: 'ALGESA San Juan Itapúa', type: 'PRIVADO (Depósito / Terminal)', department: 'Itapúa' },
  { code: '035', name: 'Aduana Nanawa', type: 'ANNP (Paso Fronterizo)', department: 'Presidente Hayes' },
  { code: '035', name: 'Carmelo Peralta', type: 'ANNP (Sub-Administración)', department: 'Alto Paraguay' },
  { code: '036', name: 'Puerto Seco Boreal', type: 'PRIVADO (Puerto / Depósito)', department: 'Presidente Hayes' },
  { code: '036', name: 'Zona Franca ZOFRAMAQ', type: 'PRIVADO (Zona Franca)', department: 'Alto Paraná' },
  { code: '037', name: 'Mayor Infante Rivarola', type: 'ANNP (Paso Fronterizo)', department: 'Boquerón' },
  { code: '038', name: 'TERPORT - Villeta', type: 'PRIVADO (Puerto Fluvial)', department: 'Central' },
];

// 79 Regímenes Aduaneros DNIT (Paraguay)
export const CUSTOMS_REGIMES: CustomsRegime[] = [
  { num: 1, code: 'DSEM', description: 'DESPACHO SIMPLIFICADO DE EXPORTACIONES MENORES' },
  { num: 2, code: 'EC01', description: 'EXPORTACIÓN A CONSUMO' },
  { num: 3, code: 'EC04', description: 'EXPORTACIÓN A CONSUMO DE EXP. C/ RESERVA DE RETORNO' },
  { num: 4, code: 'IC02', description: 'RE-IMPORT DE EXPORTACIÓN TEMPORAL. PERFECCIONA PASIVO' },
  { num: 5, code: 'IC03', description: 'REGULARIZACIÓN LEY 608/95' },
  { num: 6, code: 'IC04', description: 'IMPORTACIÓN A CONSUMO CON DOCUMENTO DE TRANSPORTE' },
  { num: 7, code: 'IC05', description: 'IMPORTACIÓN DIRECTO A CONSUMO C/ DOC. DE TRANSPORTE' },
  { num: 8, code: 'IC13', description: 'RE IMPORTACION DE EXPORTACION DEFINITIVA RECHAZADA' },
  { num: 9, code: 'IC06', description: 'IMPORTACION DEPOSITO ADUANERO' },
  { num: 10, code: 'IC07', description: 'IMPORTACIÓN A CONSUMO DE IMP.TEMPORAL S/ TRANSFORMACIÓN' },
  { num: 11, code: 'IC08', description: 'IMPORTACIÓN A CONSUMO DE IMP. TEMPORAL C/ TRANSFORMACIÓN' },
  { num: 12, code: 'AB01', description: 'APROVISIONAMIENTO A BORDO' },
  { num: 13, code: 'DAAB', description: 'DEPÓSITO DE APROVISIONAMIENTO ABORDO' },
  { num: 14, code: 'ECMA', description: 'REEXPORTACION MONTADA' },
  { num: 15, code: 'IC01', description: 'RE-IMPORT DE EXPORTACIÓN TEMPORAL' },
  { num: 16, code: 'IC09', description: 'IMPORTACIÓN A CONSUMO DESDE DEPOSITO ADUANERO' },
  { num: 17, code: 'IC12', description: 'NACIONALIZACIÓN MAQUILA / MAT PRIMA / INSUMO / DESPERDICIOS' },
  { num: 18, code: 'IC19', description: 'NACIONALIZACIÓN DE DEPÓSITO DE OEC' },
  { num: 19, code: 'ICAB', description: 'IMPORTACIÓN A CONSUMO DE APROVISIONAMIENTO A BORDO' },
  { num: 20, code: 'EC02', description: 'EXPORTACIÓN A CONSUMO C/DIT SIN TRANSFORMACIÓN' },
  { num: 21, code: 'EC03', description: 'EXPORTACIÓN A CONSUMO C/DIT CON TRANSFORMACIÓN' },
  { num: 22, code: 'ERMA', description: 'REEXPORTACION AERONAVE' },
  { num: 23, code: 'ICMA', description: 'NACIONALIZACION DE INGR. A DEP P/MANT. Y REPARAC. DE AERONAVES' },
  { num: 24, code: 'ID04', description: 'IMPORTACIÓN DIPLOMÁTICA CON DOCUMENTO DE TRANSPORTE' },
  { num: 25, code: 'ID09', description: 'IMPORTACIÓN DIPLOMÁTICA DESDE DEPÓSITO ADUANERO' },
  { num: 26, code: 'EVM1', description: 'EXPORTACIÓN MAQUILA VIRTUAL' },
  { num: 27, code: 'ICL1', description: 'NACIONALIZACIÓN LEASING' },
  { num: 28, code: 'IM04', description: 'IMPORTACIÓN MENOR A CONSUMO CON DOCUMENTO DE TRANSPORTE' },
  { num: 29, code: 'IT02', description: 'IMPORTACIÓN TEMPORARIA – MAQUILA CON TRANSFORMACIÓN.' },
  { num: 30, code: 'IT03', description: 'IMPORTACIÓN TEMPORARIA – MAQUILA SIN TRANSFORMACIÓN.' },
  { num: 31, code: 'IT04', description: 'IMPORTACIÓN TEMPORARIA S/TRANSFORMACIÓN C/DOC. TRANSPORT.' },
  { num: 32, code: 'IT14', description: 'IMPORTACIÓN TEMPORARIA P/TRANSFORM.C/DOC.DE TRANSPORTE' },
  { num: 33, code: 'EM01', description: 'EXPORTACIÓN MAQUILA' },
  { num: 34, code: 'ET01', description: 'EXPORTACIÓN TEMPORAL' },
  { num: 35, code: 'ET02', description: 'EXPORTACIÓN TEMPORAL. PERFECCIONA PASIVO' },
  { num: 36, code: 'IDMA', description: 'INGR. A PEDOSITO P/MANT. Y REPARACION DE AERONAVES' },
  { num: 37, code: 'IMAR', description: 'IMPORTACION DE MATERIALES AERONAUTICOS REEMPLAZADOS' },
  { num: 38, code: 'IT06', description: 'IMP.TEMP. MAQUILA S/TRANSFORM. SOBRE DEP.ALMAC' },
  { num: 39, code: 'IT16', description: 'IMP.TEMP. MAQUILA C/TRANSFORM. SOBRE DEP.ALMAC.' },
  { num: 40, code: 'IVM1', description: 'IMPORTACIÓN MAQUILA VIRTUAL SIN TRASFORMACIÓN' },
  { num: 41, code: 'SPA1', description: 'SUMINISTROS Y PROVISIONES AEREO' },
  { num: 42, code: 'IML1', description: 'IMPORTACIÓN TEMPORARIA LEASING' },
  { num: 43, code: 'IM05', description: 'IMPORTACIÓN MENOR S/ DOC DE TRANS. C/ CÓDIGO DE BARRAS' },
  { num: 44, code: 'ECL1', description: 'EXPORTACIÓN DE CONSUMO LEASING' },
  { num: 45, code: 'ERR1', description: 'EXPORTACIÓN C/ RESERVA DE RETORNO' },
  { num: 46, code: 'IM06', description: 'DESPACHO SIMPLIFICADO PARA IMPORTACIONES MENORES' },
  { num: 47, code: 'ER04', description: 'EXPORT A CONSUMO DE EXP. C/ RESERVA RETORNO C/ TRANF.' },
  { num: 48, code: 'IC10', description: 'IMPORTACIÓN A CONSUMO DE EXP. C/ RESERVA DE RETORNO' },
  { num: 49, code: 'IR10', description: 'IMPORT A CONSUMO DE EXP. C/ RESERVA RETORNO C/ TRANF.' },
  { num: 50, code: 'ZF01', description: 'DECLARACIÓN DE INGRESO A ZONA FRANCA' },
  { num: 51, code: 'IRE1', description: 'REMESA EXPRESA – DOCUMENTO' },
  { num: 52, code: 'ZF2E', description: 'EXPORTACIÓN DE ZONA FRANCA' },
  { num: 53, code: 'ZF2M', description: 'IMP TEMP DE ZONA FRANCA – MAQUILA CON TRANSFORMACIÓN.' },
  { num: 54, code: 'ZF3M', description: 'IMP TEMP DE ZONA FRANCA – MAQUILA SIN TRANSFORMACIÓN.' },
  { num: 55, code: 'ZF2T', description: 'IMP TEMPORAL DESDE ZONA FRANCA – CON TRANSFORMACIÓN.' },
  { num: 56, code: 'ZF3T', description: 'IMP TEMPORAL DESDE ZONA FRANCA – SIN TRANSFORMACIÓN.' },
  { num: 57, code: 'IDA3', description: 'INGRESO A DEPOSITO ADUANERO C/ DOCUMENTO DE TRANSPORTE' },
  { num: 58, code: 'IRE2', description: 'REMESA EXPRESA – DE 0 A 100 USD' },
  { num: 59, code: 'IRE3', description: 'REMESA EXPRESA – DE 100 A 1.000 USD' },
  { num: 60, code: 'EC09', description: 'REEXPORTACIÓN DESDE DEPÓSITO ADUANERO' },
  { num: 61, code: 'TDA3', description: 'TRASLADO ENTRE DEPÓSITOS ADUANEROS' },
  { num: 62, code: 'IRE4', description: 'REMESA EXPRESA – HASTA 1.000 USD' },
  { num: 63, code: 'TDA5', description: 'TRASLADO DE DEPOSITO DE OEC' },
  { num: 64, code: 'TLI3', description: 'INGRESO A CONSUMO DEFINITIVO' },
  { num: 65, code: 'TLI1', description: 'INGRESO A DEPOSITO DE TIENDA LIBRE' },
  { num: 66, code: 'TLI2', description: 'REEXPORTACION' },
  { num: 67, code: 'TLI4', description: 'COMERCIALIZACION EN TIENDA LIBRE' },
  { num: 68, code: 'ZF2I', description: 'IMPORTACIÓN DE ZONA FRANCA' },
  { num: 69, code: 'EC15', description: 'EXPORTACION A CONSUMO CON ENVASE' },
  { num: 71, code: 'IDA2', description: 'TRASLADO A DEPOSITO ADUANERO' },
  { num: 72, code: 'IFC1', description: 'IMPORTACION DE FRACCIONES COMPLEMENTARIAS' },
  { num: 74, code: 'IML2', description: 'IMPORTACION MANUAL MODALIDAD LEASING' },
  { num: 75, code: 'IS01', description: 'IMPORTACION DE ASISTENCIA Y SALVAMENTO' },
  { num: 76, code: 'ITL1', description: 'IMPORTACION TEMPORARIA DE LEASING' },
  { num: 77, code: 'MZF1', description: 'MOVIMIENTO DE ZONA FRANCA' },
  { num: 78, code: 'NZF1', description: 'INGRESO A ZONA FRANCA MERCADERIAS NAC.' },
  { num: 79, code: 'XZF1', description: 'MOVIMIENTO DE ZONA FRANCA' },
];

// 11 Términos Comerciales Internacionales (Incoterms 2020)
export const INCOTERMS: Incoterm[] = [
  {
    code: 'EXW',
    name: 'Ex Works / En Fábrica',
    description: 'El vendedor pone la mercancía a disposición del comprador en sus propias instalaciones sin cargarla en el vehículo ni realizar el despacho de exportación.',
  },
  {
    code: 'FCA',
    name: 'Free Carrier / Libre Transportista',
    description: 'El vendedor entrega la mercancía despachada para la exportación al transportista designado por el comprador en el lugar acordado.',
  },
  {
    code: 'CPT',
    name: 'Carriage Paid To / Transporte Pagado Hasta',
    description: 'El vendedor paga el flete del transporte principal hasta el destino convenido, pero la transferencia del riesgo ocurre al entregar la carga al primer transportista.',
  },
  {
    code: 'CIP',
    name: 'Carriage and Insurance Paid To / Transporte y Seguro Pagados Hasta',
    description: 'El vendedor asume los gastos de transporte y la contratación obligatoria de una póliza de seguro de cobertura amplia (Cláusula A) hasta el destino final.',
  },
  {
    code: 'DAP',
    name: 'Delivered At Place / Entregado en Lugar',
    description: 'El vendedor asume los costos y riesgos del traslado hasta el punto de destino acordado, entregando la mercancía lista para su descarga pero sin asumir los trámites de importación.',
  },
  {
    code: 'DPU',
    name: 'Delivered at Place Unloaded / Entregado en Lugar Descargado',
    description: 'El vendedor asume todos los costos y riesgos hasta la entrega y descarga de la mercancía en el punto o terminal designado en destino.',
  },
  {
    code: 'DDP',
    name: 'Delivered Duty Paid / Entregado con Derechos Pagados',
    description: 'El vendedor asume la máxima obligación, cubriendo el transporte, seguros y los trámites e impuestos del despacho aduanero de importación hasta la entrega.',
  },
  {
    code: 'FAS',
    name: 'Free Alongside Ship / Libre al Costado del Buque',
    description: 'El vendedor entrega la mercancía al costado del buque en el muelle de carga del puerto de origen, con los trámites de exportación ya despachados.',
  },
  {
    code: 'FOB',
    name: 'Free On Board / Libre a Bordo',
    description: 'El vendedor se responsabiliza de los gastos, riesgos y despacho de exportación hasta que la carga se encuentra embarcada a bordo del buque.',
  },
  {
    code: 'CFR',
    name: 'Cost and Freight / Coste y Flete',
    description: 'El vendedor contrata y paga el flete del transporte principal hasta el puerto de destino, aunque el riesgo se transfiere al comprador una vez que la mercancía está a bordo del barco.',
  },
  {
    code: 'CIF',
    name: 'Cost, Insurance and Freight / Coste, Seguro y Flete',
    description: 'El vendedor cubre los gastos de transporte marítimo/fluvial hasta el puerto de destino e incluye la contratación obligatoria de un seguro marítimo de cobertura mínima (Cláusula C).',
  },
];

// Principales países socios comerciales y de intercambio con Paraguay
export const TRADING_COUNTRIES: TradingCountry[] = [
  { code: 'CN', name: 'China', region: 'Asia' },
  { code: 'BR', name: 'Brasil', region: 'Mercosur' },
  { code: 'US', name: 'Estados Unidos', region: 'Norteamérica' },
  { code: 'AR', name: 'Argentina', region: 'Mercosur' },
  { code: 'UY', name: 'Uruguay', region: 'Mercosur' },
  { code: 'CL', name: 'Chile', region: 'Sudamérica' },
  { code: 'DE', name: 'Alemania', region: 'Europa' },
  { code: 'JP', name: 'Japón', region: 'Asia' },
  { code: 'IN', name: 'India', region: 'Asia' },
  { code: 'KR', name: 'Corea del Sur', region: 'Asia' },
  { code: 'ES', name: 'España', region: 'Europa' },
  { code: 'IT', name: 'Italia', region: 'Europa' },
  { code: 'MX', name: 'México', region: 'Latinoamérica' },
  { code: 'NL', name: 'Países Bajos', region: 'Europa' },
  { code: 'TW', name: 'Taiwán', region: 'Asia' },
  { code: 'VN', name: 'Vietnam', region: 'Asia' },
  { code: 'BO', name: 'Bolivia', region: 'Sudamérica' },
  { code: 'PE', name: 'Perú', region: 'Sudamérica' },
  { code: 'GB', name: 'Reino Unido', region: 'Europa' },
  { code: 'FR', name: 'Francia', region: 'Europa' },
  { code: 'CH', name: 'Suiza', region: 'Europa' },
  { code: 'TR', name: 'Turquía', region: 'Medio Oriente' },
  { code: 'CO', name: 'Colombia', region: 'Sudamérica' },
  { code: 'BE', name: 'Bélgica', region: 'Europa' },
  { code: 'SE', name: 'Suecia', region: 'Europa' },
  { code: 'SG', name: 'Singapur', region: 'Asia' },
  { code: 'CA', name: 'Canadá', region: 'Norteamérica' },
  { code: 'PL', name: 'Polonia', region: 'Europa' },
  { code: 'AT', name: 'Austria', region: 'Europa' },
  { code: 'ZA', name: 'Sudáfrica', region: 'África' },
  { code: 'ID', name: 'Indonesia', region: 'Asia' },
  { code: 'TH', name: 'Tailandia', region: 'Asia' },
  { code: 'AE', name: 'Emiratos Árabes Unidos', region: 'Medio Oriente' },
  { code: 'MY', name: 'Malasia', region: 'Asia' },
  { code: 'PT', name: 'Portugal', region: 'Europa' },
  { code: 'PY', name: 'Paraguay', region: 'Mercosur' },
];
