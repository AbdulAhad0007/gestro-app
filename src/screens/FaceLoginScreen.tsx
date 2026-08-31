import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/useThemeStore';
import { GestroButton } from '../components/GestroButton';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../services/supabase';
import { ArrowLeft, Flashlight, FlashlightOff } from 'lucide-react-native';
import { GestroIconButton } from '../components/GestroIconButton';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export function FaceLoginScreen({ navigation }: any) {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const cameraRef = useRef<any>(null);
  const setSession = useAuthStore((state) => state.setSession);

  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (permission?.granted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: true,
          })
        ])
      ).start();
    }
  }, [permission, scanAnim]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View className={`flex-1 items-center justify-center p-6 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}>
        <Text className={`text-center mb-6 text-lg ${isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary'}`}>
          Gestro needs camera access for Face Authentication.
        </Text>
        <GestroButton label="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  const handleFaceScan = async () => {
    if (!cameraRef.current) return;
    
    setIsVerifying(true);
    setError(null);
    
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
      
      const response = await supabase.functions.invoke('face-proxy', {
        body: {
          endpoint: 'search',
          payload: {
            image_base64: photo.base64,
            outer_id: 'gestro_users'
          }
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Face authentication failed');
      }
      
      if (response.data?.error) {
        throw new Error(`Edge Function Error: ${response.data.error}`);
      }
      
      if (response.data?.error_message) {
        throw new Error(`Face++ API Error: ${response.data.error_message}`);
      }

      const results = response.data?.results;
      if (results && results.length > 0 && results[0].confidence > 80) {
        const faceToken = results[0].face_token;
        console.log("Matched faceToken from Face++:", faceToken);
        
        const userLookupResponse = await supabase.functions.invoke('get-user-by-face', {
          body: { face_token: faceToken }
        });

        if (userLookupResponse.error || userLookupResponse.data?.error) {
          console.error("get-user-by-face failed:", userLookupResponse);
          throw new Error(`Edge Function Error: ${userLookupResponse.data?.error || userLookupResponse.error?.message || 'Face verified, but user profile could not be found.'}`);
        }

        const realUser = userLookupResponse.data.user;
        const realProfile = userLookupResponse.data.profile;
        const realSession = userLookupResponse.data.session;

        if (realSession && realSession.access_token) {
          const { setCustomJwt } = require('../services/supabase');
          setCustomJwt(realSession.access_token);
        }

        useAuthStore.getState().setTemporarySession(false);
        useAuthStore.getState().setProfile(realProfile);
        setSession(realSession);
      } else {
        throw new Error('Face not recognized or confidence too low.');
      }
      
    } catch (err: any) {
      console.error('Face verification error details:', err);
      setError(err.message || 'An error occurred during verification.');
    } finally {
      setIsVerifying(false);
    }
  };

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, SCREEN_HEIGHT - 300],
  });

  return (
    <View className={`flex-1 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}>
      <View 
        className="absolute left-4 right-4 z-20 flex-row justify-between items-center"
        style={{ top: Math.max(insets.top, 24) }}
      >
        <GestroIconButton 
          icon={<ArrowLeft color="#FFF" />} 
          onPress={() => navigation.goBack()}
          variant="ghost"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        />
        
        <TouchableOpacity 
          onPress={() => setIsFlashlightOn(!isFlashlightOn)}
          className="w-12 h-12 rounded-full items-center justify-center bg-black/50"
        >
          {isFlashlightOn ? <Flashlight color="#00C278" /> : <FlashlightOff color="#FFF" />}
        </TouchableOpacity>
      </View>
      
      <CameraView 
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="front"
      />
      
      {/* Front Screen Flashlight Simulation */}
      {isFlashlightOn && (
        <View 
          style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.85)', zIndex: 5 }} 
          pointerEvents="none" 
        />
      )}

      <Animated.View 
        style={{
          position: 'absolute',
          top: 0,
          left: 40,
          right: 40,
          height: 3,
          backgroundColor: '#00C278',
          shadowColor: '#00C278',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 10,
          elevation: 5,
          transform: [{ translateY }]
        }} 
      />
      
      <View 
        className="absolute left-0 right-0 items-center px-6 z-20 max-w-md mx-auto w-full self-center"
        style={{ bottom: Math.max(insets.bottom, 24) }}
      >
        {error && (
          <View className="bg-red-500/90 rounded-xl p-4 mb-4 w-full">
            <Text className="text-white text-center font-medium">{error}</Text>
          </View>
        )}
        
        <GestroButton 
          label={isVerifying ? "Verifying..." : "Scan Face"} 
          onPress={handleFaceScan} 
          isLoading={isVerifying}
          className="w-full shadow-lg mb-4"
        />
        
        <GestroButton
          label="Use password instead"
          variant="secondary"
          onPress={() => navigation.navigate('PasswordLogin')}
          className="w-full shadow-lg opacity-90"
        />
      </View>
    </View>
  );
}
