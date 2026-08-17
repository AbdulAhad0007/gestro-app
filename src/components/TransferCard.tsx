import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowDownToLine, ArrowUpToLine, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react-native';
import { TransferSessionData, TransferStatus } from '../services/transferProtocol';
import { colors } from '../theme/colors';

interface TransferCardProps {
  transfer: TransferSessionData;
  isDark: boolean;
  onPress?: () => void;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  else return (bytes / 1073741824).toFixed(2) + ' GB';
};

export function TransferCard({ transfer, isDark, onPress }: TransferCardProps) {
  const bg = isDark ? 'bg-dark-surface' : 'bg-light-surface';
  const border = isDark ? 'border-dark-border' : 'border-light-border';
  const textPrimary = isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary';
  const textSecondary = isDark ? 'text-dark-textSecondary' : 'text-light-textSecondary';

  const isSend = transfer.direction === 'send';

  const getStatusIcon = () => {
    switch (transfer.status) {
      case TransferStatus.COMPLETED:
        return <CheckCircle2 color={colors.gestroGreen} size={20} />;
      case TransferStatus.FAILED:
      case TransferStatus.CANCELLED:
        return <XCircle color={isDark ? colors.dark.error : colors.light.error} size={20} />;
      case TransferStatus.WAITING_ACCEPTANCE:
        return <Clock color={isDark ? colors.dark.warning : colors.light.warning} size={20} />;
      case TransferStatus.ACTIVE:
      case TransferStatus.VERIFYING:
        return (
          <View className="flex-row items-center">
            <Text className={`font-bold text-xs mr-1 ${isDark ? 'text-gestro-green' : 'text-gestro-green'}`}>
              {transfer.progress.toFixed(0)}%
            </Text>
          </View>
        );
      default:
        return <AlertCircle color={isDark ? '#FFF' : '#000'} size={20} />;
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
      className={`p-4 rounded-2xl border mb-3 flex-row items-center ${bg} ${border}`}
    >
      <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
        {isSend ? (
          <ArrowUpToLine color="#40C4FF" size={20} />
        ) : (
          <ArrowDownToLine color={colors.gestroGreen} size={20} />
        )}
      </View>
      
      <View className="flex-1 mr-2">
        <Text className={`font-bold text-sm mb-1 ${textPrimary}`} numberOfLines={1}>
          {transfer.fileInfo.fileName}
        </Text>
        <Text className={`text-xs ${textSecondary}`} numberOfLines={1}>
          {isSend ? 'To' : 'From'} {transfer.deviceName} • {formatSize(transfer.fileInfo.fileSize)}
        </Text>
      </View>
      
      <View className="items-end justify-center">
        {getStatusIcon()}
        {transfer.status === TransferStatus.COMPLETED && (
          <Text className={`text-[10px] mt-1 text-gestro-green font-bold`}>Done</Text>
        )}
        {(transfer.status === TransferStatus.FAILED || transfer.status === TransferStatus.CANCELLED) && (
          <Text className={`text-[10px] mt-1 text-red-500 font-bold`}>
            {transfer.status === TransferStatus.CANCELLED ? 'Cancelled' : 'Failed'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
