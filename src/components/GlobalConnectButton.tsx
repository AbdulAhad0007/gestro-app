import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { usePCConnectionStore } from '../store/usePCConnectionStore';
import { Monitor, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';

export function GlobalConnectButton() {
  const { session } = useAuthStore();
  const { isConnected, isConnecting, availableDevices, fetchDevices, connect, disconnect, pairingTimeLeft, connectionError } = usePCConnectionStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (session?.user?.id) {
      fetchDevices(session.user.id);
      const channel = supabase
        .channel('global_device_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_devices', filter: `user_id=eq.${session.user.id}` },
          () => fetchDevices(session.user.id)
        )
        .subscribe();

      return () => { 
        supabase.removeChannel(channel);
      };
    }
  }, [session?.user?.id]);

  if (!session?.user?.id || isConnected) return null;

  const onlineDevices = availableDevices.filter(d => d.status === 'online');

  if (onlineDevices.length === 0) return null;

  const handleConnect = () => {
    if (!isConnecting) {
      connect(session.user.id, onlineDevices[0]);
    }
  };

  return (
    <View style={{ position: 'absolute', bottom: insets.bottom + 80, right: 16, zIndex: 9999 }}>
      <TouchableOpacity
        onPress={handleConnect}
        disabled={isConnecting}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#00C278',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <Monitor color="#000" size={20} />
        <Text style={{ color: '#000', fontWeight: 'bold', marginLeft: 8 }}>
          {isConnecting ? (pairingTimeLeft !== null ? `Waiting (${pairingTimeLeft}s)` : 'Connecting...') : 'Connect PC'}
        </Text>
        
        {isConnecting && (
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              disconnect();
            }}
            style={{
              marginLeft: 12,
              padding: 4,
              backgroundColor: 'rgba(0,0,0,0.1)',
              borderRadius: 12,
            }}
          >
            <X color="#000" size={16} strokeWidth={3} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );
}
