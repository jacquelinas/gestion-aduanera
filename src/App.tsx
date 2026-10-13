import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Printer,
  Search,
  History,
  Building2,
  Hash,
  Download,
  Copy,
  Trash2,
  Check,
  RefreshCw,
  FolderOpen,
  Save,
  Send,
  PlusCircle,
  Compass,
  X,
  Upload,
  Plus,
  Eye,
  CheckCircle2,
  FileSpreadsheet,
  Edit,
} from 'lucide-react';
import {
  CompanySettings,
  CustomsSettlement,
  LineItem,
  MerchandiseItem,
  ReceivedPaymentItem,
} from './types';
import {
  DEFAULT_COMPANY_SETTINGS,
  HISTORICAL_SETTLEMENTS,
  INITIAL_SETTLEMENT,
} from './initialData';
import {
  calculateSettlementMetrics,
  formatCurrencyGs,
  formatCurrencyUsd,
  formatCurrencyAmount,
  generateStandaloneInteractiveHtml,
} from './utils/formatters';
import { exportSettlementToPdf } from './utils/pdfExporter';
import { exportSettlementToExcel } from './utils/excelExporter';
import { renderCorporateLogoPngDataUrl } from './utils/logoRenderer';
import { DynamicExpenseTable } from './components/DynamicExpenseTable';
import { ReceivedPaymentsTable } from './components/ReceivedPaymentsTable';
import { PrintInvoiceDocument } from './components/PrintInvoiceDocument';
import { SectionTooltip } from './components/SectionTooltip';
import {
  CustomsOfficeSelect,
  CustomsRegimeSelect,
  IncotermSelect,
  CountrySelect,
} from './components/CustomsCatalogSelectors';
import { DashboardSettlements } from './components/DashboardSettlements';

type ActiveView = 'liquidacion' | 'documento' | 'dashboard' | 'historial' | 'empresa';

const STORAGE_KEYS = {
  COMPANY: 'meridian_customs_company_v4',
  HISTORY: 'meridian_customs_history_v4',
  CURRENT: 'meridian_customs_current_v4',
  ONBOARDING_DISMISSED: 'meridian_customs_onboarding_v4',
};

