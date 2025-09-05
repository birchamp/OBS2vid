export interface Rect { x: number; y: number; w: number; h: number; }
export interface Keyframe { t: number; rect: Rect; } // t in [0,1]

// Generate simple start/end rects with zoom and pan inside bounds.
export function generateKenBurnsPath(imgW: number, imgH: number, zoom = 1.1, direction: 'lr'|'rl'|'tb'|'bt' = 'lr'): Keyframe[] {
  const minDim = Math.min(imgW, imgH);
  const viewW = Math.floor(minDim / zoom);
  const viewH = Math.floor(minDim / zoom);

  const start: Rect = { x: 0, y: 0, w: viewW, h: viewH };
  const end: Rect = { x: 0, y: 0, w: viewW, h: viewH };

  if (direction === 'lr') { end.x = imgW - viewW; }
  if (direction === 'rl') { start.x = imgW - viewW; }
  if (direction === 'tb') { end.y = imgH - viewH; }
  if (direction === 'bt') { start.y = imgH - viewH; }

  return [
    { t: 0, rect: start },
    { t: 1, rect: end }
  ];
}
