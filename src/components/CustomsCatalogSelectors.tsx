import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  Check,
  Building2,
  FileCheck2,
  HelpCircle,
  Globe2,
  Flag,
  ArrowRightLeft,
  X,
} from 'lucide-react';
import {
  CUSTOMS_OFFICES,
  CUSTOMS_REGIMES,
  INCOTERMS,
  TRADING_COUNTRIES,
  CustomsOffice,
  CustomsRegime,
  Incoterm,
  TradingCountry,
} from '../data/customsCatalogs';

// ----------------------------------------------------
// 1. Selector de Aduanas de Paraguay (Filtrable por CÓD. SOFIA)
// ----------------------------------------------------
interface CustomsOfficeSelectProps {
  value: string; // Puede ser código o nombre
  onChange: (office: CustomsOffice) => void;
}

export const CustomsOfficeSelect: React.FC<CustomsOfficeSelectProps> = ({
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Encontrar la aduana seleccionada
  const selectedOffice = useMemo(() => {
    if (!value) return null;
    return (
      CUSTOMS_OFFICES.find(
        (o) =>
          o.code === value ||
          o.name.toLowerCase() === value.toLowerCase() ||
          value.startsWith(o.code)
      ) || null
    );
  }, [value]);

  // Filtrado por CÓD. SOFIA, Nombre, Predio o Departamento
  const filteredOffices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CUSTOMS_OFFICES;
    return CUSTOMS_OFFICES.filter(
      (o) =>
        o.code.toLowerCase().includes(q) ||
        o.name.toLowerCase().includes(q) ||
        o.department.toLowerCase().includes(q) ||
        o.type.toLowerCase().includes(q)
    );
  }, [search]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const tooltipText = selectedOffice
    ? `Cód. SOFIA: ${selectedOffice.code} — ${selectedOffice.name} | ${selectedOffice.type} (${selectedOffice.department})`
    : 'Filtrable por CÓD. SOFIA o nombre de administración aduanera';

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center justify-between mb-1">
        <label
          htmlFor="customs-office-btn"
          className="text-xs font-medium text-slate-700 flex items-center gap-1.5"
        >
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Aduana (CÓD. SOFIA)</span>
        </label>
        <span className="hidden sm:inline-block text-[10.5px] text-slate-600 font-mono">
          Filtro SOFIA
        </span>
      </div>

      {/* Botón trigger con Tooltip en versión Web */}
      <div className="group relative">
        <button
          id="customs-office-btn"
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            setSearch('');
          }}
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-left bg-slate-50 hover:bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="flex items-center gap-2 truncate">
            {selectedOffice ? (
              <>
                <span className="px-1.5 py-0.5 font-mono text-[11px] font-bold bg-blue-100 text-blue-800 rounded border border-blue-200 shrink-0">
                  {selectedOffice.code}
                </span>
                <span className="font-medium text-slate-900 truncate">
                  {selectedOffice.name}
                </span>
              </>
            ) : (
              <span className="text-slate-400">Seleccionar Aduana / Cód. SOFIA...</span>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1.5" />
        </button>

        {/* Tooltip Web en hover */}
        {selectedOffice && (
          <div className="hidden md:group-hover:block absolute z-30 bottom-full mb-1 left-0 w-80 p-2.5 bg-slate-900 text-white text-[11px] rounded shadow-xl border border-slate-700 pointer-events-none transition-opacity">
            <p className="font-bold text-sky-300 mb-0.5">
              Cód. SOFIA {selectedOffice.code} — {selectedOffice.name}
            </p>
            <p className="text-slate-300 text-[10px] leading-snug">
              Predio: {selectedOffice.type} · Dpto.: {selectedOffice.department}
            </p>
          </div>
        )}
      </div>

      {/* Dropdown flotante con filtro */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-300 rounded-md shadow-2xl overflow-hidden min-w-[280px]">
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por CÓD. SOFIA (ej. 002, 021) o nombre..."
              className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
            {filteredOffices.length === 0 ? (
              <div className="p-3 text-xs text-slate-600 text-center">
                No se encontró ninguna aduana con "{search}"
              </div>
            ) : (
              filteredOffices.map((office, idx) => {
                const isSelected = selectedOffice?.code === office.code && selectedOffice?.name === office.name;
                return (
                  <button
                    key={`${office.code}-${office.name}-${idx}`}
                    type="button"
                    onClick={() => {
                      onChange(office);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-blue-50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50/80 font-semibold' : ''
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 font-mono text-[11px] font-bold bg-slate-100 text-blue-700 rounded border border-slate-300">
                          {office.code}
                        </span>
                        <span className="text-slate-900 font-medium truncate">
                          {office.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-600 mt-0.5 truncate pl-0.5">
                        {office.type} · {office.department}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// 2. Selector de Regímenes Aduaneros DNIT (Filtrable por N° y CÓD.)
// ----------------------------------------------------
interface CustomsRegimeSelectProps {
  value: string; // ej. "IC04"
  onChange: (regime: CustomsRegime) => void;
}

export const CustomsRegimeSelect: React.FC<CustomsRegimeSelectProps> = ({
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Encontrar el régimen seleccionado
  const selectedRegime = useMemo(() => {
    if (!value) return null;
    return (
      CUSTOMS_REGIMES.find(
        (r) =>
          r.code.toLowerCase() === value.toLowerCase() ||
          value.toLowerCase().includes(r.code.toLowerCase())
      ) || null
    );
  }, [value]);

  // Filtrado por N°, CÓD. o Descripción
  const filteredRegimes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CUSTOMS_REGIMES;
    return CUSTOMS_REGIMES.filter(
      (r) =>
        String(r.num).includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    );
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center justify-between mb-1">
        <label
          htmlFor="customs-regime-btn"
          className="text-xs font-medium text-slate-700 flex items-center gap-1.5"
        >
          <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
          <span>Régimen Aduanero</span>
        </label>
        <span className="hidden sm:inline-block text-[10.5px] text-slate-600 font-mono">
          Filtro N° / CÓD.
        </span>
      </div>

      {/* Botón trigger con Tooltip Web */}
      <div className="group relative">
        <button
          id="customs-regime-btn"
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            setSearch('');
          }}
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-left bg-slate-50 hover:bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="flex items-center gap-2 truncate">
            {selectedRegime ? (
              <>
                <span className="px-1.5 py-0.5 font-mono text-[11px] font-bold bg-indigo-100 text-indigo-800 rounded border border-indigo-200 shrink-0">
                  {selectedRegime.code}
                </span>
                <span className="text-[11px] text-slate-600 font-mono hidden sm:inline">
                  (Nº {selectedRegime.num})
                </span>
                <span className="font-medium text-slate-900 truncate">
                  {selectedRegime.description}
                </span>
              </>
            ) : (
              <span className="text-slate-400">Seleccionar Régimen (ej. IC04)...</span>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1.5" />
        </button>

        {/* Tooltip Web en hover */}
        {selectedRegime && (
          <div className="hidden md:group-hover:block absolute z-30 bottom-full mb-1 left-0 w-84 p-2.5 bg-slate-900 text-white text-[11px] rounded shadow-xl border border-slate-700 pointer-events-none transition-opacity">
            <p className="font-bold text-amber-300 mb-0.5">
              Régimen Nº {selectedRegime.num} — Cód. {selectedRegime.code}
            </p>
            <p className="text-slate-200 text-[10.5px] leading-snug">
              {selectedRegime.description}
            </p>
          </div>
        )}
      </div>

      {/* Dropdown flotante con buscador */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-300 rounded-md shadow-2xl overflow-hidden min-w-[290px]">
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por N° (ej. 6), CÓD. (ej. IC04) o nombre..."
              className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
            {filteredRegimes.length === 0 ? (
              <div className="p-3 text-xs text-slate-600 text-center">
                No se encontró ningún régimen aduanero con "{search}"
              </div>
            ) : (
              filteredRegimes.map((regime) => {
                const isSelected = selectedRegime?.code === regime.code;
                return (
                  <button
                    key={`${regime.num}-${regime.code}`}
                    type="button"
                    onClick={() => {
                      onChange(regime);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-indigo-50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-indigo-50/80 font-semibold' : ''
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 font-mono text-[11px] font-bold bg-slate-100 text-indigo-700 rounded border border-slate-300 shrink-0">
                          {regime.code}
                        </span>
                        <span className="text-[10px] text-slate-600 font-mono shrink-0">
                          Nº {regime.num}
                        </span>
                        <span className="text-slate-900 font-medium truncate">
                          {regime.description}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// 3. Selector de Incoterms (Filtrable por CÓD.)
// ----------------------------------------------------
interface IncotermSelectProps {
  value: string; // ej. "FOB"
  onChange: (incoterm: Incoterm) => void;
}

export const IncotermSelect: React.FC<IncotermSelectProps> = ({
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Encontrar el incoterm seleccionado
  const selectedIncoterm = useMemo(() => {
    if (!value) return null;
    return (
      INCOTERMS.find(
        (i) =>
          i.code.toLowerCase() === value.toLowerCase() ||
          value.toLowerCase().startsWith(i.code.toLowerCase())
      ) || null
    );
  }, [value]);

  // Filtrado por CÓD. o Nombre
  const filteredIncoterms = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return INCOTERMS;
    return INCOTERMS.filter(
      (i) =>
        i.code.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
    );
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center justify-between mb-1">
        <label
          htmlFor="incoterm-btn"
          className="text-xs font-medium text-slate-700 flex items-center gap-1.5"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" />
          <span>Incoterms (CÓD.)</span>
        </label>
        <span className="hidden sm:inline-block text-[10.5px] text-slate-600 font-mono">
          Filtro CÓD.
        </span>
      </div>

      {/* Botón trigger con Tooltip Web */}
      <div className="group relative">
        <button
          id="incoterm-btn"
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            setSearch('');
          }}
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-left bg-slate-50 hover:bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors cursor-pointer"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="flex items-center gap-2 truncate">
            {selectedIncoterm ? (
              <>
                <span className="px-1.5 py-0.5 font-mono text-[11px] font-bold bg-emerald-100 text-emerald-800 rounded border border-emerald-200 shrink-0">
                  {selectedIncoterm.code}
                </span>
                <span className="font-medium text-slate-900 truncate">
                  {selectedIncoterm.name}
                </span>
              </>
            ) : (
              <span className="text-slate-400">Seleccionar Incoterm (FOB, CIF)...</span>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1.5" />
        </button>

        {/* Tooltip Web en hover */}
        {selectedIncoterm && (
          <div className="hidden md:group-hover:block absolute z-30 bottom-full mb-1 left-0 w-80 p-2.5 bg-slate-900 text-white text-[11px] rounded shadow-xl border border-slate-700 pointer-events-none transition-opacity">
            <p className="font-bold text-emerald-300 mb-0.5">
              {selectedIncoterm.code} — {selectedIncoterm.name}
            </p>
            <p className="text-slate-200 text-[10px] leading-snug">
              {selectedIncoterm.description}
            </p>
          </div>
        )}
      </div>

      {/* Dropdown flotante con filtro */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-300 rounded-md shadow-2xl overflow-hidden min-w-[270px]">
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por CÓD. (FOB, CIF, EXW) o nombre..."
              className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
            {filteredIncoterms.length === 0 ? (
              <div className="p-3 text-xs text-slate-600 text-center">
                No se encontró ningún Incoterm con "{search}"
              </div>
            ) : (
              filteredIncoterms.map((incoterm) => {
                const isSelected = selectedIncoterm?.code === incoterm.code;
                return (
                  <button
                    key={incoterm.code}
                    type="button"
                    onClick={() => {
                      onChange(incoterm);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-emerald-50/80 font-semibold' : ''
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 font-mono text-[11px] font-bold bg-slate-100 text-emerald-700 rounded border border-slate-300 shrink-0">
                          {incoterm.code}
                        </span>
                        <span className="text-slate-900 font-medium truncate">
                          {incoterm.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-600 mt-0.5 truncate pl-0.5">
                        {incoterm.description}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// 4. Selector de País (Origen / Procedencia) con principales socios comerciales
// ----------------------------------------------------
interface CountrySelectProps {
  label: string;
  badgeText: string;
  badgeColor?: 'sky' | 'amber';
  value: string;
  onChange: (countryName: string) => void;
  placeholder?: string;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  label,
  badgeText,
  badgeColor = 'sky',
  value,
  onChange,
  placeholder = 'Seleccionar país...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return TRADING_COUNTRIES;
    return TRADING_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q)
    );
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const badgeClass =
    badgeColor === 'amber'
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : 'bg-sky-100 text-sky-800 border-sky-200';

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
          <Globe2 className="w-3.5 h-3.5 text-slate-600" />
          <span>{label}</span>
        </label>
        <span
          className={`text-[10px] px-1 py-0.2 rounded font-medium border ${badgeClass}`}
        >
          {badgeText}
        </span>
      </div>

      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch('');
        }}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-left bg-slate-50 hover:bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={value ? 'font-medium text-slate-900 truncate' : 'text-slate-400'}>
          {value || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1.5" />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-300 rounded-md shadow-2xl overflow-hidden min-w-[240px]">
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar país socio de Paraguay..."
              className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
            {filteredCountries.length === 0 ? (
              <div className="p-3 text-xs text-slate-600 text-center">
                <p>No coincide con los principales socios.</p>
                {search.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(search.trim());
                      setIsOpen(false);
                    }}
                    className="mt-2 text-xs text-blue-600 font-semibold underline cursor-pointer"
                  >
                    Usar "{search.trim()}" como país
                  </button>
                )}
              </div>
            ) : (
              filteredCountries.map((country) => {
                const isSelected =
                  value.toLowerCase() === country.name.toLowerCase() ||
                  value.toLowerCase() === country.code.toLowerCase();
                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => {
                      onChange(country.name);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-100 transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50 font-semibold text-blue-900' : 'text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10.5px] px-1 py-0.2 bg-slate-100 border border-slate-300 rounded text-slate-600">
                        {country.code}
                      </span>
                      <span>{country.name}</span>
                      <span className="text-[10px] text-slate-600">
                        ({country.region})
                      </span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
