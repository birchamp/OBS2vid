import type { TimelinePlan, TimelineSegment } from './timeline';

function msToSrtTime(ms: number): string {
  const sign = ms < 0 ? '-' : '';
  ms = Math.max(0, Math.floor(ms));
  const h = Math.floor(ms / 3600000);
  ms -= h * 3600000;
  const m = Math.floor(ms / 60000);
  ms -= m * 60000;
  const s = Math.floor(ms / 1000);
  const msR = ms - s * 1000;
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${sign}${pad(h)}:${pad(m)}:${pad(s)},${pad(msR, 3)}`;
}

export function buildSrt(segments: TimelineSegment[], texts: (string | undefined)[], timeline: TimelinePlan): string {
  const lines: string[] = [];
  segments.forEach((seg, i) => {
    const start = seg.startMs;
    const end = seg.startMs + seg.durationMs;
    const text = (texts[i] || '').toString().trim();
    lines.push(String(i + 1));
    lines.push(`${msToSrtTime(start)} --> ${msToSrtTime(end)}`);
    lines.push(text);
    lines.push('');
  });
  return lines.join('\n');
}

export { msToSrtTime };

