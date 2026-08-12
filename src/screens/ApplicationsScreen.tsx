import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { usePCConnectionStore } from '../store/usePCConnectionStore';
import { GestroButton } from '../components/GestroButton';

export function ApplicationsScreen() {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const { isConnected, sendAction, apps } = usePCConnectionStore();
  
  const textColor = isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary';
  const surfaceStyle = isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border';

  const [search, setSearch] = useState('');
  const filtered = apps ? apps.filter((a: any) => a.name.toLowerCase().includes(search.toLowerCase())) : [];

  useEffect(() => {
    if (isConnected) {
      sendAction('GET_APPS');
    }
  }, [isConnected]);

  return (
    <ScrollView 
      className={`flex-1 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}
      contentContainerStyle={{ padding: 16, paddingTop: 48, paddingBottom: 100 }}
    >
      <Text className={`text-3xl font-bold mb-6 ${textColor}`}>Apps</Text>
      
      <View className={!isConnected ? 'opacity-30' : ''} pointerEvents={!isConnected ? 'none' : 'auto'}>
        <TextInput 
          placeholder="Filter apps..." 
          value={search} 
          onChangeText={setSearch} 
          placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
          className={`p-4 rounded-xl mb-6 border ${surfaceStyle} ${textColor}`} 
        />
        {!apps || apps.length === 0 ? (
          <Text className={`text-center py-8 ${textColor}`}>Fetching apps or none found...</Text>
        ) : (
          filtered.map((app: any) => (
            <TouchableOpacity 
              key={app.path} 
              onPress={() => sendAction('LAUNCH_APP', { path: app.path })} 
              className={`p-4 rounded-xl border mb-2 flex-row justify-between items-center ${surfaceStyle}`}
            >
              <View className="flex-1 mr-4">
                <Text className={`font-bold ${textColor}`} numberOfLines={1}>{app.name}</Text>
                <Text className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{app.exe}</Text>
              </View>
              <View className="w-32">
                <GestroButton label="Launch" onPress={() => sendAction('LAUNCH_APP', { path: app.path })} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}
