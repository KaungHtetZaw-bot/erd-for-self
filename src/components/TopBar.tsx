import React, { useState, useRef, useEffect } from 'react';
import { DOMAINS } from '../data/schemaData';
import {
  Database,
  Search,
  X,
  FileCode,
  Download,
  Code,
  Menu,
  ChevronDown,
  Maximize2,
  RotateCcw,
  Upload,
  LayoutGrid,
} from 'lucide-react';

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDomain: string;
  onSelectDomain: (domain: string) => void;
  onAutoLayout: (mode: 'cluster' | 'hierarchical' | 'grid') => void;
  onOpenSchemaModal: () => void;
  onOpenImportModal: () => void;
  onResetView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onExportSvg: () => void;
  onExportHtml: () => void;
  totalModels: number;
  activeSchemaFormat: 'prisma' | 'sql';
  schemaName: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedDomain,
  onSelectDomain,
  onAutoLayout,
  onOpenSchemaModal,
  onOpenImportModal,
  onResetView,
  onFitView,
  onExportSvg,
  onExportHtml,
  totalModels,
  activeSchemaFormat,
  schemaName,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mobileSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  return (
    <header className="relative z-40 shrink-0 select-none border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      {/* Primary Top Bar Row */}
      <div className="flex h-14 items-center justify-between gap-2.5 px-3 sm:px-4 md:gap-5">
        {/* Zone 1: Brand Wordmark & Format Tag */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#e2b616] to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 font-sans font-bold">
            <Database className="h-4 w-4 stroke-[2.5]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-sans font-extrabold text-sm sm:text-base tracking-tight text-white whitespace-nowrap">
              <span className="hidden xs:inline">Prisma </span>ERD Studio
            </span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold uppercase ${
                activeSchemaFormat === 'sql'
                  ? 'bg-sky-950/80 text-sky-300 border-sky-800/60'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
              }`}
              title={`Active Schema Format: ${activeSchemaFormat.toUpperCase()}`}
            >
              {activeSchemaFormat}
            </span>
            <span className="hidden xl:inline text-xs font-mono text-slate-400 whitespace-nowrap">
              {totalModels} tables
            </span>
          </div>
        </div>

        {/* Zone 2: Search & Domain Filters (Desktop / Tablet) */}
        <div className="hidden md:flex flex-1 items-center gap-2.5 max-w-2xl min-w-0">
          {/* Instant Search Box */}
          <div className="relative w-40 lg:w-52 xl:w-60 shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tables & fields..."
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-1.5 pl-8 pr-7 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Domain Dropdown on Medium screens */}
          <div className="flex lg:hidden items-center shrink-0">
            <div className="relative">
              <select
                value={selectedDomain}
                onChange={(e) => onSelectDomain(e.target.value)}
                className="appearance-none rounded-lg border border-slate-800 bg-slate-900 py-1.5 pl-3 pr-8 text-xs font-medium text-slate-200 outline-none hover:bg-slate-800/80 cursor-pointer"
              >
                {DOMAINS.map((d) => (
                  <option key={d.id} value={d.id} className="bg-slate-900 text-slate-200">
                    {d.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          {/* Domain Segmented Controls on Large+ Screens */}
          <div className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none text-xs">
            {DOMAINS.map((dom) => {
              const isActive = selectedDomain === dom.id;
              return (
                <button
                  key={dom.id}
                  type="button"
                  onClick={() => onSelectDomain(dom.id)}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'border border-amber-400/30 bg-slate-800 font-semibold text-amber-300'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  {dom.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Zone 3: Actions (Responsive) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile Search Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen((v) => !v)}
            className="flex md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
            title="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Import / Paste Schema Button */}
          <button
            type="button"
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/10 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-400/20 transition-colors whitespace-nowrap cursor-pointer shadow-sm shadow-amber-500/10"
            title="Import / Paste Prisma or SQL Schema"
          >
            <Upload className="h-3.5 w-3.5 text-amber-400" />
            <span>Import / Paste</span>
          </button>

          {/* Auto Arrange Grid Button */}
          <button
            type="button"
            onClick={() => onAutoLayout('grid')}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
            title="Auto-Arrange tables in a neat grid"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-sky-400" />
            <span className="hidden xl:inline">Auto Grid</span>
          </button>

          {/* Schema Viewer Button */}
          <button
            type="button"
            onClick={onOpenSchemaModal}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            <FileCode className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden md:inline">Source</span>
          </button>

          {/* Standalone HTML Export (Desktop) */}
          <button
            type="button"
            onClick={onExportHtml}
            className="hidden lg:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
            title="Download single-file standalone HTML"
          >
            <Code className="h-3.5 w-3.5 text-sky-400" />
            <span>Single HTML</span>
          </button>

          {/* Primary Action: Export SVG */}
          <button
            type="button"
            onClick={onExportSvg}
            className="flex items-center gap-1.5 rounded-lg bg-[#e2b616] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-sm shadow-amber-500/20 hover:bg-amber-300 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">SVG</span>
          </button>

          {/* Mobile / Tablet Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="flex lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer ml-0.5"
            title="Open Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Expandable Mobile Search Row */}
      {mobileSearchOpen && (
        <div className="flex md:hidden items-center gap-2 px-3 py-2 border-t border-slate-800/70 bg-slate-900/95">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tables & fields..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-7 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-amber-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMobileSearchOpen(false)}
            className="text-xs text-slate-400 hover:text-white px-2 py-1"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Mobile & Tablet Slide-Down Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800/90 bg-slate-950/98 p-4 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Active Schema Banner */}
          <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium truncate">{schemaName}</span>
            <span className="font-mono text-[10px] uppercase font-bold text-amber-300">
              {activeSchemaFormat}
            </span>
          </div>

          {/* Import / Paste Trigger */}
          <button
            type="button"
            onClick={() => {
              onOpenImportModal();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-400/15 border border-amber-400/40 p-2.5 text-xs font-semibold text-amber-300 cursor-pointer"
          >
            <Upload className="h-4 w-4 text-amber-400" />
            <span>Import / Paste New Schema (Prisma / SQL)</span>
          </button>

          {/* Domain Filter Pills */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Domain Filter</span>
              <span className="text-[10px] font-mono text-slate-500">{totalModels} Tables</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DOMAINS.map((dom) => {
                const isActive = selectedDomain === dom.id;
                return (
                  <button
                    key={dom.id}
                    type="button"
                    onClick={() => {
                      onSelectDomain(dom.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'border border-amber-400/40 bg-slate-800 font-semibold text-amber-300'
                        : 'border border-slate-800/80 bg-slate-900/60 text-slate-300 hover:bg-slate-850'
                    }`}
                  >
                    {dom.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auto Layout Selector */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Auto Arrange Tables
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  onAutoLayout('cluster');
                  setMobileMenuOpen(false);
                }}
                className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs font-medium text-slate-200 hover:bg-slate-850 text-center transition-colors cursor-pointer"
              >
                Clusters
              </button>
              <button
                type="button"
                onClick={() => {
                  onAutoLayout('hierarchical');
                  setMobileMenuOpen(false);
                }}
                className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs font-medium text-slate-200 hover:bg-slate-850 text-center transition-colors cursor-pointer"
              >
                Layered
              </button>
              <button
                type="button"
                onClick={() => {
                  onAutoLayout('grid');
                  setMobileMenuOpen(false);
                }}
                className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs font-medium text-slate-200 hover:bg-slate-850 text-center transition-colors cursor-pointer"
              >
                Grid
              </button>
            </div>
          </div>

          {/* Canvas Controls */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              View Navigation
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onFitView();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs font-medium text-slate-200 hover:bg-slate-850 cursor-pointer"
              >
                <Maximize2 className="h-3.5 w-3.5 text-amber-400" />
                <span>Fit All Models</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetView();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs font-medium text-slate-200 hover:bg-slate-850 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 text-sky-400" />
                <span>Recenter View</span>
              </button>
            </div>
          </div>

          {/* Export & Inspection Actions */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <button
              type="button"
              onClick={() => {
                onOpenSchemaModal();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-emerald-400" />
                <span>View Schema Text</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">.{activeSchemaFormat}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onExportHtml();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Code className="h-4 w-4 text-sky-400" />
                <span>Download Standalone HTML</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">.html</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onExportSvg();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between rounded-lg bg-[#e2b616] px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-300 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span>Download Diagram SVG</span>
              </span>
              <span className="text-[11px] text-slate-900 font-mono">.svg</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
