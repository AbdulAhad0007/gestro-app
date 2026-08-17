import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { usePCConnectionStore } from '../store/usePCConnectionStore';
import { supabase } from '../services/supabase';
import { useNavigation } from '@react-navigation/native';
import { User, Mail, Laptop, Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export function ProfileScreen() {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const { user, profile, isTemporarySession, session } = useAuthStore();
  const { availableDevices } = usePCConnectionStore();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const textColor = isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary';
  const secondaryTextColor = isDark ? 'text-dark-textSecondary' : 'text-light-textSecondary';
  const surfaceStyle = isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border';
  const inputBgStyle = isDark ? 'bg-black/20' : 'bg-black/5';

  const userName = isTemporarySession ? 'Guest User' : (profile?.name || user?.user_metadata?.full_name || 'Gestro User');
  const userEmail = isTemporarySession ? 'Temporary Session' : (profile?.email || user?.email || 'No email associated');
  const deviceCount = availableDevices?.length || 0;

  const handleUpdatePassword = async () => {
    if (isTemporarySession) {
      Alert.alert('Not Allowed', 'You cannot update passwords in a temporary session.');
      return;
    }
    
    if (newPassword.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long.');
      return;
    }

    setIsUpdating(true);
    try {
      if (!user?.id) {
        throw new Error('No active user found.');
      }

      const response = await supabase.functions.invoke('update-password', {
        body: { user_id: user.id, new_password: newPassword }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to update password');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }
      
      Alert.alert('Success', 'Your password has been successfully updated.');
      setNewPassword('');
    } catch (err: any) {
      console.error("Update password error: ", err);
      Alert.alert('Error', err.message || 'Failed to update password.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}>
      {/* HEADER */}
      <View style={{ paddingTop: insets.top + 16 }} className="px-4 pb-4 flex-row items-center border-b border-black/10 dark:border-white/10">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center rounded-full active:bg-black/10 dark:active:bg-white/10 mr-2"
        >
          <ArrowLeft color={isDark ? '#FFF' : '#000'} size={24} />
        </TouchableOpacity>
        <Text className={`text-xl font-bold ${textColor}`}>Profile Information</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
        
        {/* PROFILE DETAILS CARD */}
        <View className={`rounded-2xl p-5 mb-8 border ${surfaceStyle}`}>
          <View className="items-center mb-6">
            <View className="w-20 h-20 rounded-full bg-gestro-green/20 items-center justify-center mb-4">
              <User color={colors.gestroGreen} size={40} />
            </View>
            <Text className={`text-2xl font-bold ${textColor}`}>{userName}</Text>
            <Text className={`text-base ${secondaryTextColor}`}>{userEmail}</Text>
          </View>

          <View className="flex-row items-center bg-black/5 dark:bg-white/5 p-4 rounded-xl">
            <Laptop color={isDark ? '#FFF' : '#000'} size={24} />
            <View className="ml-4 flex-1">
              <Text className={`font-bold text-base ${textColor}`}>Total Registered Devices</Text>
              <Text className={`text-sm ${secondaryTextColor}`}>Devices linked to your account</Text>
            </View>
            <Text className={`text-xl font-bold text-gestro-green`}>{deviceCount}</Text>
          </View>
        </View>

        {/* UPDATE PASSWORD */}
        <Text className={`text-sm font-bold mb-3 uppercase tracking-wider ${secondaryTextColor}`}>Security</Text>
        <View className={`rounded-2xl p-5 border ${surfaceStyle}`}>
          <View className="flex-row items-center mb-4">
            <Lock color={isDark ? '#FFF' : '#000'} size={20} />
            <Text className={`ml-3 font-bold text-base ${textColor}`}>Update Password</Text>
          </View>

          <View className={`flex-row items-center rounded-xl px-4 py-1 mb-6 border border-black/5 dark:border-white/5 ${inputBgStyle}`}>
            <TextInput
              className={`flex-1 h-12 ${textColor}`}
              placeholder="Enter new password"
              placeholderTextColor={isDark ? '#666' : '#A0A0A0'}
              secureTextEntry={!showPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              editable={!isUpdating && !isTemporarySession}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              className="p-2"
              disabled={isUpdating || isTemporarySession}
            >
              {showPassword ? (
                <EyeOff color={isDark ? '#FFF' : '#000'} size={20} />
              ) : (
                <Eye color={isDark ? '#FFF' : '#000'} size={20} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleUpdatePassword}
            disabled={isUpdating || !newPassword || isTemporarySession}
            className={`py-3 rounded-xl items-center justify-center ${
              !newPassword || isUpdating || isTemporarySession ? 'bg-gestro-green/40' : 'bg-gestro-green'
            }`}
          >
            {isUpdating ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text className="text-black font-bold text-base">Save New Password</Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}
