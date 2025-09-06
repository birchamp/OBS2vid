export interface Rect { x: number; y: number; w: number; h: number; }
export interface Keyframe { t: number; rect: Rect; } // t in [0,1]

type Dir = 'lr' | 'rl' | 'tb' | 'bt';

// Simple seeded RNG (mulberry32)
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

// Ease in-out cubic for internal waypoint generation
function easeInOutCubic(u: number) {
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
}

// Choose alternating pan direction based on index: odd → horizontal, even → vertical; orientation flips with seed
function chooseDirection(index: number, rnd: () => number): Dir {
  const horizontal = index % 2 === 1;
  if (horizontal) return rnd() < 0.5 ? 'lr' : 'rl';
  return rnd() < 0.5 ? 'tb' : 'bt';
}

// Generate Ken Burns keyframes for a given image and duration.
// - Zoom picks in [1.05, 1.25]
// - Pan alternates horizontal/vertical by index, direction by seed
// - Returns 4 keyframes (0, 0.2, 0.8, 1) approximating ease-in-out
export function generateKenBurnsPath(
  imgW: number,
  imgH: number,
  durationMs: number,
  seed = 1,
  index = 1
): Keyframe[] {
  if (imgW <= 0 || imgH <= 0) throw new Error('Invalid image dimensions');
  if (durationMs <= 0) throw new Error('Invalid duration');

  const rnd = mulberry32(seed + index * 101);
  const minDim = Math.min(imgW, imgH);
  const zoom = 1.05 + rnd() * (1.25 - 1.05);
  const view = Math.floor(minDim / zoom);
  const viewW = view;
  const viewH = view;

  // pick pan axis and fixed offset on the other axis
  const dir = chooseDirection(index, rnd);
  let start: Rect = { x: 0, y: 0, w: viewW, h: viewH };
  let end: Rect = { x: 0, y: 0, w: viewW, h: viewH };

  const maxX = Math.max(0, imgW - viewW);
  const maxY = Math.max(0, imgH - viewH);
  const fixedY = Math.floor(rnd() * maxY);
  const fixedX = Math.floor(rnd() * maxX);

  if (dir === 'lr') {
    start = { x: 0, y: fixedY, w: viewW, h: viewH };
    end = { x: maxX, y: fixedY, w: viewW, h: viewH };
  } else if (dir === 'rl') {
    start = { x: maxX, y: fixedY, w: viewW, h: viewH };
    end = { x: 0, y: fixedY, w: viewW, h: viewH };
  } else if (dir === 'tb') {
    start = { x: fixedX, y: 0, w: viewW, h: viewH };
    end = { x: fixedX, y: maxY, w: viewW, h: viewH };
  } else {
    // 'bt'
    start = { x: fixedX, y: maxY, w: viewW, h: viewH };
    end = { x: fixedX, y: 0, w: viewW, h: viewH };
  }

  // clamp to bounds (safety)
  start.x = clamp(start.x, 0, maxX); end.x = clamp(end.x, 0, maxX);
  start.y = clamp(start.y, 0, maxY); end.y = clamp(end.y, 0, maxY);

  // Create ease-in-out waypoints by sampling the eased progress at 0, 0.2, 0.8, 1
  const times = [0, 0.2, 0.8, 1];
  const frames: Keyframe[] = times.map((t) => {
    const u = easeInOutCubic(t);
    const x = Math.round(start.x + (end.x - start.x) * u);
    const y = Math.round(start.y + (end.y - start.y) * u);
    return { t, rect: { x, y, w: viewW, h: viewH } };
  });

  // Normalize t to [0,1] regardless of duration; duration used by caller to scale
  frames[0].t = 0; frames[frames.length - 1].t = 1;
  return frames;
}
