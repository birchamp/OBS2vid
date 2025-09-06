export interface SectionExportSpec {
  index: number;
  imagePath: string; // absolute path
  audioPath: string; // absolute path
  durationMs: number;
  text?: string;
}

export interface TimelineSegment {
  index: number;
  startMs: number;
  durationMs: number;
}

export interface TimelinePlan {
  segments: TimelineSegment[];
  totalDurationMs: number;
  fps: number;
  totalFrames: number;
  crossfadeMs: number;
}

export function buildTimeline(sections: SectionExportSpec[], fps = 30, crossfadeMs = 350): TimelinePlan {
  if (!sections.length) throw new Error('No sections');
  if (crossfadeMs < 0) throw new Error('crossfadeMs must be >= 0');
  const segments: TimelineSegment[] = [];
  let t = 0;
  sections.forEach((s, i) => {
    segments.push({ index: s.index, startMs: t, durationMs: s.durationMs });
    // Next start overlaps previous end by crossfade
    if (i < sections.length - 1) t += s.durationMs - crossfadeMs;
  });
  const last = sections[sections.length - 1];
  const totalDurationMs = (segments[segments.length - 1].startMs + last.durationMs);
  const totalFrames = Math.round((totalDurationMs / 1000) * fps);
  return { segments, totalDurationMs, fps, totalFrames, crossfadeMs };
}

