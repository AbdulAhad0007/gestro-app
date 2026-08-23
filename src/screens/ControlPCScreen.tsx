import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, PanResponder, Image } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { usePCConnectionStore } from '../store/usePCConnectionStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '../services/supabase';
import { GestroButton } from '../components/GestroButton';
import { Monitor, Wifi, MousePointer2, Volume2, Volume1, VolumeX, Play, Pause, SkipForward, SkipBack, Lock, Power, PowerOff, Sun, Moon, Keyboard as KeyboardIcon, Command, Search, Image as ImageIcon, Cpu, Activity, Clock, X } from 'lucide-react-native';
import { colors } from '../theme/colors';

export function ControlPCScreen() {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const { isConnected, isConnecting, connectionError, connect, disconnect, sendAction, apps, windows, clipboardText, screenshotData, availableDevices, fetchDevices, systemStats, selectedDevice, transportType, latency, pairingTimeLeft } = usePCConnectionStore();
  const { session } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'quick' | 'mouse' | 'keyboard' | 'media' | 'apps' | 'windows' | 'system'>('quick');
  const [isDiscovering, setIsDiscovering] = useState(true);

  // Initial load
  useEffect(() => {
    if (session?.user.id) {
      loadDevices();
      const channel = supabase
        .channel('device_changes_phase3')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_devices', filter: `user_id=eq.${session.user.id}` },
          () => loadDevices()
        )
        .subscribe();

      // Poll devices every second without resetting the subscription or UI loader
      const interval = setInterval(() => {
        fetchDevices(session.user.id, true);
      }, 1000);

      return () => { 
        supabase.removeChannel(channel);
        clearInterval(interval);
      };
    }
  }, [session?.user.id]);

  // Telemetry Polling Loop
  useEffect(() => {
    let interval: any = null;
    if (isConnected) {
      // Fetch immediately
      sendAction('GET_SYSTEM_STATS');
      // Then every 3 seconds
      interval = setInterval(() => {
        sendAction('GET_SYSTEM_STATS');
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected]);

  const loadDevices = async () => {
    setIsDiscovering(true);
    if (session?.user.id) {
      await fetchDevices(session.user.id);
    }
    setIsDiscovering(false);
  };
  
  const textColor = isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary';
  const surfaceStyle = isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border';

  const handleConnect = (device: any) => {
    if (session?.user.id) {
      connect(session.user.id, device);
    }
  };

  const confirmDangerousAction = (action: string, label: string) => {
    Alert.alert(
      `Confirm ${label}`,
      `Are you sure you want to ${label.toLowerCase()} your PC?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', style: 'destructive', onPress: () => sendAction(action) }
      ]
    );
  };

  const switchTab = (tab: any) => {
    setActiveTab(tab);
    if (tab === 'apps') sendAction('GET_APPS');
    if (tab === 'windows') sendAction('GET_WINDOWS');
  };

  return (
    <ScrollView 
      className={`flex-1 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}
      contentContainerStyle={{ padding: 16, paddingTop: 48, paddingBottom: 100 + (useSafeAreaInsets().bottom || 0) }}
      scrollEnabled={activeTab !== 'mouse'}
    >
      <View className="flex-row items-center justify-between mb-6">
        <Text className={`text-3xl font-bold ${textColor}`}>
          Remote PC
        </Text>
      </View>

      {/* PC Dashboard (Only visible when connected) */}
      {isConnected && systemStats && (
        <View className={`p-4 rounded-2xl mb-6 border ${surfaceStyle}`}>
          <View className="flex-row justify-between items-center mb-4 border-b pb-4 border-zinc-200 dark:border-zinc-800">
            <View>
              <Text className={`text-lg font-bold ${textColor}`}>{selectedDevice?.device_name || 'My Windows PC'}</Text>
              <Text className={`text-xs text-gestro-green font-bold`}>
                ● {transportType || 'CONNECTED'} {latency ? `(${latency}ms)` : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={disconnect} className="bg-red-500/20 px-4 py-2 rounded-xl">
              <Text className="text-red-500 font-bold text-xs">Disconnect</Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row flex-wrap justify-between gap-y-4">
            <View className="w-[48%]">
              <Text className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>CPU USAGE</Text>
              <Text className={`text-xl font-bold ${textColor}`}>{systemStats.cpu_percent}%</Text>
            </View>
            <View className="w-[48%]">
              <Text className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>RAM USAGE</Text>
              <Text className={`text-xl font-bold ${textColor}`}>{systemStats.ram_percent}%</Text>
            </View>
            <View className="w-[48%]">
              <Text className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>ACTIVE APP</Text>
              <Text className={`text-sm font-bold ${textColor}`} numberOfLines={1}>{systemStats.active_app || 'None'}</Text>
            </View>
            <View className="w-[48%]">
              <Text className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>SYSTEM RAM</Text>
              <Text className={`text-sm font-bold ${textColor}`}>{systemStats.ram_used_gb} / {systemStats.ram_total_gb} GB</Text>
            </View>
          </View>
        </View>
      )}

      {/* Connection / Device Selection Card (Only visible when NOT connected) */}
      {!isConnected && (
        <View className={`p-5 rounded-2xl mb-6 border ${surfaceStyle}`}>
          <Text className={`text-xl font-bold mb-4 ${textColor}`}>My Devices</Text>
          
          {connectionError ? (
            <Text className="text-red-500 mb-4">{connectionError}</Text>
          ) : null}

          {isDiscovering && availableDevices.length === 0 ? (
            <Text className={`mb-4 ${isDark ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
              Looking for your Gestro devices...
            </Text>
          ) : availableDevices.length > 0 ? (
            availableDevices.map((device: any) => (
              <View key={device.id} className="flex-row justify-between items-center mb-4 p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <View className="flex-1 mr-3">
                  <Text className={`font-bold text-lg ${textColor}`} numberOfLines={1}>
                    {device.device_name}
                  </Text>
                  <Text className={`text-xs ${device.status === 'online' ? 'text-gestro-green' : 'text-red-500'}`}>
                    {device.status === 'online' ? '● Online' : '● Offline'}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <GestroButton 
                    label={isConnecting && selectedDevice?.id === device.id ? (pairingTimeLeft !== null ? `Waiting for PC (${pairingTimeLeft}s)` : "Connecting...") : "Connect"} 
                    onPress={() => handleConnect(device)} 
                    disabled={isConnecting || device.status !== 'online'}
                    variant={device.status === 'online' ? 'primary' : 'outline'}
                  />
                  {isConnecting && selectedDevice?.id === device.id && (
                    <TouchableOpacity 
                      onPress={() => disconnect()}
                      className="ml-2 p-2 bg-black/10 dark:bg-white/10 rounded-full"
                    >
                      <X color={isDark ? '#FFF' : '#000'} size={20} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View>
              <Text className={`mb-4 ${isDark ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
                No Windows PCs found on your account. Make sure Gestro Desktop is running.
              </Text>
              <GestroButton label="Refresh" onPress={loadDevices} variant="outline" />
            </View>
          )}
        </View>
      )}

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
        <View className="flex-row bg-black/5 p-1 rounded-xl">
          <TabButton label="Quick Actions" active={activeTab === 'quick'} onPress={() => setActiveTab('quick')} isDark={isDark} />
        </View>
      </ScrollView>

      {/* Control Actions */}
      <View className={!isConnected ? 'opacity-30' : ''} pointerEvents={!isConnected ? 'none' : 'auto'}>
        
        {activeTab === 'quick' && <QuickActionsTab isDark={isDark} sendAction={sendAction} confirmDangerousAction={confirmDangerousAction} textColor={textColor} />}

      </View>
    </ScrollView>
  );
}



function TabButton({ label, active, onPress, isDark }: any) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className={`px-4 py-2 mx-1 items-center justify-center rounded-lg ${active ? (isDark ? 'bg-zinc-800' : 'bg-white') : ''}`}
      style={active && !isDark ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 } : {}}
    >
      <Text className={`font-bold text-sm ${active ? (isDark ? 'text-white' : 'text-black') : 'text-gray-500'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function QuickActionsTab({ isDark, sendAction, confirmDangerousAction, textColor }: any) {
  return (
    <View>
      <Text className={`text-xl font-bold mb-4 ${textColor}`}>System</Text>
      <View className="flex-row flex-wrap justify-between mb-4">
        <ActionTile icon={<Lock color={isDark ? '#FFF' : '#000'} size={24} />} label="Lock" isDark={isDark} onPress={() => sendAction('SYSTEM_LOCK')} />
        <ActionTile icon={<Power color={isDark ? '#FFF' : '#000'} size={24} />} label="Sleep" isDark={isDark} onPress={() => confirmDangerousAction('SYSTEM_SLEEP', 'Sleep')} />
        <ActionTile icon={<Monitor color={isDark ? '#FFF' : '#000'} size={24} />} label="Display Off" isDark={isDark} onPress={() => sendAction('DISPLAY_OFF')} />
      </View>
      <Text className={`text-xl font-bold mb-4 ${textColor}`}>Media</Text>
      <View className="flex-row flex-wrap justify-between mb-4 gap-y-2">
        <ActionTile icon={<Volume1 color={isDark ? '#FFF' : '#000'} size={24} />} label="Vol Down" isDark={isDark} onPress={() => sendAction('MEDIA_VOLDOWN')} />
        <ActionTile icon={<VolumeX color={isDark ? '#FFF' : '#000'} size={24} />} label="Mute" isDark={isDark} onPress={() => sendAction('MEDIA_MUTE')} />
        <ActionTile icon={<Volume2 color={isDark ? '#FFF' : '#000'} size={24} />} label="Vol Up" isDark={isDark} onPress={() => sendAction('MEDIA_VOLUP')} />
        <ActionTile icon={<Play color={isDark ? '#FFF' : '#000'} size={24} />} label="Play/Pause" isDark={isDark} onPress={() => sendAction('MEDIA_PLAY_PAUSE')} />
        <ActionTile icon={<SkipBack color={isDark ? '#FFF' : '#000'} size={24} />} label="Prev" isDark={isDark} onPress={() => sendAction('MEDIA_PREV')} />
        <ActionTile icon={<SkipForward color={isDark ? '#FFF' : '#000'} size={24} />} label="Next" isDark={isDark} onPress={() => sendAction('MEDIA_NEXT')} />
      </View>
      <Text className={`text-xl font-bold mb-4 mt-2 text-red-500`}>Power</Text>
      <View className="flex-row flex-wrap justify-between">
        <ActionTile icon={<PowerOff color={isDark ? '#FFF' : '#000'} size={24} />} label="Restart" isDark={isDark} onPress={() => confirmDangerousAction('SYSTEM_RESTART', 'Restart')} />
        <ActionTile icon={<PowerOff color="#EF4444" size={24} />} label="Shutdown" isDark={isDark} onPress={() => confirmDangerousAction('SYSTEM_SHUTDOWN', 'Shutdown')} />
        <View className="w-[31%]" />
      </View>
    </View>
  );
}

function ActionTile({ icon, label, isDark, onPress }: any) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      className={`w-[31%] p-3 rounded-2xl mb-4 items-center justify-center h-24 border ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'}`}
    >
      <View className="mb-2">
        {icon}
      </View>
      <Text className={`text-xs font-medium text-center ${isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary'}`}>
        {label}
      </Text>
    </TouchableOpacity>
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
