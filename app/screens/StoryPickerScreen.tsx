import React, { useMemo } from 'react';
import { View, Text, Pressable, Image, FlatList } from 'react-native';
import data from '../assets/en_obs.json';

type Story = { id: number; title: string; sections: { index: number; text: string; imageUrl: string }[] };

export function StoryPickerScreen({ onSelect }: { onSelect: (story: Story) => void }) {
  const stories = useMemo(() => (data as any).stories as Story[], []);
  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ height: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' }}>
        <Text style={{ color: '#e5e7eb', fontSize: 16, fontWeight: '600' }}>Open Bible Stories</Text>
      </View>
      <FlatList
        data={stories}
        keyExtractor={(s) => String(s.id)}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => onSelect(item)} style={({ pressed }) => ({ marginBottom: 12, backgroundColor: '#0b1220', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#1f2937', transform: [{ scale: pressed ? 0.99 : 1 }] })}>
            <Image source={{ uri: item.sections[0]?.imageUrl }} style={{ width: '100%', aspectRatio: 3/2, backgroundColor: '#0b1220' }} />
            <View style={{ padding: 12 }}>
              <Text style={{ color: '#e5e7eb', fontWeight: '600' }}>{String(item.id).padStart(2, '0')}. {item.title}</Text>
              <Text numberOfLines={2} style={{ color: '#9ca3af', marginTop: 4 }}>{item.sections[0]?.text || ''}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
