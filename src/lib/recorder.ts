import { ObsRecorder } from '../native/ObsRecorder';
import { audioRelativePath } from './paths';
import type { Section } from '../types';

export async function ensureRecordPermission(): Promise<boolean> {
  try {
    const has = await ObsRecorder.hasPermission();
    if (has) return true;
    try {
      return await ObsRecorder.requestPermission();
    } catch {
      return false;
    }
  } catch {
    try {
      return await ObsRecorder.requestPermission();
    } catch {
      return false;
    }
  }
}

export function buildSectionAudioPath(section: Pick<Section, 'storyId' | 'index'>): Promise<string> {
  const rel = audioRelativePath(section.storyId, section.index);
  return ObsRecorder.resolvePath ? ObsRecorder.resolvePath(rel) : Promise.resolve(rel);
}

export async function startSectionRecording(section: Pick<Section, 'storyId' | 'index'>): Promise<string> {
  const ok = await ensureRecordPermission();
  if (!ok) throw new Error('Microphone permission denied');
  const absPath = await buildSectionAudioPath(section);
  await ObsRecorder.start(absPath, { sampleRate: 44100, channels: 1, bitRate: 64000, format: 'aac' });
  return absPath;
}

export async function stopSectionRecording(): Promise<{ path: string; durationMs: number }> {
  return ObsRecorder.stop();
}

export async function playSectionRecording(path: string): Promise<void> {
  return ObsRecorder.play(path);
}

export async function pausePlayback(): Promise<void> {
  if (ObsRecorder.pausePlay) return ObsRecorder.pausePlay();
  // fallback: stop if pause is not supported
  return ObsRecorder.stopPlay();
}

export async function stopPlayback(): Promise<void> {
  return ObsRecorder.stopPlay();
}

export async function retakeSectionRecording(path: string): Promise<void> {
  await ObsRecorder.stopPlay().catch(() => {});
  await ObsRecorder.remove(path).catch(() => {});
}
