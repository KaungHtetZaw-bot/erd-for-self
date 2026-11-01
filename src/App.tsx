import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  INITIAL_MODELS,
  INITIAL_EDGES,
  INITIAL_ENUMS,
  RAW_PRISMA_SCHEMA,
  PrismaModel,
  RelationEdge,
  PrismaEnum,
} from './data/schemaData';
import { TopBar } from './components/TopBar';
import { ModelCard } from './components/ModelCard';
import { RelationshipLines } from './components/RelationshipLines';
import { ModelDrawer } from './components/ModelDrawer';
import { Minimap } from './components/Minimap';
import { SchemaModal } from './components/SchemaModal';
import { ImportSchemaModal } from './components/ImportSchemaModal';
import {
  layoutDomainClusters,
  layoutHierarchical,
  layoutGrid,
} from './utils/layoutAlgorithms';
import { generateSingleFileHtml } from './utils/singleFileHtmlExport';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Eye,
  EyeOff,
  LayoutGrid,
} from 'lucide-react';

export default function App() {
  const [models, setModels] = useState<PrismaModel[]>(INITIAL_MODELS);
  const [edges, setEdges] = useState<RelationEdge[]>(INITIAL_EDGES);
  const [enums, setEnums] = useState<PrismaEnum[]>(INITIAL_ENUMS);
  const [rawSchemaText, setRawSchemaText] = useState<string>(RAW_PRISMA_SCHEMA);
  const [schemaFormat, setSchemaFormat] = useState<'prisma' | 'sql'>('prisma');
  const [schemaName, setSchemaName] = useState<string>('Salon & Spa Schema');

  const [selectedModel, setSelectedModel] = useState<PrismaModel | null>(null);
  const [hoveredModelName, setHoveredModelName] = useState<string | null>(null);
  const [hoveredFieldName, setHoveredFieldName] = useState<string | null>(null);
  const [activeEdgeId, setActiveEdgeId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [collapsedModels, setCollapsedModels] = useState<Set<string>>(new Set());
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [showAllLines, setShowAllLines] = useState<boolean>(true);

  // Pan & Zoom state
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 80, y: 40 });
  const [zoom, setZoom] = useState<number>(0.75);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
  });

  // Table Drag & Drop state
  const [draggingModelName, setDraggingModelName] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ offsetX: number; offsetY: number }>({ offsetX: 0, offsetY: 0 });
  const rafRef = useRef<number | null>(null);

  // Measured card dimensions for port accuracy
  const [cardHeights, setCardHeights] = useState<Record<string, number>>({});
  const [fieldOffsets, setFieldOffsets] = useState<Record<string, Record<string, number>>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState<{ w: number; h: number }>({
    w: window.innerWidth,
    h: window.innerHeight,
  });

  // Update viewport dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setViewportSize({
          w: containerRef.current.clientWidth,
          h: containerRef.current.clientHeight,
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Card height measurement callback
  const handleCardHeightMeasured = useCallback(
    (modelName: string, height: number, offsets: Record<string, number>) => {
      setCardHeights((prev) => {
        if (prev[modelName] === height) return prev;
        return { ...prev, [modelName]: height };
      });
      setFieldOffsets((prev) => ({
        ...prev,
        [modelName]: offsets,
      }));
    },
    []
  );

  // Start panning canvas on backdrop mouse down
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!(e.target as HTMLElement).closest('[id^="model-"]') && !(e.target as HTMLElement).closest('button')) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    }
  };

  // Start dragging a model card
  const handleStartCardDrag = (e: React.MouseEvent, modelName: string) => {
    const model = models.find((m) => m.name === modelName);
    if (!model) return;

    setDraggingModelName(modelName);

    // EXACT zoom-compensated pointer coordinate in canvas space:
    const pointerCanvasX = (e.clientX - pan.x) / zoom;
    const pointerCanvasY = (e.clientY - pan.y) / zoom;

    dragOffsetRef.current = {
      offsetX: pointerCanvasX - model.x,
      offsetY: pointerCanvasY - model.y,
    };
  };

  // Global mouse move for pan and card dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        setPan({
          x: panStartRef.current.panX + dx,
          y: panStartRef.current.panY + dy,
        });
      } else if (draggingModelName) {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
          const curCanvasX = (e.clientX - pan.x) / zoom;
          const curCanvasY = (e.clientY - pan.y) / zoom;

          const newX = Math.round(curCanvasX - dragOffsetRef.current.offsetX);
          const newY = Math.round(curCanvasY - dragOffsetRef.current.offsetY);

          setModels((prev) =>
            prev.map((m) => (m.name === draggingModelName ? { ...m, x: newX, y: newY } : m))
          );
        });
      }
    };

    const handleMouseUp = () => {
      if (isPanning) {
        setIsPanning(false);
      }
      if (draggingModelName) {
        setDraggingModelName(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPanning, draggingModelName, zoom, pan]);

  // Zoom on mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    const newZoom = Math.min(2.5, Math.max(0.25, zoom * zoomFactor));

    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Fit view to all models
  const handleFitView = useCallback(() => {
    if (models.length === 0) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    models.forEach((m) => {
      minX = Math.min(minX, m.x);
      minY = Math.min(minY, m.y);
      maxX = Math.max(maxX, m.x + 320);
      maxY = Math.max(maxY, m.y + (cardHeights[m.name] || 280));
    });

    const padding = 80;
    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;

    const availableW = viewportSize.w - (selectedModel ? 460 : 0);
    const availableH = viewportSize.h;

    const newZoom = Math.min(1.15, Math.max(0.28, Math.min(availableW / contentW, availableH / contentH)));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const newPanX = availableW / 2 - centerX * newZoom;
    const newPanY = availableH / 2 - centerY * newZoom;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [models, cardHeights, viewportSize, selectedModel]);

  // Reset view / recenter nodes
  const handleResetView = () => {
    setZoom(0.75);
    setPan({ x: 80, y: 40 });
  };

  // Auto Layout triggers
  const handleAutoLayout = (mode: 'cluster' | 'hierarchical' | 'grid') => {
    let nextModels: PrismaModel[];
    if (mode === 'cluster') {
      nextModels = layoutDomainClusters(models);
    } else if (mode === 'hierarchical') {
      nextModels = layoutHierarchical(models, edges);
    } else {
      nextModels = layoutGrid(models);
    }
    setModels(nextModels);
  };

  // Apply imported schema callback
  const handleApplySchema = (
    newModels: PrismaModel[],
    newEdges: RelationEdge[],
    newEnums: PrismaEnum[],
    rawText: string,
    format: 'prisma' | 'sql',
    name: string
  ) => {
    const arranged = layoutGrid(newModels);
    setModels(arranged);
    setEdges(newEdges);
    setEnums(newEnums);
    setRawSchemaText(rawText);
    setSchemaFormat(format);
    setSchemaName(name);
    setSelectedModel(null);
    setSelectedDomain('all');
    setSearchQuery('');

    setTimeout(() => {
      handleFitView();
    }, 150);
  };

  // Toggle Collapse on a model
  const handleToggleCollapse = (modelName: string) => {
    setCollapsedModels((prev) => {
      const next = new Set(prev);
      if (next.has(modelName)) {
        next.delete(modelName);
      } else {
        next.add(modelName);
      }
      return next;
    });
  };

  // Export ERD as SVG file
  const handleExportSvg = () => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    models.forEach((m) => {
      minX = Math.min(minX, m.x);
      minY = Math.min(minY, m.y);
      maxX = Math.max(maxX, m.x + 320);
      maxY = Math.max(maxY, m.y + (cardHeights[m.name] || 300));
    });

    const pad = 60;
    const svgW = maxX - minX + pad * 2;
    const svgH = maxY - minY + pad * 2;

    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="${minX - pad} ${minY - pad} ${svgW} ${svgH}" style="background-color: #0f172a; font-family: sans-serif;">\n`;
    svgContent += `<defs>\n`;
    svgContent += `<marker id="arr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8"/></marker>\n`;
    svgContent += `</defs>\n`;

    models.forEach((m) => {
      const h = cardHeights[m.name] || 250;
      svgContent += `<g transform="translate(${m.x}, ${m.y})">\n`;
      svgContent += `  <rect width="310" height="${h}" rx="10" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>\n`;
      svgContent += `  <rect width="310" height="34" rx="10" fill="#0f172a"/>\n`;
      svgContent += `  <text x="14" y="22" fill="#f8fafc" font-size="13" font-weight="bold">${m.name}</text>\n`;
      svgContent += `  <text x="296" y="22" fill="#94a3b8" font-size="11" text-anchor="end">${m.fields.length} cols</text>\n`;
      
      let curY = 54;
      m.fields.slice(0, 10).forEach((f) => {
        const pk = f.isId ? '[PK] ' : f.relationFromFields ? '[FK] ' : '';
        const fill = f.isId ? '#e2b616' : f.relationFromFields ? '#38bdf8' : '#e2e8f0';
        svgContent += `  <text x="14" y="${curY}" fill="${fill}" font-size="11" font-family="monospace">${pk}${f.name}</text>\n`;
        svgContent += `  <text x="296" y="${curY}" fill="#94a3b8" font-size="11" font-family="monospace" text-anchor="end">${f.type}</text>\n`;
        curY += 20;
      });
      svgContent += `</g>\n`;
    });

    svgContent += `</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schemaName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-erd.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Single-File HTML
  const handleExportHtml = () => {
    const html = generateSingleFileHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'multi-format-erd-visualizer.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Compute related models when one is selected
  const relatedModelNames = React.useMemo(() => {
    if (!selectedModel) return new Set<string>();
    const names = new Set<string>();
    edges.forEach((e) => {
      if (e.sourceModel === selectedModel.name) names.add(e.targetModel);
      if (e.targetModel === selectedModel.name) names.add(e.sourceModel);
    });
    return names;
  }, [selectedModel, edges]);

  // Keyboard shortcut listener (Esc closes drawer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedModel(null);
        setIsSchemaModalOpen(false);
        setIsImportModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden bg-[#0f172a] text-slate-100 ${draggingModelName ? 'select-none cursor-grabbing' : ''}`}>
      {/* Top Header */}
      <TopBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedDomain={selectedDomain}
        onSelectDomain={setSelectedDomain}
        onAutoLayout={handleAutoLayout}
        onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onResetView={handleResetView}
        onZoomIn={() => setZoom((z) => Math.min(2.5, z * 1.15))}
        onZoomOut={() => setZoom((z) => Math.max(0.25, z * 0.85))}
        onFitView={handleFitView}
        onExportSvg={handleExportSvg}
        onExportHtml={handleExportHtml}
        totalModels={models.length}
        activeSchemaFormat={schemaFormat}
        schemaName={schemaName}
      />

      {/* Main Interactive Canvas Container */}
      <div
        ref={containerRef}
        id="canvas-surface"
        className={`relative flex-1 w-full h-full overflow-hidden canvas-bg-grid ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={handleCanvasMouseDown}
        onWheel={handleWheel}
      >
        {/* Transformable Canvas Viewport */}
        <div
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
          className="absolute inset-0 w-full h-full pointer-events-none will-change-transform"
        >
          {/* SVG Dynamic Bezier Relationship Connector Lines */}
          {showAllLines && (
            <RelationshipLines
              models={models}
              edges={edges}
              selectedModelName={selectedModel ? selectedModel.name : null}
              hoveredModelName={hoveredModelName}
              hoveredFieldName={hoveredFieldName}
              draggingModelName={draggingModelName}
              activeEdgeId={activeEdgeId}
              onHoverEdge={setActiveEdgeId}
              onSelectEdge={(edge) => {
                const target = models.find((m) => m.name === edge.targetModel);
                if (target) setSelectedModel(target);
              }}
              cardHeights={cardHeights}
              fieldOffsets={fieldOffsets}
              filterDomain={selectedDomain}
            />
          )}

          {/* Model Cards */}
          <div className="pointer-events-auto">
            {models.map((model) => {
              const isSelected = selectedModel?.name === model.name;
              const isDragging = draggingModelName === model.name;
              const isHovered = hoveredModelName === model.name;
              const isRelated = relatedModelNames.has(model.name);
              const isDimmed =
                selectedDomain !== 'all' && model.domain !== selectedDomain && !isSelected;

              return (
                <ModelCard
                  key={model.name}
                  model={model}
                  isSelected={isSelected}
                  isDragging={isDragging}
                  isHovered={isHovered}
                  isRelatedToSelected={isRelated}
                  isDimmed={isDimmed}
                  searchQuery={searchQuery}
                  onSelect={(m) => setSelectedModel(m)}
                  onStartDrag={handleStartCardDrag}
                  onHover={setHoveredModelName}
                  onHoverField={(m, f) => setHoveredFieldName(f)}
                  onCardHeightMeasured={handleCardHeightMeasured}
                  collapsed={collapsedModels.has(model.name)}
                  onToggleCollapse={handleToggleCollapse}
                />
              );
            })}
          </div>
        </div>

        {/* Floating Zoom & Canvas Controls (Bottom-Left) */}
        <div className="absolute bottom-5 left-5 z-30 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl select-none">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.5, z * 1.15))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-400 px-1 min-w-[42px] text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.25, z * 0.85))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />
          <button
            type="button"
            onClick={handleFitView}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Fit All Models to Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleAutoLayout('grid')}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Auto-Arrange Grid"
          >
            <LayoutGrid className="w-4 h-4 text-sky-400" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Reset View / Recenter Nodes"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />
          <button
            type="button"
            onClick={() => setShowAllLines((v) => !v)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              showAllLines ? 'text-[#38bdf8] hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-800'
            }`}
            title={showAllLines ? 'Hide relationship lines' : 'Show relationship lines'}
          >
            {showAllLines ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>

        {/* Minimap (Bottom-Right) */}
        <div className={`absolute bottom-5 right-5 z-30 transition-all ${selectedModel ? 'hidden md:block' : ''}`}>
          <Minimap
            models={models}
            pan={pan}
            zoom={zoom}
            viewportWidth={viewportSize.w}
            viewportHeight={viewportSize.h}
            onNavigate={(newPanX, newPanY) => setPan({ x: newPanX, y: newPanY })}
            selectedModelName={selectedModel ? selectedModel.name : null}
          />
        </div>

        {/* Details Drawer / Model Inspector */}
        {selectedModel && (
          <ModelDrawer
            model={selectedModel}
            allModels={models}
            allEdges={edges}
            allEnums={enums}
            onClose={() => setSelectedModel(null)}
            onSelectModel={(m) => setSelectedModel(m)}
          />
        )}

        {/* Raw Schema Source Modal */}
        <SchemaModal
          isOpen={isSchemaModalOpen}
          onClose={() => setIsSchemaModalOpen(false)}
          rawSchemaText={rawSchemaText}
          schemaFormat={schemaFormat}
          schemaName={schemaName}
          enums={enums}
        />

        {/* Dual Format Import / Paste Modal */}
        <ImportSchemaModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onApplySchema={handleApplySchema}
        />
      </div>
    </div>
  );
}
