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
  pausePlay?(): Promise<void>;
  stopPlay(): Promise<void>;
  remove(path: string): Promise<void>;
  getMetering?(): Promise<number>; // -160..0 dBFS (optional)
  resolvePath?(relative: string): Promise<string>; // optional native path resolution
  getPlayPosition?(): Promise<{ positionMs: number; durationMs: number; isPlaying: boolean }>;
  setPlayPosition?(positionMs: number): Promise<void>;
}

const native: Partial<ObsRecorderModule> = (NativeModules as any).ObsRecorder;

// Lazy Expo fallback using expo-av + expo-file-system for Expo Go/dev
let expoImpl: ObsRecorderModule | null = null;
async function getExpoImpl(): Promise<ObsRecorderModule | null> {
  if (expoImpl !== null) return expoImpl;
  try {
    const { Audio } = require('expo-av');
    const FileSystem = require('expo-file-system');
    let currentRecording: any = null;
    let currentSound: any = null;
    let currentUri: string | null = null;
    let isPaused = false;
    let pendingDest: string | null = null;
    let lastMeterDb: number = -60;

    const resolveRel = async (relative: string) => {
      const base: string = FileSystem.documentDirectory;
      const dest = relative.startsWith('file://') ? relative : base + (relative.startsWith('/') ? relative.slice(1) : relative);
      const dir = dest.substring(0, dest.lastIndexOf('/') + 1);
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
      return dest;
    };

    expoImpl = {
      async requestPermission() {
        const res = await Audio.requestPermissionsAsync();
        return !!res.granted;
      },
      async hasPermission() {
        const res = await Audio.getPermissionsAsync();
        return !!res.granted;
      },
      async canRecord() { return true; },
      async start(path: string) {
        // Configure audio mode for recording with conservative, SDK‑compatible options
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: false,
            staysActiveInBackground: false,
            playThroughEarpieceAndroid: false,
          });
        } catch {
          // Fallback minimal config
          try { await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true }); } catch {}
        }
        const recording = new Audio.Recording();
        const options = {
          isMeteringEnabled: true,
          android: {
            extension: '.m4a',
            outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
            audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 64000,
          },
          ios: {
            extension: '.m4a',
            outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
            audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 64000,
          },
          web: {},
        } as any;
        await recording.prepareToRecordAsync(options);
        // Faster status updates keep the session active and meter fresh
        try { recording.setProgressUpdateInterval?.(150); } catch {}
        try { recording.setOnRecordingStatusUpdate?.((status: any) => {
          if (status && typeof status.metering === 'number') lastMeterDb = status.metering as number;
        }); } catch {}
        await recording.startAsync();
        currentRecording = recording;
        lastMeterDb = -60;
        pendingDest = await resolveRel(path);
      },
      async stop() {
        if (!currentRecording) return { path: '', durationMs: 0 };
        try {
          await currentRecording.stopAndUnloadAsync();
        } catch {}
        const status = await currentRecording.getStatusAsync().catch(() => ({}));
        const uri: string = currentRecording.getURI?.() || '';
        let out = uri;
        if (uri && pendingDest) {
          try {
            await FileSystem.moveAsync({ from: uri, to: pendingDest });
            out = pendingDest;
          } catch {
            out = uri;
          }
        }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        const durationMs = (status && status.durationMillis) ? status.durationMillis : 0;
        currentRecording = null;
        const ret = { path: out, durationMs: typeof durationMs === 'number' ? durationMs : 0 };
        return ret;
      },
      async play(path: string) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          staysActiveInBackground: false,
          playThroughEarpieceAndroid: false,
        });
        if (currentSound && currentUri === path && isPaused) {
          await currentSound.playAsync();
          isPaused = false;
          return;
        }
        if (currentSound) {
          try { await currentSound.unloadAsync(); } catch {}
          currentSound = null;
        }
        const { sound } = await Audio.Sound.createAsync({ uri: path });
        currentSound = sound;
        currentUri = path;
        isPaused = false;
        await sound.playAsync();
      },
      async pausePlay() {
        if (currentSound) {
          try { await currentSound.pauseAsync(); isPaused = true; } catch {}
        }
      },
      async stopPlay() {
        if (!currentSound) return;
        try { await currentSound.stopAsync(); } catch {}
        try { await currentSound.unloadAsync(); } catch {}
        currentSound = null;
        currentUri = null;
        isPaused = false;
      },
      async remove(path: string) {
        const FileSystem = require('expo-file-system');
        await FileSystem.deleteAsync(path, { idempotent: true }).catch(() => {});
      },
      async getMetering() {
        if (!currentRecording) return -60;
        try {
          return lastMeterDb;
        } catch {}
        return lastMeterDb;
      },
      async resolvePath(relative: string) { return resolveRel(relative); },
      async getPlayPosition() {
        if (!currentSound) return { positionMs: 0, durationMs: 0, isPlaying: false };
        try {
          const status = await currentSound.getStatusAsync();
          const positionMs = (status && typeof status.positionMillis === 'number') ? status.positionMillis : 0;
          const durationMs = (status && typeof status.durationMillis === 'number') ? status.durationMillis : 0;
          const isPlaying = !!(status && (status.isPlaying === true));
          return { positionMs, durationMs, isPlaying };
        } catch {
          return { positionMs: 0, durationMs: 0, isPlaying: false };
        }
      },
      async setPlayPosition(positionMs: number) {
        if (!currentSound) return;
        try { await currentSound.setPositionAsync(Math.max(0, Math.floor(positionMs))); } catch {}
      },
    } as ObsRecorderModule;
    return expoImpl;
  } catch {
    expoImpl = null;
    return null;
  }
}

