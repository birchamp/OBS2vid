export interface RecordingEntry {
  storyId: number;
  index: number;
  audioPath: string;
  durationMs: number;
}

// In-memory cache + AsyncStorage persistence (falls back to memory in Node/tests)
let AsyncStorage: any;
try { AsyncStorage = require('@react-native-async-storage/async-storage').default; } catch (e) { AsyncStorage = null; }

const STORAGE_KEY = 'obs2vid.recordings.v1';
const recs = new Map<string, RecordingEntry>();

function key(storyId: number, index: number) {
  return `${storyId}:${index}`;
}

export function setRecording(entry: RecordingEntry) {
  recs.set(key(entry.storyId, entry.index), entry);
  void saveAll();
}

export function getRecording(storyId: number, index: number): RecordingEntry | undefined {
  return recs.get(key(storyId, index));
}

export function getRecordingsForStory(storyId: number): RecordingEntry[] {
  return Array.from(recs.values()).filter(r => r.storyId === storyId).sort((a, b) => a.index - b.index);
}

export async function loadAll(): Promise<void> {
  if (!AsyncStorage) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const arr: RecordingEntry[] = JSON.parse(raw);
    recs.clear();
    for (const r of arr) recs.set(key(r.storyId, r.index), r);
  } catch {}
}

export async function saveAll(): Promise<void> {
  if (!AsyncStorage) return;
  try {
    const arr = Array.from(recs.values());
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {}
}
