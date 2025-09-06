import { buildSrt } from '../../lib/srt';

describe('srt', () => {
  it('generates simple SRT with one cue per segment', () => {
    const segments = [
      { index: 1, startMs: 0, durationMs: 1000 },
      { index: 2, startMs: 700, durationMs: 1000 },
      { index: 3, startMs: 1400, durationMs: 800 },
    ];
    const srt = buildSrt(segments as any, ['Hello', 'World', 'Bye'], {
      segments: [] as any,
      totalDurationMs: 0,
      fps: 30,
      totalFrames: 0,
      crossfadeMs: 350,
    } as any);
    expect(srt).toContain('1');
    expect(srt).toContain('00:00:00,000 --> 00:00:01,000');
    expect(srt).toContain('Hello');
    expect(srt).toContain('2');
    expect(srt).toContain('00:00:00,700 --> 00:00:01,700');
  });
});

