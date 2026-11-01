export interface Point {
  x: number;
  y: number;
}

export interface BezierConnector {
  path: string;
  start: Point;
  end: Point;
  mid: Point;
  sourceSide: 'left' | 'right';
  targetSide: 'left' | 'right';
}

export function computeBezierConnector(
  sourceRect: { x: number; y: number; w: number; h: number },
  targetRect: { x: number; y: number; w: number; h: number },
  sourceFieldOffset: number = 50,
  targetFieldOffset: number = 50
): BezierConnector {
  // Clamp offsets cleanly within card height
  const sOffsetClamped = Math.max(26, Math.min(sourceRect.h - 14, sourceFieldOffset));
  const tOffsetClamped = Math.max(26, Math.min(targetRect.h - 14, targetFieldOffset));

  const sRight = sourceRect.x + sourceRect.w;
  const sLeft = sourceRect.x;
  const tRight = targetRect.x + targetRect.w;
  const tLeft = targetRect.x;

  let sx: number, sy: number, tx: number, ty: number;
  let sourceSide: 'left' | 'right';
  let targetSide: 'left' | 'right';

  // Determine side orientation based on relative card positions
  if (tLeft >= sRight - 30) {
    // Target is clearly to the right of source
    sourceSide = 'right';
    targetSide = 'left';
    sx = sRight;
    sy = sourceRect.y + sOffsetClamped;
    tx = tLeft;
    ty = targetRect.y + tOffsetClamped;
  } else if (sLeft >= tRight - 30) {
    // Target is clearly to the left of source
    sourceSide = 'left';
    targetSide = 'right';
    sx = sLeft;
    sy = sourceRect.y + sOffsetClamped;
    tx = tRight;
    ty = targetRect.y + tOffsetClamped;
  } else {
    // Horizontally overlapping cards: route around sides
    const sCenter = sLeft + sourceRect.w / 2;
    const tCenter = tLeft + targetRect.w / 2;
    if (sCenter <= tCenter) {
      // Source slightly left: source exits left, target enters right
      sourceSide = 'left';
      targetSide = 'right';
      sx = sLeft;
      sy = sourceRect.y + sOffsetClamped;
      tx = tRight;
      ty = targetRect.y + tOffsetClamped;
    } else {
      sourceSide = 'right';
      targetSide = 'left';
      sx = sRight;
      sy = sourceRect.y + sOffsetClamped;
      tx = tLeft;
      ty = targetRect.y + tOffsetClamped;
    }
  }

  // Calculate control points for smooth horizontal cubic bezier
  const dx = tx - sx;
  const dy = ty - sy;

  let cx1: number, cy1: number, cx2: number, cy2: number;

  if (sourceSide === 'right' && targetSide === 'left') {
    const curvature = Math.max(50, Math.min(220, Math.abs(dx) * 0.55));
    cx1 = sx + curvature;
    cy1 = sy;
    cx2 = tx - curvature;
    cy2 = ty;
  } else if (sourceSide === 'left' && targetSide === 'right') {
    const curvature = Math.max(50, Math.min(220, Math.abs(dx) * 0.55));
    cx1 = sx - curvature;
    cy1 = sy;
    cx2 = tx + curvature;
    cy2 = ty;
  } else if (sourceSide === 'right' && targetSide === 'right') {
    const loopOffset = Math.max(60, Math.abs(dy) * 0.3);
    cx1 = sx + loopOffset;
    cy1 = sy;
    cx2 = tx + loopOffset;
    cy2 = ty;
  } else {
    // left to left
    const loopOffset = Math.max(60, Math.abs(dy) * 0.3);
    cx1 = sx - loopOffset;
    cy1 = sy;
    cx2 = tx - loopOffset;
    cy2 = ty;
  }

  // Midpoint calculation for badge placement
  // Cubic bezier formula at t = 0.5
  const midX = 0.125 * sx + 0.375 * cx1 + 0.375 * cx2 + 0.125 * tx;
  const midY = 0.125 * sy + 0.375 * cy1 + 0.375 * cy2 + 0.125 * ty;

  const path = `M ${sx.toFixed(1)} ${sy.toFixed(1)} C ${cx1.toFixed(1)} ${cy1.toFixed(1)}, ${cx2.toFixed(1)} ${cy2.toFixed(1)}, ${tx.toFixed(1)} ${ty.toFixed(1)}`;

  return {
    path,
    start: { x: sx, y: sy },
    end: { x: tx, y: ty },
    mid: { x: midX, y: midY },
    sourceSide,
    targetSide,
  };
}
