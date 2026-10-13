import React from 'react';
import {
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  CheckCircle2,
  ArrowRightLeft,
  Banknote,
} from 'lucide-react';
import { ReceivedPaymentItem } from '../types';
import { formatCurrencyGs } from '../utils/formatters';
import { SectionTooltip } from './SectionTooltip';

interface ReceivedPaymentsTableProps {
  sectionIndex?: string;
  items: ReceivedPaymentItem[];
  onAddItem: () => void;
  onUpdateItem: (
    id: string,
    field: keyof ReceivedPaymentItem,
    value: string | number
  ) => void;
  onRemoveItem: (id: string) => void;
  onMarkFullPaid?: () => void;
}

export const ReceivedPaymentsTable: React.FC<ReceivedPaymentsTableProps> = ({
  sectionIndex = '04',
  items,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onMarkFullPaid,
}) => {
  const totalReceived = items.reduce(
    (sum, item) => sum + (Number(item.amountGs) || 0),
    0
  );

  return (
    <section className="bg-white border border-slate-200 rounded-lg overflow-visible">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3.5 bg-slate-900 text-white rounded-t-lg">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-white break-words">
              {sectionIndex}. DETALLE DE MONTOS RECIBIDOS
            </h3>
            <SectionTooltip
              title={`${sectionIndex}. DETALLE DE MONTOS RECIBIDOS`}
              purpose="Desglosa por Método de Pago (Transferencia o Efectivo), Detalle (Banco y N° de transacción o N° de Recibo de Caja), Fecha interactiva con calendario y Valor en Guaraníes."
              problemSolved="Permite conciliar con precisión contable transferencias bancarias y cobros en ventanilla, sincronizando los datos con el Resumen y Dashboard de Liquidaciones."
            />
          </div>
          <p className="text-xs text-slate-300 mt-0.5 break-words">
            Método (Transferencia / Efectivo) · Detalle (Banco y N° Transacción / Recibo) · Fecha · Valor (Gs.)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onMarkFullPaid && (
            <button
              type="button"
              onClick={onMarkFullPaid}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Registra automáticamente un pago para saldar el 100% de la liquidación"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Marcar 100% cancelado</span>
            </button>
          )}
          <button
            type="button"
            onClick={onAddItem}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
            title="Añadir un nuevo pago o anticipo del cliente"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Pago / Anticipo</span>
          </button>
        </div>
      </div>

      {/* MOBILE VIEW (< 768px): Zero-Scroll Stacked Cards */}
      <div className="md:hidden divide-y divide-slate-200">
        {items.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500">
            No se han registrado pagos aún. Haz clic en "Añadir Pago / Anticipo".
          </div>
        ) : (
          items.map((item, idx) => {
            const currentMethod = item.method || 'Transferencia';
            const isTransfer = currentMethod === 'Transferencia';

            return (
              <div key={item.id} className="p-3.5 space-y-2.5 bg-white">
                {/* Row 1: Header de Fila + Selector de Método + Quitar */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Pago #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                    title="Eliminar este pago"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Quitar</span>
                  </button>
                </div>

                {/* Row 2: Método de Pago (Lista desplegable Transferencia / Efectivo) */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Método de Pago
                  </label>
                  <div className="relative">
                    <select
                      value={currentMethod}
                      onChange={(e) =>
                        onUpdateItem(
                          item.id,
                          'method',
                          e.target.value as 'Transferencia' | 'Efectivo'
                        )
                      }
                      className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none text-slate-900 cursor-pointer"
                    >
                      <option value="Transferencia">Transferencia Bancaria</option>
                      <option value="Efectivo">Efectivo / Caja</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: Detalle con Etiqueta Dinámica: Banco y N° de transacción vs N° de Recibo */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>
                      {isTransfer
                        ? 'Banco y N° de transacción *'
                        : 'N° de Recibo de Caja / Cobrado por *'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {isTransfer ? 'Ej. Banco Itaú' : 'Ej. Recibo Oficial'}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      onUpdateItem(item.id, 'description', e.target.value)
                    }
                    placeholder={
                      isTransfer
                        ? 'Banco y N° de transacción (ej. Banco Itaú - Transacción #147772927)'
                        : 'N° de Recibo de Caja (ej. Recibo Nº 00482 - Entregado en Tesorería)'
                    }
                    className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none"
                  />
                </div>

                {/* Row 4: Fecha (Calendario interactivo) & Valor (Gs.) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Fecha</span>
                    </label>
                    <input
                      type="date"
                      value={item.date}
                      onClick={(e) => {
                        try {
                          (e.target as HTMLInputElement).showPicker?.();
                        } catch {}
                      }}
                      onChange={(e) =>
                        onUpdateItem(item.id, 'date', e.target.value)
                      }
                      className="w-full px-2.5 py-2 text-xs font-mono tabular-nums text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1 text-right flex items-center justify-end gap-1">
                      <DollarSign className="w-3 h-3 text-slate-400" />
                      <span>Valor (Gs.)</span>
                    </label>
                    <input
                      type="number"
                      step="10000"
                      min="0"
                      value={item.amountGs === 0 ? '' : item.amountGs}
                      onChange={(e) =>
                        onUpdateItem(
                          item.id,
                          'amountGs',
                          e.target.value === '' ? 0 : Number(e.target.value)
                        )
                      }
                      placeholder="0"
                      className="w-full px-2.5 py-2 text-xs font-mono tabular-nums font-bold text-right text-emerald-800 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Mobile Total Footer */}
        <div className="p-3 bg-slate-50 flex items-center justify-between border-t border-slate-200">
          <span className="text-xs font-bold text-slate-700">
            Total Montos Recibidos:
          </span>
          <span className="font-mono tabular-nums text-sm font-bold text-emerald-800">
            Gs. {formatCurrencyGs(totalReceived)}
          </span>
        </div>
      </div>

      {/* DESKTOP VIEW (>= 768px): 4 Columns Table (Método · Detalle · Fecha · Valor Gs.) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
              <th className="py-2.5 px-3 w-44 text-left">
                <span className="flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                  <span>Método de Pago</span>
                </span>
              </th>
              <th className="py-2.5 px-3 min-w-[280px]">
                <span>Detalle del Pago (Banco y N° Transacción / N° Recibo)</span>
              </th>
              <th className="py-2.5 px-3 w-48 text-left">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Fecha (Calendario)</span>
                </span>
              </th>
              <th className="py-2.5 px-3 w-44 text-right">Valor (Gs.)</th>
              <th className="py-2.5 px-2 w-10 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-slate-500">
                  No se han registrado pagos aún. Haz clic en "Añadir Pago / Anticipo".
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const currentMethod = item.method || 'Transferencia';
                const isTransfer = currentMethod === 'Transferencia';

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* 1. Lista Desplegable: Transferencia o Efectivo */}
                    <td className="py-2 px-3 align-middle">
                      <div className="relative">
                        <select
                          value={currentMethod}
                          onChange={(e) =>
                            onUpdateItem(
                              item.id,
                              'method',
                              e.target.value as 'Transferencia' | 'Efectivo'
                            )
                          }
                          className={`w-full px-2.5 py-1.5 text-xs font-semibold rounded border focus:outline-none focus:ring-1 cursor-pointer transition-colors ${
                            isTransfer
                              ? 'bg-blue-50/60 border-blue-200 text-blue-900 focus:border-blue-600 focus:ring-blue-600'
                              : 'bg-emerald-50/60 border-emerald-200 text-emerald-900 focus:border-emerald-600 focus:ring-emerald-600'
                          }`}
                        >
                          <option value="Transferencia">Transferencia</option>
                          <option value="Efectivo">Efectivo</option>
                        </select>
                      </div>
                    </td>

                    {/* 2. Detalle: si es transferencia solicita Banco y N° transacción, si es efectivo recibo */}
                    <td className="py-2 px-3 align-middle">
                      <div className="relative">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            onUpdateItem(item.id, 'description', e.target.value)
                          }
                          placeholder={
                            isTransfer
                              ? 'Banco y N° de transacción (ej. Banco Itaú - OP Nº 147772927)'
                              : 'N° de Recibo de Caja / Cobrado por (ej. Recibo Nº 00482 - Tesorería)'
                          }
                          title={
                            isTransfer
                              ? 'Indique el Banco emisor y el N° de transacción bancaria'
                              : 'Indique el N° de Recibo de caja o comprobante de entrega en efectivo'
                          }
                          className="w-full px-2.5 py-1.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                    </td>

                    {/* 3. Fecha con selector nativo de calendario */}
                    <td className="py-2 px-3 align-middle">
                      <input
                        type="date"
                        value={item.date}
                        onClick={(e) => {
                          try {
                            (e.target as HTMLInputElement).showPicker?.();
                          } catch {}
                        }}
                        onChange={(e) =>
                          onUpdateItem(item.id, 'date', e.target.value)
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-900 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-blue-600 focus:outline-none cursor-pointer"
                      />
                    </td>

                    {/* 4. Valor (Gs.) */}
                    <td className="py-2 px-3 align-middle">
                      <input
                        type="number"
                        step="10000"
                        min="0"
                        value={item.amountGs === 0 ? '' : item.amountGs}
                        onChange={(e) =>
                          onUpdateItem(
                            item.id,
                            'amountGs',
                            e.target.value === '' ? 0 : Number(e.target.value)
                          )
                        }
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums font-bold text-right text-emerald-800 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                    </td>

                    {/* Acciones */}
                    <td className="py-2 px-2 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                        title="Eliminar este pago"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50/90 font-bold text-slate-900">
              <td colSpan={3} className="py-2.5 px-4 text-right">
                Total Montos Recibidos:
              </td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums text-sm text-emerald-800">
                Gs. {formatCurrencyGs(totalReceived)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
};
