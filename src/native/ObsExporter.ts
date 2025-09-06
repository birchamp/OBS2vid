// JS bridge for native iOS exporter with Node/Expo fallback.
let RN: any = {};
try { RN = require('react-native'); } catch { RN = {}; }
const NativeModules = RN.NativeModules || {};

type ExportSection = {
  index: number;
  imagePath: string;
  audioPath: string;
  durationMs: number;
  text?: string;
};

export interface ExportOptions {
  outputPath: string;
  width: number; // 1920
  height: number; // 1080
  fps?: number; // 30
  crossfadeMs?: number; // 350
  seed?: number; // for ken burns
  makeSrt?: boolean;
  sections: ExportSection[];
}

export interface ExportResult {
  outputPath: string;
  srtPath?: string;
  durationMs: number;
}

interface ObsExporterModule {
  exportVideo(opts: ExportOptions): Promise<ExportResult>;
}

const native: Partial<ObsExporterModule> = (NativeModules as any).ObsExporter;

// Fallback mock; does not produce a video. Returns joined duration.
export const ObsExporter: ObsExporterModule = {
  exportVideo: async (opts: ExportOptions): Promise<ExportResult> => {
    if (native?.exportVideo) return native.exportVideo(opts);
    const durationMs = opts.sections.reduce((a, s) => a + s.durationMs, 0) - (opts.crossfadeMs || 350) * Math.max(0, opts.sections.length - 1);
    return { outputPath: opts.outputPath, durationMs };
  },
};

export type { ExportSection };

