import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking, Image } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { usePCConnectionStore } from '../store/usePCConnectionStore';
import { supabase } from '../services/supabase';
import { 
  User, MonitorSmartphone, Wifi, Power, PowerOff, Shield, Info, ChevronRight,
  LogOut, CheckCircle2, Lock, AppWindow, ClipboardPaste, Mic, Camera
} from 'lucide-react-native';
import { LogOut as LucideLogOut, Sun, Moon, Info as LucideInfo, Settings, Smartphone, FileText, Share2, Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';

export function MoreScreen() {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const { themeMode, setThemeMode } = useThemeStore();
  const { user, profile, setSession, setTemporarySession, isTemporarySession } = useAuthStore();
  const { isConnected, sendAction, systemStats, selectedDevice, connect, disconnect, fetchDevices, isConnecting, transportType, latency, connectionPreference, setConnectionPreference } = usePCConnectionStore();
  const navigation = useNavigation();

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

  const userName = isTemporarySession ? 'Guest User' : (profile?.name || user?.user_metadata?.full_name || 'Gestro User');
  const userEmail = isTemporarySession ? 'Temporary Session' : (profile?.email || user?.email || 'No email associated');

  return (
    <ScrollView 
      className={`flex-1 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}
      contentContainerStyle={{ padding: 16, paddingTop: 48, paddingBottom: 100 + (useSafeAreaInsets().bottom || 0) }}
    >
      {/* HEADER */}
      <View className="mb-6">
        <Text className={`text-3xl font-bold ${textColor}`}>More</Text>
        <Text className={`text-base ${secondaryTextColor}`}>Settings & Gestro controls</Text>
      </View>

      {/* PROFILE CARD */}
      <TouchableOpacity 
        activeOpacity={0.8}
        className={`p-4 rounded-2xl mb-6 flex-row items-center border ${surfaceStyle}`}
      >
        <View className="w-14 h-14 rounded-full bg-gestro-green/20 items-center justify-center mr-4">
          <User color={colors.gestroGreen} size={28} />
        </View>
        <View className="flex-1">
          <Text className={`text-lg font-bold ${textColor}`}>{userName}</Text>
          <Text className={`text-sm mb-1 ${secondaryTextColor}`}>{userEmail}</Text>
          <View className="flex-row items-center">
            <View className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-gestro-green' : 'bg-red-500'}`} />
            <Text className={`text-xs font-bold ${isConnected ? 'text-gestro-green' : 'text-red-500'}`}>
              {isConnected ? 'Connected' : 'Active'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>



      {/* CONNECTION */}
      <Text className={`text-sm font-bold mb-3 uppercase tracking-wider ${secondaryTextColor}`}>Connection</Text>
      <View className={`rounded-2xl mb-8 overflow-hidden border ${surfaceStyle}`}>
        {isConnected ? (
          <View className="p-4">
            <View className="flex-row items-center mb-1">
              <MonitorSmartphone color={isDark ? '#FFF' : '#000'} size={20} />
              <Text className={`ml-3 font-bold text-base ${textColor}`}>{selectedDevice?.device_name || 'Gestro-PC'}</Text>
            </View>
            <Text className={`text-sm ml-8 mb-4 text-gestro-green font-medium`}>
              ● {transportType || 'Connected'} {latency ? `(${latency}ms)` : ''}
            </Text>
            <View className="flex-row justify-end">
              <TouchableOpacity onPress={() => disconnect()} className="px-4 py-2 bg-red-500/10 rounded-lg">
                <Text className="text-red-500 font-bold text-sm">Disconnect</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="p-4 items-center py-6">
            <MonitorSmartphone color={isDark ? '#666' : '#A0A0A0'} size={32} className="mb-3" />
            <Text className={`font-bold text-base mb-1 ${textColor}`}>No Windows device connected</Text>
            <Text className={`text-sm mb-4 ${secondaryTextColor}`}>Open Control PC to connect</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Control PC' as never)}
              className="px-5 py-2 bg-gestro-green rounded-lg"
            >
              <Text className="text-black font-bold">Go to Control PC</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {/* MODULES */}
      <Text className={`text-sm font-bold mb-3 uppercase tracking-wider ${secondaryTextColor}`}>Modules</Text>
      <View className="mb-8">
        <View className={!isConnected ? 'opacity-40' : ''} pointerEvents={!isConnected ? 'none' : 'auto'}>
          <ModuleButton 
            icon={<AppWindow color={isDark ? '#FFF' : '#000'} size={24} />} 
            label="Windows Manager" 
            description="View and control open windows"
            onPress={() => navigation.navigate('WindowsList' as never)} 
            isDark={isDark} 
            surfaceStyle={surfaceStyle} 
            textColor={textColor} 
          />
          <ModuleButton 
            icon={<ClipboardPaste color={isDark ? '#FFF' : '#000'} size={24} />} 
            label="Clipboard & Screenshot" 
            description="Sync clipboard and take screenshots"
            onPress={() => navigation.navigate('ClipboardSync' as never)} 
            isDark={isDark} 
            surfaceStyle={surfaceStyle} 
            textColor={textColor} 
          />
        </View>
        <ModuleButton 
          icon={<Settings color={isDark ? '#FFF' : '#000'} size={24} />} 
          label="Settings" 
          description="Appearance, account & preferences"
          onPress={() => navigation.navigate('Settings' as never)} 
          isDark={isDark} 
          surfaceStyle={surfaceStyle} 
          textColor={textColor} 
        />
      </View>

      {/* LEGAL */}
      <Text className={`text-sm font-bold mb-3 uppercase tracking-wider ${secondaryTextColor}`}>Legal</Text>
      <View className={`rounded-2xl mb-8 overflow-hidden border ${surfaceStyle}`}>
        <SettingRow 
          icon={<Info color={isDark ? '#FFF' : '#000'} size={20} />} 
          label="Terms and Conditions" 
          isDark={isDark} 
          onPress={() => Linking.openURL('https://gestroai.vercel.app/terms')}
        />
        <View className={`h-[1px] ${isDark ? 'bg-dark-border' : 'bg-light-border'}`} />
        <SettingRow 
          icon={<Shield color={isDark ? '#FFF' : '#000'} size={20} />} 
          label="Privacy Policy" 
          isDark={isDark} 
          onPress={() => Linking.openURL('https://gestroai.vercel.app/privacy')}
        />
      </View>



    </ScrollView>
  );
}

// Subcomponents

function SettingRow({ icon, label, isDark, onPress, danger }: any) {
  const textColor = danger ? 'text-red-500' : (isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary');
  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.7}
      className="flex-row items-center justify-between p-4 active:bg-black/5 dark:active:bg-white/5"
    >
      <View className="flex-row items-center">
        {icon}
        <Text className={`ml-3 font-medium text-base ${textColor}`}>{label}</Text>
      </View>
      <ChevronRight color={isDark ? '#666' : '#A0A0A0'} size={20} />
    </TouchableOpacity>
  );
}

function ModuleButton({ icon, label, description, onPress, isDark, surfaceStyle, textColor }: any) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      className={`p-4 rounded-2xl mb-3 flex-row items-center border ${surfaceStyle}`}
    >
      <View className="w-12 h-12 rounded-xl bg-black/5 dark:bg-white/5 items-center justify-center mr-4">
        {icon}
      </View>
      <View className="flex-1">
        <Text className={`text-base font-bold ${textColor}`}>{label}</Text>
        <Text className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{description}</Text>
      </View>
      <ChevronRight color={isDark ? '#666' : '#A0A0A0'} size={20} />
    </TouchableOpacity>
  );
}
