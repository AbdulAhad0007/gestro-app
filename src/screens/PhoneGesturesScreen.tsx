import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { usePCConnectionStore } from '../store/usePCConnectionStore';
import { GestroButton } from '../components/GestroButton';
import { Hand, CameraOff, AlertCircle } from 'lucide-react-native';
import { colors } from '../theme/colors';

export function PhoneGesturesScreen() {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const { session } = useAuthStore();
  const { isConnected, sendAction } = usePCConnectionStore();
  
  const [permission, requestPermission] = useCameraPermissions();
  const [isActive, setIsActive] = useState(false);
  
  // Mock tracking state for UI since real ML model is not embedded yet
  const [currentGesture, setCurrentGesture] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [faceConfidence, setFaceConfidence] = useState<number>(0);
  const [bodyConfidence, setBodyConfidence] = useState<number>(0);
  const [mappedAction, setMappedAction] = useState<string | null>(null);

  useEffect(() => {
    // If we wanted to periodically send dummy frames or simulate logic
    let interval: ReturnType<typeof setInterval>;
    if (isActive && permission?.granted) {
      interval = setInterval(() => {
        // Simulate finding a gesture occasionally for testing UI
        if (Math.random() > 0.5) {
          const gestures = ['Pinch / OK', 'Peace', 'Stop Palm', 'Thumbs Up', 'Swipe Left', 'Swipe Right', 'Triangle'];
          const actions = ['Play/Pause', 'Next', 'Mute', 'Like', 'Previous', 'Next', 'Confirmed Illuminati'];
          const idx = Math.floor(Math.random() * gestures.length);
          
          setCurrentGesture(gestures[idx]);
          setConfidence(Math.floor(Math.random() * 15 + 85)); // 85-100% for gestures
          
          // Add dummy face/body confidence
          setFaceConfidence(Math.floor(Math.random() * 20 + 80)); // 80-100%
          setBodyConfidence(Math.floor(Math.random() * 40 + 40)); // 40-80% (less accurate)
          
          setMappedAction(actions[idx]);

          if (isConnected) {
            // sendAction('GESTURE_DETECTED', { gesture: gestures[idx] });
          }
        } else {
          setCurrentGesture(null);
          setConfidence(0);
          setFaceConfidence(0);
          setBodyConfidence(0);
          setMappedAction(null);
        }
      }, 1500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, permission, isConnected]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View className={`flex-1 items-center justify-center p-6 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}>
        <AlertCircle color={isDark ? '#FFF' : '#000'} size={48} className="mb-4" />
        <Text className={`text-xl font-bold mb-2 text-center ${isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary'}`}>
          Camera Permission Required
        </Text>
        <Text className={`text-center mb-6 ${isDark ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
          Gestro needs access to your camera to recognize hand gestures.
        </Text>
        <GestroButton label="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}>
      {/* Camera View */}
      <View className="flex-1 rounded-b-3xl overflow-hidden relative bg-black">
        {isActive ? (
          <CameraView 
            style={StyleSheet.absoluteFillObject}
            facing="front"
          />
        ) : (
          <View className="flex-1 items-center justify-center bg-zinc-900">
            <CameraOff color="#52525B" size={48} />
            <Text className="text-zinc-500 mt-4 font-medium">Camera is inactive</Text>
          </View>
        )}
        
        {/* Overlay UI */}
        <View className="absolute top-12 left-4 right-4 flex-row justify-between items-start">
          <View className="bg-black/50 px-3 py-1.5 rounded-full">
            <Text className="text-white font-bold">
              {isActive ? 'Tracking Active' : 'Tracking Paused'}
            </Text>
          </View>
          <View className={`w-3 h-3 rounded-full ${isActive ? 'bg-gestro-green' : 'bg-red-500'}`} />
        </View>

        {isActive && currentGesture && (
          <View className="absolute bottom-8 left-4 right-4 gap-3">
            {/* Hand Gesture Match */}
            <View className="bg-black/70 p-4 rounded-2xl flex-row items-center justify-between border border-gestro-green">
              <View>
                <Text className="text-white font-bold text-lg">Hand: {currentGesture}</Text>
                <Text className="text-gestro-green font-medium mt-1">{confidence}% Match</Text>
              </View>
              {mappedAction && (
                <View className="bg-white/10 px-3 py-1 rounded-md">
                  <Text className="text-white text-xs">Action: {mappedAction}</Text>
                </View>
              )}
            </View>

            {/* Face Confidence */}
            <View className="bg-black/70 p-3 rounded-xl flex-row items-center justify-between border border-blue-400/50">
              <Text className="text-white font-medium">Face Tracking</Text>
              <Text className="text-blue-400 font-bold">{faceConfidence}% Match</Text>
            </View>

            {/* Body Confidence (Less accurate as mentioned by user) */}
            <View className="bg-black/70 p-3 rounded-xl flex-row items-center justify-between border border-yellow-400/50">
              <Text className="text-white font-medium">Body Tracking</Text>
              <Text className="text-yellow-400 font-bold">{bodyConfidence}% Match (Searching)</Text>
            </View>
          </View>
        )}
      </View>

      {/* Control Panel */}
      <View className="p-6 h-48 justify-center">
        <Text className={`text-xl font-bold mb-2 ${isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary'}`}>
          Phone Gestures
        </Text>
        <Text className={`mb-6 ${isDark ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
          Use your phone's front camera to control your PC when away from your desk.
        </Text>
        
        <GestroButton 
          label={isActive ? "Stop Tracking" : "Start Tracking"} 
          variant={isActive ? "outline" : "primary"}
          onPress={() => setIsActive(!isActive)} 
        />
      </View>
    </View>
  );
}
