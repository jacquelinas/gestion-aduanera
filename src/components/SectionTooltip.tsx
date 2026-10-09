import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface SectionTooltipProps {
  title: string;
  purpose: string;
  problemSolved: string;
  align?: 'left' | 'right';
}

export const SectionTooltip: React.FC<SectionTooltipProps> = ({
  title,
  purpose,
  problemSolved,
  align = 'left',
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label={`Ayuda sobre ${title}`}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium text-sky-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded transition-colors cursor-pointer shrink-0"
      >
        <HelpCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        <span className="hidden sm:inline">¿Para qué sirve?</span>
      </button>

      {open && (
        <div
          role="tooltip"
          className={`absolute z-50 top-full mt-2 w-72 sm:w-80 p-3.5 bg-slate-900 text-white text-xs rounded-lg border border-slate-700 shadow-xl pointer-events-none ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="font-semibold text-sky-300 mb-1.5">{title}</div>
          <p className="text-slate-200 leading-relaxed mb-2">
            <strong className="text-white">Función:</strong> {purpose}
          </p>
          <p className="text-slate-300 leading-relaxed border-t border-slate-800 pt-2">
            <strong className="text-emerald-400">Problema que resuelve:</strong>{' '}
            {problemSolved}
          </p>
        </div>
      )}
    </div>
  );
};
