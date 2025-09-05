// Avoid hard import to support Node/Jest without react-native
let RN: any = {};
try { RN = require('react-native'); } catch { RN = {}; }
const NativeModules = RN.NativeModules || {};
const Platform = RN.Platform || { OS: 'test' };

type StartOptions = {
  sampleRate?: number; // default 44100
  channels?: 1 | 2;    // default 1
  bitRate?: number;    // e.g., 64000
  format?: 'aac';      // m4a container
};

export interface ObsRecorderModule {
  requestPermission(): Promise<boolean>;
  hasPermission(): Promise<boolean>;
  canRecord(): Promise<boolean>;
  start(path: string, opts?: StartOptions): Promise<void>;
  stop(): Promise<{ path: string; durationMs: number }>;
  play(path: string): Promise<void>;
  stopPlay(): Promise<void>;
  remove(path: string): Promise<void>;
  getMetering?(): Promise<number>; // -160..0 dBFS (optional)
  resolvePath?(relative: string): Promise<string>; // optional native path resolution
}

const native: Partial<ObsRecorderModule> = (NativeModules as any).ObsRecorder;

// Fallback mock for non-native/Jest environments to unblock UI/dev
const mock: ObsRecorderModule = {
  async requestPermission() { return true; },
  async hasPermission() { return true; },
  async canRecord() { return Platform.OS === 'ios' || Platform.OS === 'android'; },
  async start(_path: string) { /* no-op */ },
  async stop() { return { path: '', durationMs: 1000 }; },
  async play(_path: string) { /* no-op */ },
  async stopPlay() { /* no-op */ },
  async remove(_path: string) { /* no-op */ },
  async getMetering() { return -60; },
  async resolvePath(relative: string) { return relative; },
};

export const ObsRecorder: ObsRecorderModule = {
  requestPermission: () => (native?.requestPermission ? native.requestPermission() : mock.requestPermission()),
  hasPermission:      () => (native?.hasPermission ? native.hasPermission() : mock.hasPermission()),
  canRecord:          () => (native?.canRecord ? native.canRecord() : mock.canRecord()),
  start:              (path, opts) => (native?.start ? native.start(path, opts) : mock.start(path, opts)),
  stop:               () => (native?.stop ? native.stop() : mock.stop()),
  play:               (path) => (native?.play ? native.play(path) : mock.play(path)),
  stopPlay:           () => (native?.stopPlay ? native.stopPlay() : mock.stopPlay()),
  remove:             (path) => (native?.remove ? native.remove(path) : mock.remove(path)),
  getMetering:        () => (native?.getMetering ? native.getMetering() : mock.getMetering!()),
  resolvePath:        (relative) => (native?.resolvePath ? native.resolvePath(relative) : mock.resolvePath!(relative)),
};

export type { StartOptions };
