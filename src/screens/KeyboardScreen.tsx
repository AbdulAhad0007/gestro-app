import React, { useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { usePCConnectionStore } from '../store/usePCConnectionStore';
import { Search } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function KeyboardScreen() {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const { isConnected, sendAction, searchResults, isSearchingApps } = usePCConnectionStore();
  const insets = useSafeAreaInsets();
  
  const textColor = isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary';
  const surfaceStyle = isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border';

  const [text, setText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const searchQueryRef = useRef(searchQuery);

  const handleSearchQueryChange = useCallback((val: string) => {
    searchQueryRef.current = val;
    setSearchQuery(val);
  }, []);

  const handleSearch = useCallback(() => {
    const query = searchQueryRef.current.trim();
    if (!query) return;
    sendAction('SEARCH_APPS', { query });
    // Safety timeout: reset isSearchingApps if server doesn't respond within 30s
    setTimeout(() => {
      const { isSearchingApps: stillSearching } = usePCConnectionStore.getState();
      if (stillSearching) {
        usePCConnectionStore.setState({ isSearchingApps: false } as any);
      }
    }, 30000);
  }, [sendAction]);

  const handleKeyPress = (key: string) => sendAction('KEY_PRESS', { key });

  const handleType = (val: string) => {
    let i = 0;
    // Find the common prefix length
    while (i < text.length && i < val.length && text[i] === val[i]) i++;
    
    const backspacesNeeded = text.length - i;
    const newCharsToType = val.slice(i);

    for (let b = 0; b < backspacesNeeded; b++) {
      sendAction('BACKSPACE');
    }
    
    if (newCharsToType) {
      sendAction('TYPE_TEXT', { text: newCharsToType });
    }
    
    setText(val);
  };

  return (
    <ScrollView 
      className={`flex-1 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}
      contentContainerStyle={{ padding: 16, paddingTop: 48, paddingBottom: 100 }}
    >
      <Text className={`text-3xl font-bold mb-6 ${textColor}`}>Keyboard</Text>
      
      <View className={!isConnected ? 'opacity-30' : ''} pointerEvents={!isConnected ? 'none' : 'auto'}>
        <Text className={`text-xl font-bold mb-4 ${textColor}`}>Windows Search</Text>
        <View className={`p-4 rounded-2xl border mb-6 flex-row items-center ${surfaceStyle}`}>
          <Search color={isDark ? '#A1A1AA' : '#71717A'} size={20} className="mr-3" />
          <TextInput
            value={searchQuery}
            onChangeText={handleSearchQueryChange}
            onSubmitEditing={handleSearch}
            placeholder="Search PC apps..."
            placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
            className={`flex-1 text-lg font-bold ${textColor}`}
            returnKeyType="search"
          />
          <TouchableOpacity
            onPress={handleSearch}
            className="ml-2 bg-blue-500/20 p-2 rounded-xl border border-blue-500/30"
          >
            <Search color="#3B82F6" size={20} />
          </TouchableOpacity>
        </View>

        {isSearchingApps && (
          <View className={`mb-6 p-4 rounded-2xl border flex-row items-center justify-center ${surfaceStyle}`}>
            <Text className={`text-sm font-bold ${textColor}`}>Searching PC apps... (this may take up to 2 minutes on the first try)</Text>
          </View>
        )}

        {!isSearchingApps && searchResults && searchResults.length > 0 && (
          <View className={`mb-6 p-4 rounded-2xl border ${surfaceStyle}`}>
            <Text className={`text-sm font-bold mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Search Results</Text>
            {searchResults.map((app: any, idx: number) => (
              <View key={idx} className="mb-4 pb-4 border-b border-gray-700/30 last:border-0 last:pb-0 last:mb-0">
                <Text className={`text-base font-bold mb-2 ${textColor}`} numberOfLines={1}>{app.name}</Text>
                <View className="flex-row flex-wrap gap-2">
                  <TouchableOpacity
                    onPress={() => sendAction('APP_ACTION', { path: app.path, action_type: 'open' })}
                    className="bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/30"
                  >
                    <Text className="text-blue-500 font-bold text-xs">Open</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => sendAction('APP_ACTION', { path: app.path, action_type: 'runas' })}
                    className="bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/30"
                  >
                    <Text className="text-red-500 font-bold text-xs">Run as Admin</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => sendAction('APP_ACTION', { path: app.path, action_type: 'location' })}
                    className="bg-gray-500/20 px-3 py-1.5 rounded-lg border border-gray-500/30"
                  >
                    <Text className="text-gray-400 font-bold text-xs">Location</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <Text className={`text-xl font-bold mb-4 ${textColor}`}>Type direct</Text>
        <View className={`p-4 rounded-2xl border mb-6 ${surfaceStyle}`}>
          <TextInput
            value={text}
            onChangeText={handleType}
            placeholder="Type instantly to PC..."
            placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
            className={`w-full text-lg font-bold ${textColor}`}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Text className={`text-xl font-bold mb-4 ${textColor}`}>Keys & Shortcuts</Text>
        <View className="flex-row flex-wrap justify-between mb-4">
          <KeyBtn label="Enter" onPress={() => handleKeyPress('enter')} isDark={isDark} />
          <KeyBtn label="Backspace" onPress={() => handleKeyPress('backspace')} isDark={isDark} />
          <KeyBtn label="Space" onPress={() => handleKeyPress('space')} isDark={isDark} />
          <KeyBtn label="Escape" onPress={() => handleKeyPress('escape')} isDark={isDark} />
          <KeyBtn label="Ctrl+C" onPress={() => sendAction('KEYBOARD_SHORTCUT', { custom_command: 'ctrl+c' })} isDark={isDark} />
          <KeyBtn label="Ctrl+V" onPress={() => sendAction('KEYBOARD_SHORTCUT', { custom_command: 'ctrl+v' })} isDark={isDark} />
        </View>
      </View>
    </ScrollView>
  );
}

function KeyBtn({ label, onPress, isDark }: any) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className={`w-[31%] p-3 rounded-xl mb-3 items-center justify-center border ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'}`}
    >
      <Text className={`text-xs font-bold text-center ${isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
