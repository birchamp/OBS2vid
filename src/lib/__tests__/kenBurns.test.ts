import { generateKenBurnsPath } from '../../lib/kenBurns';

describe('Ken Burns generator', () => {
  it('produces deterministic frames for a seed', () => {
    const a = generateKenBurnsPath(1920, 1080, 3000, 42, 1);
    const b = generateKenBurnsPath(1920, 1080, 3000, 42, 1);
    expect(a).toEqual(b);
    const c = generateKenBurnsPath(1920, 1080, 3000, 43, 1);
    expect(c[0].rect.x).not.toBe(a[0].rect.x);
  });

  it('keeps rects within bounds and zoom between 1.05-1.25', () => {
    const frames = generateKenBurnsPath(1200, 800, 4000, 7, 2);
    for (const f of frames) {
      expect(f.rect.x).toBeGreaterThanOrEqual(0);
      expect(f.rect.y).toBeGreaterThanOrEqual(0);
      expect(f.rect.x + f.rect.w).toBeLessThanOrEqual(1200);
      expect(f.rect.y + f.rect.h).toBeLessThanOrEqual(800);
    }
    const minDim = Math.min(1200, 800);
    const zoom = minDim / frames[0].rect.w;
    expect(zoom).toBeGreaterThanOrEqual(1.05 - 1e-6);
    expect(zoom).toBeLessThanOrEqual(1.25 + 1e-6);
  });

  it('alternates pan axis by index', () => {
    const f1 = generateKenBurnsPath(1000, 1000, 2000, 1, 1);
    const f2 = generateKenBurnsPath(1000, 1000, 2000, 1, 2);
    const movedX = f1[0].rect.x !== f1[f1.length - 1].rect.x;
    const movedY = f1[0].rect.y !== f1[f1.length - 1].rect.y;
    // For index 1 (odd), prefer horizontal move
    expect(movedX).toBe(true);
    // For index 2 (even), prefer vertical move
    const movedX2 = f2[0].rect.x !== f2[f2.length - 1].rect.x;
    const movedY2 = f2[0].rect.y !== f2[f2.length - 1].rect.y;
    expect(movedY2).toBe(true);
    expect(movedX2).toBe(false);
  });

  it('time domain normalized 0..1', () => {
    const frames = generateKenBurnsPath(800, 600, 1234, 9, 3);
    expect(frames[0].t).toBe(0);
    expect(frames[frames.length - 1].t).toBe(1);
  });
});

