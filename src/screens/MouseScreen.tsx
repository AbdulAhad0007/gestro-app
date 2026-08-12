import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, PanResponder } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { usePCConnectionStore } from '../store/usePCConnectionStore';
import { MousePointer2 } from 'lucide-react-native';

export function MouseScreen() {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const { isConnected, sendAction } = usePCConnectionStore();
  
  const textColor = isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary';
  const surfaceStyle = isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border';

  const [sensitivity, setSensitivity] = useState(1.5);
  
  // Use refs to avoid re-creating panResponder when state changes
  const sensitivityRef = useRef(sensitivity);
  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  const lastSentTime = useRef(0);
  const lastPos = useRef({ x: 0, y: 0 });
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastPos.current = { x: 0, y: 0 };
      },
      onPanResponderMove: (evt, gestureState) => {
        const now = Date.now();
        const dx = gestureState.dx - lastPos.current.x;
        const dy = gestureState.dy - lastPos.current.y;

        if (now - lastSentTime.current > 16) {
          if (dx !== 0 || dy !== 0) {
            sendAction('MOUSE_MOVE', { 
              dx: dx * sensitivityRef.current, 
              dy: dy * sensitivityRef.current 
            });
            lastSentTime.current = now;
            lastPos.current = { x: gestureState.dx, y: gestureState.dy };
          }
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
          if (gestureState.numberActiveTouches === 1) sendAction('MOUSE_CLICK');
          else if (gestureState.numberActiveTouches === 2) sendAction('RIGHT_CLICK');
          else if (gestureState.numberActiveTouches === 3) sendAction('MOUSE_MIDDLE_CLICK');
        }
      }
    })
  ).current;

  return (
    <ScrollView 
      className={`flex-1 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}
      contentContainerStyle={{ padding: 16, paddingTop: 48, paddingBottom: 100 }}
      scrollEnabled={false}
    >
      <Text className={`text-3xl font-bold mb-6 ${textColor}`}>Mouse</Text>
      
      <View className={!isConnected ? 'opacity-30' : ''} pointerEvents={!isConnected ? 'none' : 'auto'}>
        <View 
          {...panResponder.panHandlers}
          className={`w-full h-[55vh] rounded-3xl border mb-6 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-100 border-zinc-300'}`}
        >
          <View className="flex-1 items-center justify-center opacity-30">
            <MousePointer2 color={isDark ? '#FFF' : '#000'} size={48} />
            <Text className={`mt-4 font-bold ${textColor}`}>Touch & Move</Text>
          </View>
        </View>
        
        {/* Pointer Speed Selector */}
        <Text className={`text-sm font-bold mb-3 uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Pointer Speed</Text>
        <View className={`p-2 rounded-2xl mb-6 flex-row border ${surfaceStyle}`}>
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => setSensitivity(0.8)}
            className={`flex-1 py-3 items-center justify-center rounded-xl ${sensitivity === 0.8 ? 'bg-gestro-green/20' : ''}`}
          >
            <Text className={`font-bold text-sm ${sensitivity === 0.8 ? 'text-gestro-green' : textColor}`}>Slow</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => setSensitivity(1.5)}
            className={`flex-1 py-3 items-center justify-center rounded-xl ${sensitivity === 1.5 ? 'bg-gestro-green/20' : ''}`}
          >
            <Text className={`font-bold text-sm ${sensitivity === 1.5 ? 'text-gestro-green' : textColor}`}>Normal</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => setSensitivity(3.0)}
            className={`flex-1 py-3 items-center justify-center rounded-xl ${sensitivity === 3.0 ? 'bg-gestro-green/20' : ''}`}
          >
            <Text className={`font-bold text-sm ${sensitivity === 3.0 ? 'text-gestro-green' : textColor}`}>Fast</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row space-x-2 gap-2">
          <TouchableOpacity onPress={() => sendAction('MOUSE_CLICK')} className={`flex-1 p-4 rounded-xl items-center border ${surfaceStyle}`}>
            <Text className={`font-bold ${textColor}`}>Left</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => sendAction('MOUSE_MIDDLE_CLICK')} className={`flex-1 p-4 rounded-xl items-center border ${surfaceStyle}`}>
            <Text className={`font-bold ${textColor}`}>Mid</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => sendAction('RIGHT_CLICK')} className={`flex-1 p-4 rounded-xl items-center border ${surfaceStyle}`}>
            <Text className={`font-bold ${textColor}`}>Right</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
