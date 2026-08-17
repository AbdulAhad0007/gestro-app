import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, PanResponder, Animated } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { usePCConnectionStore } from '../store/usePCConnectionStore';
import { useMouseStore } from '../store/useMouseStore';
import { MousePointer2, ArrowUpDown } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function MouseScreen() {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const { isConnected, sendAction } = usePCConnectionStore();
  const { layoutPreference } = useMouseStore();
  
  const textColor = isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary';
  const surfaceStyle = isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border';

  const [sensitivity, setSensitivity] = useState(1.5);
  const [isScrollMode, setIsScrollMode] = useState(false);
  
  // Use refs to avoid re-creating panResponder when state changes
  const sensitivityRef = useRef(sensitivity);
  const isScrollModeRef = useRef(isScrollMode);
  
  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  useEffect(() => {
    isScrollModeRef.current = isScrollMode;
  }, [isScrollMode]);

  const lastSentTime = useRef(0);
  const lastPos = useRef({ x: 0, y: 0 });
  const scrollY = useRef(new Animated.Value(0)).current;
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);

  const clearAutoScroll = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }
  };

  useEffect(() => {
    return () => clearAutoScroll();
  }, []);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastPos.current = { x: 0, y: 0 };
        clearAutoScroll();
      },
      onPanResponderMove: (evt, gestureState) => {
        const now = Date.now();
        const dx = gestureState.dx - lastPos.current.x;
        const dy = gestureState.dy - lastPos.current.y;

        if (isScrollModeRef.current) {
          // Clamp the drag distance for the ball visually
          let boundedDy = gestureState.dy;
          if (boundedDy > 100) boundedDy = 100;
          if (boundedDy < -100) boundedDy = -100;
          scrollY.setValue(boundedDy);

          if (boundedDy < -30) {
            if (!autoScrollInterval.current) {
              autoScrollInterval.current = setInterval(() => {
                sendAction('SCROLL_UP');
              }, 60);
            }
          } else if (boundedDy > 30) {
            if (!autoScrollInterval.current) {
              autoScrollInterval.current = setInterval(() => {
                sendAction('SCROLL_DOWN');
              }, 60);
            }
          } else {
            clearAutoScroll();
          }
        } else {
          clearAutoScroll();
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
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        clearAutoScroll();
        if (isScrollModeRef.current) {
          Animated.spring(scrollY, {
            toValue: 0,
            useNativeDriver: true,
            stiffness: 400,
            damping: 20,
            mass: 0.5
          }).start();
        } else {
          if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
            if (gestureState.numberActiveTouches === 1) sendAction('MOUSE_CLICK');
            else if (gestureState.numberActiveTouches === 2) sendAction('RIGHT_CLICK');
            else if (gestureState.numberActiveTouches === 3) sendAction('MOUSE_MIDDLE_CLICK');
          }
        }
      },
      onPanResponderTerminate: () => {
        clearAutoScroll();
        if (isScrollModeRef.current) {
          Animated.spring(scrollY, {
            toValue: 0,
            useNativeDriver: true,
            stiffness: 400,
            damping: 20,
            mass: 0.5
          }).start();
        }
      }
    })
  ).current;

  const PointerSpeedSelector = () => (
    <View className="mb-6">
      <Text className={`text-sm font-bold mb-3 uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Pointer Speed</Text>
      <View className={`p-2 rounded-2xl flex-row border ${surfaceStyle}`}>
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
    </View>
  );

  const TouchpadArea = ({ flex = false }: { flex?: boolean }) => (
    <View 
      {...panResponder.panHandlers}
      className={`rounded-3xl border mb-6 overflow-hidden ${flex ? 'flex-1 mx-2 mb-0 h-full' : 'w-full h-[55vh]'} ${isScrollMode ? 'border-gestro-green bg-gestro-green/10' : (isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-100 border-zinc-300')}`}
    >
      <View className="flex-1 items-center justify-center opacity-30" pointerEvents="none">
        {isScrollMode ? (
          <Animated.View style={{ transform: [{ translateY: scrollY }] }} className="items-center justify-center bg-gestro-green/20 p-6 rounded-full border border-gestro-green shadow-sm">
            <ArrowUpDown color={isDark ? '#FFF' : '#000'} size={32} />
          </Animated.View>
        ) : (
          <>
            <MousePointer2 color={isDark ? '#FFF' : '#000'} size={48} />
            <Text className={`mt-4 font-bold ${textColor}`}>Touch & Move</Text>
          </>
        )}
      </View>
    </View>
  );

  const ThreeButtonsRow = () => (
    <View className="flex-row space-x-2 gap-2 mb-6">
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
  );

  const renderLayout = () => {
    switch (layoutPreference) {
      case 2: // Buttons Top
        return (
          <>
            <ThreeButtonsRow />
            <TouchpadArea />
            <PointerSpeedSelector />
          </>
        );
      case 3: // Side Buttons & Scroller
        return (
          <View className="flex-1">
            <PointerSpeedSelector />
            
            {/* Middle Button Toggle */}
            <TouchableOpacity 
              onPress={() => setIsScrollMode(!isScrollMode)} 
              className={`p-4 rounded-xl items-center border mb-4 ${isScrollMode ? 'bg-gestro-green/20 border-gestro-green' : surfaceStyle}`}
            >
              <Text className={`font-bold ${isScrollMode ? 'text-gestro-green' : textColor}`}>
                {isScrollMode ? 'Disable Scroller (Mid)' : 'Enable Scroller (Mid)'}
              </Text>
            </TouchableOpacity>

            <View className="flex-row flex-1 h-[55vh]">
              <TouchableOpacity onPress={() => sendAction('MOUSE_CLICK')} className={`w-20 p-4 rounded-3xl items-center justify-center border ${surfaceStyle}`}>
                <Text className={`font-bold ${textColor}`}>Left</Text>
              </TouchableOpacity>
              
              <TouchpadArea flex />
              
              <TouchableOpacity onPress={() => sendAction('RIGHT_CLICK')} className={`w-20 p-4 rounded-3xl items-center justify-center border ${surfaceStyle}`}>
                <Text className={`font-bold ${textColor}`}>Right</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 1: // Touchpad Top (Default)
      default:
        return (
          <>
            <TouchpadArea />
            <PointerSpeedSelector />
            <ThreeButtonsRow />
          </>
        );
    }
  };

  return (
    <ScrollView 
      className={`flex-1 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}
      contentContainerStyle={{ padding: 16, paddingTop: 48, paddingBottom: 100 + (useSafeAreaInsets().bottom || 0), flexGrow: 1 }}
      scrollEnabled={false}
    >
      <Text className={`text-3xl font-bold mb-6 ${textColor}`}>Mouse</Text>
      
      <View className={`flex-1 ${!isConnected ? 'opacity-30' : ''}`} pointerEvents={!isConnected ? 'none' : 'auto'}>
        {renderLayout()}
      </View>
    </ScrollView>
  );
}
