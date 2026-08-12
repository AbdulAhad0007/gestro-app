import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useThemeStore } from '../store/useThemeStore';
import { GestroButton } from '../components/GestroButton';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../services/supabase';
import { ArrowLeft } from 'lucide-react-native';
import { GestroIconButton } from '../components/GestroIconButton';

export function FaceLoginScreen({ navigation }: any) {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const [permission, requestPermission] = useCameraPermissions();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);
  const setSession = useAuthStore((state) => state.setSession);

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
      
      // Simulate Supabase Edge Function Call to Face++
      const response = await supabase.functions.invoke('face-proxy', {
        body: {
          endpoint: 'search',
          payload: {
            image_base64: photo.base64,
            outer_id: 'gestro_users' // Assumes a faceset exists
          }
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Face authentication failed');
      }
      
      // The edge function now returns status 200 even for errors, so we check data
      if (response.data?.error) {
        throw new Error(`Edge Function Error: ${response.data.error}`);
      }
      
      if (response.data?.error_message) {
        throw new Error(`Face++ API Error: ${response.data.error_message}`);
      }

      const results = response.data?.results;
      if (results && results.length > 0 && results[0].confidence > 80) {
        const faceToken = results[0].face_token;
        
        // Lookup user in Supabase by face_token using our new edge function
        const userLookupResponse = await supabase.functions.invoke('get-user-by-face', {
          body: { face_token: faceToken }
        });

        if (userLookupResponse.error || userLookupResponse.data?.error) {
          throw new Error('Face verified, but user profile could not be found.');
        }

        const realUser = userLookupResponse.data.user;
        const realProfile = userLookupResponse.data.profile;
        const realSession = userLookupResponse.data.session;

        // Establish real Supabase session if JWT is returned
        if (realSession && realSession.access_token) {
          // Tell our custom fetch wrapper to inject this JWT into all Supabase queries
          const { setCustomJwt } = require('../services/supabase');
          setCustomJwt(realSession.access_token);
        }

        // Setup application state with real profile data
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

  return (
    <View className={`flex-1 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}>
      <View className="absolute top-12 left-4 z-10">
        <GestroIconButton 
          icon={<ArrowLeft color={isDark ? '#FFF' : '#000'} />} 
          onPress={() => navigation.goBack()}
          variant="ghost"
        />
      </View>
      
      <CameraView 
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="front"
      />
      
      <View className="absolute bottom-12 left-0 right-0 items-center px-6">
        {error && (
          <View className="bg-red-500/90 rounded-xl p-4 mb-4 w-full">
            <Text className="text-white text-center font-medium">{error}</Text>
          </View>
        )}
        
        <GestroButton 
          label={isVerifying ? "Verifying..." : "Scan Face"} 
          onPress={handleFaceScan} 
          isLoading={isVerifying}
          className="w-full shadow-lg"
        />
      </View>
    </View>
  );
}
