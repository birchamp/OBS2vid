import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';

export default function App() {
  return (
    <SafeAreaView>
      <Text>OBS Video App Starter</Text>
      <Text>Go to /src for parsers and scripts. Wire native exporters next.</Text>
      <View style={{ marginTop: 12 }}>
        <Text>
          License: Open Bible Stories text © unfoldingWord, images © Sweet Publishing.
          Licensed under CC BY-SA 4.0. See docs/attribution.md
        </Text>
      </View>
    </SafeAreaView>
  );
}
