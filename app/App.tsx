import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, Platform } from 'react-native';
import { SectionScreen } from './screens/SectionScreen';
import { StoryPickerScreen } from './screens/StoryPickerScreen';
import { ExportScreen } from './screens/ExportScreen';
import { loadAll as loadRecordings } from '../src/state/recordings';

export default function App() {
  const [screen, setScreen] = useState<'picker' | 'section' | 'export'>('picker');
  const [storyId, setStoryId] = useState<number>(32);
  const [story, setStory] = useState<any | undefined>(undefined);

  useEffect(() => {
    // Load persisted recordings on app start
    loadRecordings();
  }, []);

  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: '#0f172a',
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
    }}>
      <StatusBar
        barStyle="light-content"
        translucent={Platform.OS === 'android'}
        backgroundColor={Platform.OS === 'android' ? 'transparent' : '#0f172a'}
      />
      {screen === 'picker' && (
        <StoryPickerScreen onSelect={(st) => { setStory(st); setStoryId(st.id); setScreen('section'); }} />
      )}
      {screen === 'section' && (
        <SectionScreen story={story} onHome={() => setScreen('picker')} onExport={(sid) => { setStoryId(sid); setScreen('export'); }} />
      )}
      {screen === 'export' && (
        <ExportScreen storyId={storyId} onBack={() => setScreen('section')} onHome={() => setScreen('picker')} />
      )}
    </SafeAreaView>
  );
}
