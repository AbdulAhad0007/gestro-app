import { create } from 'zustand';
import { supabase } from '../services/supabase';
import * as Device from 'expo-device';

export type TransportType = 'USB' | 'LAN' | 'RELAY' | null;

interface PCConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  ws: WebSocket | null;
  transportType: TransportType;
  latency: number | null;
  connectionPreference: 'USB First' | 'Wi-Fi First';
  
  connect: (userId: string, device?: any) => Promise<void>;
  disconnect: () => void;
  sendAction: (action: string, payload?: any) => void;
  setConnectionPreference: (pref: 'USB First' | 'Wi-Fi First') => void;
}

export const usePCConnectionStore = create<PCConnectionState & {
  apps: any[];
  windows: any[];
  clipboardText: string | null;
  brightness: number | null;
  screenshotData: string | null;
  
  availableDevices: any[];
  selectedDevice: any | null;
  systemStats: any | null;
  fetchDevices: (userId: string) => Promise<void>;
}>((set, get) => ({
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  ws: null,
  transportType: null,
  latency: null,
  connectionPreference: 'USB First',
  _connectionAttempt: 0,
  
  apps: [],
  windows: [],
  clipboardText: null,
  brightness: null,
  screenshotData: null,

  availableDevices: [],
  selectedDevice: null,
  systemStats: null,

  _devicesSubscription: null as any,
  _pingInterval: null as any,

  setConnectionPreference: (pref) => {
    set({ connectionPreference: pref } as any);
  },
  
  fetchDevices: async (userId: string) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', 'windows')
        .order('last_seen', { ascending: false });
        
      if (!error && data) {
        set({ availableDevices: data } as any);
      }

      const { _devicesSubscription } = get() as any;
      if (_devicesSubscription) {
        _devicesSubscription.unsubscribe();
      }

      const channel = supabase.channel('user_devices_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_devices', filter: \user_id=eq.\\ },
          async () => {
            const { data: newData } = await supabase
              .from('user_devices')
              .select('*')
              .eq('user_id', userId)
              .eq('platform', 'windows')
              .order('last_seen', { ascending: false });
            if (newData) set({ availableDevices: newData } as any);
          }
        )
        .subscribe();
        
      set({ _devicesSubscription: channel } as any);
    } catch (e) {
      console.error('Failed to fetch devices', e);
    }
  },

  connect: async (userId: string, device?: any) => {
    const targetDevice = device || get().selectedDevice;
    if (!userId || !targetDevice || !targetDevice.id) {
      set({ connectionError: 'Invalid device selection.' } as any);
      return;
    }

    set({ selectedDevice: targetDevice } as any);

    const { ws: existingWs, _connectionAttempt, _pingInterval } = get() as any;
    if (_pingInterval) clearInterval(_pingInterval);
    const currentAttempt = _connectionAttempt + 1;

    if (existingWs) {
      existingWs.close();
    }

    set({ isConnecting: true, connectionError: null, ws: null, _connectionAttempt: currentAttempt, latency: null } as any);

    const setupWsHandlers = (ws: WebSocket, transport: TransportType) => {
      let lastPingTime = 0;

      const sendHandshake = () => {
        if ((get() as any)._connectionAttempt !== currentAttempt) return;
        ws.send(JSON.stringify({
          type: 'connect',
          device_name: Device.deviceName || 'Unknown Android Device',
          user_id: userId
        }));
      };

      if (ws.readyState === WebSocket.OPEN) {
        sendHandshake();
      } else {
        ws.onopen = sendHandshake;
      }

      ws.onmessage = (event) => {
        if ((get() as any)._connectionAttempt !== currentAttempt) return;
        try {
          const data = JSON.parse(event.data);
          if (data.status === 'connected') {
            set({ isConnected: true, isConnecting: false, connectionError: null, ws, transportType: transport } as any);
            
            // Start ping/pong for latency
            const pingInterval = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                lastPingTime = Date.now();
                ws.send(JSON.stringify({ action: 'PING' }));
              }
            }, 2000);
            set({ _pingInterval: pingInterval } as any);

          } else if (data.status === 'denied') {
            set({ isConnecting: false, connectionError: 'Connection denied by PC.', ws: null } as any);
            ws.close();
          } else if (data.status === 'error') {
            set({ isConnecting: false, connectionError: data.message || 'Connection error.', ws: null } as any);
            ws.close();
          } else if (data.type) {
            if (data.type === 'PONG') {
              set({ latency: Date.now() - lastPingTime } as any);
            } else if (data.type === 'GET_APPS_RESPONSE' && data.success) set({ apps: data.data } as any);
            else if (data.type === 'GET_WINDOWS_RESPONSE' && data.success) set({ windows: data.data } as any);
            else if (data.type === 'GET_CLIPBOARD_RESPONSE' && data.success) set({ clipboardText: data.data } as any);
            else if (data.type === 'TAKE_SCREENSHOT_RESPONSE' && data.success) set({ screenshotData: data.data } as any);
            else if (data.type === 'GET_SYSTEM_STATS_RESPONSE' && data.success) set({ systemStats: data.data } as any);
          }
        } catch (e) {
          console.error("Failed to parse WS message", e);
        }
      };

      ws.onclose = () => {
        if ((get() as any)._connectionAttempt !== currentAttempt) return;
        set({ isConnected: false, isConnecting: false, ws: null, transportType: null, latency: null } as any);
        const { _pingInterval } = get() as any;
        if (_pingInterval) clearInterval(_pingInterval);
        
        // Auto-reconnect fallback
        setTimeout(() => {
          if (get().selectedDevice) {
            get().connect(userId, get().selectedDevice);
          }
        }, 3000);
      };
    };

    const tryConnect = (url: string, timeoutMs: number): Promise<WebSocket> => {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket(url);
        let timeout = setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            ws.close();
            reject(new Error("Timeout"));
          }
        }, timeoutMs);

        ws.addEventListener('open', () => {
          clearTimeout(timeout);
          resolve(ws);
        });

        ws.addEventListener('error', (e) => {
          clearTimeout(timeout);
          reject(e);
        });
      });
    };

    try {
      const pref = get().connectionPreference;

      if (pref === 'USB First') {
        try {
          console.log('Trying USB connection to localhost...');
          const usbWs = await tryConnect('ws://localhost:8765', 1000);
          console.log('USB connected!');
          setupWsHandlers(usbWs, 'USB');
          return;
        } catch (e) {
          console.log('USB connection failed, falling back to LAN...');
        }
      }

      if (targetDevice.local_ip) {
        try {
          console.log(\Trying LAN connection to \...\);
          const lanWs = await tryConnect(\ws://\:8765\, 1500);
          console.log('LAN connected!');
          setupWsHandlers(lanWs, 'LAN');
          return;
        } catch (e) {
          console.log('LAN connection failed, falling back to relay...');
        }
      }

      // If Wi-Fi First, try USB after LAN
      if (pref === 'Wi-Fi First') {
        try {
          console.log('Trying USB connection to localhost...');
          const usbWs = await tryConnect('ws://localhost:8765', 1000);
          console.log('USB connected!');
          setupWsHandlers(usbWs, 'USB');
          return;
        } catch (e) {
          console.log('USB connection failed, falling back to relay...');
        }
      }

      const { useAuthStore } = await import('./useAuthStore');
      const token = useAuthStore.getState().session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const RELAY_URL = "ws://10.0.2.2:8080"; 
      const relayWsUrl = \\/?role=client&token=\&device_id=\\;
      
      console.log("Connecting via Relay...");
      const relayWs = await tryConnect(relayWsUrl, 5000);
      setupWsHandlers(relayWs, 'RELAY');

    } catch (err: any) {
      if ((get() as any)._connectionAttempt === currentAttempt) {
        set({ isConnecting: false, connectionError: 'Failed to connect to PC locally and via relay.' } as any);
        
        // Auto-reconnect fallback on total failure
        setTimeout(() => {
          if (get().selectedDevice) {
            get().connect(userId, get().selectedDevice);
          }
        }, 5000);
      }
    }
  },

  disconnect: () => {
    const { ws, _pingInterval } = get() as any;
    if (ws) ws.close();
    if (_pingInterval) clearInterval(_pingInterval);
    set({ isConnected: false, isConnecting: false, ws: null, connectionError: null, transportType: null, latency: null, apps: [], windows: [], clipboardText: null, screenshotData: null, selectedDevice: null } as any);
  },

  sendAction: (action, payload = {}) => {
    const { ws, isConnected } = get();
    if (ws && isConnected) {
      ws.send(JSON.stringify({ action, payload }));
      if (!['MOUSE_MOVE', 'GET_SYSTEM_STATS', 'GET_WINDOWS', 'GET_APPS', 'PING'].includes(action)) {
        import('./useCommandHistoryStore').then(({ useCommandHistoryStore }) => {
          useCommandHistoryStore.getState().addCommand(action);
        }).catch(err => console.error(err));
      }
    }
  }
}));
