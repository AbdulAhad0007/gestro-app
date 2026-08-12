import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { usePCConnectionStore } from '../store/usePCConnectionStore';
import { GestroButton } from '../components/GestroButton';
import { ChevronLeft, AppWindow, Search, Minimize2, Maximize2, XSquare, Focus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';

export function WindowsListScreen() {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const { isConnected, sendAction, windows } = usePCConnectionStore();
  const navigation = useNavigation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWindowId, setSelectedWindowId] = useState<number | null>(null);

  const textColor = isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary';
  const secondaryTextColor = isDark ? 'text-dark-textSecondary' : 'text-light-textSecondary';
  const surfaceStyle = isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border';

  useEffect(() => {
    if (isConnected) {
      sendAction('GET_WINDOWS');
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <View className={`flex-1 items-center justify-center p-6 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}>
        <AppWindow color={isDark ? '#666' : '#A0A0A0'} size={48} className="mb-4" />
        <Text className={`text-xl font-bold mb-2 ${textColor}`}>Connect to a Windows PC</Text>
        <Text className={`text-center mb-6 ${secondaryTextColor}`}>
          Gestro needs an active Windows connection to use this feature.
        </Text>
        <GestroButton label="Connect PC" onPress={() => navigation.navigate('Control PC' as never)} />
      </View>
    );
  }

  const handleAction = (windowId: number, action: string) => {
    sendAction('WINDOW_ACTION', { window_id: windowId, action });
    // Optimistically deselect or refresh after a short delay
    setTimeout(() => sendAction('GET_WINDOWS'), 500);
  };

  const filteredWindows = windows?.filter((win: any) => 
    win.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (win.process_name && win.process_name.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  return (
    <View className={`flex-1 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}>
      <View className={`pt-12 pb-4 px-4 flex-row items-center border-b ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <ChevronLeft color={isDark ? '#FFF' : '#000'} size={28} />
        </TouchableOpacity>
        <Text className={`text-2xl font-bold ${textColor}`}>Windows Manager</Text>
      </View>

      <View className="px-4 py-4">
        <View className={`flex-row items-center px-4 py-2 rounded-xl border ${surfaceStyle}`}>
          <Search color={isDark ? '#666' : '#A0A0A0'} size={20} />
          <TextInput
            className={`flex-1 ml-3 h-10 ${textColor}`}
            placeholder="Search windows..."
            placeholderTextColor={isDark ? '#666' : '#A0A0A0'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View className="flex-row justify-between items-center mb-6">
          <Text className={`text-lg font-bold ${textColor}`}>Open Windows ({filteredWindows.length})</Text>
          <GestroButton label="Refresh" onPress={() => sendAction('GET_WINDOWS')} variant="outline" />
        </View>
        
        {filteredWindows.length === 0 ? (
          <View className="items-center py-12">
            <AppWindow color={isDark ? '#666' : '#A0A0A0'} size={48} className="mb-4" />
            <Text className={`text-center ${textColor}`}>No matching windows found.</Text>
          </View>
        ) : (
          filteredWindows.map((win: any) => {
            const isSelected = selectedWindowId === win.id;
            return (
              <TouchableOpacity 
                key={win.id} 
                onPress={() => setSelectedWindowId(isSelected ? null : win.id)}
                activeOpacity={0.8}
                className={`p-4 rounded-xl border mb-3 ${isSelected ? 'border-gestro-green' : surfaceStyle}`}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 mr-2">
                    <Text className={`font-bold text-base mb-1 ${textColor}`} numberOfLines={2}>
                      {win.title || 'Untitled Window'}
                    </Text>
                    {win.process_name ? (
                      <Text className={`text-xs ${secondaryTextColor}`}>{win.process_name}</Text>
                    ) : null}
                  </View>
                  {win.is_active && (
                    <View className="bg-gestro-green/20 px-2 py-1 rounded">
                      <Text className="text-gestro-green text-xs font-bold">Active</Text>
                    </View>
                  )}
                </View>

                {isSelected && (
                  <View className="flex-row flex-wrap justify-start mt-4 pt-4 border-t border-black/10 dark:border-white/10">
                    <ActionButton icon={<Focus size={18} color="#FFF" />} label="Focus" onPress={() => handleAction(win.id, 'FOCUS')} color="bg-blue-500" />
                    {win.is_minimized ? (
                      <ActionButton icon={<Maximize2 size={18} color="#FFF" />} label="Restore" onPress={() => handleAction(win.id, 'RESTORE')} color="bg-emerald-500" />
                    ) : (
                      <ActionButton icon={<Minimize2 size={18} color="#FFF" />} label="Minimize" onPress={() => handleAction(win.id, 'MINIMIZE')} color="bg-amber-500" />
                    )}
                    <ActionButton icon={<Maximize2 size={18} color="#FFF" />} label="Maximize" onPress={() => handleAction(win.id, 'MAXIMIZE')} color="bg-purple-500" />
                    <ActionButton icon={<XSquare size={18} color="#FFF" />} label="Close" onPress={() => handleAction(win.id, 'CLOSE')} color="bg-red-500" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function ActionButton({ icon, label, onPress, color }: any) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className={`flex-row items-center px-3 py-2 rounded-lg mr-2 mb-2 ${color}`}
    >
      {icon}
      <Text className="text-white font-bold ml-2 text-sm">{label}</Text>
    </TouchableOpacity>
  );
}
