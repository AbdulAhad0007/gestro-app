import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Alert } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { useFileTransferStore } from '../store/useFileTransferStore';
import { usePCConnectionStore } from '../store/usePCConnectionStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestroButton } from '../components/GestroButton';
import { TransferStatus } from '../services/transferProtocol';
import { ArrowLeft, File, CheckCircle2, XCircle } from 'lucide-react-native';
import { colors } from '../theme/colors';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  else return (bytes / 1073741824).toFixed(2) + ' GB';
};

const formatSpeed = (bytesPerSec: number) => {
  if (bytesPerSec < 1024) return Math.round(bytesPerSec) + ' B/s';
  else if (bytesPerSec < 1048576) return (bytesPerSec / 1024).toFixed(1) + ' KB/s';
  else return (bytesPerSec / 1048576).toFixed(1) + ' MB/s';
};

export function TransferProgressScreen({ route, navigation }: any) {
  const { transferId } = route.params;
  const isDark = useThemeStore((state) => state.isDarkMode());
  const { activeTransfers, transferHistory, cancelTransfer, resumeTransfer } = useFileTransferStore();
  const { isConnected } = usePCConnectionStore();
  
  const transfer = activeTransfers[transferId] || transferHistory.find(t => t.transferId === transferId);
  
  const textColor = isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary';
  const surfaceStyle = isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border';

  const progressAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (transfer) {
      Animated.timing(progressAnim, {
        toValue: transfer.progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [transfer?.progress]);

  if (!transfer) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}>
        <Text className={textColor}>Transfer not found</Text>
        <GestroButton label="Go Back" onPress={() => navigation.goBack()} className="mt-4" />
      </View>
    );
  }

  const isComplete = transfer.status === TransferStatus.COMPLETED;
  const isFailed = transfer.status === TransferStatus.FAILED || transfer.status === TransferStatus.CANCELLED;
  const isActive = transfer.status === TransferStatus.ACTIVE || transfer.status === TransferStatus.VERIFYING;
  const isPaused = transfer.status === TransferStatus.PAUSED;

  const handleShareFile = async () => {
    if (!transfer) return;
    try {
      const fileUri = FileSystem.documentDirectory + transfer.fileInfo.fileName;
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Sharing Unavailable', 'Sharing is not available on this device.');
      }
    } catch (e) {
      console.log('Error sharing file:', e);
      Alert.alert('Error', 'Failed to share file.');
    }
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`} style={{ paddingTop: useSafeAreaInsets().top }}>
      
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-zinc-200 dark:border-zinc-800">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 p-2">
          <ArrowLeft color={isDark ? '#FFF' : '#000'} size={24} />
        </TouchableOpacity>
        <Text className={`text-xl font-bold ${textColor}`}>Transfer Details</Text>
      </View>

      <View className="flex-1 p-6 items-center">
        
        {/* Status Icon */}
        <View className={`w-32 h-32 rounded-full items-center justify-center mb-8 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
          {isComplete ? (
            <CheckCircle2 color={colors.gestroGreen} size={64} />
          ) : isFailed ? (
            <XCircle color={isDark ? colors.dark.error : colors.light.error} size={64} />
          ) : (
            <File color={isDark ? '#FFF' : '#000'} size={64} />
          )}
        </View>

        {/* File Info */}
        <Text className={`text-2xl font-bold text-center mb-2 ${textColor}`} numberOfLines={2}>
          {transfer.fileInfo.fileName}
        </Text>
        <Text className={`text-base text-center mb-10 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
          {transfer.direction === 'send' ? 'Sending to' : 'Receiving from'} {transfer.deviceName} • {transfer.transportType}
        </Text>

        {/* Overall Progress Section (if multi-file) */}
        {transfer.files && transfer.files.length > 1 && (
          <View className={`w-full p-4 rounded-2xl border mb-4 ${surfaceStyle}`}>
            <View className="flex-row justify-between mb-2">
              <Text className={`font-bold ${textColor}`}>
                Overall ({transfer.currentFileIndex + 1} of {transfer.files.length})
              </Text>
              <Text className={`font-bold ${isDark ? 'text-gestro-green' : 'text-gestro-green'}`}>
                {transfer.overallProgress?.toFixed(0) || 0}%
              </Text>
            </View>
            <View className={`h-2 w-full rounded-full mb-2 overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
              <View 
                className="h-full bg-gestro-green rounded-full opacity-70"
                style={{ width: `${transfer.overallProgress || 0}%` }}
              />
            </View>
            <Text className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {formatSize(transfer.overallBytesTransferred || 0)} / {formatSize(transfer.totalSize || 0)}
            </Text>
          </View>
        )}

        {/* Current File Progress Section */}
        <View className={`w-full p-6 rounded-3xl border mb-8 ${surfaceStyle}`}>
          
          <View className="flex-row justify-between mb-2">
            <Text className={`font-bold ${textColor}`}>
              {isComplete ? 'Complete' : isFailed ? transfer.status : isPaused ? 'Paused' : 'Transferring...'}
            </Text>
            <Text className={`font-bold ${isDark ? 'text-gestro-green' : 'text-gestro-green'}`}>
              {transfer.progress.toFixed(0)}%
            </Text>
          </View>

          {/* Progress Bar Background */}
          <View className={`h-3 w-full rounded-full mb-4 overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
            <Animated.View 
              className="h-full bg-gestro-green rounded-full"
              style={{
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%']
                })
              }}
            />
          </View>

          <View className="flex-row justify-between">
            <Text className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {formatSize(transfer.bytesTransferred)} / {formatSize(transfer.fileInfo.fileSize)}
            </Text>
            {isActive && (
              <Text className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {formatSpeed(transfer.speed)}
              </Text>
            )}
          </View>
          
          {isActive && transfer.etaSeconds > 0 && (
            <Text className={`text-xs text-center mt-3 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              ~ {Math.round(transfer.etaSeconds)} seconds remaining
            </Text>
          )}

          {isFailed && transfer.errorMessage && (
            <Text className={`text-xs text-center mt-3 text-red-500 font-bold`}>
              {transfer.errorMessage}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View className="w-full flex-row justify-center space-x-4">
          {isPaused && isConnected && (
            <GestroButton 
              label="Resume" 
              onPress={() => resumeTransfer(transferId)} 
              variant="primary"
              style={{ minWidth: 120, marginRight: 16 }}
            />
          )}
          
          {(isActive || isPaused || transfer.status === TransferStatus.WAITING_ACCEPTANCE) && (
            <GestroButton 
              label="Cancel Transfer" 
              onPress={() => cancelTransfer(transferId)} 
              variant="outline"
              style={{ borderColor: isDark ? colors.dark.error : colors.light.error, minWidth: 120 }}
            />
          )}
          
          {isComplete && transfer.direction === 'receive' && (
            <GestroButton 
              label="Share / Save File" 
              onPress={handleShareFile} 
              variant="primary"
              style={{ minWidth: 160 }}
            />
          )}
        </View>

      </View>
    </View>
  );
}
