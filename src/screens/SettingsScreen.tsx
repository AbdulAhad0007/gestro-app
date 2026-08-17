import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, Pressable } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { usePCConnectionStore } from '../store/usePCConnectionStore';
import { useMouseStore } from '../store/useMouseStore';
import { supabase } from '../services/supabase';
import { User, LogOut, PowerOff, ArrowLeft, ChevronRight, MousePointer2, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestroIconButton } from '../components/GestroIconButton';
import { useNavigation } from '@react-navigation/native';

export function SettingsScreen() {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const { themeMode, setThemeMode } = useThemeStore();
  const { user, profile, setSession, setTemporarySession, isTemporarySession } = useAuthStore();
  const { disconnect, connectionPreference, setConnectionPreference, isConnected } = usePCConnectionStore();
  const { layoutPreference, setLayoutPreference } = useMouseStore();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [showMouseModal, setShowMouseModal] = useState(false);

  const textColor = isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary';
  const secondaryTextColor = isDark ? 'text-dark-textSecondary' : 'text-light-textSecondary';
  const surfaceStyle = isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border';

  const handleLogout = () => {
    Alert.alert('Log out of Gestro?', 'Your current device connection will be disconnected.', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive',
        onPress: async () => {
          if (!isTemporarySession) await supabase.auth.signOut();
          setSession(null);
          setTemporarySession(false);
          disconnect();
        }
      }
    ]);
  };

  const handleDeleteAccount = () => {
    if (isTemporarySession) {
      Alert.alert('Temporary Session', 'You are in a temporary session. There is no account to delete.');
      return;
    }
    
    Alert.alert(
      'Delete your Gestro account?',
      'This permanently removes your account and associated cloud data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.rpc('delete_user_account');
              if (error) throw error;
              
              await supabase.auth.signOut();
              setSession(null);
              setTemporarySession(false);
              disconnect();
              Alert.alert('Account Deleted', 'Your account has been successfully deleted.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete account.');
            }
          }
        }
      ]
    );
  };
  
  const getLayoutLabel = (layout: number) => {
    if (layout === 1) return 'Default (Touchpad Top)';
    if (layout === 2) return 'Buttons Top';
    if (layout === 3) return 'Side Buttons & Scroller';
    return '';
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}>
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <GestroIconButton 
          icon={<ArrowLeft color={isDark ? '#FFF' : '#000'} />} 
          onPress={() => navigation.goBack()}
          variant="ghost"
        />
        <Text className={`text-xl font-bold ml-4 ${textColor}`}>Settings</Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 + (insets.bottom || 0) }}
      >
        {/* APPEARANCE */}
        <Text className={`text-sm font-bold mb-3 uppercase tracking-wider ${secondaryTextColor}`}>Appearance</Text>
        <View className={`p-2 rounded-2xl mb-8 flex-row border ${surfaceStyle}`}>
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => setThemeMode('system')}
            className={`flex-1 py-2 items-center justify-center rounded-xl ${themeMode === 'system' ? 'bg-gestro-green/20' : ''}`}
          >
            <Text className={`font-bold text-sm ${themeMode === 'system' ? 'text-gestro-green' : textColor}`}>System</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => setThemeMode('dark')}
            className={`flex-1 py-2 items-center justify-center rounded-xl ${themeMode === 'dark' ? 'bg-gestro-green/20' : ''}`}
          >
            <Text className={`font-bold text-sm ${themeMode === 'dark' ? 'text-gestro-green' : textColor}`}>Dark</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => setThemeMode('light')}
            className={`flex-1 py-2 items-center justify-center rounded-xl ${themeMode === 'light' ? 'bg-gestro-green/20' : ''}`}
          >
            <Text className={`font-bold text-sm ${themeMode === 'light' ? 'text-gestro-green' : textColor}`}>Light</Text>
          </TouchableOpacity>
        </View>

        {/* CONNECTION PREFERENCES */}
        <Text className={`text-sm font-bold mb-3 uppercase tracking-wider ${secondaryTextColor}`}>Connection Preference</Text>
        <View className={`p-2 rounded-2xl mb-8 flex-row border ${surfaceStyle}`}>
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => setConnectionPreference('USB First')}
            className={`flex-1 py-2 items-center justify-center rounded-xl ${connectionPreference === 'USB First' ? 'bg-gestro-green/20' : ''}`}
          >
            <Text className={`font-bold text-sm ${connectionPreference === 'USB First' ? 'text-gestro-green' : textColor}`}>USB First</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => setConnectionPreference('Wi-Fi First')}
            className={`flex-1 py-2 items-center justify-center rounded-xl ${connectionPreference === 'Wi-Fi First' ? 'bg-gestro-green/20' : ''}`}
          >
            <Text className={`font-bold text-sm ${connectionPreference === 'Wi-Fi First' ? 'text-gestro-green' : textColor}`}>Wi-Fi First</Text>
          </TouchableOpacity>
        </View>
        
        {/* MOUSE PREFERENCES */}
        <Text className={`text-sm font-bold mb-3 uppercase tracking-wider ${secondaryTextColor}`}>Control Preferences</Text>
        <View className={`rounded-2xl mb-8 overflow-hidden border ${surfaceStyle}`}>
          <View className={!isConnected ? 'opacity-40' : ''} pointerEvents={!isConnected ? 'none' : 'auto'}>
            <SettingRow 
              icon={<MousePointer2 color={isDark ? '#FFF' : '#000'} size={20} />} 
              label="Mouse Layout" 
              value={getLayoutLabel(layoutPreference)}
              isDark={isDark} 
              onPress={() => setShowMouseModal(true)}
            />
          </View>
        </View>

        {/* ACCOUNT */}
        <Text className={`text-sm font-bold mb-3 uppercase tracking-wider ${secondaryTextColor}`}>Account & Profile</Text>
        <View className={`rounded-2xl mb-8 overflow-hidden border ${surfaceStyle}`}>
          <SettingRow 
            icon={<User color={isDark ? '#FFF' : '#000'} size={20} />} 
            label="Profile Information" 
            isDark={isDark} 
            onPress={() => navigation.navigate('Profile' as never)}
          />
          <View className={`h-[1px] ${isDark ? 'bg-dark-border' : 'bg-light-border'}`} />
          <SettingRow 
            icon={<LogOut color="#EF4444" size={20} />} 
            label="Log out" 
            isDark={isDark} 
            onPress={handleLogout}
            danger
          />
        </View>

        {/* DANGER ZONE */}
        <Text className={`text-sm font-bold mb-3 uppercase tracking-wider text-red-500`}>Danger Zone</Text>
        <View className={`rounded-2xl mb-8 overflow-hidden border ${isDark ? 'bg-dark-surface border-red-900/30' : 'bg-red-50 border-red-200'}`}>
          <SettingRow 
            icon={<PowerOff color="#EF4444" size={20} />} 
            label="Delete Account Permanently" 
            isDark={isDark} 
            onPress={handleDeleteAccount}
            danger
          />
        </View>
      </ScrollView>

      {/* MOUSE LAYOUT MODAL */}
      <Modal visible={showMouseModal} animationType="slide" transparent={true}>
        <Pressable 
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowMouseModal(false)}
        >
          <Pressable 
            className={`rounded-t-3xl p-6 pb-12 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="items-center mb-6">
              <View className="w-12 h-1 rounded-full bg-zinc-500 mb-4" />
              <Text className={`text-xl font-bold ${textColor}`}>Mouse Layout</Text>
            </View>
            
            <LayoutOptionRow 
              label="Default (Touchpad Top)" 
              description="Touch & Move area on top, buttons on bottom"
              selected={layoutPreference === 1}
              isDark={isDark}
              onPress={() => { setLayoutPreference(1); setShowMouseModal(false); }}
            />
            <View className={`h-[1px] my-1 ${isDark ? 'bg-dark-border' : 'bg-light-border'}`} />
            <LayoutOptionRow 
              label="Buttons Top" 
              description="Buttons on top, Touch & Move area on bottom"
              selected={layoutPreference === 2}
              isDark={isDark}
              onPress={() => { setLayoutPreference(2); setShowMouseModal(false); }}
            />
            <View className={`h-[1px] my-1 ${isDark ? 'bg-dark-border' : 'bg-light-border'}`} />
            <LayoutOptionRow 
              label="Side Buttons & Scroller" 
              description="Left/Right buttons on sides with a mid button for scrolling"
              selected={layoutPreference === 3}
              isDark={isDark}
              onPress={() => { setLayoutPreference(3); setShowMouseModal(false); }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function SettingRow({ icon, label, value, isDark, onPress, danger }: any) {
  const textColor = danger ? 'text-red-500' : (isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary');
  const secondaryColor = isDark ? 'text-dark-textSecondary' : 'text-light-textSecondary';
  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.7}
      className="flex-row items-center justify-between p-4 active:bg-black/5 dark:active:bg-white/5"
    >
      <View className="flex-row items-center flex-1">
        {icon}
        <Text className={`ml-3 font-medium text-base ${textColor}`}>{label}</Text>
      </View>
      <View className="flex-row items-center">
        {value && <Text className={`mr-2 text-sm ${secondaryColor}`}>{value}</Text>}
        <ChevronRight color={isDark ? '#666' : '#A0A0A0'} size={20} />
      </View>
    </TouchableOpacity>
  );
}

function LayoutOptionRow({ label, description, selected, isDark, onPress }: any) {
  const textColor = isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary';
  const secondaryColor = isDark ? 'text-dark-textSecondary' : 'text-light-textSecondary';
  
  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={onPress}
      className="flex-row items-center justify-between py-4"
    >
      <View className="flex-1 pr-4">
        <Text className={`text-base font-bold mb-1 ${textColor}`}>{label}</Text>
        <Text className={`text-xs ${secondaryColor}`}>{description}</Text>
      </View>
      <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${selected ? 'border-gestro-green bg-gestro-green' : (isDark ? 'border-zinc-700' : 'border-zinc-300')}`}>
        {selected && <Check color="#000" size={14} strokeWidth={3} />}
      </View>
    </TouchableOpacity>
  );
}
