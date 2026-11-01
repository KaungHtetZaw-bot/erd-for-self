import React from 'react';
import { PrismaModel, RelationEdge } from '../data/schemaData';
import { computeBezierConnector } from '../utils/bezierCurves';

interface RelationshipLinesProps {
  models: PrismaModel[];
  edges: RelationEdge[];
  selectedModelName: string | null;
  hoveredModelName: string | null;
  hoveredFieldName: string | null;
  draggingModelName: string | null;
  activeEdgeId: string | null;
  onHoverEdge: (edgeId: string | null) => void;
  onSelectEdge: (edge: RelationEdge) => void;
  cardHeights: Record<string, number>;
  fieldOffsets: Record<string, Record<string, number>>;
  filterDomain: string;
}

export const RelationshipLines: React.FC<RelationshipLinesProps> = ({
  models,
  edges,
  selectedModelName,
  hoveredModelName,
  hoveredFieldName,
  draggingModelName,
  activeEdgeId,
  onHoverEdge,
  onSelectEdge,
  cardHeights,
  fieldOffsets,
  filterDomain,
}) => {
  const modelMap = React.useMemo(() => {
    const map = new Map<string, PrismaModel>();
    models.forEach((m) => map.set(m.name, m));
    return map;
  }, [models]);

  return (
    <svg
      className="absolute inset-0 pointer-events-none w-full h-full overflow-visible z-10"
      style={{ minWidth: 4500, minHeight: 4500 }}
    >
      <defs>
        {/* Glow filter in Banana Yellow */}
        <filter id="line-glow-yellow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        {/* Glow filter in Sky Blue */}
        <filter id="line-glow-blue" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Arrow Markers */}
        <marker
          id="arrow-amber"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#e2b616" />
        </marker>
        <marker
          id="arrow-sky"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
        </marker>
        <marker
          id="arrow-dim"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 2 L 6 5 L 0 8 z" fill="#475569" />
        </marker>
      </defs>

      {edges.map((edge) => {
        const sourceModel = modelMap.get(edge.sourceModel);
        const targetModel = modelMap.get(edge.targetModel);

        if (!sourceModel || !targetModel) return null;

        const isSourceInDomain = filterDomain === 'all' || sourceModel.domain === filterDomain;
        const isTargetInDomain = filterDomain === 'all' || targetModel.domain === filterDomain;
        const isDimmed = !isSourceInDomain && !isTargetInDomain;

        const isHovered = activeEdgeId === edge.id;
        const isDraggingConnected =
          draggingModelName === edge.sourceModel || draggingModelName === edge.targetModel;
        const isSelectedConnected =
          selectedModelName === edge.sourceModel || selectedModelName === edge.targetModel;
        const isHoveredModelConnected =
          hoveredModelName === edge.sourceModel || hoveredModelName === edge.targetModel;
        const isHoveredFieldConnected =
          hoveredFieldName &&
          ((edge.sourceModel === hoveredModelName && edge.sourceField === hoveredFieldName) ||
            (edge.targetModel === hoveredModelName && edge.targetField === hoveredFieldName));

        const isHighlighted =
          isHovered ||
          isDraggingConnected ||
          isSelectedConnected ||
          isHoveredModelConnected ||
          Boolean(isHoveredFieldConnected);

        // Heights
        const sHeight = cardHeights[sourceModel.name] || 250;
        const tHeight = cardHeights[targetModel.name] || 250;

        // Field specific vertical offsets
        const sOffset = fieldOffsets[sourceModel.name]?.[edge.sourceField] || 60;
        const tOffset = fieldOffsets[targetModel.name]?.[edge.targetField] || 45;

        const connector = computeBezierConnector(
          { x: sourceModel.x, y: sourceModel.y, w: 310, h: sHeight },
          { x: targetModel.x, y: targetModel.y, w: 310, h: tHeight },
          sOffset,
          tOffset
        );

        // Highlight line in Banana Yellow (#e2b616) on hover or active dragging!
        const strokeColor = isHovered || isDraggingConnected
          ? '#e2b616'
          : isSelectedConnected
          ? '#38bdf8'
          : isHoveredModelConnected || isHoveredFieldConnected
          ? '#e2b616'
          : isDimmed
          ? '#1e293b'
          : '#334155';

        const strokeWidth = isHovered
          ? 3.5
          : isDraggingConnected || isSelectedConnected
          ? 2.5
          : isHighlighted
          ? 2.25
          : 1.25;

        return (
          <g
            key={edge.id}
            className="cursor-pointer pointer-events-auto"
            onMouseEnter={() => onHoverEdge(edge.id)}
            onMouseLeave={() => onHoverEdge(null)}
            onClick={() => onSelectEdge(edge)}
          >
            {/* Invisible wide stroke for seamless hover capture */}
            <path
              d={connector.path}
              fill="none"
              stroke="transparent"
              strokeWidth="24"
              className="cursor-pointer"
            />

            {/* Glowing underlay on hover or drag */}
            {isHighlighted && (
              <path
                d={connector.path}
                fill="none"
                stroke={isHovered || isDraggingConnected ? '#e2b616' : '#38bdf8'}
                strokeWidth={isHovered ? 8 : 5}
                strokeOpacity={isHovered ? 0.45 : 0.25}
                filter={isHovered || isDraggingConnected ? 'url(#line-glow-yellow)' : 'url(#line-glow-blue)'}
              />
            )}

            {/* Main Bezier Line */}
            <path
              d={connector.path}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={isHighlighted ? 'none' : '4 2'}
              markerEnd={
                isHovered || isDraggingConnected || isHoveredModelConnected
                  ? 'url(#arrow-amber)'
                  : isSelectedConnected
                  ? 'url(#arrow-sky)'
                  : 'url(#arrow-dim)'
              }
              className="transition-colors duration-75"
            />

            {/* Source Anchor Port Terminal */}
            <circle
              cx={connector.start.x}
              cy={connector.start.y}
              r={isHighlighted ? 4.5 : 2.5}
              fill={isHovered || isDraggingConnected ? '#e2b616' : isSelectedConnected ? '#38bdf8' : '#64748b'}
              stroke="#0f172a"
              strokeWidth="1.5"
            />

            {/* Target Anchor Port Terminal */}
            <circle
              cx={connector.end.x}
              cy={connector.end.y}
              r={isHighlighted ? 4.5 : 2.5}
              fill={isHovered || isDraggingConnected ? '#e2b616' : '#38bdf8'}
              stroke="#0f172a"
              strokeWidth="1.5"
            />

            {/* Midpoint Cardinality & Relation Label Badge */}
            {(isHighlighted || isHovered) && (
              <g
                transform={`translate(${connector.mid.x}, ${connector.mid.y})`}
                className="select-none"
              >
                <rect
                  x="-32"
                  y="-12"
                  width="64"
                  height="24"
                  rx="6"
                  fill="#0b0f19"
                  stroke={isHovered || isDraggingConnected ? '#e2b616' : '#38bdf8'}
                  strokeWidth="1.5"
                  className="shadow-lg"
                />
                <text
                  x="0"
                  y="4.5"
                  textAnchor="middle"
                  fill={isHovered || isDraggingConnected ? '#fef08a' : '#7dd3fc'}
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="700"
                >
                  {edge.cardinality}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};
