import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { usePCConnectionStore } from '../store/usePCConnectionStore';
import { useFileTransferStore } from '../store/useFileTransferStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestroButton } from '../components/GestroButton';
import { TransferCard } from '../components/TransferCard';
import { TransferRequestModal } from '../components/TransferRequestModal';
import { FilePlus, MonitorSmartphone, History } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import { TransferStatus } from '../services/transferProtocol';

export function GestroShareScreen({ navigation }: any) {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const { isConnected, selectedDevice } = usePCConnectionStore();
  const { activeTransfers, transferHistory, acceptTransfer, rejectTransfer, sendFiles, sendClipboard } = useFileTransferStore();
  
  const textColor = isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary';
  const surfaceStyle = isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border';

  // Find any pending incoming requests to show modal
  const pendingRequest = Object.values(activeTransfers).find(
    t => t.direction === 'receive' && t.status === TransferStatus.WAITING_ACCEPTANCE
  );

  const handlePickFile = async () => {
    if (!isConnected || !selectedDevice) {
      Alert.alert('Not Connected', 'Please connect to a Windows PC first.');
      return;
    }
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: false,
        multiple: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const mappedFiles = result.assets.map(file => ({
            uri: file.uri,
            name: file.name,
            size: file.size || 0,
            mimeType: file.mimeType || 'application/octet-stream'
        }));
        const transferId = await sendFiles(mappedFiles, selectedDevice.device_name);
        
        // Navigate to progress screen
        navigation.navigate('TransferProgress', { transferId });
      }
    } catch (err) {
      console.log('Document picker error:', err);
    }
  };

  const handleCardPress = (transferId: string) => {
    navigation.navigate('TransferProgress', { transferId });
  };

  const handleSendClipboard = async () => {
    if (!isConnected || !selectedDevice) return;
    const text = await Clipboard.getStringAsync();
    if (text) {
      sendClipboard(text);
      Alert.alert("Sent", "Clipboard text sent to Windows.");
    } else {
      Alert.alert("Empty", "Nothing on the clipboard to send.");
    }
  };

  const activeList = Object.values(activeTransfers).filter(t => t.status !== TransferStatus.WAITING_ACCEPTANCE);

  return (
    <View className={`flex-1 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}>
      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingTop: 48, paddingBottom: 100 + (useSafeAreaInsets().bottom || 0) }}
      >
        <Text className={`text-3xl font-bold mb-6 ${textColor}`}>
          Gestro Share
        </Text>

        {!isConnected && (
          <View className={`p-4 rounded-2xl mb-6 border ${surfaceStyle}`}>
            <View className="flex-row items-center mb-2">
              <MonitorSmartphone color={isDark ? '#FFF' : '#000'} size={24} className="mr-3" />
              <Text className={`text-lg font-bold ${textColor}`}>Not Connected</Text>
            </View>
            <Text className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'} mb-4`}>
              Connect to your Windows PC to send and receive files.
            </Text>
            <GestroButton 
              label="Go to Connection" 
              onPress={() => navigation.navigate('Remote')} 
              variant="outline"
            />
          </View>
        )}

        {/* Send Section */}
        <View className={`p-5 rounded-2xl mb-6 border items-center ${surfaceStyle} ${!isConnected ? 'opacity-50' : ''}`} pointerEvents={!isConnected ? 'none' : 'auto'}>
          <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
            <FilePlus color={isDark ? '#FFF' : '#000'} size={32} />
          </View>
          <Text className={`text-lg font-bold mb-1 ${textColor}`}>File Transfer</Text>
          <Text className={`text-sm text-center mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Send files to or receive files from {selectedDevice?.device_name || 'PC'}.
          </Text>
          <View className="flex-row mt-2 w-full justify-center px-4">
            <GestroButton 
              label="Send Files" 
              onPress={handlePickFile} 
              variant="primary"
              style={{ minWidth: 140, marginRight: 12 }}
            />
            <GestroButton 
              label="Receive Files" 
              onPress={() => Alert.alert('Receive Files', 'To receive files, open the Gestro app on your Windows PC, navigate to the Share tab, and select files to send to this device. They will appear here automatically.')} 
              variant="outline"
              style={{ minWidth: 140 }}
            />
          </View>
        </View>

        {/* Active Transfers */}
        {activeList.length > 0 && (
          <View className="mb-6">
            <Text className={`text-xl font-bold mb-4 ${textColor}`}>Active</Text>
            {activeList.map(t => (
              <TransferCard 
                key={t.transferId} 
                transfer={t} 
                isDark={isDark} 
                onPress={() => handleCardPress(t.transferId)} 
              />
            ))}
          </View>
        )}

        {/* History */}
        <View>
          <View className="flex-row items-center mb-4">
            <History color={isDark ? '#FFF' : '#000'} size={20} className="mr-2" />
            <Text className={`text-xl font-bold ${textColor}`}>History</Text>
          </View>
          
          {transferHistory.length === 0 ? (
            <View className={`p-6 rounded-2xl border items-center ${surfaceStyle}`}>
              <Text className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                No previous transfers.
              </Text>
            </View>
          ) : (
            transferHistory.map(t => (
              <TransferCard 
                key={t.transferId} 
                transfer={t} 
                isDark={isDark} 
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Incoming Request Modal */}
      {pendingRequest && (
        <TransferRequestModal
          visible={true}
          isDark={isDark}
          senderName={pendingRequest.deviceName}
          fileName={pendingRequest.files ? (pendingRequest.files.length > 1 ? `${pendingRequest.files.length} files` : pendingRequest.fileInfo.fileName) : pendingRequest.fileInfo.fileName}
          fileSize={pendingRequest.totalSize || pendingRequest.fileInfo.fileSize}
          transportType={pendingRequest.transportType}
          onAccept={() => acceptTransfer(pendingRequest.transferId)}
          onReject={() => rejectTransfer(pendingRequest.transferId)}
        />
      )}
    </View>
  );
}