function computeNextSequential(list: CustomsSettlement[], year = 2026): string {
  const regex = new RegExp(`^(\\d+)\\/${year}$`);
  const numbers = list
    .map((item) => {
      const match = item.sequentialNumber.trim().match(regex);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !isNaN(n) && n > 0);

  const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `${String(nextNum).padStart(3, '0')}/${year}`;
}

export default function App() {
  const [company, setCompany] = useState<CompanySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMPANY);
      return saved ? JSON.parse(saved) : DEFAULT_COMPANY_SETTINGS;
    } catch {
      return DEFAULT_COMPANY_SETTINGS;
    }
  });

  const [history, setHistory] = useState<CustomsSettlement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return saved ? JSON.parse(saved) : HISTORICAL_SETTLEMENTS;
    } catch {
      return HISTORICAL_SETTLEMENTS;
    }
  });

  const [settlement, setSettlement] = useState<CustomsSettlement>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT);
      return saved ? JSON.parse(saved) : INITIAL_SETTLEMENT;
    } catch {
      return INITIAL_SETTLEMENT;
    }
  });

  const [showGuideBanner, setShowGuideBanner] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ONBOARDING_DISMISSED) !== 'true';
    } catch {
      return true;
    }
  });

  const [activeView, setActiveView] = useState<ActiveView>('liquidacion');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewSettlement, setPreviewSettlement] =
    useState<CustomsSettlement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewSettlement) {
        setPreviewSettlement(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewSettlement]);

  // Lock body scroll when preview modal is open so wheel/touch scrolls the modal
  useEffect(() => {
    if (previewSettlement) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [previewSettlement]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(company));
    } catch {
      // ignore storage errors
    }
  }, [company]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch {
      // ignore storage errors
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT, JSON.stringify(settlement));
    } catch {
      // ignore storage errors
    }
  }, [settlement]);

  const showNotice = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3600);
  };

  const dismissGuide = () => {
    setShowGuideBanner(false);
    try {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_DISMISSED, 'true');
    } catch {
      // ignore
    }
  };

  // Real-time financial & customs valuation calculations
  const metrics = useMemo(
    () => calculateSettlementMetrics(settlement),
    [settlement]
  );

  // Filtered historical settlements for Quick Search & History Panel
  const filteredHistory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return history.filter((item) => {
      const matchesStatus =
        statusFilter === 'Todos' || item.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        item.sequentialNumber.toLowerCase().includes(q) ||
        item.clientName.toLowerCase().includes(q) ||
        item.clientRuc.toLowerCase().includes(q) ||
        item.dispatchNumber.toLowerCase().includes(q) ||
        item.invoiceNumber.toLowerCase().includes(q) ||
        item.proformaNumber.toLowerCase().includes(q) ||
        item.senderName.toLowerCase().includes(q) ||
        (item.originCountry && item.originCountry.toLowerCase().includes(q)) ||
        (item.provenanceCountry && item.provenanceCountry.toLowerCase().includes(q)) ||
        (item.customsOffice && item.customsOffice.toLowerCase().includes(q)) ||
        (item.customsRegime && item.customsRegime.toLowerCase().includes(q)) ||
        (item.incoterm && item.incoterm.toLowerCase().includes(q))
      );
    });
  }, [history, searchQuery, statusFilter]);

  const updateField = <K extends keyof CustomsSettlement>(
    field: K,
    value: CustomsSettlement[K]
  ) => {
    setSettlement((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Auto-Sequential Generator: cycles between 001/2026 and the next available sequential number
  const handleGenerateSequential = () => {
    const nextCorrelative = computeNextSequential(history, 2026);
    if (settlement.sequentialNumber !== '001/2026') {
      updateField('sequentialNumber', '001/2026');
      showNotice('Secuencial inicial asignado: 001/2026');
    } else {
      updateField('sequentialNumber', nextCorrelative);
      showNotice(
        `Secuencial actualizado automáticamente al siguiente correlativo: ${nextCorrelative}`
      );
    }
  };

  // Merchandise 6-column table handlers
  const handleAddMerchandiseRow = () => {
    const newMerch: MerchandiseItem = {
      id: `merch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      packages: 1,
      unit: 'BULTOS',
      description: '',
      tariffCode: '8431.49.29',
      valueGs: metrics.cifGs,
      tariffPercent: 10,
    };
    setSettlement((prev) => ({
      ...prev,
      merchandiseItems: [...(prev.merchandiseItems || []), newMerch],
    }));
  };

  const handleUpdateMerchandiseRow = (
    id: string,
    field: keyof MerchandiseItem,
    value: string | number
  ) => {
    setSettlement((prev) => ({
      ...prev,
      merchandiseItems: (prev.merchandiseItems || []).map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      ),
    }));
  };

  const handleRemoveMerchandiseRow = (id: string) => {
    setSettlement((prev) => ({
      ...prev,
      merchandiseItems: (prev.merchandiseItems || []).filter(
        (row) => row.id !== id
      ),
    }));
  };

  // Dynamic Table Handlers
  const handleAddRow = (
    category: 'customsDuties' | 'ratesAndCosts' | 'internalServices'
  ) => {
    const nextIndex = settlement[category].length + 1;
    const newRow: LineItem = {
      id: `${category}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      code: `0${nextIndex}`,
      description: '',
      documentRef: category === 'customsDuties' ? 'S/ DESPACHO' : '',
      amountGs: 0,
      taxable: category === 'internalServices',
    };
    setSettlement((prev) => ({
      ...prev,
      [category]: [...prev[category], newRow],
    }));
  };

  const handleUpdateRow = (
    category: 'customsDuties' | 'ratesAndCosts' | 'internalServices',
    id: string,
    field: keyof LineItem,
    value: string | number | boolean
  ) => {
    setSettlement((prev) => ({
      ...prev,
      [category]: prev[category].map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      ),
    }));
  };

  const handleRemoveRow = (
    category: 'customsDuties' | 'ratesAndCosts' | 'internalServices',
    id: string
  ) => {
    setSettlement((prev) => ({
      ...prev,
      [category]: prev[category].filter((row) => row.id !== id),
    }));
  };

  // 04. Detalle de Montos Recibidos Handlers
  const handleAddPaymentRow = () => {
    const newPayment: ReceivedPaymentItem = {
      id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      method: 'Transferencia',
      description: '',
      date: new Date().toISOString().split('T')[0],
      amountGs: 0,
    };
    setSettlement((prev) => {
      const current = prev.receivedPayments || [];
      const updated = [...current, newPayment];
      const sum = updated.reduce((s, p) => s + (Number(p.amountGs) || 0), 0);
      return {
        ...prev,
        receivedPayments: updated,
        amountReceived: sum,
      };
    });
  };

  const handleUpdatePaymentRow = (
    id: string,
    field: keyof ReceivedPaymentItem,
    value: string | number
  ) => {
    setSettlement((prev) => {
      const current = prev.receivedPayments || [];
      const updated = current.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      );
      const sum = updated.reduce((s, p) => s + (Number(p.amountGs) || 0), 0);
      return {
        ...prev,
        receivedPayments: updated,
        amountReceived: sum,
      };
    });
  };

  const handleRemovePaymentRow = (id: string) => {
    setSettlement((prev) => {
      const current = prev.receivedPayments || [];
      const updated = current.filter((p) => p.id !== id);
      const sum = updated.reduce((s, p) => s + (Number(p.amountGs) || 0), 0);
      return {
        ...prev,
        receivedPayments: updated,
        amountReceived: sum,
      };
    });
  };

  // Marcar 100% cancelado vinculando la suma de montos recibidos
  const handleMarkFullPaid = () => {
    const grandTotal = metrics.grandTotalGs;
    const current = settlement.receivedPayments || [];
    if (current.length === 0) {
      const newPayment: ReceivedPaymentItem = {
        id: `pay-${Date.now()}`,
        method: 'Transferencia',
        description: 'Banco Itaú — Transacción SIPAP #147772927 (Pago Total 100% Cancelado)',
        date: new Date().toISOString().split('T')[0],
        amountGs: grandTotal,
      };
      setSettlement((prev) => ({
        ...prev,
        receivedPayments: [newPayment],
        amountReceived: grandTotal,
      }));
    } else {
      const currentSum = current.reduce(
        (s, p) => s + (Number(p.amountGs) || 0),
        0
      );
      const diff = grandTotal - currentSum;
      if (diff > 0) {
        const newPayment: ReceivedPaymentItem = {
          id: `pay-${Date.now()}`,
          method: 'Transferencia',
          description: 'Banco Continental — Transacción SIPAP #99418204 (Cancelación de Saldo)',
          date: new Date().toISOString().split('T')[0],
          amountGs: diff,
        };
        setSettlement((prev) => ({
          ...prev,
          receivedPayments: [...current, newPayment],
          amountReceived: grandTotal,
        }));
      } else {
        const updated = current.map((p, idx) =>
          idx === 0 ? { ...p, amountGs: grandTotal } : { ...p, amountGs: 0 }
        );
        setSettlement((prev) => ({
          ...prev,
          receivedPayments: updated,
          amountReceived: grandTotal,
        }));
      }
    }
    showNotice(
      `Liquidación 100% cancelada: Total Gs. ${formatCurrencyGs(grandTotal)}`
    );
  };

  // Recalculate standard customs duties from CIF Gs
  const handleRecalculateDutiesFromCif = () => {
    const cifGs = metrics.cifGs;
    if (cifGs <= 0) {
      showNotice(
        'Ingrese valores FOB, Flete, Seguro y Cotización Dólar mayores a 0.'
      );
      return;
    }
    const derechoAduanero = Math.round(cifGs * 0.1);
    const valoracion = Math.round(cifGs * 0.005);
    const ireGeneral = Math.round(cifGs * 0.004);
    const tasaIntervencion = 85000;
    const baseIva = cifGs + derechoAduanero + valoracion + tasaIntervencion;
    const ivaAduanero = Math.round(baseIva * 0.1);

    const updatedDuties: LineItem[] = [
      {
        id: `d-${Date.now()}-1`,
        code: '01',
        description: 'DERECHO ADUANERO',
        documentRef: 'S/ DESPACHO',
        amountGs: derechoAduanero,
        taxable: false,
      },
      {
        id: `d-${Date.now()}-2`,
        code: '02',
        description: 'SERVICIO DE VALORACION',
        documentRef: 'S/ DESPACHO',
        amountGs: valoracion,
        taxable: false,
      },
      {
        id: `d-${Date.now()}-3`,
        code: '03',
        description: 'IRE GENERAL 700',
        documentRef: 'S/ DESPACHO',
        amountGs: ireGeneral,
        taxable: false,
      },
      {
        id: `d-${Date.now()}-4`,
        code: '04',
        description: 'I.V.A.',
        documentRef: 'S/ DESPACHO',
        amountGs: ivaAduanero,
        taxable: false,
      },
      {
        id: `d-${Date.now()}-5`,
        code: '05',
        description: 'TASA INTERVENCION ADUANERA',
        documentRef: 'S/ DESPACHO',
        amountGs: tasaIntervencion,
        taxable: false,
      },
    ];

    setSettlement((prev) => ({
      ...prev,
      customsDuties: updatedDuties,
    }));
    showNotice(
      'Tributos aduaneros calculados automáticamente sobre el Valor CIF.'
    );
  };

  // Save or update current settlement in history AND auto-advance sequential if needed
  const handleSaveToHistory = (
    newStatus?: CustomsSettlement['status'],
    autoAdvanceAfterSend = false
  ) => {
    const updated: CustomsSettlement = {
      ...settlement,
      status: newStatus || settlement.status,
      createdAt: new Date().toISOString(),
    };

    const nextHistory = (() => {
      const exists = history.some(
        (item) =>
          item.id === updated.id ||
          item.sequentialNumber === updated.sequentialNumber
      );
      if (exists) {
        return history.map((item) =>
          item.id === updated.id ||
          item.sequentialNumber === updated.sequentialNumber
            ? updated
            : item
        );
      }
      return [updated, ...history];
    })();

    setHistory(nextHistory);

    if (autoAdvanceAfterSend) {
      const nextSeq = computeNextSequential(nextHistory, 2026);
      setSettlement({
        ...updated,
        id: `liq-${Date.now()}`,
        sequentialNumber: nextSeq,
        status: 'Emitida',
      });
      showNotice(
        `Liquidación ${updated.sequentialNumber} guardada en Historial. Secuencial actualizado automáticamente a ${nextSeq}.`
      );
    } else {
      setSettlement(updated);
      showNotice(
        `Liquidación ${updated.sequentialNumber} guardada en el historial.`
      );
    }
  };

  // Create new blank/template settlement with automatic next sequential number
  const handleNewSettlement = () => {
    const nextSeq = computeNextSequential(history, 2026);
    const newDoc: CustomsSettlement = {
      id: `liq-${Date.now()}`,
      sequentialNumber: nextSeq,
      date: new Date().toISOString().split('T')[0],
      status: 'Borrador',
      clientName: '',
      clientRuc: '',
      clientAddress: '',
      clientContact: '',
      senderName: '',
      senderCountry: 'China',
      originCountry: 'China',
      provenanceCountry: 'China',
      senderReference: '',
      transportMode: 'Marítimo',
      customsCode: '004',
      customsOffice: '004 - Villeta',
      customsRegime: 'IC04',
      incoterm: 'FOB',
      invoiceNumber: '',
      dispatchNumber: '',
      proformaNumber: '',
      exchangeRate: 7650,
      currency: 'USD',
      fobUsd: 0,
      insuranceUsd: 0,
      freightUsd: 0,
      adjustmentUsd: 0,
      merchandiseItems: [
        {
          id: `m-${Date.now()}-1`,
          packages: 1,
          unit: 'BULTOS',
          description: '',
          tariffCode: '',
          valueGs: 0,
          tariffPercent: 10,
        },
      ],
      customsDuties: [
        {
          id: `d-${Date.now()}-1`,
          code: '01',
          description: 'DERECHO ADUANERO',
          documentRef: 'S/ DESPACHO',
          amountGs: 0,
          taxable: false,
        },
        {
          id: `d-${Date.now()}-2`,
          code: '02',
          description: 'SERVICIO DE VALORACION',
          documentRef: 'S/ DESPACHO',
          amountGs: 0,
          taxable: false,
        },
        {
          id: `d-${Date.now()}-3`,
          code: '03',
          description: 'IRE GENERAL 700',
          documentRef: 'S/ DESPACHO',
          amountGs: 0,
          taxable: false,
        },
        {
          id: `d-${Date.now()}-4`,
          code: '04',
          description: 'I.V.A.',
          documentRef: 'S/ DESPACHO',
          amountGs: 0,
          taxable: false,
        },
        {
          id: `d-${Date.now()}-5`,
          code: '05',
          description: 'TASA INTERVENCION ADUANERA',
          documentRef: 'S/ DESPACHO',
          amountGs: 0,
          taxable: false,
        },
      ],
      ratesAndCosts: [
        {
          id: `r-${Date.now()}-1`,
          code: '01',
          description: 'FOTOCOPIAS DE DOCUMENTOS',
          documentRef: '',
          amountGs: 0,
          taxable: false,
        },
        {
          id: `r-${Date.now()}-2`,
          code: '02',
          description: 'TASAS PORTUARIAS',
          documentRef: '',
          amountGs: 0,
          taxable: false,
        },
        {
          id: `r-${Date.now()}-3`,
          code: '03',
          description: 'CANON INFORMATICO',
          documentRef: 'S/DESPACHO',
          amountGs: 0,
          taxable: false,
        },
        {
          id: `r-${Date.now()}-4`,
          code: '04',
          description: 'TASA INTERVENCION ANNP',
          documentRef: 'S/DESPACHO',
          amountGs: 0,
          taxable: false,
        },
      ],
      internalServices: [
        {
          id: `s-${Date.now()}-1`,
          code: '01',
          description: 'GASTOS DE DESPACHO',
          documentRef: '',
          amountGs: 330000,
          taxable: true,
        },
        {
          id: `s-${Date.now()}-2`,
          code: '02',
          description: 'HONORARIOS PROFESIONALES',
          documentRef: '',
          amountGs: 0,
          taxable: true,
        },
        {
          id: `s-${Date.now()}-3`,
          code: '03',
          description: 'DESCUENTO HONORARIOS',
          documentRef: '',
          amountGs: 0,
          taxable: false,
        },
      ],
      receivedPayments: [],
      amountReceived: 0,
      amountInWords: '',
      notes: '',
      createdAt: new Date().toISOString(),
    };
    setSettlement(newDoc);
    setActiveView('liquidacion');
    showNotice(
      `Nueva planilla creada. Nro. Secuencial asignado automáticamente: ${nextSeq}`
    );
  };

  // Load settlement from history
  const handleLoadSettlement = (item: CustomsSettlement) => {
    setSettlement(item);
    setActiveView('liquidacion');
    showNotice(
      `Liquidación ${item.sequentialNumber} (${item.clientName}) cargada.`
    );
  };

  // Duplicate settlement from history with auto-incremented sequential number
  const handleDuplicateSettlement = (item: CustomsSettlement) => {
    const nextSeq = computeNextSequential(history, 2026);
    const copy: CustomsSettlement = {
      ...item,
      id: `liq-${Date.now()}`,
      sequentialNumber: nextSeq,
      date: new Date().toISOString().split('T')[0],
      status: 'Borrador',
      createdAt: new Date().toISOString(),
    };
    setSettlement(copy);
    setActiveView('liquidacion');
    showNotice(
      `Liquidación duplicada con nuevo secuencial automático: ${nextSeq}`
    );
  };

  // Delete settlement from history
  const handleDeleteFromHistory = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    showNotice('Registro eliminado del historial.');
  };

  // Direct PDF File Export + Switch to Invoice Preview
  const handleExportPdfAndPreview = () => {
    handleSaveToHistory();
    setActiveView('documento');
    try {
      const fileName = exportSettlementToPdf(settlement, company);
      showNotice(
        `PDF descargado (${fileName}) y vista de factura lista para imprimir.`
      );
    } catch {
      window.print();
    }
  };

  // Export single self-contained HTML file
  const handleExportStandaloneHtml = () => {
    const htmlContent = generateStandaloneInteractiveHtml(
      settlement,
      history,
      company
    );
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const cleanSeq = settlement.sequentialNumber.replace(
      /[^a-zA-Z0-9_-]/g,
      '-'
    );
    a.href = url;
    a.download = `Liquidacion-Aduanera-${cleanSeq}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotice(
      `Archivo HTML único descargado: Liquidacion-Aduanera-${cleanSeq}.html`
    );
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-slate-100 text-slate-900">
      {/* Top Bar Contract: 3 zones (Brand wordmark | 4 nav links | 1 primary action) — zero horizontal overflow on mobile */}
      <header className="no-print sticky top-0 z-30 w-full flex items-center justify-between gap-2 sm:gap-6 md:gap-8 px-3 sm:px-6 py-3 bg-slate-900 text-white border-b border-slate-800">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#liquidacion"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('liquidacion');
          }}
          className="text-sm sm:text-base font-bold tracking-tight text-white truncate min-w-0 font-display"
        >
          {company.name.split(' ')[0]} Aduanas & Logística
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300 shrink-0">
          <button
            type="button"
            onClick={() => setActiveView('liquidacion')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeView === 'liquidacion'
                ? 'text-white border-sky-400'
                : 'border-transparent hover:text-white hover:border-slate-600'
            }`}
          >
            Liquidación
          </button>
          <button
            type="button"
            onClick={() => setActiveView('documento')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeView === 'documento'
                ? 'text-white border-sky-400'
                : 'border-transparent hover:text-white hover:border-slate-600'
            }`}
          >
            Vista Factura / PDF
          </button>
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeView === 'dashboard'
                ? 'text-white border-sky-400 font-semibold'
                : 'border-transparent hover:text-white hover:border-slate-600'
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveView('historial')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeView === 'historial'
                ? 'text-white border-sky-400'
                : 'border-transparent hover:text-white hover:border-slate-600'
            }`}
          >
            Historial ({history.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveView('empresa')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeView === 'empresa'
                ? 'text-white border-sky-400'
                : 'border-transparent hover:text-white hover:border-slate-600'
            }`}
          >
            Datos Empresa
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleExportPdfAndPreview}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Descarga el PDF oficial de la liquidación y abre la vista lista para imprimir"
          >
            <Printer className="w-3.5 h-3.5 shrink-0" />
            <span className="sm:hidden">PDF / Imprimir</span>
            <span className="hidden sm:inline">Imprimir / Exportar a PDF</span>
          </button>
        </div>
      </header>

      {/* Mobile Navigation Tabs (5 equal-width columns, zero horizontal scroll) */}
      <nav
        aria-label="Navegación móvil"
        className="no-print md:hidden grid grid-cols-5 gap-1 bg-slate-800 text-slate-200 px-2 py-1.5 border-b border-slate-700 w-full"
      >
        <button
          type="button"
          onClick={() => setActiveView('liquidacion')}
          className={`py-2 px-1 text-[11px] font-semibold text-center rounded transition-colors truncate ${
            activeView === 'liquidacion'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Liquidación
        </button>
        <button
          type="button"
          onClick={() => setActiveView('documento')}
          className={`py-2 px-1 text-[11px] font-semibold text-center rounded transition-colors truncate ${
            activeView === 'documento'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Factura
        </button>
        <button
          type="button"
          onClick={() => setActiveView('dashboard')}
          className={`py-2 px-1 text-[11px] font-semibold text-center rounded transition-colors truncate ${
            activeView === 'dashboard'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Dashboard
        </button>
        <button
          type="button"
          onClick={() => setActiveView('historial')}
          className={`py-2 px-1 text-[11px] font-semibold text-center rounded transition-colors truncate ${
            activeView === 'historial'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Historial
        </button>
        <button
          type="button"
          onClick={() => setActiveView('empresa')}
          className={`py-2 px-1 text-[11px] font-semibold text-center rounded transition-colors truncate ${
            activeView === 'empresa'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Empresa
        </button>
      </nav>

      {/* Notification Banner */}
      {toastMessage && (
        <div className="no-print fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-lg border border-slate-700 shadow-lg">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Print-only view when user triggers browser print from any tab */}
        <div className="hidden print-only">
          <PrintInvoiceDocument
            settlement={settlement}
            company={company}
            onExportStandaloneHtml={handleExportStandaloneHtml}
            onExportPdfFile={handleExportPdfAndPreview}
          />
        </div>

        {/* Screen Interactive Views */}
        <div className="no-print">
          {/* Interactive Quick-Start Guide Strip (User-Friendly Onboarding with Low Learning Curve) */}
          {showGuideBanner && (
            <div className="bg-slate-900 text-white rounded-lg p-4 mb-5 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Compass className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-sky-300">
                    Guía Rápida de Uso (3 pasos) — Pase el cursor sobre "¿Para qué sirve?" en cada sección
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-200">
                    <span>
                      <strong className="text-white">Paso 1:</strong> Complete
                      Cliente, Remitente y Valores FOB/Flete/Seguro (el CIF y
                      el Nº Secuencial se actualizan solos).
                    </span>
                    <span className="hidden sm:inline text-slate-600">·</span>
                    <span>
                      <strong className="text-white">Paso 2:</strong> Agregue o
                      ajuste filas en Tributos, Tasas y Honorarios.
                    </span>
                    <span className="hidden sm:inline text-slate-600">·</span>
                    <span>
                      <strong className="text-white">Paso 3:</strong> Ingrese el
                      Anticipo y pulse{' '}
                      <strong className="text-sky-300">
                        Imprimir / Exportar a PDF
                      </strong>
                      .
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={dismissGuide}
                className="self-end lg:self-center inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors shrink-0 cursor-pointer"
                title="Ocultar guía rápida"
              >
                <span>Entendido</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Sub-toolbar with Quick Search, Sequential Generator, and Company Identity Strip */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 overflow-hidden">
            {/* Company Identity Preview — Stacked on mobile so text never clips or overflows */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 min-w-0 w-full lg:w-auto">
              <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                <img
                  src={
                    company.logoUrl && company.logoUrl.trim() !== ''
                      ? company.logoUrl
                      : renderCorporateLogoPngDataUrl(
                          company.logoText,
                          company.name
                        )
                  }
                  alt={`Logo ${company.name}`}
                  referrerPolicy="no-referrer"
                  className="w-24 h-14 rounded-md object-contain border border-slate-300 bg-white p-1 shrink-0"
                />
                <button
                  type="button"
                  onClick={() => setActiveView('empresa')}
                  className="sm:hidden px-2.5 py-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors shrink-0 cursor-pointer"
                >
                  Editar empresa
                </button>
              </div>

              <div className="min-w-0 w-full flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                  <h1 className="text-sm font-bold text-slate-900 break-words leading-snug">
                    {company.name}
                  </h1>
                  <span className="hidden sm:inline text-slate-300" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-xs font-mono tabular-nums font-semibold text-slate-700">
                    RUC {company.ruc}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveView('empresa')}
                    className="hidden sm:inline text-[11px] font-medium text-blue-600 hover:underline cursor-pointer"
                    title="Personalizar Nombre, Logo, Slogan, Teléfono y Correo del Estudio"
                  >
                    Editar datos empresa
                  </button>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed break-words">
                  <span>{company.slogan}</span>
                  {' · '}
                  <span className="font-mono tabular-nums">{company.phone}</span>
                  {' · '}
                  <span className="break-all sm:break-normal text-slate-700 font-medium">
                    {company.email}
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Search Bar & Action Controls */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <div
                className="relative w-full sm:w-72"
                title="Busque al instante cualquier liquidación anterior por nombre de cliente, RUC, número de despacho o factura"
              >
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (
                      e.target.value.trim() &&
                      activeView !== 'liquidacion' &&
                      activeView !== 'historial'
                    ) {
                      setActiveView('historial');
                    }
                  }}
                  placeholder="Buscar por cliente, RUC, despacho..."
                  aria-label="Buscar liquidaciones previas"
                  className="w-full pl-8 pr-3 py-2 sm:py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateSequential}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer flex-1 sm:flex-initial"
                title="Asigna 001/2026 o avanza automáticamente al siguiente número correlativo disponible (ej. 004/2026)"
              >
                <Hash className="w-3.5 h-3.5 text-blue-700" />
                <span>Generar Secuencial ({settlement.sequentialNumber})</span>
              </button>

              <button
                type="button"
                onClick={handleNewSettlement}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer flex-1 sm:flex-initial"
                title="Limpia el formulario y asigna automáticamente el siguiente número de liquidación secuencial"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nueva Liquidación (Auto-Nº)</span>
              </button>

              <button
                type="button"
                onClick={handleExportStandaloneHtml}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer w-full sm:w-auto"
                title="Descarga un archivo HTML único e interactivo listo para enviar o abrir sin conexión"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Descargar HTML Único</span>
              </button>
            </div>
          </div>

          {/* VIEW 1: EDITOR DE LIQUIDACIÓN + PANEL LATERAL DE RESUMEN E HISTORIAL */}
          {activeView === 'liquidacion' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Left/Center Column (8 cols): Header Form, Customs Valuation, Dynamic Expense Tables, Notes */}
              <div className="xl:col-span-8 space-y-6">
                {/* Section A: Encabezado de Liquidación, Datos del Cliente y Remitente */}
                <section className="bg-white border border-slate-200 rounded-lg overflow-visible">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-slate-900 text-white rounded-t-lg">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-sm font-semibold tracking-tight">
                          Encabezado — Cliente, Remitente y Valoración Aduanera
                        </h2>
                        <SectionTooltip
                          title="Encabezado y Valoración CIF"
                          purpose="Centraliza los datos legales del importador, proveedor extranjero, documentos de embarque y calcula automáticamente la base imponible CIF (FOB + Flete + Seguro)."
                          problemSolved="Evita errores manuales de tipo de cambio o suma en la base imponible y garantiza que la liquidación tenga trazabilidad documental completa."
                        />
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Identificación fiscal del importador, remitente internacional y cálculo automático del Valor CIF
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-300">
                        Secuencial Activo:
                      </span>
                      <span
                        className="font-mono tabular-nums text-sm font-bold text-sky-300 bg-slate-800 px-2.5 py-1 rounded border border-slate-700"
                        title="Este número se actualiza automáticamente al crear o registrar una liquidación"
                      >
                        {settlement.sequentialNumber}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-6">
                    {/* Row 1: Secuencial, Fecha, Factura, Despacho, Proforma */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div>
                        <label
                          className="block text-xs font-semibold text-slate-700 mb-1"
                          title="Número único correlativo de la liquidación. Se actualiza automáticamente al crear o guardar despachos."
                        >
                          Nro. Liquidación (Auto)
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={settlement.sequentialNumber}
                            onChange={(e) =>
                              updateField('sequentialNumber', e.target.value)
                            }
                            placeholder="001/2026"
                            className="w-full px-3 py-2 text-xs font-mono tabular-nums font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleGenerateSequential}
                            className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md shrink-0 cursor-pointer"
                            title="Alternar entre 001/2026 y el siguiente correlativo automático del año"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Fecha de Liquidación
                        </label>
                        <input
                          type="date"
                          value={settlement.date}
                          onChange={(e) => updateField('date', e.target.value)}
                          className="w-full px-3 py-2 text-xs font-mono tabular-nums text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          className="block text-xs font-semibold text-slate-700 mb-1"
                          title="Número de la Factura Comercial (Commercial Invoice) emitida por el exportador"
                        >
                          Nro. Factura Comercial
                        </label>
                        <input
                          type="text"
                          value={settlement.invoiceNumber}
                          onChange={(e) =>
                            updateField('invoiceNumber', e.target.value)
                          }
                          placeholder="Ej. INV-2026-0894"
                          className="w-full px-3 py-2 text-xs font-mono tabular-nums text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          className="block text-xs font-semibold text-slate-700 mb-1"
                          title="Identificador oficial del Despacho de Importación en el sistema aduanero (ej. IC04 / SOFÍA)"
                        >
                          Despacho Aduanero
                        </label>
                        <input
                          type="text"
                          value={settlement.dispatchNumber}
                          onChange={(e) =>
                            updateField('dispatchNumber', e.target.value)
                          }
                          placeholder="Ej. 26021IC04008412R"
                          className="w-full px-3 py-2 text-xs font-mono tabular-nums text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          className="block text-xs font-semibold text-slate-700 mb-1"
                          title="Número de Proforma o presupuesto previo vinculado a la operación"
                        >
                          Nro. Proforma
                        </label>
                        <input
                          type="text"
                          value={settlement.proformaNumber}
                          onChange={(e) =>
                            updateField('proformaNumber', e.target.value)
                          }
                          placeholder="Ej. PROF-2026-0118"
                          className="w-full px-3 py-2 text-xs font-mono tabular-nums text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Row 2: Datos del Cliente (Importador) y Datos del Remitente (Exportador) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                      {/* Datos del Cliente */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Datos del Cliente / Importador
                          </h3>
                          <span className="text-[11px] text-slate-400">
                            A quien se emite la liquidación
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Nombre o Razón Social del Cliente
                            </label>
                            <input
                              type="text"
                              value={settlement.clientName}
                              onChange={(e) =>
                                updateField('clientName', e.target.value)
                              }
                              placeholder="Razón Social S.A."
                              className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              RUC Cliente
                            </label>
                            <input
                              type="text"
                              value={settlement.clientRuc}
                              onChange={(e) =>
                                updateField('clientRuc', e.target.value)
                              }
                              placeholder="80045892-1"
                              className="w-full px-3 py-2 text-xs font-mono tabular-nums text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Dirección del Cliente
                            </label>
                            <input
                              type="text"
                              value={settlement.clientAddress}
                              onChange={(e) =>
                                updateField('clientAddress', e.target.value)
                              }
                              placeholder="Dirección fiscal o depósito..."
                              className="w-full px-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Contacto / Atención
                            </label>
                            <input
                              type="text"
                              value={settlement.clientContact}
                              onChange={(e) =>
                                updateField('clientContact', e.target.value)
                              }
                              placeholder="Nombre del responsable..."
                              className="w-full px-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Parámetros Aduaneros vinculados: Aduana (SOFIA), Régimen (N°/CÓD), Incoterm (CÓD) */}
                        <div className="pt-2 border-t border-slate-200/80">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              Parámetros Aduaneros (Aduana · Régimen · Incoterm)
                            </span>
                            <span className="text-[10.5px] text-slate-600 hidden sm:inline">
                              * Pasa el mouse sobre el código en PC para ver descripción completa
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <CustomsOfficeSelect
                              value={settlement.customsCode || settlement.customsOffice}
                              onChange={(office) => {
                                updateField('customsCode', office.code);
                                updateField('customsOffice', `${office.code} - ${office.name}`);
                              }}
                            />
                            <CustomsRegimeSelect
                              value={settlement.customsRegime || 'IC04'}
                              onChange={(regime) => {
                                updateField('customsRegime', regime.code);
                              }}
                            />
                            <IncotermSelect
                              value={settlement.incoterm || 'FOB'}
                              onChange={(incoterm) => {
                                updateField('incoterm', incoterm.code);
                                updateField('saleCondition', incoterm.code);
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Datos del Remitente / Exportador */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Datos del Remitente / Exportador
                          </h3>
                          <span className="text-[11px] text-slate-400">
                            Origen y Procedencia
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Nombre del Remitente / Proveedor Exterior
                            </label>
                            <input
                              type="text"
                              value={settlement.senderName}
                              onChange={(e) => {
                                updateField('senderName', e.target.value);
                                updateField('supplierName', e.target.value);
                              }}
                              placeholder="Proveedor / Exportador..."
                              className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Origen vs Procedencia (Listas desplegables con principales países socios comerciales con Paraguay) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <CountrySelect
                            label="País de Origen"
                            badgeText="Fabricación"
                            badgeColor="sky"
                            value={settlement.originCountry || settlement.senderCountry || ''}
                            onChange={(countryName) => {
                              updateField('originCountry', countryName);
                              if (!settlement.senderCountry) {
                                updateField('senderCountry', countryName);
                              }
                            }}
                            placeholder="Ej. China..."
                          />
                          <CountrySelect
                            label="País de Procedencia"
                            badgeText="Embarque / Tránsito"
                            badgeColor="amber"
                            value={settlement.provenanceCountry || settlement.senderCountry || ''}
                            onChange={(countryName) => {
                              updateField('provenanceCountry', countryName);
                              updateField('senderCountry', countryName);
                            }}
                            placeholder="Ej. Uruguay..."
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Conocimiento de Embarque (BL / AWB / CRT)
                            </label>
                            <input
                              type="text"
                              value={settlement.senderReference}
                              onChange={(e) =>
                                updateField('senderReference', e.target.value)
                              }
                              placeholder="BL Nº / Contenedor / Bultos..."
                              className="w-full px-3 py-2 text-xs font-mono tabular-nums text-slate-800 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Vía de Transporte
                            </label>
                            <select
                              value={settlement.transportMode}
                              onChange={(e) =>
                                updateField(
                                  'transportMode',
                                  e.target.value as CustomsSettlement['transportMode']
                                )
                              }
                              className="w-full px-2.5 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none"
                            >
                              <option value="Marítimo">Marítimo</option>
                              <option value="Aéreo">Aéreo</option>
                              <option value="Terrestre">Terrestre</option>
                              <option value="Multimodal">Multimodal</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Contenido / Valoración en Aduana (Moneda, Cotización, Condición de Venta, Valor FC, Flete, Seguro, Ajuste a incluir, Ajuste a deducir, CIF) */}
                    <div className="pt-4 border-t border-slate-200">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Contenido y Base Imponible (Moneda · Cotización · Condición de Venta · Valor FC · Flete · Seguro · Ajustes a incluir · Ajustes a deducir · CIF)
                          </h3>
                        </div>
                        <span className="text-xs text-slate-500">
                          Fórmula automática:{' '}
                          <strong className="text-slate-700">
                            CIF = Valor FC + Flete + Seguro + Ajustes a incluir - Ajustes a deducir
                          </strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3 bg-slate-900 text-white p-4 rounded-lg">
                        {/* 1. Lista desplegable de Divisa */}
                        <div title="Divisa de la factura comercial y base imponible">
                          <label className="block text-[11px] font-medium text-slate-300 mb-1">
                            Divisa
                          </label>
                          <select
                            value={settlement.currency || 'USD'}
                            onChange={(e) => updateField('currency', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs font-bold text-slate-900 bg-white rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
                          >
                            <option value="USD">USD — Dólar ($)</option>
                            <option value="EUR">EUR — Euro (€)</option>
                            <option value="BRL">BRL — Real (R$)</option>
                            <option value="PYG">PYG — Guaraní (₲)</option>
                            <option value="ARS">ARS — Peso Arg. ($)</option>
                            <option value="CNY">CNY — Yuan (¥)</option>
                            <option value="GBP">GBP — Libra (£)</option>
                            <option value="CLP">CLP — Peso Ch. ($)</option>
                            <option value="UYU">UYU — Peso Urug. ($)</option>
                            <option value="JPY">JPY — Yen (¥)</option>
                          </select>
                        </div>

                        {/* 2. Cotización */}
                        <div title={`Tipo de cambio oficial del día en Guaraníes por cada unidad de ${settlement.currency || 'USD'}`}>
                          <label className="block text-[11px] font-medium text-slate-300 mb-1">
                            Cotización
                          </label>
                          <input
                            type="number"
                            step="10"
                            min="1"
                            value={settlement.exchangeRate || ''}
                            onChange={(e) =>
                              updateField(
                                'exchangeRate',
                                e.target.value === ''
                                  ? 0
                                  : Number(e.target.value)
                              )
                            }
                            className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums font-bold text-slate-900 bg-white rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                          />
                        </div>

                        {/* 3. Condición de Venta */}
                        <div title="Condición de venta comercial / Incoterm de la transacción">
                          <label className="block text-[11px] font-medium text-slate-300 mb-1">
                            Condición Venta
                          </label>
                          <select
                            value={settlement.saleCondition || settlement.incoterm || 'FOB'}
                            onChange={(e) => {
                              updateField('saleCondition', e.target.value);
                              updateField('incoterm', e.target.value);
                            }}
                            className="w-full px-2 py-1.5 text-xs font-bold text-slate-900 bg-white rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
                          >
                            <option value="FOB">FOB — Free on Board</option>
                            <option value="CIF">CIF — Cost, Ins. & Freight</option>
                            <option value="CFR">CFR — Cost & Freight</option>
                            <option value="FCA">FCA — Free Carrier</option>
                            <option value="EXW">EXW — Ex Works</option>
                            <option value="CIP">CIP — Carriage & Ins.</option>
                            <option value="CPT">CPT — Carriage Paid To</option>
                            <option value="DAP">DAP — Delivered At Place</option>
                            <option value="DPU">DPU — Deliv. Unloaded</option>
                            <option value="DDP">DDP — Deliv. Duty Paid</option>
                            <option value="FAS">FAS — Along Buque</option>
                          </select>
                        </div>

                        {/* 4. Valor FC (en vez de valor FOB) */}
                        <div title={`Valor de la Factura Comercial (FC) en ${settlement.currency || 'USD'}`}>
                          <label className="block text-[11px] font-medium text-slate-300 mb-1">
                            Valor FC
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={
                              settlement.fobUsd === 0 ? '' : settlement.fobUsd
                            }
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : Number(e.target.value);
                              updateField('fobUsd', val);
                              updateField('fcUsd', val);
                            }}
                            placeholder="0.00"
                            className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums font-bold text-slate-900 bg-white rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                          />
                        </div>

                        {/* 5. Flete */}
                        <div title={`Costo del flete internacional en ${settlement.currency || 'USD'}`}>
                          <label className="block text-[11px] font-medium text-slate-300 mb-1">
                            Flete
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={
                              settlement.freightUsd === 0
                                ? ''
                                : settlement.freightUsd
                            }
                            onChange={(e) =>
                              updateField(
                                'freightUsd',
                                e.target.value === ''
                                  ? 0
                                  : Number(e.target.value)
                              )
                            }
                            placeholder="0.00"
                            className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums font-bold text-slate-900 bg-white rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                          />
                        </div>

                        {/* 6. Seguro */}
                        <div title={`Prima de seguro internacional de la carga en ${settlement.currency || 'USD'}`}>
                          <label className="block text-[11px] font-medium text-slate-300 mb-1">
                            Seguro
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={
                              settlement.insuranceUsd === 0
                                ? ''
                                : settlement.insuranceUsd
                            }
                            onChange={(e) =>
                              updateField(
                                'insuranceUsd',
                                e.target.value === ''
                                  ? 0
                                  : Number(e.target.value)
                              )
                            }
                            placeholder="0.00"
                            className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums font-bold text-slate-900 bg-white rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                          />
                        </div>

                        {/* 7. Ajuste a incluir */}
                        <div title={`Valor de ajuste aduanero a incluir en la base imponible en ${settlement.currency || 'USD'}`}>
                          <label className="block text-[11px] font-medium text-slate-300 mb-1">
                            Ajuste a incluir
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={
                              !settlement.adjustmentUsd
                                ? ''
                                : settlement.adjustmentUsd
                            }
                            onChange={(e) =>
                              updateField(
                                'adjustmentUsd',
                                e.target.value === ''
                                  ? 0
                                  : Number(e.target.value)
                              )
                            }
                            placeholder="0.00"
                            className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums font-bold text-slate-900 bg-white rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                          />
                        </div>

                        {/* 8. Ajuste a deducir */}
                        <div title={`Valor de ajuste aduanero a deducir de la base imponible en ${settlement.currency || 'USD'}`}>
                          <label className="block text-[11px] font-medium text-slate-300 mb-1">
                            Ajuste a deducir
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={
                              !settlement.deductionUsd
                                ? ''
                                : settlement.deductionUsd
                            }
                            onChange={(e) =>
                              updateField(
                                'deductionUsd',
                                e.target.value === ''
                                  ? 0
                                  : Number(e.target.value)
                              )
                            }
                            placeholder="0.00"
                            className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums font-bold text-slate-900 bg-white rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                          />
                        </div>

                        {/* 9. CIF (Automático) */}
                        <div
                          className="bg-slate-800 border border-slate-700 rounded p-2.5 flex flex-col justify-center"
                          title={`Valor Imponible calculado automáticamente (Valor FC + Flete + Seguro + Ajustes a incluir - Ajustes a deducir) en ${settlement.currency || 'USD'} y convertido a Guaraníes`}
                        >
                          <span className="text-[11px] text-sky-300 font-medium block">
                            CIF (Automático)
                          </span>
                          <span className="font-mono tabular-nums text-sm font-bold text-white block">
                            {settlement.currency || 'USD'} {formatCurrencyAmount(metrics.cifAmount, settlement.currency || 'USD')}
                          </span>
                          <span className="font-mono tabular-nums text-[11px] text-slate-300 block">
                            Gs. {formatCurrencyGs(metrics.cifGs)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section B: Liquidación de Derechos y Gastos Sobre Mercadería a ser Transportada (6 Columnas) */}
                <section className="bg-white border border-slate-200 rounded-lg overflow-visible">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3.5 bg-slate-900 text-white rounded-t-lg">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold tracking-tight text-white break-words">
                          Liquidación de Derechos y Gastos Sobre Mercadería a ser Transportada
                        </h3>
                        <SectionTooltip
                          title="Detalle de Mercadería y Posición Arancelaria"
                          purpose="Registra los Bultos, Unidad de Medida, Descripción de la mercadería, Partida Arancelaria (NCM), Valor Imponible y Porcentaje Arancelario (%)."
                          problemSolved="Permite verificar de un vistazo qué mercadería se está nacionalizando y bajo qué posición arancelaria tributa en el despacho."
                        />
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 break-words">
                        Bultos · Unidad Medida · Descripción · Part Arancel · Valor · Porc. Arancelaria %
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddMerchandiseRow}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Mercadería</span>
                    </button>
                  </div>

                  {/* MOBILE VIEW (< 768px): Zero-Scroll Stacked Merchandise Cards */}
                  <div className="md:hidden divide-y divide-slate-200">
                    {(settlement.merchandiseItems || []).map((m, idx) => (
                      <div key={m.id} className="p-3.5 space-y-2.5 bg-white">
                        {/* Row 1: Descripción + Quitar */}
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                              Descripción de Mercadería #{idx + 1}
                            </label>
                            <button
                              type="button"
                              onClick={() => handleRemoveMerchandiseRow(m.id)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="Eliminar fila de mercadería"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Quitar</span>
                            </button>
                          </div>
                          <input
                            type="text"
                            value={m.description}
                            onChange={(e) =>
                              handleUpdateMerchandiseRow(
                                m.id,
                                'description',
                                e.target.value
                              )
                            }
                            placeholder="Descripción de la mercadería..."
                            className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none"
                          />
                        </div>

                        {/* Row 2: 3-Col Grid (Bultos | Unidad Medida | Porc. Arancel %) */}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-500 mb-1">
                              Bultos
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={m.packages || ''}
                              onChange={(e) =>
                                handleUpdateMerchandiseRow(
                                  m.id,
                                  'packages',
                                  Number(e.target.value) || 0
                                )
                              }
                              className="w-full px-2.5 py-2 text-xs font-mono tabular-nums font-semibold text-center bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-500 mb-1">
                              Unidad Medida
                            </label>
                            <input
                              type="text"
                              value={m.unit}
                              onChange={(e) =>
                                handleUpdateMerchandiseRow(
                                  m.id,
                                  'unit',
                                  e.target.value
                                )
                              }
                              placeholder="BULTOS"
                              className="w-full px-2.5 py-2 text-xs font-medium text-center bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-500 mb-1 text-right">
                              Arancel %
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              value={m.tariffPercent ?? ''}
                              onChange={(e) =>
                                handleUpdateMerchandiseRow(
                                  m.id,
                                  'tariffPercent',
                                  Number(e.target.value) || 0
                                )
                              }
                              className="w-full px-2.5 py-2 text-xs font-mono tabular-nums font-semibold text-right bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Row 3: 2-Col Grid (Part Arancel NCM | Valor Gs.) */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-500 mb-1">
                              Part. Arancelaria
                            </label>
                            <input
                              type="text"
                              value={m.tariffCode}
                              onChange={(e) =>
                                handleUpdateMerchandiseRow(
                                  m.id,
                                  'tariffCode',
                                  e.target.value
                                )
                              }
                              placeholder="8431.49.29"
                              className="w-full px-2.5 py-2 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-500 mb-1 text-right">
                              Valor (Gs.)
                            </label>
                            <input
                              type="number"
                              step="1000"
                              value={m.valueGs || ''}
                              onChange={(e) =>
                                handleUpdateMerchandiseRow(
                                  m.id,
                                  'valueGs',
                                  Number(e.target.value) || 0
                                )
                              }
                              className="w-full px-2.5 py-2 text-xs font-mono tabular-nums font-bold text-right bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* DESKTOP VIEW (>= 768px): 6-Column Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                          <th className="py-2.5 px-3 w-24 text-center">Bultos</th>
                          <th className="py-2.5 px-3 w-32 text-center">
                            Unidad Medida
                          </th>
                          <th className="py-2.5 px-3 min-w-[200px]">
                            Descripción
                          </th>
                          <th className="py-2.5 px-3 w-36 text-center">
                            Part Arancel
                          </th>
                          <th className="py-2.5 px-3 w-40 text-right">
                            Valor (Gs.)
                          </th>
                          <th className="py-2.5 px-3 w-32 text-right">
                            Porc. Arancelaria %
                          </th>
                          <th className="py-2.5 px-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(settlement.merchandiseItems || []).map((m) => (
                          <tr
                            key={m.id}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="0"
                                value={m.packages || ''}
                                onChange={(e) =>
                                  handleUpdateMerchandiseRow(
                                    m.id,
                                    'packages',
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="w-full px-2 py-1.5 text-xs font-mono tabular-nums text-center bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-blue-600 focus:outline-none"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={m.unit}
                                onChange={(e) =>
                                  handleUpdateMerchandiseRow(
                                    m.id,
                                    'unit',
                                    e.target.value
                                  )
                                }
                                placeholder="BULTOS / UN"
                                className="w-full px-2 py-1.5 text-xs text-center font-medium bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-blue-600 focus:outline-none"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={m.description}
                                onChange={(e) =>
                                  handleUpdateMerchandiseRow(
                                    m.id,
                                    'description',
                                    e.target.value
                                  )
                                }
                                placeholder="Descripción de la mercadería..."
                                className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-blue-600 focus:outline-none"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={m.tariffCode}
                                onChange={(e) =>
                                  handleUpdateMerchandiseRow(
                                    m.id,
                                    'tariffCode',
                                    e.target.value
                                  )
                                }
                                placeholder="8431.49.29"
                                className="w-full px-2 py-1.5 text-xs font-mono tabular-nums text-center bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-blue-600 focus:outline-none"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                step="1000"
                                value={m.valueGs || ''}
                                onChange={(e) =>
                                  handleUpdateMerchandiseRow(
                                    m.id,
                                    'valueGs',
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="w-full px-2 py-1.5 text-xs font-mono tabular-nums font-semibold text-right bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-blue-600 focus:outline-none"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                step="0.5"
                                value={m.tariffPercent ?? ''}
                                onChange={(e) =>
                                  handleUpdateMerchandiseRow(
                                    m.id,
                                    'tariffPercent',
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="w-full px-2 py-1.5 text-xs font-mono tabular-nums text-right bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-blue-600 focus:outline-none"
                              />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveMerchandiseRow(m.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                                title="Eliminar fila de mercadería"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Dynamic 3-Column Tables: 1. DETALLE DE TRIBUTOS ADUANEROS Y SERVICIOS, 2. DETALLE DE TASAS Y OTROS COSTOS, 3. DETALLE DE SERVICIOS INTERNOS */}
                <DynamicExpenseTable
                  sectionIndex="01"
                  title="DETALLE DE TRIBUTOS ADUANEROS Y SERVICIOS — Liquidación De Despacho"
                  subtitle="DERECHO ADUANERO · SERVICIO DE VALORACION · IRE GENERAL 700 · I.V.A. · TASA INTERVENCION ADUANERA"
                  tooltipPurpose="Desglosa en 3 columnas (Descripción, Datos Adicionales como S/ DESPACHO y Valor) los tributos oficiales de aduana."
                  tooltipProblem="Permite verificar exactamente cuánto suma el bloque impositivo de despacho y recalcularlo desde el CIF en un clic."
                  items={settlement.customsDuties}
                  onAddItem={() => handleAddRow('customsDuties')}
                  onUpdateItem={(id, field, value) =>
                    handleUpdateRow('customsDuties', id, field, value)
                  }
                  onRemoveItem={(id) => handleRemoveRow('customsDuties', id)}
                  onQuickCalculate={handleRecalculateDutiesFromCif}
                  quickCalculateLabel="Estimar Tributos s/ CIF"
                />

                <DynamicExpenseTable
                  sectionIndex="02"
                  title="DETALLE DE TASAS Y OTROS COSTOS"
                  subtitle="FOTOCOPIAS DE DOCUMENTOS · TASAS PORTUARIAS · CANON INFORMATICO · TASA INTERVENCION ANNP"
                  tooltipPurpose="Registra en 3 columnas los gastos operativos y tasas con su número de comprobante o referencia S/DESPACHO."
                  tooltipProblem="Evita omisiones de facturas de terceros al reembolsar gastos y mantiene ordenado cada comprobante."
                  items={settlement.ratesAndCosts}
                  onAddItem={() => handleAddRow('ratesAndCosts')}
                  onUpdateItem={(id, field, value) =>
                    handleUpdateRow('ratesAndCosts', id, field, value)
                  }
                  onRemoveItem={(id) => handleRemoveRow('ratesAndCosts', id)}
                />

                <DynamicExpenseTable
                  sectionIndex="03"
                  title="DETALLE DE SERVICIOS INTERNOS"
                  subtitle="GASTOS DE DESPACHO · HONORARIOS PROFESIONALES · DESCUENTO HONORARIOS (permite valores negativos)"
                  tooltipPurpose="Detalla los gastos de despacho, honorarios profesionales y posibles descuentos (ej. -589.901) para obtener el Total de servicios."
                  tooltipProblem="Separa claramente los honorarios e incluye soporte para descuentos directos sobre honorarios."
                  items={settlement.internalServices}
                  onAddItem={() => handleAddRow('internalServices')}
                  onUpdateItem={(id, field, value) =>
                    handleUpdateRow('internalServices', id, field, value)
                  }
                  onRemoveItem={(id) => handleRemoveRow('internalServices', id)}
                />

                {/* 04. DETALLE DE MONTOS RECIBIDOS */}
                <ReceivedPaymentsTable
                  sectionIndex="04"
                  items={settlement.receivedPayments || []}
                  onAddItem={handleAddPaymentRow}
                  onUpdateItem={handleUpdatePaymentRow}
                  onRemoveItem={handleRemovePaymentRow}
                  onMarkFullPaid={handleMarkFullPaid}
                />

                {/* Monto en Letras y Observación Section */}
                <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <label
                        htmlFor="amount-in-words"
                        className="text-xs font-bold uppercase tracking-wider text-slate-700"
                      >
                        Monto en Letras (Autocalculado del Total General o Editable)
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Total General: Gs. {formatCurrencyGs(metrics.grandTotalGs)}
                      </span>
                    </div>
                    <input
                      id="amount-in-words"
                      type="text"
                      value={settlement.amountInWords || ''}
                      onChange={(e) =>
                        updateField('amountInWords', e.target.value)
                      }
                      placeholder={metrics.computedAmountInWords}
                      className="w-full px-3.5 py-2 text-xs font-mono font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none uppercase"
                    />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <label
                          htmlFor="settlement-notes"
                          className="text-xs font-bold uppercase tracking-wider text-slate-700"
                        >
                          Observación (Devoluciones / Saldo a Favor / Notas Adjuntas)
                        </label>
                        <SectionTooltip
                          title="Observación y Monto en Letras"
                          purpose="Muestra el Total General expresado en letras mayúsculas y la observación de cierre (ej. devolución o saldo a favor del cliente con Nro. de Operación)."
                          problemSolved="Brinda respaldo formal contable y deja constancia clara de devoluciones o saldos en una sola hoja."
                        />
                      </div>
                      <span className="text-xs text-slate-400">
                        Se imprime al pie de la hoja única
                      </span>
                    </div>
                    <textarea
                      id="settlement-notes"
                      rows={2}
                      value={settlement.notes}
                      onChange={(e) => updateField('notes', e.target.value)}
                      placeholder="Ej. Observación a Favor de PETRA 626.882.- (Devolución hecha el 10/02/26 Nro.Op:147772927) Adjunto"
                      className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none leading-relaxed"
                    />
                  </div>
                </section>
              </div>

              {/* Right Column (4 cols): Real-Time Financial Summary + Interactive History Panel */}
              <div className="xl:col-span-4 space-y-6">
                {/* Real-Time Calculation Card: Total General, Monto Recibido y Saldo */}
                <section className="bg-white border border-slate-200 rounded-lg overflow-visible">
                  <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between rounded-t-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold tracking-tight">
                          Liquidación en Tiempo Real
                        </h2>
                        <SectionTooltip
                          align="right"
                          title="Cálculo de Total, Anticipo y Saldo"
                          purpose="Suma al instante las 3 tablas de gastos, descuenta el anticipo recibido del cliente y muestra el saldo exacto a pagar o a favor."
                          problemSolved="Elimina descuadres de caja mostrando simultáneamente los totales en moneda local (Gs.) y en dólares (USD) antes de emitir el PDF."
                        />
                      </div>
                      <p className="text-xs text-slate-300">
                        Total General, Monto Recibido y Saldo
                      </p>
                    </div>
                    <span className="font-mono tabular-nums text-xs text-sky-300">
                      T.C. Gs. {formatCurrencyGs(settlement.exchangeRate)}
                    </span>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Subtotals Breakdown */}
                    <div className="space-y-2 text-xs border-b border-slate-200 pb-4">
                      <div className="flex justify-between text-slate-600">
                        <span>01. Tributos Aduaneros:</span>
                        <span className="font-mono tabular-nums font-semibold text-slate-900">
                          Gs. {formatCurrencyGs(metrics.totalDutiesGs)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>02. Tasas y Costos Operativos:</span>
                        <span className="font-mono tabular-nums font-semibold text-slate-900">
                          Gs. {formatCurrencyGs(metrics.totalRatesGs)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>03. Servicios Internos / Honorarios:</span>
                        <span className="font-mono tabular-nums font-semibold text-slate-900">
                          Gs. {formatCurrencyGs(metrics.totalServicesGs)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-700 pt-1.5 border-t border-slate-100 font-medium">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                          <span>04. Montos Recibidos (Total):</span>
                        </span>
                        <span className="font-mono tabular-nums font-bold text-emerald-800">
                          Gs. {formatCurrencyGs(metrics.amountReceivedGs)}
                        </span>
                      </div>
                    </div>

                    {/* Total General */}
                    <div className="bg-slate-900 text-white rounded-lg p-4">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                          Total General
                        </span>
                        <span className="font-mono tabular-nums text-xl font-bold text-white">
                          Gs. {formatCurrencyGs(metrics.grandTotalGs)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1 text-xs text-slate-300">
                        <span>Equivalente en Dólares:</span>
                        <span className="font-mono tabular-nums font-semibold text-sky-300">
                          USD {formatCurrencyUsd(metrics.grandTotalUsd)}
                        </span>
                      </div>
                    </div>

                    {/* Monto Recibido / Anticipo del Cliente (Gs.) — Suma de 04. DETALLE DE MONTOS RECIBIDOS */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="amount-received-input"
                          className="text-xs font-bold text-slate-700"
                        >
                          Monto Recibido / Anticipo del Cliente (Gs.)
                        </label>
                        <span className="text-[10.5px] text-slate-500 font-medium">
                          {(settlement.receivedPayments || []).length} pago(s) en 04
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs font-mono font-bold text-emerald-700 pointer-events-none">
                          Gs.
                        </span>
                        <input
                          id="amount-received-input"
                          type="text"
                          readOnly
                          value={formatCurrencyGs(metrics.amountReceivedGs)}
                          className="w-full pl-10 pr-3 py-2.5 text-sm font-mono tabular-nums font-bold text-emerald-900 bg-emerald-50/80 border border-emerald-300 rounded-md focus:bg-white focus:border-emerald-600 focus:outline-none cursor-default shadow-xs"
                          title="Suma automática de todos los pagos registrados en la sección 04"
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500">
                        <button
                          type="button"
                          onClick={handleMarkFullPaid}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                          title="Registra un pago para cubrir el 100% del saldo y dejar la liquidación en 0 Gs."
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Marcar 100% cancelado</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSettlement((prev) => ({
                              ...prev,
                              receivedPayments: [],
                              amountReceived: 0,
                            }));
                            showNotice('Montos recibidos restablecidos a Gs. 0');
                          }}
                          className="text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                        >
                          Sin anticipo (Gs. 0)
                        </button>
                      </div>
                    </div>

                    {/* Saldo Resultante */}
                    <div
                      className={`rounded-lg p-4 border ${
                        metrics.balanceGs > 0
                          ? 'bg-amber-50/70 border-amber-300 text-slate-900'
                          : metrics.balanceGs < 0
                          ? 'bg-emerald-50/70 border-emerald-300 text-slate-900'
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          {metrics.balanceGs > 0
                            ? 'Saldo a Pagar (Cliente)'
                            : metrics.balanceGs < 0
                            ? 'Saldo a Favor del Cliente'
                            : 'Saldo Cancelado'}
                        </span>
                        <span className="font-mono tabular-nums text-lg font-bold text-slate-900">
                          Gs. {formatCurrencyGs(Math.abs(metrics.balanceGs))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1 text-xs text-slate-600">
                        <span>Equivalente USD:</span>
                        <span className="font-mono tabular-nums font-semibold">
                          USD {formatCurrencyUsd(Math.abs(metrics.balanceUsd))}
                        </span>
                      </div>
                    </div>

                    {/* Primary Document Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => handleSaveToHistory()}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-colors cursor-pointer"
                        title="Guarda los cambios actuales en el historial"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar Borrador</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveToHistory('Enviada', true)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                        title="Registra la liquidación como Enviada y avanza automáticamente el Nº Secuencial para el próximo despacho"
                      >
                        <Send className="w-3.5 h-3.5 text-sky-400" />
                        <span>Registrar y Avanzar Nº</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportPdfAndPreview}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors cursor-pointer"
                      title="Genera el archivo PDF oficial y muestra la vista previa de factura"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Imprimir / Exportar a PDF</span>
                    </button>
                  </div>
                </section>

                {/* Panel de Historial & Búsqueda Rápida de Documentos Recientes */}
                <section className="bg-white border border-slate-200 rounded-lg overflow-visible">
                  <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-sky-400" />
                      <h2 className="text-sm font-semibold tracking-tight">
                        Historial Reciente
                      </h2>
                      <SectionTooltip
                        align="right"
                        title="Historial y Búsqueda Rápida"
                        purpose="Almacena todas las liquidaciones emitidas o enviadas para consultarlas, reimprimir su PDF o duplicarlas como plantilla."
                        problemSolved="Evita volver a cargar desde cero operaciones recurrentes del mismo cliente importador y permite auditar envíos previos en segundos."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveView('historial')}
                      className="text-xs text-sky-300 hover:underline cursor-pointer"
                    >
                      Ver todo ({history.length})
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Quick filter tabs (5 equal columns, zero horizontal scroll) */}
                    <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 rounded-md w-full">
                      {['Todos', 'Emitida', 'Enviada', 'Pagada', 'Borrador'].map(
                        (st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setStatusFilter(st)}
                            className={`py-1.5 px-1 text-[11px] font-medium text-center rounded transition-colors truncate cursor-pointer ${
                              statusFilter === st
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {st}
                          </button>
                        )
                      )}
                    </div>

                    <div className="divide-y divide-slate-200 max-h-[380px] overflow-y-auto">
                      {filteredHistory.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-500">
                          No se encontraron liquidaciones con ese criterio.
                        </div>
                      ) : (
                        filteredHistory.map((item) => {
                          const itemMetrics = calculateSettlementMetrics(item);
                          const isCurrent =
                            item.id === settlement.id ||
                            item.sequentialNumber ===
                              settlement.sequentialNumber;

                          return (
                            <div
                              key={item.id}
                              className={`py-3 px-2.5 transition-colors rounded ${
                                isCurrent
                                  ? 'bg-slate-100/90'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <span className="font-mono tabular-nums font-bold text-slate-900">
                                      Nº {item.sequentialNumber}
                                    </span>
                                    <span
                                      aria-hidden="true"
                                      className="text-slate-400"
                                    >
                                      ·
                                    </span>
                                    <span className="font-mono tabular-nums text-slate-500">
                                      {item.date}
                                    </span>
                                    <span
                                      aria-hidden="true"
                                      className="text-slate-400"
                                    >
                                      ·
                                    </span>
                                    <span className="font-medium text-slate-700">
                                      {item.status}
                                    </span>
                                  </div>
                                  <div className="text-xs font-semibold text-slate-900 mt-0.5">
                                    {item.clientName ||
                                      'Cliente sin especificar'}
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    RUC:{' '}
                                    <span className="font-mono tabular-nums">
                                      {item.clientRuc || '—'}
                                    </span>{' '}
                                    · Despacho:{' '}
                                    <span className="font-mono tabular-nums">
                                      {item.dispatchNumber || '—'}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="font-mono tabular-nums text-xs font-bold text-slate-900 block">
                                    Gs.{' '}
                                    {formatCurrencyGs(itemMetrics.grandTotalGs)}
                                  </span>
                                  <span className="font-mono tabular-nums text-[11px] text-slate-500 block">
                                    Saldo: Gs.{' '}
                                    {formatCurrencyGs(itemMetrics.balanceGs)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-1.5 mt-2 pt-1.5 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => setPreviewSettlement(item)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                  title="Vista previa del documento antes de descargar"
                                >
                                  <Eye className="w-3 h-3 text-blue-600" />
                                  <span>Previa</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleLoadSettlement(item)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                >
                                  <FolderOpen className="w-3 h-3" />
                                  <span>Cargar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSettlement(item);
                                    setActiveView('documento');
                                    exportSettlementToPdf(item, company);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                >
                                  <Printer className="w-3 h-3" />
                                  <span>Exportar PDF</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDuplicateSettlement(item)
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                  title="Duplica este despacho asignando automáticamente el próximo Nº Secuencial"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>Duplicar</span>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* VIEW 2: VISTA DE FACTURA / DOCUMENTO OFICIAL PARA IMPRIMIR O EXPORTAR PDF */}
          {activeView === 'documento' && (
            <PrintInvoiceDocument
              settlement={settlement}
              company={company}
              isStandaloneView={true}
              onBackToEditor={() => setActiveView('liquidacion')}
              onExportStandaloneHtml={handleExportStandaloneHtml}
              onExportPdfFile={() => {
                const fileName = exportSettlementToPdf(settlement, company);
                showNotice(`Archivo PDF descargado: ${fileName}`);
              }}
              onExportExcelFile={() => {
                const fileName = exportSettlementToExcel(settlement, company);
                showNotice(`Archivo Excel (.xlsx) estructurado descargado: ${fileName}`);
              }}
              onMarkAsSent={() => handleSaveToHistory('Enviada', true)}
            />
          )}

          {/* VIEW: DASHBOARD DE DATA VISUALIZATION Y GESTIÓN DE SALDOS */}
          {activeView === 'dashboard' && (
            <DashboardSettlements
              companySettings={company}
              historySettlements={history}
              currentSettlement={settlement}
              onGoToEditor={() => setActiveView('liquidacion')}
            />
          )}

          {/* VIEW 3: HISTORIAL COMPLETO Y BÚSQUEDA AVANZADA DE DOCUMENTOS ENVIADOS */}
          {activeView === 'historial' && (
            <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">
                    Historial de Liquidaciones y Documentos Enviados
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Consulte, filtre, descargue en PDF o duplique liquidaciones aduaneras previas
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleNewSettlement}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Nueva Liquidación (Auto-Nº)</span>
                  </button>
                </div>
              </div>

              <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrar por Nº secuencial, cliente, RUC, factura, despacho o remitente..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-5 sm:flex items-center gap-1 p-1 bg-slate-200/70 rounded-md w-full sm:w-auto">
                  {['Todos', 'Emitida', 'Enviada', 'Pagada', 'Borrador'].map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatusFilter(st)}
                        className={`py-1.5 px-1 sm:px-3 text-[11px] sm:text-xs font-medium text-center rounded transition-colors truncate cursor-pointer ${
                          statusFilter === st
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                      <th className="py-3 px-4">Secuencial / Fecha</th>
                      <th className="py-3 px-4">Cliente / RUC</th>
                      <th className="py-3 px-4">Remitente / Transporte</th>
                      <th className="py-3 px-4">Despacho / Factura</th>
                      <th className="py-3 px-4 text-right">Valor CIF</th>
                      <th className="py-3 px-4 text-right">
                        Total General (Gs.)
                      </th>
                      <th className="py-3 px-4 text-right">Saldo (Gs.)</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredHistory.map((item) => {
                      const m = calculateSettlementMetrics(item);
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3 px-4 align-middle">
                            <div className="font-mono tabular-nums font-bold text-slate-900">
                              {item.sequentialNumber}
                            </div>
                            <div className="font-mono tabular-nums text-[11px] text-slate-500">
                              {item.date}
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <div className="font-semibold text-slate-900">
                              {item.clientName}
                            </div>
                            <div className="font-mono tabular-nums text-[11px] text-slate-500">
                              RUC: {item.clientRuc}
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <div className="text-slate-800 font-medium">
                              {item.senderName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {item.originCountry || item.senderCountry}{item.provenanceCountry && item.provenanceCountry !== item.originCountry ? ` (vía ${item.provenanceCountry})` : ''} · {item.transportMode}
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle font-mono tabular-nums">
                            <div className="text-slate-900 font-medium flex items-center gap-1.5">
                              <span>{item.dispatchNumber}</span>
                              <span className="text-[10px] px-1 py-0.2 bg-slate-100 text-slate-700 rounded border border-slate-300">
                                {item.customsRegime || 'IC04'}
                              </span>
                              <span className="text-[10px] px-1 py-0.2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                                {item.incoterm || 'FOB'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Fact: {item.invoiceNumber}
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle text-right font-mono tabular-nums font-medium text-slate-800">
                            {item.currency || 'USD'} {formatCurrencyAmount(m.cifAmount, item.currency || 'USD')}
                          </td>
                          <td className="py-3 px-4 align-middle text-right font-mono tabular-nums font-bold text-slate-900">
                            Gs. {formatCurrencyGs(m.grandTotalGs)}
                          </td>
                          <td className="py-3 px-4 align-middle text-right font-mono tabular-nums font-semibold text-slate-800">
                            Gs. {formatCurrencyGs(m.balanceGs)}
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <span className="font-medium text-slate-700">
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 align-middle text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setPreviewSettlement(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors cursor-pointer"
                                title="Vista previa del documento oficial antes de descargar"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                <span>Vista previa</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleLoadSettlement(item)}
                                className="px-2.5 py-1 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const fileName = exportSettlementToPdf(
                                    item,
                                    company
                                  );
                                  showNotice(`PDF descargado: ${fileName}`);
                                }}
                                className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                              >
                                Descargar PDF
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteFromHistory(item.id)
                                }
                                className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                                title="Eliminar registro"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* VIEW 4: PERSONALIZACIÓN DE DATOS DE LA EMPRESA (Nombre, Logo, Slogan, Teléfono, Correo) */}
          {activeView === 'empresa' && (
            <section className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-lg overflow-visible">
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between rounded-t-lg">
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-sky-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold tracking-tight">
                        Personalización de Datos de la Empresa (Estudio Aduanero)
                      </h2>
                      <SectionTooltip
                        title="Identidad Corporativa del Estudio"
                        purpose="Permite personalizar el Nombre, Logo, Slogan, Teléfono, Correo y Cuentas Bancarias que aparecen en el membrete oficial del PDF."
                        problemSolved="Adapta el prototipo en segundos a cualquier agencia despachante o empresa logística sin tocar código."
                      />
                    </div>
                    <p className="text-xs text-slate-300">
                      Configure el Nombre, Logo, Slogan, Teléfono, Correo y Cuentas que aparecerán en el encabezado y en el PDF
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nombre de la Empresa / Estudio Aduanero
                    </label>
                    <input
                      type="text"
                      value={company.name}
                      onChange={(e) =>
                        setCompany({ ...company, name: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      RUC de la Empresa
                    </label>
                    <input
                      type="text"
                      value={company.ruc}
                      onChange={(e) =>
                        setCompany({ ...company, ruc: e.target.value })
                      }
                      className="w-full px-3 py-2 font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Slogan / Especialidad Corporativa
                  </label>
                  <input
                    type="text"
                    value={company.slogan}
                    onChange={(e) =>
                      setCompany({ ...company, slogan: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="text"
                      value={company.phone}
                      onChange={(e) =>
                        setCompany({ ...company, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Correo Electrónico Corporativo
                    </label>
                    <input
                      type="email"
                      value={company.email}
                      onChange={(e) =>
                        setCompany({ ...company, email: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          company.logoUrl && company.logoUrl.trim() !== ''
                            ? company.logoUrl
                            : renderCorporateLogoPngDataUrl(
                                company.logoText,
                                company.name
                              )
                        }
                        alt={`Logo ${company.name}`}
                        referrerPolicy="no-referrer"
                        className="w-28 h-16 rounded-md object-contain border border-slate-300 bg-white p-1 shrink-0"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 text-xs">
                          Vista Previa del Logo Corporativo (PDF, HTML e Impresión)
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Suba el logo de su empresa (PNG/JPG) o utilice el logo oficial LG Logística Aduanera por defecto.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-sky-400" />
                        <span>Subir Logo (PNG / JPG)</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              const img = new Image();
                              img.onload = () => {
                                const canvas = document.createElement('canvas');
                                canvas.width = 640;
                                canvas.height = 360;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                  ctx.fillStyle = '#ffffff';
                                  ctx.fillRect(0, 0, 640, 360);
                                  const ratio = Math.min(
                                    640 / img.width,
                                    360 / img.height
                                  );
                                  const w = img.width * ratio;
                                  const h = img.height * ratio;
                                  ctx.drawImage(
                                    img,
                                    (640 - w) / 2,
                                    (360 - h) / 2,
                                    w,
                                    h
                                  );
                                  const pngData = canvas.toDataURL('image/png');
                                  setCompany({ ...company, logoUrl: pngData });
                                  showNotice(
                                    'Logo corporativo actualizado para PDF, HTML e Impresión.'
                                  );
                                }
                              };
                              if (typeof reader.result === 'string') {
                                img.src = reader.result;
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                      {company.logoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setCompany({
                              ...company,
                              logoUrl: renderCorporateLogoPngDataUrl(
                                company.logoText,
                                company.name
                              ),
                            });
                            showNotice('Emblema corporativo generado con las siglas.');
                          }}
                          className="px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors cursor-pointer"
                        >
                          Usar Emblema por Siglas
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Siglas del Emblema (1–4 letras)
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        value={company.logoText}
                        onChange={(e) => {
                          const newText = e.target.value.toUpperCase();
                          setCompany({
                            ...company,
                            logoText: newText,
                            logoUrl: renderCorporateLogoPngDataUrl(
                              newText,
                              company.name
                            ),
                          });
                        }}
                        placeholder="MC"
                        className="w-full px-3 py-2 font-display font-bold bg-white border border-slate-300 rounded-md text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        URL o Data URI del Logo (Opcional)
                      </label>
                      <input
                        type="text"
                        value={company.logoUrl || ''}
                        onChange={(e) =>
                          setCompany({ ...company, logoUrl: e.target.value })
                        }
                        placeholder="Suba un archivo arriba o pegue una URL de imagen..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Dirección Física de Oficinas
                  </label>
                  <input
                    type="text"
                    value={company.address}
                    onChange={(e) =>
                      setCompany({ ...company, address: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Datos Bancarios para Pie de Factura / Liquidación
                  </label>
                  <input
                    type="text"
                    value={company.bankDetails}
                    onChange={(e) =>
                      setCompany({ ...company, bankDetails: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setCompany(DEFAULT_COMPANY_SETTINGS);
                      showNotice(
                        'Datos de la empresa restaurados a los valores por defecto.'
                      );
                    }}
                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                  >
                    Restaurar Valores por Defecto
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      showNotice(
                        'Datos corporativos actualizados correctamente.'
                      );
                      setActiveView('liquidacion');
                    }}
                    className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors cursor-pointer"
                  >
                    Guardar y Volver a Liquidación
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* MODAL DE VISTA PREVIA RÁPIDA (CON ÍCONO DE OJO) ANTES DE DESCARGAR */}
      {previewSettlement && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xs"
          onClick={() => setPreviewSettlement(null)}
        >
          <div
            className="relative w-full max-w-5xl bg-slate-100 border border-slate-300 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[94vh] max-h-[94vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header (Fijo arriba) */}
            <div className="flex items-center justify-between px-3 sm:px-6 py-3 bg-slate-900 text-white shrink-0 border-b border-slate-800 z-10 shadow-sm">
              <div className="flex items-center gap-2.5 truncate">
                <div className="p-1.5 bg-sky-500/20 text-sky-400 rounded-md border border-sky-400/30 shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                      Vista Previa — Liquidación Nº {previewSettlement.sequentialNumber}
                    </h3>
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-200 rounded border border-slate-700 font-mono shrink-0">
                      {previewSettlement.status}
                    </span>
                  </div>
                  <p className="text-[10.5px] sm:text-[11px] text-slate-300 truncate">
                    {previewSettlement.clientName} · Despacho: {previewSettlement.dispatchNumber || 'S/N'} · Fecha: {previewSettlement.date}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* [Editar Datos] */}
                <button
                  type="button"
                  onClick={() => {
                    handleLoadSettlement(previewSettlement);
                    setPreviewSettlement(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-md transition-colors cursor-pointer shadow-2xs"
                  title="Abre el formulario de edición de campos y rubros"
                >
                  <Edit className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden sm:inline">Editar Datos</span>
                </button>

                {/* [Descargar PDF] */}
                <button
                  type="button"
                  onClick={() => {
                    const fileName = exportSettlementToPdf(previewSettlement, company);
                    showNotice(`PDF descargado exitosamente: ${fileName}`);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors cursor-pointer shadow-xs"
                  title="Genera el documento A4 formateado"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Descargar PDF</span>
                </button>

                {/* [Descargar Excel (.xlsx)] */}
                <button
                  type="button"
                  onClick={() => {
                    const fileName = exportSettlementToExcel(previewSettlement, company);
                    showNotice(`Excel estructurado descargado: ${fileName}`);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-md transition-colors cursor-pointer shadow-xs"
                  title="Dispara la descarga inmediata del archivo de Excel estructurado (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                  <span className="hidden sm:inline">Descargar Excel (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSettlement(previewSettlement);
                    setActiveView('documento');
                    setPreviewSettlement(null);
                  }}
                  className="hidden md:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors cursor-pointer"
                  title="Abrir en pantalla completa de Vista Factura"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Pantalla Completa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSettlement(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer ml-1"
                  title="Cerrar vista previa (Escape)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: ÁREA CON SCROLL SUAVE ACTIVO Y COMPLETO */}
            <div
              tabIndex={0}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 sm:p-5 bg-slate-200/90 focus:outline-none"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <div className="max-w-[210mm] mx-auto pb-14 sm:pb-20">
                <div className="bg-white rounded-md shadow-xl border border-slate-300 overflow-hidden">
                  <PrintInvoiceDocument
                    settlement={previewSettlement}
                    company={company}
                    isStandaloneView={false}
                    showTopActionBar={false}
                    onBackToEditor={() => {
                      handleLoadSettlement(previewSettlement);
                      setPreviewSettlement(null);
                    }}
                    onExportPdfFile={() => {
                      const fileName = exportSettlementToPdf(previewSettlement, company);
                      showNotice(`PDF descargado exitosamente: ${fileName}`);
                    }}
                    onExportExcelFile={() => {
                      const fileName = exportSettlementToExcel(previewSettlement, company);
                      showNotice(`Excel estructurado descargado: ${fileName}`);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer: barra informativa con acceso rápido */}
            <div className="shrink-0 px-4 py-2 bg-slate-100 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span>Desplaza con la rueda del mouse, trackpad o arrastra para revisar todo el documento</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewSettlement(null)}
                className="font-medium text-slate-700 hover:text-slate-950 underline cursor-pointer"
              >
                Cerrar vista previa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
