import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { GestroButton } from './GestroButton';
import { File, Smartphone, Monitor } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface TransferRequestModalProps {
  visible: boolean;
  isDark: boolean;
  senderName: string;
  fileName: string;
  fileSize: number;
  transportType: string;
  onAccept: () => void;
  onReject: () => void;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  else return (bytes / 1073741824).toFixed(2) + ' GB';
};

export function TransferRequestModal({
  visible,
  isDark,
  senderName,
  fileName,
  fileSize,
  transportType,
  onAccept,
  onReject
}: TransferRequestModalProps) {
  
  const bg = isDark ? 'bg-dark-surface' : 'bg-light-surface';
  const textPrimary = isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary';
  const textSecondary = isDark ? 'text-dark-textSecondary' : 'text-light-textSecondary';
  const border = isDark ? 'border-dark-border' : 'border-light-border';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View className="flex-1 justify-center items-center bg-black/60 p-4">
        <View className={`w-full max-w-sm rounded-3xl p-6 ${bg} border ${border}`}>
          
          <View className="items-center mb-6">
            <View className={`w-16 h-16 rounded-2xl items-center justify-center mb-4 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
              <File color={isDark ? '#FFF' : '#000'} size={32} />
            </View>
            <Text className={`text-xl font-bold text-center ${textPrimary}`}>Incoming File</Text>
            <Text className={`text-sm text-center mt-1 ${textSecondary}`}>
              {senderName} wants to send you a file via {transportType}
            </Text>
          </View>

          <View className={`p-4 rounded-xl border mb-6 ${isDark ? 'bg-black/20 border-white/10' : 'bg-black/5 border-black/5'}`}>
            <Text className={`font-bold mb-1 ${textPrimary}`} numberOfLines={2}>
              {fileName}
            </Text>
            <Text className={`text-sm ${textSecondary}`}>
              {formatSize(fileSize)}
            </Text>
          </View>

          <View className="flex-row justify-between gap-x-4">
            <View className="flex-1">
              <GestroButton label="Decline" onPress={onReject} variant="outline" />
            </View>
            <View className="flex-1">
              <GestroButton label="Accept" onPress={onAccept} variant="primary" />
            </View>
          </View>

        </View>
      </View>
    </Modal>
  );
}
