import { buildTimeline } from '../../lib/timeline';

describe('timeline', () => {
  it('computes overlapping starts with crossfade and total duration', () => {
    const sections = [
      { index: 1, imagePath: 'a', audioPath: 'a', durationMs: 2000 },
      { index: 2, imagePath: 'b', audioPath: 'b', durationMs: 1500 },
      { index: 3, imagePath: 'c', audioPath: 'c', durationMs: 3000 },
    ];
    const crossfade = 350;
    const t = buildTimeline(sections as any, 30, crossfade);
    expect(t.segments[0].startMs).toBe(0);
    expect(t.segments[1].startMs).toBe(2000 - crossfade);
    expect(t.segments[2].startMs).toBe(2000 - crossfade + 1500 - crossfade);
    const expectedTotal = (2000 + 1500 + 3000) - crossfade * 2;
    expect(t.totalDurationMs).toBe(expectedTotal);
    expect(t.totalFrames).toBe(Math.round((expectedTotal / 1000) * 30));
  });
});

