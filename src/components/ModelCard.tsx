import React, { useRef, useEffect } from 'react';
import { PrismaModel, PrismaField } from '../data/schemaData';
import { Key, Link as LinkIcon, Eye, ChevronDown, ChevronRight } from 'lucide-react';

interface ModelCardProps {
  model: PrismaModel;
  isSelected: boolean;
  isDragging: boolean;
  isHovered: boolean;
  isRelatedToSelected: boolean;
  isDimmed: boolean;
  searchQuery: string;
  onSelect: (model: PrismaModel) => void;
  onStartDrag: (e: React.MouseEvent, modelName: string) => void;
  onHover: (modelName: string | null) => void;
  onHoverField: (modelName: string, fieldName: string | null) => void;
  onCardHeightMeasured?: (modelName: string, height: number, fieldOffsets: Record<string, number>) => void;
  collapsed: boolean;
  onToggleCollapse: (modelName: string) => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  model,
  isSelected,
  isDragging,
  isHovered,
  isRelatedToSelected,
  isDimmed,
  searchQuery,
  onSelect,
  onStartDrag,
  onHover,
  onHoverField,
  onCardHeightMeasured,
  collapsed,
  onToggleCollapse,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (cardRef.current && onCardHeightMeasured) {
      const rect = cardRef.current.getBoundingClientRect();
      const fieldOffsets: Record<string, number> = {};

      model.fields.forEach((f) => {
        const el = fieldRefs.current[f.name];
        if (el) {
          fieldOffsets[f.name] = el.offsetTop + el.offsetHeight / 2;
        }
      });

      onCardHeightMeasured(model.name, rect.height, fieldOffsets);
    }
  }, [collapsed, model.fields, onCardHeightMeasured, model.name]);

  const matchesSearch =
    searchQuery.trim() !== '' &&
    (model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.fields.some((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase())));

  // Highlight search text match
  const highlightMatch = (text: string) => {
    if (!searchQuery.trim()) return text;
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="bg-[#e2b616] text-slate-950 font-bold px-0.5 rounded-xs">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const isFkField = (field: PrismaField) => Boolean(field.relationFromFields && field.relationFromFields.length > 0);

  const handleCardMouseDown = (e: React.MouseEvent) => {
    // Prevent dragging when clicking interactive buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    // Only primary mouse button initiates drag
    if (e.button !== 0) return;
    onStartDrag(e, model.name);
  };

  return (
    <div
      ref={cardRef}
      id={`model-${model.name}`}
      style={{
        transform: `translate3d(${model.x}px, ${model.y}px, 0)`,
        width: 310,
      }}
      className={`absolute select-none rounded-xl transition-shadow duration-75 backdrop-blur-md cursor-grab active:cursor-grabbing ${
        isDimmed ? 'opacity-25 grayscale-[30%]' : 'opacity-100'
      } ${
        isDragging
          ? 'ring-2 ring-[#e2b616] shadow-2xl shadow-[#e2b616]/40 bg-slate-900/98 z-40 scale-[1.01]'
          : isSelected
          ? 'ring-2 ring-[#e2b616] shadow-xl shadow-[#e2b616]/20 bg-slate-900/98 z-30'
          : isRelatedToSelected
          ? 'ring-1.5 ring-[#38bdf8] shadow-lg shadow-[#38bdf8]/20 bg-slate-900/95 z-20'
          : isHovered
          ? 'ring-1 ring-slate-400/60 shadow-xl bg-slate-900/95 z-20'
          : matchesSearch
          ? 'ring-2 ring-amber-400 shadow-xl shadow-amber-500/20 bg-slate-900/95 z-25'
          : 'border border-slate-800/90 shadow-md bg-slate-900/90 hover:border-slate-700/90 z-10'
      }`}
      onMouseDown={handleCardMouseDown}
      onMouseEnter={() => onHover(model.name)}
      onMouseLeave={() => onHover(null)}
      onClick={(e) => {
        // If clicking on card without dragging, select model
        onSelect(model);
      }}
    >
      {/* Card Header */}
      <div className="px-3.5 py-2.5 rounded-t-xl bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: model.domainColor }}
            title={model.domain}
          />
          <div className="truncate">
            <span className="font-bold text-sm text-slate-100 tracking-tight font-sans">
              {highlightMatch(model.name)}
            </span>
            {model.tableName && (
              <span className="ml-1.5 text-[11px] font-mono text-slate-400" title="Table map name">
                [{model.tableName}]
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          <span className="text-[11px] font-mono text-slate-400 tabular-nums">
            {model.fields.length}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(model.name);
            }}
            className="p-1 hover:text-slate-100 hover:bg-slate-800/80 rounded transition-colors cursor-pointer"
            title={collapsed ? 'Expand fields' : 'Collapse fields'}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Fields List */}
      {!collapsed && (
        <div className="divide-y divide-slate-800/40 text-[12px] font-mono max-h-[360px] overflow-y-auto">
          {model.fields.map((field) => {
            const isPk = field.isId;
            const isFk = isFkField(field);
            const isReverseRelation = field.isRelation && field.type.endsWith('[]');
            const isRelationObj = field.isRelation && !field.isList && !field.relationFromFields;

            return (
              <div
                key={field.name}
                ref={(el) => {
                  fieldRefs.current[field.name] = el;
                }}
                className={`px-3 py-1.5 flex items-center justify-between gap-1 transition-colors ${
                  isPk
                    ? 'bg-amber-500/10 hover:bg-amber-500/15 text-amber-200'
                    : isFk
                    ? 'bg-sky-500/10 hover:bg-sky-500/15 text-sky-200'
                    : isReverseRelation || isRelationObj
                    ? 'bg-purple-500/5 hover:bg-purple-500/10 text-purple-200'
                    : 'hover:bg-slate-800/50 text-slate-300'
                }`}
                onMouseEnter={() => {
                  if (isFk || isPk || isReverseRelation) {
                    onHoverField(model.name, field.name);
                  }
                }}
                onMouseLeave={() => onHoverField(model.name, null)}
              >
                {/* Left: Key indicator and Field name */}
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  {isPk ? (
                    <span
                      className="shrink-0 text-[#e2b616] flex items-center gap-0.5 text-[10px] font-bold"
                      title="Primary Key (@id)"
                    >
                      <Key className="w-3 h-3 fill-[#e2b616]/30" />
                      <span>PK</span>
                    </span>
                  ) : isFk ? (
                    <span
                      className="shrink-0 text-[#38bdf8] flex items-center gap-0.5 text-[10px] font-bold"
                      title={`Foreign Key references ${field.type}`}
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>FK</span>
                    </span>
                  ) : field.isUnique ? (
                    <span
                      className="shrink-0 text-emerald-400 text-[10px] font-semibold"
                      title="Unique Constraint (@unique)"
                    >
                      UQ
                    </span>
                  ) : (
                    <span className="w-4 shrink-0 text-slate-600 text-center text-[10px]">•</span>
                  )}

                  <span
                    className={`truncate ${
                      isPk
                        ? 'text-[#e2b616] font-semibold'
                        : isFk
                        ? 'text-[#38bdf8] font-medium'
                        : 'text-slate-200'
                    }`}
                  >
                    {highlightMatch(field.name)}
                    {field.isOptional && <span className="text-slate-500">?</span>}
                  </span>
                </div>

                {/* Right: Field Type & Defaults */}
                <div className="flex items-center gap-1 shrink-0 text-[11px]">
                  <span
                    className={`truncate max-w-[110px] ${
                      isPk
                        ? 'text-amber-300/90'
                        : isFk
                        ? 'text-sky-300'
                        : isReverseRelation || isRelationObj
                        ? 'text-purple-300'
                        : 'text-slate-400'
                    }`}
                    title={field.type}
                  >
                    {field.type}
                  </span>
                  {field.defaultValue && (
                    <span
                      className="text-[9px] px-1 py-0.2 text-slate-500 bg-slate-800/80 rounded"
                      title={`@default(${field.defaultValue})`}
                    >
                      def
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Card Footer */}
      <div className="px-3 py-1.5 bg-slate-950/50 rounded-b-xl border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <span className="truncate max-w-[180px] text-slate-400 font-sans">{model.domain}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(model);
          }}
          className="text-xs hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Eye className="w-3 h-3" />
          <span>Inspect</span>
        </button>
      </div>
    </div>
  );
};
