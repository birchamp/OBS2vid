import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRecordingsForStory } from '../../src/state/recordings';
import { ObsExporter } from '../../src/native/ObsExporter';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type Props = { storyId: number; onBack: () => void };
type ExportProps = Props & { onHome?: () => void };

export function ExportScreen({ storyId, onBack, onHome }: ExportProps) {
  const [res, setRes] = useState<'720p' | '1080p'>('1080p');
  const [crossfade, setCrossfade] = useState<number>(350);
  const [captions, setCaptions] = useState<boolean>(true);
  const width = res === '1080p' ? 1920 : 1280;
  const height = res === '1080p' ? 1080 : 720;
  const [androidDirUri, setAndroidDirUri] = useState<string | null>(null);
  const [androidDirName, setAndroidDirName] = useState<string | null>(null);

  const recordings = useMemo(() => getRecordingsForStory(storyId), [storyId]);

  const exportNow = async () => {
    if (!recordings.length) {
      Alert.alert('No recordings', 'Record at least one section before exporting.');
      return;
    }
    // Build sections; include end-card placeholder with 2s duration
    const sections = recordings.map(r => ({ index: r.index, imagePath: '', audioPath: r.audioPath, durationMs: r.durationMs, text: undefined }));
    const endCard = { index: 999, imagePath: '', audioPath: '', durationMs: 2000, text: 'Open Bible Stories text © unfoldingWord, images © Sweet Publishing. CC BY-SA 4.0.' };
    const ts = Date.now();
    const tempDir = (FileSystem.cacheDirectory || FileSystem.documentDirectory) + 'exports/';
    const filename = `obs2vid-${ts}.mp4`;
    const tempOutput = tempDir + filename;
    try { await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true }); } catch {}
    const opts = {
      outputPath: tempOutput,
      width,
      height,
      fps: 30,
      crossfadeMs: crossfade,
      seed: 42,
      makeSrt: captions,
      sections: [...sections, endCard],
    };
    try {
      const result = await ObsExporter.exportVideo(opts as any);
      // Android: if a folder was selected, save there using SAF; else present a Save/Share dialog
      if (Platform.OS === 'android' && androidDirUri) {
        try {
          const created = await FileSystem.StorageAccessFramework.createFileAsync(androidDirUri, filename, 'video/mp4');
          const data = await FileSystem.readAsStringAsync(result.outputPath, { encoding: FileSystem.EncodingType.Base64 });
          await FileSystem.writeAsStringAsync(created, data, { encoding: FileSystem.EncodingType.Base64 });
          Alert.alert('Export complete', `Saved to: ${androidDirName || 'selected folder'}`);
        } catch (e: any) {
          Alert.alert('Save failed', `Could not save to selected folder. You can still choose a location in the next step.\n${String(e?.message || e)}`);
          if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.outputPath, { mimeType: 'video/mp4' }).catch(() => {});
        }
      } else {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(result.outputPath, { mimeType: 'video/mp4' }).catch(() => {});
        } else {
          Alert.alert('Export complete', `Video ready at: ${result.outputPath}`);
        }
      }
      setTimeout(() => onBack(), 0);
    } catch (e: any) {
      Alert.alert('Export failed', String(e?.message || e));
    }
  };

  const chooseFolderAndroid = async () => {
    try {
      const perms = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (perms.granted) {
        setAndroidDirUri(perms.directoryUri);
        const seg = perms.directoryUri.split('%3A').pop() || perms.directoryUri;
        setAndroidDirName(decodeURIComponent(seg));
      } else {
        setAndroidDirUri(null);
        setAndroidDirName(null);
      }
    } catch (e: any) {
      Alert.alert('Folder selection failed', String(e?.message || e));
    }
  };

  const Toggle = ({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) => (
    <Pressable onPress={onPress} style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 9999, backgroundColor: active ? '#22c55e' : '#111827' }}>
      <Text style={{ color: active ? '#0b1220' : '#e5e7eb', fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );

  const Stepper = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Pressable onPress={() => onChange(Math.max(0, value - 50))} style={{ padding: 8, backgroundColor: '#111827', borderRadius: 8 }}>
        <Ionicons name="remove" size={20} color="#e5e7eb" />
      </Pressable>
      <Text style={{ color: '#e5e7eb', width: 80, textAlign: 'center' }}>{value} ms</Text>
      <Pressable onPress={() => onChange(Math.min(1000, value + 50))} style={{ padding: 8, backgroundColor: '#111827', borderRadius: 8 }}>
        <Ionicons name="add" size={20} color="#e5e7eb" />
      </Pressable>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      {/* Nav bar */}
      <View style={{ height: 56, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111827' }}>
        <Pressable onPress={onBack} style={{ padding: 10 }}>
          <Ionicons name="chevron-back" size={24} color="#e5e7eb" />
        </Pressable>
        <Text style={{ color: '#e5e7eb', fontSize: 16, fontWeight: '600' }}>Export</Text>
        <Pressable onPress={onHome} style={{ padding: 10 }}>
          <Ionicons name="home" size={20} color="#e5e7eb" />
        </Pressable>
      </View>

      <View style={{ padding: 16, gap: 16 }}>
        <View>
          <Text style={{ color: '#9ca3af', marginBottom: 8 }}>Resolution</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Toggle active={res === '720p'} label="720p" onPress={() => setRes('720p')} />
            <Toggle active={res === '1080p'} label="1080p" onPress={() => setRes('1080p')} />
          </View>
        </View>

        <View>
          <Text style={{ color: '#9ca3af', marginBottom: 8 }}>Cross‑fade</Text>
          <Stepper value={crossfade} onChange={setCrossfade} />
        </View>

        <View>
          <Text style={{ color: '#9ca3af', marginBottom: 8 }}>Captions (SRT)</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Toggle active={captions} label="On" onPress={() => setCaptions(true)} />
            <Toggle active={!captions} label="Off" onPress={() => setCaptions(false)} />
          </View>
        </View>

        <View style={{ padding: 12, backgroundColor: '#0b1220', borderRadius: 12, borderWidth: 1, borderColor: '#1f2937' }}>
          <Text style={{ color: '#9ca3af' }}>
            End‑card with CC BY‑SA attribution will be appended automatically.
          </Text>
        </View>

        {Platform.OS === 'android' && (
          <View style={{ gap: 8 }}>
            <Text style={{ color: '#9ca3af' }}>Destination folder</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: androidDirUri ? '#e5e7eb' : '#6b7280', flex: 1 }} numberOfLines={1}>
                {androidDirUri ? (androidDirName || 'Selected folder') : 'Not selected'}
              </Text>
              <Pressable onPress={chooseFolderAndroid} style={({ pressed }) => ({ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#111827', transform: [{ scale: pressed ? 0.98 : 1 }] })}>
                <Text style={{ color: '#e5e7eb', fontWeight: '600' }}>{androidDirUri ? 'Change' : 'Choose'}</Text>
              </Pressable>
            </View>
            <Text style={{ color: '#6b7280', fontSize: 12 }}>
              If not selected, a Save/Share dialog will be shown after export.
            </Text>
          </View>
        )}

        <Pressable onPress={exportNow} style={({ pressed }) => ({ marginTop: 8, paddingVertical: 14, borderRadius: 10, backgroundColor: '#22c55e', alignItems: 'center', transform: [{ scale: pressed ? 0.98 : 1 }] })}>
          <Text style={{ color: '#0b1220', fontWeight: '700' }}>Export Video</Text>
        </Pressable>

        <Text style={{ color: '#9ca3af', marginTop: 8, fontSize: 12 }}>Recorded sections: {recordings.length}</Text>
      </View>
    </View>
  );
}
