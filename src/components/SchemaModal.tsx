import React, { useState } from 'react';
import { PrismaEnum } from '../data/schemaData';
import { X, Copy, Check, Download, Layers, FileCode } from 'lucide-react';

interface SchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawSchemaText: string;
  schemaFormat: 'prisma' | 'sql';
  schemaName: string;
  enums: PrismaEnum[];
}

export const SchemaModal: React.FC<SchemaModalProps> = ({
  isOpen,
  onClose,
  rawSchemaText,
  schemaFormat,
  schemaName,
  enums,
}) => {
  const [activeTab, setActiveTab] = useState<'schema' | 'enums'>('schema');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(rawSchemaText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = schemaFormat === 'sql' ? 'sql' : 'prisma';
    const blob = new Blob([rawSchemaText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-[880px] max-w-full max-h-[90vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-sans">{schemaName}</h2>
              <p className="text-xs text-slate-400 font-sans">
                {schemaFormat.toUpperCase()} Schema Definition {enums.length > 0 ? `· ${enums.length} Enums` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy All'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>schema.{schemaFormat === 'sql' ? 'sql' : 'prisma'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800/60 bg-slate-900/40 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'schema' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>Schema Source</span>
          </button>
          {enums.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('enums')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'enums' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Enums Directory ({enums.length})</span>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 select-text">
          {activeTab === 'schema' ? (
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
              <pre className="text-emerald-300/90 whitespace-pre">{rawSchemaText}</pre>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {enums.map((e) => (
                <div key={e.name} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="font-mono font-bold text-sm text-purple-300">{e.name}</span>
                    <span className="text-[11px] text-slate-400">{e.values.length} values</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{e.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {e.values.map((v) => (
                      <span
                        key={v}
                        className="bg-purple-950/40 text-purple-200 border border-purple-800/40 px-2 py-0.5 rounded text-[11px] font-mono"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
