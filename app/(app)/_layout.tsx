import React from 'react';
import { Tabs } from 'expo-router';
import { FEATURES } from '../../src/config/features';

export default function AppLayout() {
  if (!FEATURES.bottomTabs) {
    // No tabs — use a plain Stack instead
    const { Stack } = require('expo-router');
    return <Stack screenOptions={{ headerShown: false }} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e5e7eb',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Chat', tabBarIcon: ({ color }) => <TabIcon emoji="💬" color={color} /> }}
      />
      {FEATURES.camera && (
        <Tabs.Screen
          name="camera"
          options={{ title: 'Camera', tabBarIcon: ({ color }) => <TabIcon emoji="📷" color={color} /> }}
        />
      )}
      {FEATURES.localDatabase && (
        <Tabs.Screen
          name="library"
          options={{ title: 'Library', tabBarIcon: ({ color }) => <TabIcon emoji="📚" color={color} /> }}
        />
      )}
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: ({ color }) => <TabIcon emoji="⚙️" color={color} /> }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20, opacity: color === '#6366f1' ? 1 : 0.5 }}>{emoji}</Text>;
}
