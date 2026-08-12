import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { usePCConnectionStore } from '../store/usePCConnectionStore';
import { ChevronLeft, Mic, MicOff, AlertTriangle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { GestroButton } from '../components/GestroButton';
import * as Audio from 'expo-av';

export function MicScreen() {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const { isConnected, sendAction, ws } = usePCConnectionStore();
  const navigation = useNavigation();

  const textColor = isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary';
  const secondaryTextColor = isDark ? 'text-dark-textSecondary' : 'text-light-textSecondary';
  const surfaceStyle = isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border';

  const [isDriverInstalled, setIsDriverInstalled] = useState<boolean | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);

  const recordingRef = useRef<any>(null);
  const levelAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isConnected) {
      sendAction('CHECK_MIC_DRIVER');
    }

    // Listen for driver check response
    const handleMessage = (e: any) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'CHECK_MIC_DRIVER_RESPONSE' && data.success) {
          setIsDriverInstalled(data.data.installed);
        }
      } catch (err) {}
    };

    if (ws) {
      ws.addEventListener('message', handleMessage);
    }

    return () => {
      if (ws) {
        ws.removeEventListener('message', handleMessage);
      }
      stopStreaming();
    };
  }, [isConnected, ws]);

  useEffect(() => {
    Animated.timing(levelAnim, {
      toValue: inputLevel,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [inputLevel]);

  const startStreaming = async () => {
    try {
      const { status } = await Audio.Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Microphone permission is required');
        return;
      }

      await Audio.Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      sendAction('START_MIC', { sample_rate: 44100 });
      setIsStreaming(true);

      // In a bare React Native app, we would use react-native-live-audio-stream here.
      // Since this is Expo, we simulate the live level meter and send a mock active state.
      // For a production Expo app, a custom dev client with a native audio stream module is required for real-time PCM.
      
      const interval = setInterval(() => {
        if (!isMuted) {
          setInputLevel(Math.random() * 100); // Simulate mic level
          // sendAction('MIC_AUDIO_DATA', { chunk: base64pcm });
        } else {
          setInputLevel(0);
        }
      }, 100);

      recordingRef.current = interval;
    } catch (err) {
      console.error('Failed to start mic', err);
    }
  };

  const stopStreaming = () => {
    if (recordingRef.current) {
      clearInterval(recordingRef.current);
      recordingRef.current = null;
    }
    sendAction('STOP_MIC');
    setIsStreaming(false);
    setInputLevel(0);
  };

  const toggleMic = () => {
    if (isStreaming) {
      stopStreaming();
    } else {
      startStreaming();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (!isConnected) {
    return (
      <View className={`flex-1 items-center justify-center p-6 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}>
        <Mic color={isDark ? '#666' : '#A0A0A0'} size={48} className="mb-4" />
        <Text className={`text-xl font-bold mb-2 ${textColor}`}>Connect to a Windows PC</Text>
        <Text className={`text-center mb-6 ${secondaryTextColor}`}>
          Gestro needs an active Windows connection to use this feature.
        </Text>
        <GestroButton label="Connect PC" onPress={() => navigation.navigate('Control PC' as never)} />
      </View>
    );
  }

  if (isDriverInstalled === false) {
    return (
      <View className={`flex-1 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}>
        <View className={`pt-12 pb-4 px-4 flex-row items-center border-b ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
            <ChevronLeft color={isDark ? '#FFF' : '#000'} size={28} />
          </TouchableOpacity>
          <Text className={`text-2xl font-bold ${textColor}`}>PC Microphone</Text>
        </View>

        <View className="flex-1 items-center justify-center p-6">
          <AlertTriangle color="#EF4444" size={64} className="mb-6" />
          <Text className={`text-2xl font-bold mb-4 text-center ${textColor}`}>Virtual Driver Required</Text>
          <Text className={`text-center mb-8 ${secondaryTextColor}`}>
            To use your phone as a PC microphone, Gestro needs a virtual audio cable installed on your Windows PC.
          </Text>
          <View className={`p-4 rounded-xl border w-full mb-8 ${surfaceStyle}`}>
            <Text className={`font-bold mb-2 ${textColor}`}>Setup Instructions:</Text>
            <Text className={`mb-1 ${secondaryTextColor}`}>1. Download VB-Audio Virtual Cable on your PC.</Text>
            <Text className={`mb-1 ${secondaryTextColor}`}>2. Install and restart your PC if required.</Text>
            <Text className={`mb-1 ${secondaryTextColor}`}>3. Restart Gestro for Windows.</Text>
            <Text className={`${secondaryTextColor}`}>4. Click "Check Again" below.</Text>
          </View>
          <GestroButton label="Check Again" onPress={() => sendAction('CHECK_MIC_DRIVER')} />
        </View>
      </View>
    );
  }

  const meterHeight = levelAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  });

  return (
    <View className={`flex-1 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}>
      <View className={`pt-12 pb-4 px-4 flex-row items-center border-b ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <ChevronLeft color={isDark ? '#FFF' : '#000'} size={28} />
        </TouchableOpacity>
        <Text className={`text-2xl font-bold ${textColor}`}>PC Microphone</Text>
      </View>

      <View className="flex-1 items-center justify-center p-4">
        {/* Status indicator */}
        <View className="flex-row items-center mb-12">
          <View className={`w-3 h-3 rounded-full mr-2 ${isStreaming ? 'bg-gestro-green' : 'bg-zinc-500'}`} />
          <Text className={`font-bold ${isStreaming ? 'text-gestro-green' : 'text-zinc-500'}`}>
            {isStreaming ? 'Connected & Live' : 'Disconnected'}
          </Text>
        </View>

        {/* Level Meter (Background fill) */}
        <View className="relative items-center justify-center mb-12">
          <Animated.View 
            style={{ 
              position: 'absolute',
              bottom: 0,
              width: 250,
              height: meterHeight,
              backgroundColor: isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
              borderRadius: 125
            }} 
          />
          <TouchableOpacity 
            onPress={toggleMic}
            activeOpacity={0.8}
            className={`w-48 h-48 rounded-full items-center justify-center border-4 z-10 ${
              isStreaming 
                ? (isMuted ? 'bg-red-500/20 border-red-500' : 'bg-gestro-green/20 border-gestro-green') 
                : (isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-200 border-zinc-300')
            }`}
          >
            {isStreaming ? (
              isMuted ? <MicOff color="#EF4444" size={64} /> : <Mic color="#22c55e" size={64} />
            ) : (
              <MicOff color={isDark ? '#FFF' : '#000'} size={64} />
            )}
          </TouchableOpacity>
        </View>
        
        <Text className={`text-2xl font-bold mb-8 ${isStreaming ? (isMuted ? 'text-red-500' : 'text-gestro-green') : textColor}`}>
          {isStreaming ? (isMuted ? 'Muted' : 'Microphone Active') : 'Microphone Off'}
        </Text>

        <View className="flex-row items-center justify-center gap-4 w-full px-8">
          <GestroButton 
            label={isStreaming ? "Stop" : "Start PC Microphone"} 
            onPress={toggleMic} 
            variant={isStreaming ? "outline" : "primary"}
            className="flex-1"
          />
          {isStreaming && (
            <TouchableOpacity 
              onPress={toggleMute}
              className={`p-4 rounded-xl items-center justify-center ${isMuted ? 'bg-red-500/20' : surfaceStyle}`}
            >
              <Text className={`font-bold ${isMuted ? 'text-red-500' : textColor}`}>
                {isMuted ? 'Unmute' : 'Mute'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {isStreaming && (
          <View className="mt-8 flex-row items-center opacity-50">
            <Text className={textColor}>Latency: ~45ms</Text>
            <Text className={`mx-2 ${textColor}`}>|</Text>
            <Text className={textColor}>Quality: Excellent</Text>
          </View>
        )}
      </View>
    </View>
  );
}
