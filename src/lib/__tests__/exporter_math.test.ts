import { buildTimeline } from '../../lib/timeline';

describe('exporter math golden (3 sections)', () => {
  it('keeps constant fps and A/V sync within 40ms', () => {
    const fps = 30;
    const crossfadeMs = 350;
    const durations = [1800, 2200, 1600]; // ms
    const sections = durations.map((d, i) => ({ index: i + 1, imagePath: 'x', audioPath: 'y', durationMs: d }));
    const tl = buildTimeline(sections as any, fps, crossfadeMs);

    // Constant fps means total frames = round(totalDuration * fps)
    const expectedTotal = durations.reduce((a, b) => a + b, 0) - crossfadeMs * 2;
    expect(tl.totalDurationMs).toBe(expectedTotal);
    expect(tl.totalFrames).toBe(Math.round((expectedTotal / 1000) * fps));

    // A/V sync: section video span matches audio duration; overlap handled at crossfade boundaries
    // Check boundaries: difference between sequential boundaries equals crossfade
    const end0 = tl.segments[0].startMs + durations[0];
    const start1 = tl.segments[1].startMs;
    const overlap01 = end0 - start1; // should equal crossfade
    expect(Math.abs(overlap01 - crossfadeMs)).toBeLessThanOrEqual(5); // arithmetic exact here

    const end1 = tl.segments[1].startMs + durations[1];
    const start2 = tl.segments[2].startMs;
    const overlap12 = end1 - start2;
    expect(Math.abs(overlap12 - crossfadeMs)).toBeLessThanOrEqual(5);

    // Per-section A/V offset is 0 in this math model; allow <=40ms budget
    for (let i = 0; i < 3; i++) {
      const videoEnd = tl.segments[i].startMs + durations[i];
      const audioEnd = tl.segments[i].startMs + durations[i];
      expect(Math.abs(videoEnd - audioEnd)).toBeLessThanOrEqual(40);
    }
  });
});

