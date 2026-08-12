import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { usePCConnectionStore } from '../store/usePCConnectionStore';
import { GestroButton } from '../components/GestroButton';
import { ChevronLeft, ClipboardPaste, Camera, Download, Share2, Trash2, RefreshCw } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

export function ClipboardScreen() {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const { isConnected, sendAction, clipboardText, screenshotData } = usePCConnectionStore();
  const navigation = useNavigation();

  const textColor = isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary';
  const secondaryTextColor = isDark ? 'text-dark-textSecondary' : 'text-light-textSecondary';
  const surfaceStyle = isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border';

  const [localTextToSend, setLocalTextToSend] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (isConnected) {
      sendAction('GET_CLIPBOARD');
    }
  }, [isConnected]);

  useEffect(() => {
    if (screenshotData && isCapturing) {
      setIsCapturing(false);
    }
  }, [screenshotData]);

  if (!isConnected) {
    return (
      <View className={`flex-1 items-center justify-center p-6 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}>
        <ClipboardPaste color={isDark ? '#666' : '#A0A0A0'} size={48} className="mb-4" />
        <Text className={`text-xl font-bold mb-2 ${textColor}`}>Connect to a Windows PC</Text>
        <Text className={`text-center mb-6 ${secondaryTextColor}`}>
          Gestro needs an active Windows connection to use this feature.
        </Text>
        <GestroButton label="Connect PC" onPress={() => navigation.navigate('Control PC' as never)} />
      </View>
    );
  }

  const handleCopyToPhone = async () => {
    if (clipboardText) {
      await Clipboard.setStringAsync(clipboardText);
      Alert.alert('Copied', 'Text copied to phone clipboard');
    }
  };

  const handleSendToPC = () => {
    sendAction('SET_CLIPBOARD', { text: localTextToSend });
    setLocalTextToSend('');
    setTimeout(() => sendAction('GET_CLIPBOARD'), 500);
  };

  const handleClearPCClipboard = () => {
    sendAction('CLEAR_CLIPBOARD');
    setTimeout(() => sendAction('GET_CLIPBOARD'), 500);
  };

  const handleTakeScreenshot = () => {
    setIsCapturing(true);
    sendAction('TAKE_SCREENSHOT');
  };

  const saveScreenshot = async () => {
    if (!screenshotData) return;
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Need storage permission to save screenshot');
        return;
      }
      const base64Code = screenshotData.split('data:image/jpeg;base64,')[1];
      const filename = FileSystem.documentDirectory + `screenshot_${Date.now()}.jpg`;
      await FileSystem.writeAsStringAsync(filename, base64Code, {
        encoding: 'base64',
      });
      await MediaLibrary.saveToLibraryAsync(filename);
      Alert.alert('Saved', 'Screenshot saved to gallery');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save screenshot');
    }
  };

  const shareScreenshot = async () => {
    if (!screenshotData) return;
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Not Available', 'Sharing is not available on this device');
        return;
      }
      const base64Code = screenshotData.split('data:image/jpeg;base64,')[1];
      const filename = FileSystem.cacheDirectory + `screenshot_share_${Date.now()}.jpg`;
      await FileSystem.writeAsStringAsync(filename, base64Code, {
        encoding: 'base64',
      });
      await Sharing.shareAsync(filename);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to share screenshot');
    }
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}>
      <View className={`pt-12 pb-4 px-4 flex-row items-center border-b ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <ChevronLeft color={isDark ? '#FFF' : '#000'} size={28} />
        </TouchableOpacity>
        <Text className={`text-2xl font-bold ${textColor}`}>Clipboard & Screenshot</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* CLIPBOARD SECTION */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className={`text-xl font-bold ${textColor}`}>PC Clipboard</Text>
          <TouchableOpacity onPress={() => sendAction('GET_CLIPBOARD')} className="p-2">
            <RefreshCw color={isDark ? '#FFF' : '#000'} size={20} />
          </TouchableOpacity>
        </View>

        <View className={`p-4 rounded-2xl border mb-6 ${surfaceStyle}`}>
          {clipboardText === null ? (
            <Text className={`text-center py-4 italic ${secondaryTextColor}`}>Unsupported clipboard content or empty</Text>
          ) : clipboardText === '' ? (
            <Text className={`text-center py-4 italic ${secondaryTextColor}`}>Clipboard is empty</Text>
          ) : (
            <Text className={`mb-4 ${textColor}`} numberOfLines={5}>{clipboardText}</Text>
          )}
          
          <View className="flex-row justify-between mt-2 pt-4 border-t border-black/10 dark:border-white/10">
            <GestroButton label="Copy to Phone" onPress={handleCopyToPhone} disabled={!clipboardText} variant="outline" />
            <TouchableOpacity onPress={handleClearPCClipboard} className="p-2 ml-2 justify-center items-center rounded-lg bg-red-500/10">
              <Trash2 color="#ef4444" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SEND TEXT TO PC */}
        <Text className={`text-xl font-bold mb-4 ${textColor}`}>Send Text to PC</Text>
        <View className={`p-4 rounded-2xl border mb-8 ${surfaceStyle}`}>
          <TextInput
            value={localTextToSend}
            onChangeText={setLocalTextToSend}
            placeholder="Type text to send to PC clipboard..."
            placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
            className={`w-full text-base ${textColor} mb-4`}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <GestroButton 
            label="Send to PC Clipboard" 
            onPress={handleSendToPC} 
            disabled={!localTextToSend}
          />
        </View>

        {/* SCREENSHOT SECTION */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className={`text-xl font-bold ${textColor}`}>Capture PC Screen</Text>
        </View>

        {!screenshotData ? (
          <TouchableOpacity 
            onPress={handleTakeScreenshot}
            activeOpacity={0.7}
            disabled={isCapturing}
            className={`p-8 rounded-2xl border items-center justify-center ${surfaceStyle} min-h-[200px]`}
          >
            <Camera color={isDark ? '#FFF' : '#000'} size={40} className="mb-4" />
            <Text className={`font-bold text-lg ${textColor}`}>
              {isCapturing ? 'Capturing...' : 'Take Screenshot'}
            </Text>
            {!isCapturing && (
              <Text className={`text-sm mt-2 text-center ${secondaryTextColor}`}>
                Takes a screenshot on the host PC and sends it here.
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <View className={`rounded-2xl border overflow-hidden ${surfaceStyle}`}>
            <View className="bg-black/5 dark:bg-white/5 relative aspect-video w-full flex items-center justify-center">
              <Image 
                source={{ uri: screenshotData }} 
                className="w-full h-full"
                resizeMode="contain"
              />
            </View>
            <View className="p-4">
              <View className="flex-row justify-between mb-4">
                <Text className={`font-bold ${textColor}`}>Screenshot ready</Text>
                <TouchableOpacity onPress={handleTakeScreenshot}>
                  <Text className="text-gestro-green font-bold">Retake</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <GestroButton label="Save" onPress={saveScreenshot} variant="primary" />
                </View>
                <View className="flex-1">
                  <GestroButton label="Share" onPress={shareScreenshot} variant="outline" />
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
