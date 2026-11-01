import React from 'react';
import { PrismaModel } from '../data/schemaData';

interface MinimapProps {
  models: PrismaModel[];
  pan: { x: number; y: number };
  zoom: number;
  viewportWidth: number;
  viewportHeight: number;
  onNavigate: (x: number, y: number) => void;
  selectedModelName: string | null;
}

export const Minimap: React.FC<MinimapProps> = ({
  models,
  pan,
  zoom,
  viewportWidth,
  viewportHeight,
  onNavigate,
  selectedModelName,
}) => {
  // Compute bounds of all models
  const bounds = React.useMemo(() => {
    let minX = 0;
    let minY = 0;
    let maxX = 2500;
    let maxY = 2200;

    models.forEach((m) => {
      minX = Math.min(minX, m.x);
      minY = Math.min(minY, m.y);
      maxX = Math.max(maxX, m.x + 320);
      maxY = Math.max(maxY, m.y + 350);
    });

    const padding = 150;
    return {
      x: minX - padding,
      y: minY - padding,
      w: maxX - minX + padding * 2,
      h: maxY - minY + padding * 2,
    };
  }, [models]);

  const mapW = 180;
  const mapH = 130;
  const scale = Math.min(mapW / bounds.w, mapH / bounds.h);

  // Viewport rect inside canvas space
  const viewX = -pan.x / zoom;
  const viewY = -pan.y / zoom;
  const viewW = viewportWidth / zoom;
  const viewH = viewportHeight / zoom;

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetCanvasX = bounds.x + clickX / scale;
    const targetCanvasY = bounds.y + clickY / scale;

    const newPanX = -(targetCanvasX - viewportWidth / (2 * zoom)) * zoom;
    const newPanY = -(targetCanvasY - viewportHeight / (2 * zoom)) * zoom;

    onNavigate(newPanX, newPanY);
  };

  return (
    <div
      className="relative bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-lg p-1.5 shadow-xl select-none cursor-crosshair overflow-hidden"
      style={{ width: mapW + 12, height: mapH + 12 }}
      onClick={handleMinimapClick}
      title="Click anywhere to pan canvas"
    >
      <div className="text-[10px] text-slate-400 font-mono mb-1 px-1 flex items-center justify-between">
        <span>OVERVIEW</span>
        <span>{Math.round(zoom * 100)}%</span>
      </div>

      <div className="relative bg-slate-900/90 rounded border border-slate-800/60 overflow-hidden" style={{ width: mapW, height: mapH }}>
        {/* Model rectangles */}
        {models.map((m) => {
          const x = (m.x - bounds.x) * scale;
          const y = (m.y - bounds.y) * scale;
          const w = 310 * scale;
          const h = 180 * scale;
          const isSelected = m.name === selectedModelName;

          return (
            <div
              key={m.name}
              style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${Math.max(4, w)}px`,
                height: `${Math.max(4, h)}px`,
                backgroundColor: isSelected ? '#e2b616' : m.domainColor,
                opacity: isSelected ? 1 : 0.65,
              }}
              className="absolute rounded-[1px] transition-opacity"
            />
          );
        })}

        {/* Viewport Box */}
        <div
          style={{
            left: `${(viewX - bounds.x) * scale}px`,
            top: `${(viewY - bounds.y) * scale}px`,
            width: `${Math.max(10, viewW * scale)}px`,
            height: `${Math.max(10, viewH * scale)}px`,
          }}
          className="absolute border border-amber-400/80 bg-amber-400/10 pointer-events-none rounded-[2px]"
        />
      </div>
    </div>
  );
};
