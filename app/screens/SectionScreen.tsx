import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, Button, Image } from 'react-native';
import type { Section } from '../../src/types';
import { obsCdnImage, UI_IMAGE_SIZE } from '../../src/lib/obsImage';
import { startSectionRecording, stopSectionRecording, playSectionRecording, retakeSectionRecording } from '../../src/lib/recorder';

export function SectionScreen() {
  // Placeholder section for wiring demo
  const section: Section = useMemo(() => ({
    storyId: 32,
    index: 3,
    text: 'Section text here…',
    imageUrl: obsCdnImage(32, 3, UI_IMAGE_SIZE),
  }), []);

  const [audioPath, setAudioPath] = useState<string | undefined>(undefined);
  const [isRecording, setIsRecording] = useState(false);
  const recordedDuration = useRef<number | undefined>(undefined);

  const onRecord = useCallback(async () => {
    if (isRecording) {
      const res = await stopSectionRecording();
      recordedDuration.current = res.durationMs;
      setIsRecording(false);
      setAudioPath(res.path || audioPath); // mock may return ''
      return;
    }
    const path = await startSectionRecording(section);
    setIsRecording(true);
    setAudioPath(path);
  }, [isRecording, section, audioPath]);

  const onPlay = useCallback(async () => {
    if (!audioPath) return;
    await playSectionRecording(audioPath);
  }, [audioPath]);

  const onRetake = useCallback(async () => {
    if (audioPath) await retakeSectionRecording(audioPath);
    setAudioPath(undefined);
    recordedDuration.current = undefined;
  }, [audioPath]);

  return (
    <View>
      <Image source={{ uri: section.imageUrl }} style={{width:360, height:240}} />
      <Text>{section.text}</Text>
      <Button title={isRecording ? 'Stop' : 'Record'} onPress={onRecord} />
      <Button title="Play" onPress={onPlay} disabled={!audioPath} />
      <Button title="Retake" onPress={onRetake} disabled={!audioPath} />
      {audioPath && (
        <Text>Saved: {audioPath} {recordedDuration.current ? `(${Math.round((recordedDuration.current/1000)*10)/10}s)` : ''}</Text>
      )}
    </View>
  );
}
