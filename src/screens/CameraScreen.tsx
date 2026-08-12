import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { usePCConnectionStore } from '../store/usePCConnectionStore';
import { ChevronLeft, Camera as CameraIcon, Video, VideoOff, AlertTriangle, SwitchCamera } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { GestroButton } from '../components/GestroButton';

export function CameraScreen() {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const { isConnected, sendAction, ws } = usePCConnectionStore();
  const navigation = useNavigation();

  const textColor = isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary';
  const secondaryTextColor = isDark ? 'text-dark-textSecondary' : 'text-light-textSecondary';
  const surfaceStyle = isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border';

  const [permission, requestPermission] = useCameraPermissions();
  const [isDriverInstalled, setIsDriverInstalled] = useState<boolean | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  
  const cameraRef = useRef<CameraView>(null);
  const streamingRef = useRef(false);

  useEffect(() => {
    if (isConnected) {
      sendAction('CHECK_CAMERA_DRIVER');
    }

    const handleMessage = (e: any) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'CHECK_CAMERA_DRIVER_RESPONSE' && data.success) {
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

  const streamFrames = async () => {
    if (!streamingRef.current || !cameraRef.current) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.1, // Compress heavily for MJPEG stream
      });
      
      if (photo?.base64 && streamingRef.current) {
        sendAction('CAMERA_VIDEO_DATA', { frame: photo.base64 });
      }
    } catch (e) {
      console.log('Frame capture error', e);
    }

    // Loop if still streaming
    if (streamingRef.current) {
      setTimeout(streamFrames, 100); // Target ~10 FPS MJPEG
    }
  };

  const startStreaming = () => {
    sendAction('START_CAMERA', { width: 640, height: 480, fps: 15 });
    setIsStreaming(true);
    streamingRef.current = true;
    streamFrames();
  };

  const stopStreaming = () => {
    sendAction('STOP_CAMERA');
    setIsStreaming(false);
    streamingRef.current = false;
  };

  const toggleStream = () => {
    if (isStreaming) {
      stopStreaming();
    } else {
      startStreaming();
    }
  };

  const toggleFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (!isConnected) {
    return (
      <View className={`flex-1 items-center justify-center p-6 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}>
        <CameraIcon color={isDark ? '#666' : '#A0A0A0'} size={48} className="mb-4" />
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
          <Text className={`text-2xl font-bold ${textColor}`}>PC Camera</Text>
        </View>

        <View className="flex-1 items-center justify-center p-6">
          <AlertTriangle color="#EF4444" size={64} className="mb-6" />
          <Text className={`text-2xl font-bold mb-4 text-center ${textColor}`}>Virtual Webcam Required</Text>
          <Text className={`text-center mb-8 ${secondaryTextColor}`}>
            To use your phone as a webcam, Gestro requires a virtual camera driver on your Windows PC.
          </Text>
          <View className={`p-4 rounded-xl border w-full mb-8 ${surfaceStyle}`}>
            <Text className={`font-bold mb-2 ${textColor}`}>Setup Instructions:</Text>
            <Text className={`mb-1 ${secondaryTextColor}`}>1. Install OBS Studio.</Text>
            <Text className={`mb-1 ${secondaryTextColor}`}>2. Click "Start Virtual Camera" in OBS once to register the driver.</Text>
            <Text className={`mb-1 ${secondaryTextColor}`}>3. Restart Gestro for Windows.</Text>
            <Text className={`${secondaryTextColor}`}>4. Click "Check Again" below.</Text>
          </View>
          <GestroButton label="Check Again" onPress={() => sendAction('CHECK_CAMERA_DRIVER')} />
        </View>
      </View>
    );
  }

  if (!permission) {
    return <View className={`flex-1 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`} />;
  }

  if (!permission.granted) {
    return (
      <View className={`flex-1 items-center justify-center p-6 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}>
        <CameraIcon color={isDark ? '#FFF' : '#000'} size={64} className="mb-6" />
        <Text className={`text-xl font-bold mb-4 text-center ${textColor}`}>Camera Permission Required</Text>
        <Text className={`text-center mb-8 ${secondaryTextColor}`}>
          Gestro needs access to your camera to use your phone as a webcam for your PC.
        </Text>
        <GestroButton label="Grant Permission" onPress={requestPermission} />
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4 p-4">
          <Text className={`font-bold ${textColor}`}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}>
      <View className={`pt-12 pb-4 px-4 flex-row items-center border-b ${isDark ? 'border-dark-border' : 'border-light-border'} absolute top-0 left-0 right-0 z-10 bg-black/60`}>
        <TouchableOpacity onPress={() => {
          stopStreaming();
          navigation.goBack();
        }} className="mr-4">
          <ChevronLeft color="#FFF" size={28} />
        </TouchableOpacity>
        <Text className={`text-2xl font-bold text-white`}>PC Camera</Text>
      </View>

      <View className="flex-1 relative">
        <CameraView 
          ref={cameraRef}
          style={{ flex: 1 }} 
          facing={facing} 
          animateShutter={false}
        />
        
        <View className="absolute inset-0 flex-1 justify-between items-end p-6 pt-28 pb-16" pointerEvents="box-none">
          <View className="flex-col gap-4">
            <TouchableOpacity 
              onPress={toggleFacing}
              className="w-12 h-12 bg-black/50 rounded-full items-center justify-center backdrop-blur-sm"
            >
              <SwitchCamera color="#FFF" size={24} />
            </TouchableOpacity>
          </View>

          <View className="w-full items-center">
            <View className={!isConnected ? 'opacity-30 items-center' : 'items-center'} pointerEvents={!isConnected ? 'none' : 'auto'}>
              <TouchableOpacity 
                onPress={toggleStream}
                activeOpacity={0.8}
                className={`w-20 h-20 rounded-full items-center justify-center border-4 ${
                  isStreaming 
                    ? 'bg-red-500/80 border-red-500' 
                    : 'bg-white/80 border-white'
                }`}
              >
                {isStreaming ? (
                  <VideoOff color="#FFF" size={32} />
                ) : (
                  <Video color="#000" size={32} />
                )}
              </TouchableOpacity>
              
              <View className="bg-black/70 rounded-xl px-4 py-2 mt-4">
                <Text className={`font-bold ${isStreaming ? 'text-red-500' : 'text-white'}`}>
                  {isStreaming ? 'STREAMING LIVE TO PC' : 'READY TO STREAM'}
                </Text>
              </View>
              {isStreaming && (
                <Text className="text-white font-bold mt-2 opacity-80 text-xs">
                  MJPEG | ~10 FPS | 640x480
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
