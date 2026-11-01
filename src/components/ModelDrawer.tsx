import React, { useState } from 'react';
import { PrismaModel, PrismaEnum, RelationEdge } from '../data/schemaData';
import { generatePostgreSql, generateTypeScript } from '../utils/sqlGenerator';
import {
  X,
  Key,
  Link as LinkIcon,
  Copy,
  Check,
  Code2,
  Database,
  FileCode,
  TableProperties,
  ArrowRight,
  ShieldAlert,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ModelDrawerProps {
  model: PrismaModel | null;
  allModels: PrismaModel[];
  allEdges: RelationEdge[];
  allEnums: PrismaEnum[];
  onClose: () => void;
  onSelectModel: (model: PrismaModel) => void;
}

export const ModelDrawer: React.FC<ModelDrawerProps> = ({
  model,
  allModels,
  allEdges,
  allEnums,
  onClose,
  onSelectModel,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'prisma' | 'sql' | 'typescript'>('overview');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  if (!model) return null;

  // Filter edges related to this model
  const incomingEdges = allEdges.filter((e) => e.targetModel === model.name);
  const outgoingEdges = allEdges.filter((e) => e.sourceModel === model.name);

  // Associated enums
  const modelEnumNames = new Set(
    model.fields
      .map((f) => f.type.replace('[]', ''))
      .filter((t) => allEnums.some((e) => e.name === t))
  );
  const associatedEnums = allEnums.filter((e) => modelEnumNames.has(e.name));

  // Copy helper
  const handleCopy = (text: string, tabId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabId);
    setTimeout(() => setCopiedTab(null), 1800);
  };

  // Reconstruct Prisma model code snippet
  const getPrismaSnippet = () => {
    const lines = [`model ${model.name} {`];
    model.fields.forEach((f) => {
      let line = `  ${f.name.padEnd(16)} ${f.type}`;
      if (f.isId) line += ' @id';
      if (f.isUnique) line += ' @unique';
      if (f.defaultValue) line += ` @default(${f.defaultValue})`;
      if (f.isCreatedAt) line += ' @default(now())';
      if (f.isUpdatedAt) line += ' @updatedAt';
      if (f.relationFromFields && f.relationToFields) {
        line += ` @relation(fields: [${f.relationFromFields.join(', ')}], references: [${f.relationToFields.join(
          ', '
        )}]${f.onDelete ? `, onDelete: ${f.onDelete}` : ''})`;
      }
      lines.push(line);
    });
    if (model.compositeUnique) {
      model.compositeUnique.forEach((u) => lines.push(`\n  @@unique(${u})`));
    }
    if (model.compositeId) {
      model.compositeId.forEach((i) => lines.push(`\n  @@id(${i})`));
    }
    if (model.indexes) {
      model.indexes.forEach((idx) => lines.push(`\n  @@index(${idx})`));
    }
    if (model.tableName) {
      lines.push(`\n  @@map("${model.tableName}")`);
    }
    lines.push('}');
    return lines.join('\n');
  };

  const sqlCode = generatePostgreSql(model, allEnums);
  const tsCode = generateTypeScript(model);
  const prismaCode = getPrismaSnippet();

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] max-w-full bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col z-50 text-slate-200 transition-transform">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: model.domainColor }}
          />
          <div className="truncate">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight font-sans">
                {model.name}
              </h2>
              {model.tableName && (
                <span className="text-xs font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  {model.tableName}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">{model.domain}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          title="Close details (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-800/60 bg-slate-900/40 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
            activeTab === 'overview'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <TableProperties className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('prisma')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
            activeTab === 'prisma'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <FileCode className="w-3.5 h-3.5 text-emerald-400" />
          <span>Prisma</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sql')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
            activeTab === 'sql'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span>PostgreSQL</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('typescript')}
          className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
            activeTab === 'typescript'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Code2 className="w-3.5 h-3.5 text-amber-400" />
          <span>TypeScript</span>
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === 'overview' && (
          <>
            {/* Description Card */}
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
              {model.description}
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-4 gap-2">
              <div className="p-2.5 bg-slate-900/40 rounded-lg border border-slate-800/70 text-center">
                <span className="text-[11px] text-slate-400 block">Fields</span>
                <span className="text-base font-bold text-slate-100 font-mono tabular-nums">
                  {model.fields.length}
                </span>
              </div>
              <div className="p-2.5 bg-slate-900/40 rounded-lg border border-slate-800/70 text-center">
                <span className="text-[11px] text-slate-400 block">Foreign Keys</span>
                <span className="text-base font-bold text-[#38bdf8] font-mono tabular-nums">
                  {outgoingEdges.length}
                </span>
              </div>
              <div className="p-2.5 bg-slate-900/40 rounded-lg border border-slate-800/70 text-center">
                <span className="text-[11px] text-slate-400 block">Referenced By</span>
                <span className="text-base font-bold text-emerald-400 font-mono tabular-nums">
                  {incomingEdges.length}
                </span>
              </div>
              <div className="p-2.5 bg-slate-900/40 rounded-lg border border-slate-800/70 text-center">
                <span className="text-[11px] text-slate-400 block">Indexes</span>
                <span className="text-base font-bold text-amber-400 font-mono tabular-nums">
                  {model.indexes ? model.indexes.length : 0}
                </span>
              </div>
            </div>

            {/* Relations Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-sky-400" />
                <span>Relationships ({outgoingEdges.length + incomingEdges.length})</span>
              </h3>

              {outgoingEdges.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-sky-400 font-medium block">
                    Outgoing (Foreign Keys to Parents):
                  </span>
                  {outgoingEdges.map((edge) => {
                    const target = allModels.find((m) => m.name === edge.targetModel);
                    return (
                      <div
                        key={edge.id}
                        onClick={() => target && onSelectModel(target)}
                        className="p-2 bg-slate-900/70 hover:bg-slate-800/70 border border-slate-800/80 rounded-md flex items-center justify-between text-xs cursor-pointer group transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-sky-300">{edge.sourceField}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="font-bold text-slate-200 group-hover:text-amber-400 transition-colors">
                            {edge.targetModel}.{edge.targetField}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono">
                          <span className="bg-sky-950/80 text-sky-300 border border-sky-800/60 px-1.5 py-0.5 rounded">
                            {edge.cardinality}
                          </span>
                          {edge.onDelete && (
                            <span className="bg-slate-800 text-slate-400 px-1 py-0.5 rounded">
                              {edge.onDelete}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {incomingEdges.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] text-emerald-400 font-medium block">
                    Incoming (Referenced by Child Models):
                  </span>
                  {incomingEdges.map((edge) => {
                    const src = allModels.find((m) => m.name === edge.sourceModel);
                    return (
                      <div
                        key={edge.id}
                        onClick={() => src && onSelectModel(src)}
                        className="p-2 bg-slate-900/70 hover:bg-slate-800/70 border border-slate-800/80 rounded-md flex items-center justify-between text-xs cursor-pointer group transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                            {edge.sourceModel}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            ({edge.sourceField})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono">
                          <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                            {edge.cardinality}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {outgoingEdges.length === 0 && incomingEdges.length === 0 && (
                <div className="text-xs text-slate-500 italic">No direct relationships found.</div>
              )}
            </div>

            {/* Enums Section */}
            {associatedEnums.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Associated Enums ({associatedEnums.length})</span>
                </h3>
                <div className="space-y-2">
                  {associatedEnums.map((e) => (
                    <div key={e.name} className="p-2.5 bg-slate-900/60 rounded-md border border-slate-800 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-purple-300 font-mono">{e.name}</span>
                        <span className="text-[11px] text-slate-400">{e.description}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {e.values.map((v) => (
                          <span
                            key={v}
                            className="bg-purple-950/40 text-purple-200 border border-purple-800/40 font-mono text-[10px] px-1.5 py-0.5 rounded"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fields Detailed Table */}
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Fields Breakdown
              </h3>
              <div className="border border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-800/60 text-xs font-mono">
                {model.fields.map((f) => (
                  <div key={f.name} className="p-2 hover:bg-slate-900/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      {f.isId ? (
                        <Key className="w-3.5 h-3.5 text-[#e2b616] shrink-0" />
                      ) : f.relationFromFields ? (
                        <LinkIcon className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                      ) : (
                        <span className="w-3.5 text-center text-slate-600">•</span>
                      )}
                      <span className="font-semibold text-slate-200">{f.name}</span>
                      {f.isOptional && <span className="text-slate-500">?</span>}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-slate-400">{f.type}</span>
                      {f.isId && (
                        <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800 px-1 rounded">
                          PK
                        </span>
                      )}
                      {f.isUnique && (
                        <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1 rounded">
                          UQ
                        </span>
                      )}
                      {f.defaultValue && (
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1 rounded">
                          default: {f.defaultValue}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Prisma Code View */}
        {activeTab === 'prisma' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Prisma Schema Model Definition</span>
              <button
                type="button"
                onClick={() => handleCopy(prismaCode, 'prisma')}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1.5 transition-colors"
              >
                {copiedTab === 'prisma' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === 'prisma' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-300/90 overflow-x-auto leading-relaxed">
              {prismaCode}
            </pre>
          </div>
        )}

        {/* PostgreSQL DDL View */}
        {activeTab === 'sql' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">PostgreSQL DDL (CREATE TABLE)</span>
              <button
                type="button"
                onClick={() => handleCopy(sqlCode, 'sql')}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1.5 transition-colors"
              >
                {copiedTab === 'sql' ? <Check className="w-3.5 h-3.5 text-sky-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === 'sql' ? 'Copied' : 'Copy SQL'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono text-sky-300/90 overflow-x-auto leading-relaxed">
              {sqlCode}
            </pre>
          </div>
        )}

        {/* TypeScript View */}
        {activeTab === 'typescript' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">TypeScript Model Interface</span>
              <button
                type="button"
                onClick={() => handleCopy(tsCode, 'ts')}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1.5 transition-colors"
              >
                {copiedTab === 'ts' ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === 'ts' ? 'Copied' : 'Copy TS'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono text-amber-300/90 overflow-x-auto leading-relaxed">
              {tsCode}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
