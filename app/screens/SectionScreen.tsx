import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Section, Story } from '../../src/types';
import { obsCdnImage, UI_IMAGE_SIZE } from '../../src/lib/obsImage';
import { startSectionRecording, stopSectionRecording, playSectionRecording, pausePlayback, retakeSectionRecording } from '../../src/lib/recorder';
import { ObsRecorder } from '../../src/native/ObsRecorder';
import { setRecording, getRecording } from '../../src/state/recordings';

export function SectionScreen({ story, onExport, onHome }: { story?: Story; onExport?: (storyId: number) => void; onHome?: () => void }) {
  const initialStoryId = story?.id ?? 32;
  const [storyId] = useState<number>(initialStoryId);
  const [sectionIndex, setSectionIndex] = useState<number>(1);
  const maxFrames = story?.sections?.length ?? 14;
  const section: Section = useMemo(() => {
    if (story) {
      const s = story.sections[sectionIndex - 1];
      return { storyId: story.id, index: s.index, text: s.text, imageUrl: s.imageUrl } as Section;
    }
    return {
      storyId,
      index: sectionIndex,
      text: `This is a preview of section ${String(sectionIndex).padStart(2, '0')} narration text. Tap record to capture your voice, then play to review.`,
      imageUrl: obsCdnImage(storyId, sectionIndex, UI_IMAGE_SIZE),
    } as Section;
  }, [story, storyId, sectionIndex]);

  const [audioPath, setAudioPath] = useState<string | undefined>(undefined);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [meter, setMeter] = useState<number>(-60);
  const [playPulse, setPlayPulse] = useState<number>(0);
  const recordedDuration = useRef<number | undefined>(undefined);
  const [playPosMs, setPlayPosMs] = useState(0);
  const [playDurMs, setPlayDurMs] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubMs, setScrubMs] = useState(0);
  const scrubWidth = useRef(0);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const onRecord = useCallback(async () => {
    try {
      // Prevent starting recording while playing
      if (isPlaying) {
        Alert.alert(
          'Cannot Record While Playing',
          'Please stop playback before starting a new recording.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (isRecording) {
        const res = await stopSectionRecording();
        recordedDuration.current = res.durationMs;
        setIsRecording(false);
        setRecordingStartTime(null);
        setRecordingDuration(0);
        setAudioPath(res.path || audioPath);
        if ((res.path || audioPath) && recordedDuration.current) {
          setRecording({ storyId: section.storyId, index: section.index, audioPath: (res.path || audioPath)!, durationMs: recordedDuration.current });
        }
        return;
      }

      // Best-effort capability check
      try {
        const can = await ObsRecorder.canRecord();
        if (!can) {
          Alert.alert('Recording not available', 'No audio input is available on this device.');
          return;
        }
      } catch {}

      // Stop any current playback before starting recording
      if (isPlaying) {
        try {
          await pausePlayback();
          setIsPlaying(false);
        } catch {}
      }

      const path = await startSectionRecording(section);
      setIsRecording(true);
      setAudioPath(path);
      setRecordingStartTime(Date.now());
      setRecordingDuration(0);
    } catch (e: any) {
      setIsRecording(false);
      const msg = (e && (e.message || e.toString())) || 'Unknown error';
      Alert.alert('Recording error', String(msg));
    }
  }, [isRecording, isPlaying, section, audioPath]);

  const onPlayPause = useCallback(async () => {
    if (!audioPath) return;

    // Prevent playing while recording
    if (isRecording) {
      Alert.alert(
        'Cannot Play While Recording',
        'Please stop recording before playing back your audio.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (isPlaying) {
      await pausePlayback();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    const dur = recordedDuration.current ?? 1000;
    const timeout = setTimeout(() => setIsPlaying(false), Math.max(300, dur));
    try {
      await playSectionRecording(audioPath);
    } finally {
      setTimeout(() => setIsPlaying(false), Math.max(300, dur));
    }
    return () => clearTimeout(timeout);
  }, [audioPath, isPlaying, isRecording, pausePlayback]);

  const onRetake = useCallback(async () => {
    if (!audioPath) return;

    // Prevent retake while recording or playing
    if (isRecording) {
      Alert.alert(
        'Cannot Retake While Recording',
        'Please stop recording before retaking.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (isPlaying) {
      Alert.alert(
        'Cannot Retake While Playing',
        'Please stop playback before retaking.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Retake Recording',
      'This will delete your current recording. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retake',
          style: 'destructive',
          onPress: async () => {
            try {
              if (audioPath) await retakeSectionRecording(audioPath);
            } catch {}
            setAudioPath(undefined);
            recordedDuration.current = undefined;
            setPlayPosMs(0);
            setPlayDurMs(0);
          }
        }
      ]
    );
  }, [audioPath, isRecording, isPlaying]);

  const prev = useCallback(() => {
    // Don't clear audio path here - let the useEffect load the correct recording for the new section
    setPlayPosMs(0);
    setPlayDurMs(0);
    setSectionIndex(i => (i > 1 ? i - 1 : maxFrames));
  }, []);

  const next = useCallback(() => {
    // Don't clear audio path here - let the useEffect load the correct recording for the new section
    setPlayPosMs(0);
    setPlayDurMs(0);
    setSectionIndex(i => (i < maxFrames ? i + 1 : 1));
  }, []);

  React.useEffect(() => {
    let id: any;
    if (isRecording) {
      id = setInterval(async () => {
        try {
          const m = await (ObsRecorder.getMetering ? ObsRecorder.getMetering() : Promise.resolve(-60));
          if (typeof m === 'number') setMeter(m);
        } catch {}
      }, 150);
    } else {
      setMeter(-60);
    }
    return () => { if (id) clearInterval(id); };
  }, [isRecording]);

  // Update recording timer
  React.useEffect(() => {
    let id: any;
    if (isRecording && recordingStartTime) {
      id = setInterval(() => {
        setRecordingDuration(Date.now() - recordingStartTime);
      }, 100);
    }
    return () => { if (id) clearInterval(id); };
  }, [isRecording, recordingStartTime]);

  // Poll playback position to drive scrubber
  React.useEffect(() => {
    let id: any;
    if (audioPath && !isRecording) {
      id = setInterval(async () => {
        try {
          const status = await (ObsRecorder.getPlayPosition ? ObsRecorder.getPlayPosition() : Promise.resolve({ positionMs: 0, durationMs: recordedDuration.current || 0, isPlaying }));
          if (!isScrubbing) setPlayPosMs(status.positionMs || 0);
          setPlayDurMs(status.durationMs || (recordedDuration.current || 0));
          if (typeof status.isPlaying === 'boolean') setIsPlaying(status.isPlaying);
        } catch {}
      }, 150);
    }
    return () => { if (id) clearInterval(id); };
  }, [audioPath, isRecording, isScrubbing, isPlaying]);

  // Load existing recording when section changes
  React.useEffect(() => {
    const existingRecording = getRecording(section.storyId, section.index);
    if (existingRecording) {
      setAudioPath(existingRecording.audioPath);
      recordedDuration.current = existingRecording.durationMs;
      setPlayPosMs(0);
      setPlayDurMs(existingRecording.durationMs);
    } else {
      setAudioPath(undefined);
      recordedDuration.current = undefined;
      setPlayPosMs(0);
      setPlayDurMs(0);
    }
  }, [section.storyId, section.index]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      {/* Top navigation bar */}
      <View style={{ height: 56, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111827' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={onHome} style={{ padding: 10, marginRight: 2 }}>
            <Ionicons name="home" size={20} color="#e5e7eb" />
          </Pressable>
          <Pressable onPress={prev} style={{ padding: 10, marginLeft: 2 }}>
            <Ionicons name="chevron-back" size={22} color="#e5e7eb" />
          </Pressable>
        </View>
        <Text style={{ color: '#e5e7eb', fontSize: 16, fontWeight: '600' }}>
          Story {String(storyId).padStart(2, '0')} — {String(sectionIndex).padStart(2, '0')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={next} style={{ padding: 8, marginRight: 4 }}>
            <Ionicons name="chevron-forward" size={24} color="#e5e7eb" />
          </Pressable>
          <Pressable onPress={() => onExport ? onExport(storyId) : Alert.alert('Export', 'Export screen not available in this mode.')} style={{ padding: 8, marginLeft: 4 }}>
            <Ionicons name="share-social" size={20} color="#e5e7eb" />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 96 }}>
        <Image
          source={{ uri: section.imageUrl }}
          style={{ width: '100%', aspectRatio: 3 / 2, backgroundColor: '#0b1220' }}
          resizeMode="cover"
        />
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ color: '#e5e7eb', fontSize: 16, lineHeight: 22 }}>{section.text}</Text>
        </View>
      </ScrollView>

      {/* Visual Status Bar */}
      <View style={{
        position: 'absolute',
        top: 56, // Below the navigation bar
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: isRecording ? '#ef4444' : isPlaying ? '#22c55e' : audioPath ? '#3b82f6' : '#6b7280',
        opacity: isRecording ? 0.8 : 0.6
      }}>
        {isRecording && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '100%',
            backgroundColor: '#ef4444',
            opacity: 0.3,
            transform: [{ scaleX: Math.sin(Date.now() / 200) * 0.1 + 0.9 }] // Pulsing effect
          }} />
        )}
      </View>

      {/* Recording toolbar */}
      <View style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        padding: 16,
        backgroundColor: isRecording ? '#1a0f0f' : isPlaying ? '#0f1a0f' : '#0b1220',
        borderTopWidth: 2,
        borderTopColor: isRecording ? '#ef4444' : isPlaying ? '#22c55e' : '#1f2937'
      }}>

        <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
          <Pressable
            onPress={onRetake}
            disabled={!audioPath || isRecording || isPlaying}
            style={({ pressed }) => ({
              opacity: (!audioPath || isRecording || isPlaying) ? 0.4 : (pressed ? 0.7 : 1),
              padding: 12,
              borderRadius: 9999,
              backgroundColor: audioPath && !isRecording && !isPlaying ? '#f59e0b' : '#111827',
              shadowColor: audioPath && !isRecording && !isPlaying ? '#f59e0b' : '#111827',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: audioPath && !isRecording && !isPlaying ? 0.3 : 0.2,
              shadowRadius: audioPath && !isRecording && !isPlaying ? 6 : 4,
              elevation: audioPath && !isRecording && !isPlaying ? 4 : 2,
              transform: [{ scale: pressed && audioPath && !isRecording && !isPlaying ? 0.95 : 1 }]
            })}
          >
            <Ionicons name="refresh" size={24} color={audioPath && !isRecording && !isPlaying ? '#0b1220' : '#e5e7eb'} />
          </Pressable>

          {(() => {
            const recLevel = Math.max(0, Math.min(1, (meter + 60) / 60));
            const level = isRecording ? recLevel : (isPlaying ? playPulse : 0);
            const glowSize = 68 + level * 22;
            const glowOpacity = 0.2 + level * 0.6;
            return (
              <View style={{ width: 72, height: 72, alignItems: 'center', justifyContent: 'center' }}>
                {isRecording && (
                  <View style={{ position: 'absolute', width: glowSize, height: glowSize, borderRadius: 9999, backgroundColor: '#ef4444', opacity: glowOpacity }} />
                )}
                <Pressable
                  onPress={onRecord}
                  style={({ pressed }) => ({
                    padding: 20,
                    borderRadius: 9999,
                    backgroundColor: isRecording ? '#ef4444' : '#22c55e',
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                    shadowColor: isRecording ? '#ef4444' : '#22c55e',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: isRecording ? 0.5 : 0.3,
                    shadowRadius: isRecording ? 10 : 5,
                    elevation: isRecording ? 8 : 4
                  })}
                >
                  <Ionicons name={isRecording ? 'stop' : 'mic'} size={28} color="#0b1220" />
                </Pressable>
                {isRecording && (
                  <View style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: '#ef4444',
                    borderWidth: 2,
                    borderColor: '#0b1220',
                    opacity: Math.sin(Date.now() / 300) * 0.3 + 0.7 // Pulsing red dot
                  }} />
                )}
              </View>
            );
          })()}


          <Pressable
            onPress={onPlayPause}
            disabled={!audioPath || isRecording}
            style={({ pressed }) => ({
              opacity: (!audioPath || isRecording) ? 0.4 : (pressed ? 0.7 : 1),
              padding: 12,
              borderRadius: 9999,
              backgroundColor: isPlaying ? '#22c55e' : '#111827',
              shadowColor: isPlaying ? '#22c55e' : '#111827',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: isPlaying ? 0.4 : 0.2,
              shadowRadius: isPlaying ? 8 : 4,
              elevation: isPlaying ? 6 : 2,
              transform: [{ scale: pressed ? 0.95 : 1 }]
            })}
          >
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color={isPlaying ? '#0b1220' : '#e5e7eb'} />
          </Pressable>

          {null}
        </View>

        {/* Under controls: show meter while recording; show scrubber during playback */}
        { isRecording && (() => {
            const recLevel = Math.max(0, Math.min(1, (meter + 60) / 60));
            let color = '#22c55e';
            if (recLevel < 0.6) {
              const r = Math.round(34 + (245 - 34) * (recLevel / 0.6));
              const g = Math.round(197 + (158 - 197) * (recLevel / 0.6));
              const b = Math.round(94 + (11 - 94) * (recLevel / 0.6));
              color = `rgb(${r},${g},${b})`;
            } else {
              const t = (recLevel - 0.6) / 0.4; // 0..1
              const r = Math.round(245 + (239 - 245) * t);
              const g = Math.round(158 + (68 - 158) * t);
              const b = Math.round(11 + (68 - 11) * t);
              color = `rgb(${r},${g},${b})`;
            }
            const widthPct = Math.max(2, Math.min(100, Math.round(recLevel * 100)));
            return (
              <View style={{ marginTop: 10, height: 6, borderRadius: 4, overflow: 'hidden', backgroundColor: '#1f2937' }}>
                <View style={{ width: `${widthPct}%`, height: '100%', backgroundColor: color }} />
              </View>
            );
        })() }

        { (!isRecording && !!audioPath) && (() => {
            const duration = playDurMs || recordedDuration.current || 0;
            const pos = isScrubbing ? scrubMs : playPosMs;
            const pct = duration > 0 ? Math.max(0, Math.min(1, pos / duration)) : 0;
            const dotSize = 12;
            return (
              <View
                style={{ marginTop: 12, height: 24, justifyContent: 'center' }}
                onLayout={(e) => { scrubWidth.current = e.nativeEvent.layout.width; }}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={(e) => {
                  if (!duration || !scrubWidth.current) return;
                  setIsScrubbing(true);
                  const x = e.nativeEvent.locationX;
                  const pct = Math.max(0, Math.min(1, x / scrubWidth.current));
                  setScrubMs(pct * duration);
                }}
                onResponderMove={(e) => {
                  if (!duration || !scrubWidth.current) return;
                  const x = e.nativeEvent.locationX;
                  const pct = Math.max(0, Math.min(1, x / scrubWidth.current));
                  setScrubMs(pct * duration);
                }}
                onResponderRelease={async () => {
                  if (!duration) return;
                  setIsScrubbing(false);
                  const target = Math.max(0, Math.min(duration, scrubMs));
                  await (ObsRecorder.setPlayPosition ? ObsRecorder.setPlayPosition(target) : Promise.resolve());
                  setPlayPosMs(target);
                }}
              >
                <View style={{ height: 6, borderRadius: 4, backgroundColor: '#1f2937', overflow: 'hidden' }}>
                  <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: '#22c55e' }} />
                </View>
                <View style={{ position: 'absolute', left: `${pct * 100}%`, marginLeft: -dotSize/2, width: dotSize, height: dotSize, borderRadius: 9999, backgroundColor: '#e5e7eb' }} />
                <View style={{ position: 'absolute', top: 14, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#9ca3af', fontSize: 10 }}>{(pos/1000).toFixed(1)}s</Text>
                  <Text style={{ color: '#9ca3af', fontSize: 10 }}>{(duration/1000).toFixed(1)}s</Text>
                </View>
              </View>
            );
        })() }

        {/* Recording Timer & Status */}
        {isRecording && (
          <View style={{ marginTop: 12, alignItems: 'center' }}>
            <Text style={{ color: '#ef4444', fontSize: 18, fontWeight: 'bold', fontVariant: ['tabular-nums'] }}>
              {(recordingDuration / 1000).toFixed(1)}s
            </Text>
            <Text style={{ color: '#fca5a5', fontSize: 10, marginTop: 2 }}>
              RECORDING
            </Text>
          </View>
        )}

        {!isRecording && (
          <View style={{ marginTop: 8, alignItems: 'center' }}>
            {audioPath ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                <Text style={{ color: '#22c55e', fontSize: 12, marginLeft: 4 }}>
                  {Math.round(((recordedDuration.current || 0) / 1000) * 10) / 10}s saved
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="mic-off" size={14} color="#6b7280" />
                <Text style={{ color: '#6b7280', fontSize: 12, marginLeft: 4 }}>
                  Ready to record
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
