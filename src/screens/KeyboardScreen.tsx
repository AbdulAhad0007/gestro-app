import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { usePCConnectionStore } from '../store/usePCConnectionStore';
import { Search } from 'lucide-react-native';

export function KeyboardScreen() {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const { isConnected, sendAction } = usePCConnectionStore();
  
  const textColor = isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary';
  const surfaceStyle = isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border';

  const [text, setText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
            onChangeText={setSearchQuery}
            onSubmitEditing={() => { sendAction('START_SEARCH', { query: searchQuery }); setSearchQuery(''); }}
            placeholder="Search PC (Press Enter)..."
            placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
            className={`flex-1 text-lg font-bold ${textColor}`}
            returnKeyType="search"
          />
        </View>

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
