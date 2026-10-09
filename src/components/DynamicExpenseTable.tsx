import React from 'react';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { LineItem } from '../types';
import { formatCurrencyGs } from '../utils/formatters';
import { SectionTooltip } from './SectionTooltip';

interface DynamicExpenseTableProps {
  sectionIndex: string;
  title: string;
  subtitle: string;
  tooltipPurpose: string;
  tooltipProblem: string;
  items: LineItem[];
  onAddItem: () => void;
  onUpdateItem: (id: string, field: keyof LineItem, value: string | number | boolean) => void;
  onRemoveItem: (id: string) => void;
  onQuickCalculate?: () => void;
  quickCalculateLabel?: string;
}

export const DynamicExpenseTable: React.FC<DynamicExpenseTableProps> = ({
  sectionIndex,
  title,
  subtitle,
  tooltipPurpose,
  tooltipProblem,
  items,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onQuickCalculate,
  quickCalculateLabel,
}) => {
  const subtotalGs = items.reduce((sum, item) => sum + (Number(item.amountGs) || 0), 0);

  return (
    <section className="bg-white border border-slate-200 rounded-lg overflow-visible">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3.5 bg-slate-900 text-white rounded-t-lg">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-white break-words">
              {sectionIndex}. {title}
            </h3>
            <SectionTooltip
              title={`${sectionIndex}. ${title}`}
              purpose={tooltipPurpose}
              problemSolved={tooltipProblem}
            />
          </div>
          <p className="text-xs text-slate-300 mt-0.5 break-words">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onQuickCalculate && quickCalculateLabel && (
            <button
              type="button"
              onClick={onQuickCalculate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Calcula automáticamente los aranceles e impuestos tomando como base el Valor CIF"
            >
              <Calculator className="w-3.5 h-3.5 text-sky-400" />
              <span>{quickCalculateLabel}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onAddItem}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Añadir un nuevo renglón de gasto en esta categoría"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Fila</span>
          </button>
        </div>
      </div>

      {/* MOBILE VIEW (< 768px): Zero-Scroll Stacked Cards */}
      <div className="md:hidden divide-y divide-slate-200">
        {items.length === 0 ? (
          <div className="py-6 px-4 text-center text-slate-500">
            <p className="text-xs mb-2">No hay conceptos cargados en esta sección.</p>
            <button
              type="button"
              onClick={onAddItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir primer ítem</span>
            </button>
          </div>
        ) : (
          items.map((item, idx) => (
            <div key={item.id} className="p-3.5 space-y-2.5 bg-white">
              {/* Row 1: Descripción + Delete button */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Descripción #{idx + 1}
                  </label>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                    title="Eliminar fila"
                    aria-label="Eliminar fila"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Quitar</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => onUpdateItem(item.id, 'description', e.target.value)}
                  placeholder="Ej. DERECHO ADUANERO / TASAS PORTUARIAS..."
                  aria-label="Descripción"
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 rounded-md focus:outline-none transition-colors"
                />
              </div>

              {/* Row 2: 2-Column Grid (Datos Adicionales | Valor Gs.) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Datos Adicionales
                  </label>
                  <input
                    type="text"
                    value={item.documentRef}
                    onChange={(e) => onUpdateItem(item.id, 'documentRef', e.target.value)}
                    placeholder="S/ DESPACHO o Factura"
                    aria-label="Datos Adicionales"
                    className="w-full px-2.5 py-2 text-xs font-mono tabular-nums text-slate-800 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1 text-right">
                    Valor (Gs.)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-[11px] font-mono text-slate-400 pointer-events-none">
                      Gs.
                    </span>
                    <input
                      type="number"
                      step="1000"
                      value={item.amountGs === 0 ? '' : item.amountGs}
                      onChange={(e) =>
                        onUpdateItem(
                          item.id,
                          'amountGs',
                          e.target.value === '' ? 0 : Number(e.target.value)
                        )
                      }
                      placeholder="0"
                      aria-label="Valor en Guaraníes"
                      className={`w-full pl-8 pr-2.5 py-2 text-xs font-mono tabular-nums font-bold text-right bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none transition-colors ${
                        item.amountGs < 0 ? 'text-red-600' : 'text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Mobile Total Footer */}
        <div className="px-4 py-3 bg-slate-100 border-t border-slate-300 flex items-center justify-between rounded-b-lg">
          <span className="text-xs font-bold text-slate-800">Total Sección:</span>
          <span className="text-sm font-mono tabular-nums font-bold text-slate-950">
            Gs. {formatCurrencyGs(subtotalGs)}
          </span>
        </div>
      </div>

      {/* DESKTOP VIEW (>= 768px): Classic 3-Column Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <th className="py-2.5 px-4 min-w-[240px]">Descripción</th>
              <th className="py-2.5 px-4 w-64">Datos Adicionales</th>
              <th className="py-2.5 px-4 w-48 text-right">Valor (Gs.)</th>
              <th className="py-2.5 px-3 w-12 text-center" aria-label="Acciones"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 px-4 text-center text-slate-500">
                  <p className="text-xs mb-2">No hay conceptos cargados en esta sección.</p>
                  <button
                    type="button"
                    onClick={onAddItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir primer ítem</span>
                  </button>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-2 px-4 align-middle">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => onUpdateItem(item.id, 'description', e.target.value)}
                      placeholder="Ej. DERECHO ADUANERO / TASAS PORTUARIAS..."
                      aria-label="Descripción"
                      className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-900 bg-transparent border border-transparent hover:border-slate-200 focus:bg-white focus:border-blue-600 rounded focus:outline-none transition-colors"
                    />
                  </td>
                  <td className="py-2 px-4 align-middle">
                    <input
                      type="text"
                      value={item.documentRef}
                      onChange={(e) => onUpdateItem(item.id, 'documentRef', e.target.value)}
                      placeholder="Ej. S/ DESPACHO o 001-002-0003447"
                      aria-label="Datos Adicionales"
                      className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-700 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
                    />
                  </td>
                  <td className="py-2 px-4 align-middle text-right">
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-[11px] font-mono text-slate-400 pointer-events-none">
                        Gs.
                      </span>
                      <input
                        type="number"
                        step="1000"
                        value={item.amountGs === 0 ? '' : item.amountGs}
                        onChange={(e) =>
                          onUpdateItem(
                            item.id,
                            'amountGs',
                            e.target.value === '' ? 0 : Number(e.target.value)
                          )
                        }
                        placeholder="0"
                        aria-label="Valor en Guaraníes"
                        className={`w-full pl-8 pr-2.5 py-1.5 text-xs font-mono tabular-nums font-bold text-right bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-blue-600 focus:outline-none transition-colors ${
                          item.amountGs < 0 ? 'text-red-600' : 'text-slate-900'
                        }`}
                      />
                    </div>
                  </td>
                  <td className="py-2 px-3 align-middle text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      title="Eliminar fila"
                      aria-label="Eliminar fila"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 border-t border-slate-300">
              <td colSpan={2} className="py-2.5 px-4 text-right text-xs font-bold text-slate-800">
                Total:
              </td>
              <td className="py-2.5 px-4 text-right text-xs font-mono tabular-nums font-bold text-slate-900">
                {formatCurrencyGs(subtotalGs)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
};
