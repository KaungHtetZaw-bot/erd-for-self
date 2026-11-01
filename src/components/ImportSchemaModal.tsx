import React, { useState } from 'react';
import {
  parsePrismaSchema,
  parseSqlDdl,
  detectSchemaType,
  SAMPLE_ECOMMERCE_SQL,
  SAMPLE_SAAS_BILLING_SQL,
  SAMPLE_SOCIAL_PRISMA,
} from '../utils/schemaParsers';
import { RAW_PRISMA_SCHEMA, PrismaModel, RelationEdge, PrismaEnum } from '../data/schemaData';
import {
  X,
  FileCode,
  Database,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Layers,
} from 'lucide-react';

interface ImportSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySchema: (
    models: PrismaModel[],
    edges: RelationEdge[],
    enums: PrismaEnum[],
    rawText: string,
    schemaFormat: 'prisma' | 'sql',
    schemaName: string
  ) => void;
}

export const ImportSchemaModal: React.FC<ImportSchemaModalProps> = ({
  isOpen,
  onClose,
  onApplySchema,
}) => {
  const [formatMode, setFormatMode] = useState<'auto' | 'prisma' | 'sql'>('auto');
  const [schemaText, setSchemaText] = useState<string>(RAW_PRISMA_SCHEMA);
  const [selectedPreset, setSelectedPreset] = useState<string>('salon-prisma');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseSuccessInfo, setParseSuccessInfo] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePresetChange = (presetKey: string) => {
    setSelectedPreset(presetKey);
    setParseError(null);
    setParseSuccessInfo(null);

    switch (presetKey) {
      case 'salon-prisma':
        setSchemaText(RAW_PRISMA_SCHEMA);
        setFormatMode('prisma');
        break;
      case 'ecommerce-sql':
        setSchemaText(SAMPLE_ECOMMERCE_SQL);
        setFormatMode('sql');
        break;
      case 'saas-sql':
        setSchemaText(SAMPLE_SAAS_BILLING_SQL);
        setFormatMode('sql');
        break;
      case 'social-prisma':
        setSchemaText(SAMPLE_SOCIAL_PRISMA);
        setFormatMode('prisma');
        break;
      case 'custom':
        setSchemaText('');
        setFormatMode('auto');
        break;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSchemaText(content);
      setSelectedPreset('custom');
      if (file.name.endsWith('.sql')) {
        setFormatMode('sql');
      } else if (file.name.endsWith('.prisma')) {
        setFormatMode('prisma');
      } else {
        setFormatMode('auto');
      }
    };
    reader.readAsText(file);
  };

  const handleParseAndVisualize = () => {
    setParseError(null);
    setParseSuccessInfo(null);

    if (!schemaText.trim()) {
      setParseError('Please paste or upload schema code before visualizing.');
      return;
    }

    try {
      let resolvedFormat = formatMode;
      if (resolvedFormat === 'auto') {
        resolvedFormat = detectSchemaType(schemaText);
      }

      let parsed: { models: PrismaModel[]; edges: RelationEdge[]; enums: PrismaEnum[] };
      if (resolvedFormat === 'sql') {
        parsed = parseSqlDdl(schemaText);
      } else {
        parsed = parsePrismaSchema(schemaText);
      }

      if (parsed.models.length === 0) {
        setParseError(
          `Could not identify any ${resolvedFormat.toUpperCase()} tables/models in the input. Ensure valid syntax (e.g., 'CREATE TABLE ...' or 'model ... { }').`
        );
        return;
      }

      setParseSuccessInfo(
        `Successfully parsed ${parsed.models.length} tables & ${parsed.edges.length} relationships!`
      );

      const name =
        selectedPreset === 'salon-prisma'
          ? 'Salon & Spa Schema'
          : selectedPreset === 'ecommerce-sql'
          ? 'E-Commerce Schema'
          : selectedPreset === 'saas-sql'
          ? 'SaaS Billing Schema'
          : selectedPreset === 'social-prisma'
          ? 'Social Network Schema'
          : 'Custom Schema';

      onApplySchema(
        parsed.models,
        parsed.edges,
        parsed.enums,
        schemaText,
        resolvedFormat as 'prisma' | 'sql',
        name
      );

      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err: any) {
      setParseError(`Parse error: ${err.message || 'Invalid syntax'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none">
      <div className="w-[840px] max-w-full max-h-[92vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#e2b616] to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <Database className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-sans">
                Import & Parse Database Schema
              </h2>
              <p className="text-xs text-slate-400">
                Support for Prisma (`schema.prisma`) and SQL DDL (`schema.sql` / MySQL / PostgreSQL / SQLite)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Selector & Format Bar */}
        <div className="px-5 py-3 border-b border-slate-800/70 bg-slate-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Preset Samples */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Sample Schemas:</span>
            <select
              value={selectedPreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none hover:bg-slate-750 cursor-pointer"
            >
              <option value="salon-prisma">Salon & Spa (Prisma - 22 Models)</option>
              <option value="ecommerce-sql">E-Commerce & Orders (SQL DDL - 9 Tables)</option>
              <option value="saas-sql">SaaS & Subscriptions (SQL DDL - 7 Tables)</option>
              <option value="social-prisma">Social Media (Prisma - 7 Models)</option>
              <option value="custom">Paste / Upload Custom...</option>
            </select>
          </div>

          {/* Format Mode Radio / Segmented */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Format:</span>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setFormatMode('auto')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  formatMode === 'auto'
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Auto-Detect
              </button>
              <button
                type="button"
                onClick={() => setFormatMode('prisma')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  formatMode === 'prisma'
                    ? 'bg-emerald-950 text-emerald-300 font-semibold border border-emerald-800/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Prisma (.prisma)
              </button>
              <button
                type="button"
                onClick={() => setFormatMode('sql')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  formatMode === 'sql'
                    ? 'bg-sky-950 text-sky-300 font-semibold border border-sky-800/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                SQL DDL (.sql)
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body: Editor & Upload */}
        <div className="flex-1 overflow-hidden p-5 flex flex-col space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Schema Script / Model Definitions:</span>
            <label className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span>Upload .prisma / .sql</span>
              <input
                type="file"
                accept=".prisma,.sql,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <textarea
            value={schemaText}
            onChange={(e) => {
              setSchemaText(e.target.value);
              setSelectedPreset('custom');
              setParseError(null);
            }}
            placeholder="Paste your 'model User { ... }' or 'CREATE TABLE users ( ... )' statements here..."
            className="w-full flex-1 min-h-[300px] bg-slate-900 border border-slate-800 focus:border-amber-400/80 rounded-xl p-3.5 font-mono text-xs text-slate-200 outline-none leading-relaxed resize-none selection:bg-amber-400/30 selection:text-amber-200"
            spellCheck={false}
          />

          {parseError && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/80 text-rose-200 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {parseSuccessInfo && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800/80 text-emerald-200 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{parseSuccessInfo}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            Lines: {schemaText.split('\n').length} · Characters: {schemaText.length}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleParseAndVisualize}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-[#e2b616] hover:bg-amber-300 rounded-lg transition-colors shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Parse & Visualize Schema</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
