import React, { useEffect } from 'react';
import {
  X,
  Download,
  FileDown,
  Printer,
  FolderOpen,
  Eye,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
  Edit,
} from 'lucide-react';
import { CompanySettings, CustomsSettlement } from '../types';
import { PrintInvoiceDocument } from './PrintInvoiceDocument';
import { exportSettlementToPdf } from '../utils/pdfExporter';
import { exportSettlementToExcel } from '../utils/excelExporter';
import { generateStandaloneInteractiveHtml } from '../utils/formatters';

interface DocumentPreviewModalProps {
  settlement: CustomsSettlement | null;
  company: CompanySettings;
  isOpen: boolean;
  onClose: () => void;
  onLoadIntoEditor: (settlement: CustomsSettlement) => void;
  onShowNotice: (msg: string) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  settlement,
  company,
  isOpen,
  onClose,
  onLoadIntoEditor,
  onShowNotice,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !settlement) return null;

  const handleDownloadPdf = () => {
    const fileName = exportSettlementToPdf(settlement, company);
    onShowNotice(`PDF descargado con éxito: ${fileName}`);
  };

  const handleDownloadExcel = () => {
    const fileName = exportSettlementToExcel(settlement, company);
    onShowNotice(`Excel descargado con éxito: ${fileName}`);
  };

  const handleDownloadHtml = () => {
    const htmlContent = generateStandaloneInteractiveHtml(
      settlement,
      [settlement],
      company
    );
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanSeq = settlement.sequentialNumber.replace('/', '-');
    a.download = `Liquidacion-Aduanera-${cleanSeq}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowNotice(
      `Archivo HTML descargado: Liquidacion-Aduanera-${cleanSeq}.html`
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleLoadAndClose = () => {
    onLoadIntoEditor(settlement);
    onClose();
    onShowNotice(
      `Liquidación Nº ${settlement.sequentialNumber} cargada en el editor.`
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6"
    >
      <div
        className="relative bg-slate-100 rounded-xl shadow-2xl border border-slate-300 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  id="preview-modal-title"
                  className="text-sm font-semibold tracking-tight text-white truncate"
                >
                  Vista Previa de Liquidación
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-sky-300 border border-slate-700">
                  Nº {settlement.sequentialNumber}
                </span>
                <span className="px-2 py-0.5 rounded text-[10.5px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  {settlement.status}
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate mt-0.5">
                Cliente: <strong className="text-white">{settlement.clientName || 'Sin especificar'}</strong> · RUC: {settlement.clientRuc || '—'} · Fecha: {settlement.date}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons in Modal Header */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {/* [Editar Datos] */}
            <button
              type="button"
              onClick={handleLoadAndClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-md transition-colors cursor-pointer shadow-2xs"
              title="Abre el formulario de edición de campos y rubros"
            >
              <Edit className="w-3.5 h-3.5 text-sky-400" />
              <span>Editar Datos</span>
            </button>

            {/* [Descargar PDF] */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors cursor-pointer shadow-xs"
              title="Genera el documento A4 formateado"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>

            {/* [Descargar Excel (.xlsx)] */}
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-md transition-colors cursor-pointer shadow-xs"
              title="Dispara la descarga inmediata del archivo de Excel estructurado (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>Descargar Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors cursor-pointer"
              title="Imprimir documento"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors cursor-pointer"
              title="Descargar archivo HTML interactivo"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">HTML</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer ml-1"
              title="Cerrar vista previa (Esc)"
              aria-label="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/60">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md border border-slate-300 p-2 sm:p-4">
            <PrintInvoiceDocument
              settlement={settlement}
              company={company}
              isStandaloneView={false}
              showTopActionBar={false}
              onBackToEditor={handleLoadAndClose}
              onExportStandaloneHtml={handleDownloadHtml}
              onExportPdfFile={handleDownloadPdf}
              onExportExcelFile={handleDownloadExcel}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-300 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Vista previa fiel al documento impreso y descargado.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
