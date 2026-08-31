import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/useThemeStore';
import { GestroButton } from '../components/GestroButton';
import { GradientButton } from '../components/GradientButton';
import { GestroInput } from '../components/GestroInput';
import { supabase } from '../services/supabase';
import { ArrowLeft, User, Mail, Lock, Check, Flashlight, FlashlightOff } from 'lucide-react-native';
import { GestroIconButton } from '../components/GestroIconButton';
import * as Device from 'expo-device';
import { useAuthStore } from '../store/useAuthStore';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export function CreateProfileScreen({ navigation }: any) {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const insets = useSafeAreaInsets();
  const greenColor = '#00C278';
  const textColor = isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary';
  const textMuted = isDark ? 'text-dark-textSecondary' : 'text-light-textSecondary';
  const [permission, requestPermission] = useCameraPermissions();
  
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  
  const cameraRef = useRef<any>(null);

  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (step === 2 && permission?.granted) {
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
  }, [step, permission, scanAnim]);

  const handleNext = () => {
    if (step === 1 && name && email && password && confirmPassword) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      setStep(2);
    } else {
      setError('Please fill in all fields.');
    }
  };

  const handleCreateProfile = async () => {
    if (!cameraRef.current) return;
    
    setIsCapturing(true);
    setError(null);
    
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
      
      const detectResponse = await supabase.functions.invoke('face-proxy', {
        body: {
          endpoint: 'detect',
          payload: {
            image_base64: photo.base64,
            return_attributes: 'none'
          }
        }
      });
      
      if (detectResponse.error) throw new Error(detectResponse.error.message);
      
      const faces = detectResponse.data.faces;
      if (!faces || faces.length === 0) {
        throw new Error('No face detected. Please try again.');
      }
      
      const faceToken = faces[0].face_token;
      
      const faceSetResponse = await supabase.functions.invoke('face-proxy', {
        body: {
          endpoint: 'faceset/addface',
          payload: {
            outer_id: 'gestro_users',
            face_tokens: faceToken
          }
        }
      });
      
      if (faceSetResponse.data?.error) {
        console.error('FaceSet Add Error:', faceSetResponse.data.error);
        throw new Error(`Edge Function Error adding to FaceSet: ${faceSetResponse.data.error}`);
      }
      if (faceSetResponse.data?.error_message) {
        console.error('FaceSet Add API Error:', faceSetResponse.data.error_message);
        throw new Error(`Face++ API Error adding to FaceSet: ${faceSetResponse.data.error_message}`);
      }
      console.log('Successfully added to FaceSet:', faceSetResponse.data);

      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            face_token: faceToken
          }
        }
      });
      
      if (signUpError) throw signUpError;

      if (data.user) {
        const username = email.split('@')[0];
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: data.user.id,
            username: username,
            email: email,
            name: name,
            face_id: faceToken,
            profile_mode: 'persistent',
            is_active: true,
            platform_created_from: 'android'
          }, { onConflict: 'id' });
          
        if (profileError) {
          console.error('Error saving to user_profiles table:', profileError);
          throw new Error('Could not create complete profile. Please try again.');
        }

        await supabase.from('user_devices').insert({
            user_id: data.user.id,
            platform: 'android',
            status: 'online',
            device_name: Device.deviceName || 'Android Device'
        });
        
      }
      
      alert('Profile created successfully! You can now log in.');
      
      if (data.session) {
        useAuthStore.getState().setSession(data.session);
      } else {
        navigation.goBack();
      }
      
    } catch (err: any) {
      setError(err.message || 'An error occurred during profile creation.');
    } finally {
      setIsCapturing(false);
    }
  };

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, SCREEN_HEIGHT - 300],
  });

  return (
    <View className={`flex-1 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}>
      {step === 1 ? (
        <View 
          className="flex-1 px-6 pb-6 max-w-md mx-auto w-full self-center"
          style={{ paddingTop: Math.max(insets.top, 24) }}
        >
          <View className="w-full flex-row">
            <GestroIconButton 
              icon={<ArrowLeft color={isDark ? '#FFF' : '#000'} />} 
              onPress={() => navigation.goBack()}
              variant="ghost"
            />
          </View>

          <View className="items-center mt-6 mb-8">
            <Image 
              source={require('../../assets/icon.png')} 
              className="w-20 h-20 mb-4" 
              resizeMode="contain"
            />
            <Text className={`text-2xl font-bold mb-2 text-center ${textColor}`}>
              Create Your <Text className="text-gestro-green">Gestro</Text> Profile
            </Text>
            <Text className={`text-center text-sm px-4 ${textMuted}`}>
              Set up your account to save your preferences and sync across devices.
            </Text>
          </View>
          
          <View className="w-full flex-1">
            <GestroInput 
              label=""
              placeholder="Full Name"
              icon={<User color={isDark ? '#A0A0A0' : '#666666'} size={20} />}
              value={name}
              onChangeText={setName}
              containerClassName="mb-4"
            />
            <GestroInput 
              label=""
              placeholder="Email Address"
              icon={<Mail color={isDark ? '#A0A0A0' : '#666666'} size={20} />}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              containerClassName="mb-4"
            />
            <GestroInput 
              label=""
              placeholder="Password"
              icon={<Lock color={isDark ? '#A0A0A0' : '#666666'} size={20} />}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              containerClassName="mb-4"
            />
            <GestroInput 
              label=""
              placeholder="Confirm Password"
              icon={<Lock color={isDark ? '#A0A0A0' : '#666666'} size={20} />}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              containerClassName="mb-6"
            />
            
            <View className="mb-6">
              <Text className={`text-sm mb-3 ${textMuted}`}>Password must contain:</Text>
              <View className="flex-row items-center mb-1.5">
                <View className="w-4 h-4 rounded-full bg-gestro-green/20 items-center justify-center mr-2">
                  <Check size={10} color={greenColor} />
                </View>
                <Text className={`text-xs ${textColor}`}>Minimum 8 characters</Text>
              </View>
              <View className="flex-row items-center mb-1.5">
                <View className="w-4 h-4 rounded-full bg-gestro-green/20 items-center justify-center mr-2">
                  <Check size={10} color={greenColor} />
                </View>
                <Text className={`text-xs ${textColor}`}>At least 1 uppercase letter</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-4 h-4 rounded-full bg-gestro-green/20 items-center justify-center mr-2">
                  <Check size={10} color={greenColor} />
                </View>
                <Text className={`text-xs ${textColor}`}>At least 1 number</Text>
              </View>
            </View>
            
            {error && <Text className="text-red-500 mb-4 text-center">{error}</Text>}
            
            <GradientButton 
              label="Create Profile" 
              onPress={handleNext} 
              className="w-full mt-auto"
            />

            <View className="flex-row justify-center mt-6">
              <Text className={textMuted}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text className="text-gestro-green font-bold">Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <>
          <View className="absolute top-12 left-4 right-4 z-20 flex-row justify-between items-center">
            <GestroIconButton 
              icon={<ArrowLeft color="#FFF" />} 
              onPress={() => setStep(1)}
              variant="ghost"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            />
            
            {permission?.granted && (
              <TouchableOpacity 
                onPress={() => setIsFlashlightOn(!isFlashlightOn)}
                className="w-12 h-12 rounded-full items-center justify-center bg-black/50"
              >
                {isFlashlightOn ? <Flashlight color="#00C278" /> : <FlashlightOff color="#FFF" />}
              </TouchableOpacity>
            )}
          </View>

          {(!permission || !permission.granted) ? (
            <View className="flex-1 items-center justify-center p-6">
              <Text className={`text-center mb-6 text-lg ${isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary'}`}>
                Gestro needs camera access to capture your face profile.
              </Text>
              <GestroButton label="Grant Permission" onPress={requestPermission} />
            </View>
          ) : (
            <>
              <CameraView 
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing="front"
                enableTorch={isFlashlightOn}
              />
              
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
              
              <View className="absolute top-24 left-0 right-0 items-center">
                <Text className="text-white text-xl font-bold bg-black/50 px-4 py-2 rounded-full">
                  Position your face clearly
                </Text>
              </View>
              <View className="absolute bottom-12 left-0 right-0 items-center px-6 z-20">
                {error && (
                  <View className="bg-red-500/90 rounded-xl p-4 mb-4 w-full">
                    <Text className="text-white text-center font-medium">{error}</Text>
                  </View>
                )}
                <GestroButton 
                  label={isCapturing ? "Capturing..." : "Capture Face & Create Profile"} 
                  onPress={handleCreateProfile} 
                  isLoading={isCapturing}
                  className="w-full shadow-lg"
                />
              </View>
            </>
          )}
        </>
      )}
    </View>
  );
}
