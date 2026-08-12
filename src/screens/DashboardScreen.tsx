import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, Dimensions, ActivityIndicator } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { usePCConnectionStore } from '../store/usePCConnectionStore';
import { GestroMetricCard } from '../components/GestroMetricCard';
import { Hand, Mic, CheckCircle, XCircle, Monitor } from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
import { colors } from '../theme/colors';
import { supabase } from '../services/supabase';

const screenWidth = Dimensions.get('window').width;

export function DashboardScreen() {
  const isDark = useThemeStore((state) => state.isDarkMode());
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const { isConnected } = usePCConnectionStore();
  
  const [gestures, setGestures] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch last 1000 gestures for metrics and charts
    const { data: gesturesData } = await supabase
      .from('gestures')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);
      
    if (gesturesData) setGestures(gesturesData);

    const { data: statusData } = await supabase
      .from('system_status')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (statusData) setSystemStatus(statusData);

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();

    // Subscribe to new gestures
    const gesturesChannel = supabase
      .channel('live_gestures_app')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'gestures' },
        (payload) => {
          setGestures((prev) => [payload.new, ...prev].slice(0, 1000));
        }
      )
      .subscribe();
      
    const statusChannel = supabase
      .channel('system_status_app')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_status' },
        (payload) => {
          if (payload.new) setSystemStatus(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gesturesChannel);
      supabase.removeChannel(statusChannel);
    };
  }, []);

  const metrics = useMemo(() => {
    const totalGestures = gestures.length;
    const totalVoice = gestures.filter(g => g.action_name).length; // Approximating voice commands as those with actions
    
    let successCount = 0;
    gestures.forEach(g => {
      if ((g.confidence || 0) > 60) successCount++;
    });
    
    const successRate = totalGestures > 0 ? ((successCount / totalGestures) * 100).toFixed(1) : 0;
    const failureRate = totalGestures > 0 ? (100 - parseFloat(successRate as string)).toFixed(1) : 0;
    
    return {
      totalGestures,
      totalVoice,
      successRate,
      failureRate
    };
  }, [gestures]);

  const chartData = useMemo(() => {
    if (!gestures.length) return { labels: ['No Data'], datasets: [{ data: [0] }] };
    
    const dayCounts: Record<string, number> = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Initialize last 7 days
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      dayCounts[days[d.getDay()]] = 0;
    }
    
    gestures.forEach(g => {
      const d = new Date(g.created_at);
      const dayName = days[d.getDay()];
      if (dayCounts[dayName] !== undefined) {
        dayCounts[dayName]++;
      }
    });
    
    return {
      labels: Object.keys(dayCounts),
      datasets: [
        {
          data: Object.values(dayCounts),
          color: (opacity = 1) => `rgba(0, 255, 157, ${opacity})`,
          strokeWidth: 2
        }
      ]
    };
  }, [gestures]);
  
  return (
    <ScrollView 
      className={`flex-1 ${isDark ? 'bg-dark-background' : 'bg-light-background'}`}
      contentContainerStyle={{ padding: 16, paddingTop: 48 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#00C278" />}
    >
      <View className="mb-6">
        <Text className={`text-3xl font-bold ${isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary'}`}>
          Overview
        </Text>
        <Text className={`text-base ${isDark ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
          Welcome back, {profile?.profile_name || user?.user_metadata?.full_name || 'User'}
        </Text>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#00C278" style={{ marginTop: 40 }} />
      ) : (
        <>
          <View className="flex-row justify-between space-x-4 mb-4">
            <GestroMetricCard 
              title="Gestures" 
              value={metrics.totalGestures} 
              icon={<Hand color="#00C278" size={20} />} 
            />
            <GestroMetricCard 
              title="Voice Cmds" 
              value={metrics.totalVoice} 
              icon={<Mic color="#00C278" size={20} />} 
            />
          </View>

          <View className="flex-row justify-between space-x-4 mb-8">
            <GestroMetricCard 
              title="Success Rate" 
              value={`${metrics.successRate}%`} 
              icon={<CheckCircle color="#00C278" size={20} />} 
            />
            <GestroMetricCard 
              title="Failure Rate" 
              value={`${metrics.failureRate}%`} 
              icon={<XCircle color="#FF4C4C" size={20} />} 
            />
          </View>

          <View className="mb-6">
            <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary'}`}>
              Usage Activity
            </Text>
            <View className={`rounded-2xl overflow-hidden ${isDark ? 'bg-dark-surface border border-dark-border' : 'bg-light-surface border border-light-border'}`}>
              <LineChart
                data={chartData.datasets[0].data.length > 0 ? chartData : { labels: ['No Data'], datasets: [{ data: [0] }] }}
                width={screenWidth - 32}
                height={220}
                chartConfig={{
                  backgroundColor: isDark ? colors.dark.surface : colors.light.surface,
                  backgroundGradientFrom: isDark ? colors.dark.surface : colors.light.surface,
                  backgroundGradientTo: isDark ? colors.dark.surface : colors.light.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => isDark ? `rgba(161, 161, 170, ${opacity})` : `rgba(113, 113, 122, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: colors.gestroGreen
                  }
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16
                }}
              />
            </View>
          </View>

          <View className="mb-6">
            <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary'}`}>
              System Status
            </Text>
            <View className={`p-4 rounded-2xl ${isDark ? 'bg-dark-surface border border-dark-border' : 'bg-light-surface border border-light-border'}`}>
              <StatusRow 
                label="Desktop App Connection" 
                status={isConnected ? 'Connected' : 'Disconnected'} 
                isDark={isDark} 
                isWarning={!isConnected} 
              />
              <StatusRow 
                label="Camera Module" 
                status={systemStatus?.camera_status === 'online' ? 'Online' : 'Offline'} 
                isDark={isDark} 
                isWarning={systemStatus?.camera_status !== 'online'}
              />
              <StatusRow 
                label="Control Mode" 
                status={systemStatus?.control_mode || 'Unknown'} 
                isDark={isDark} 
              />
              <StatusRow 
                label="Tracking FPS" 
                status={`${systemStatus?.tracking_fps || 0} FPS`} 
                isDark={isDark} 
              />
              <StatusRow 
                label="Network Latency" 
                status={`${systemStatus?.network_latency || 0}ms`} 
                isDark={isDark} 
              />
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function StatusRow({ label, status, isDark, isWarning = false }: any) {
  return (
    <View className="flex-row justify-between items-center py-2">
      <Text className={`font-medium ${isDark ? 'text-dark-textPrimary' : 'text-light-textPrimary'}`}>
        {label}
      </Text>
      <View className="flex-row items-center">
        <View className={`w-2 h-2 rounded-full mr-2 ${isWarning ? 'bg-yellow-500' : 'bg-gestro-green'}`} />
        <Text className={`${isDark ? 'text-dark-textSecondary' : 'text-light-textSecondary'}`}>
          {status}
        </Text>
      </View>
    </View>
  );
}