// Fallback mock for non-native/Jest environments to unblock UI/dev
const mock: ObsRecorderModule = {
  async requestPermission() { return true; },
  async hasPermission() { return true; },
  async canRecord() { return Platform.OS === 'ios' || Platform.OS === 'android'; },
  async start(_path: string) { /* no-op */ },
  async stop() { return { path: '', durationMs: 1000 }; },
  async play(_path: string) { /* no-op */ },
  async pausePlay() { /* no-op */ },
  async stopPlay() { /* no-op */ },
  async remove(_path: string) { /* no-op */ },
  async getMetering() { return -60; },
  async resolvePath(relative: string) { return relative; },
  async getPlayPosition() { return { positionMs: 0, durationMs: 0, isPlaying: false }; },
  async setPlayPosition(_positionMs: number) { /* no-op */ },
};

export const ObsRecorder: ObsRecorderModule = {
  requestPermission: async () => (native?.requestPermission ? native.requestPermission() : (await getExpoImpl())?.requestPermission() ?? mock.requestPermission()),
  hasPermission:      async () => (native?.hasPermission ? native.hasPermission() : (await getExpoImpl())?.hasPermission() ?? mock.hasPermission()),
  canRecord:          async () => (native?.canRecord ? native.canRecord() : (await getExpoImpl())?.canRecord() ?? mock.canRecord()),
  start:              async (path, opts) => (native?.start ? native.start(path, opts) : (await getExpoImpl())?.start(path, opts) ?? mock.start(path, opts)),
  stop:               async () => (native?.stop ? native.stop() : (await getExpoImpl())?.stop() ?? mock.stop()),
  play:               async (path) => (native?.play ? native.play(path) : (await getExpoImpl())?.play(path) ?? mock.play(path)),
  pausePlay:          async () => (native?.pausePlay ? native.pausePlay() : (await getExpoImpl())?.pausePlay?.() ?? mock.pausePlay!()),
  stopPlay:           async () => (native?.stopPlay ? native.stopPlay() : (await getExpoImpl())?.stopPlay() ?? mock.stopPlay()),
  remove:             async (path) => (native?.remove ? native.remove(path) : (await getExpoImpl())?.remove(path) ?? mock.remove(path)),
  getMetering:        async () => (native?.getMetering ? native.getMetering() : (await getExpoImpl())?.getMetering?.() ?? mock.getMetering!()),
  resolvePath:        async (relative) => (native?.resolvePath ? native.resolvePath(relative) : (await getExpoImpl())?.resolvePath?.(relative) ?? mock.resolvePath!(relative)),
  getPlayPosition:    async () => (native?.getPlayPosition ? native.getPlayPosition() : (await getExpoImpl())?.getPlayPosition?.() ?? mock.getPlayPosition!()),
  setPlayPosition:    async (positionMs) => (native?.setPlayPosition ? native.setPlayPosition(positionMs) : (await getExpoImpl())?.setPlayPosition?.(positionMs) ?? mock.setPlayPosition!(positionMs)),
};

export type { StartOptions };
