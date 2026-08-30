import { create } from 'zustand';
import { supabase } from '../services/supabase';
import * as Device from 'expo-device';
import { useFileTransferStore } from './useFileTransferStore';

export type TransportType = 'USB' | 'LAN' | 'RELAY' | null;

interface PCConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  ws: WebSocket | null;
  transportType: TransportType;
  latency: number | null;
  connectionPreference: 'USB First' | 'Wi-Fi First';
  pairingTimeLeft: number | null;
  
  connect: (userId: string, device?: any) => Promise<void>;
  disconnect: () => void;
  sendAction: (action: string, payload?: any) => void;
  setConnectionPreference: (pref: 'USB First' | 'Wi-Fi First') => void;
}

interface ExtendedPCConnectionState extends PCConnectionState {
  apps: any[];
  windows: any[];
  clipboardText: string | null;
  brightness: number | null;
  screenshotData: string | null;
  systemStats: any | null;
  fileSystemItems: any[];
  searchResults: any[];
  isSearchingApps: boolean;
  
  availableDevices: any[];
  selectedDevice: any | null;
  fetchDevices: (userId: string, skipSubscription?: boolean) => Promise<void>;
  removeDevice: (deviceId: string) => Promise<void>;
}

export const usePCConnectionStore = create<ExtendedPCConnectionState>((set, get) => ({
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  ws: null,
  transportType: null,
  latency: null,
  connectionPreference: 'USB First',
  pairingTimeLeft: null,
  _connectionAttempt: 0,
  
  apps: [],
  windows: [],
  clipboardText: null,
  brightness: null,
  screenshotData: null,
  systemStats: null,
  fileSystemItems: [],
  searchResults: [],
  isSearchingApps: false,

  availableDevices: [],
  selectedDevice: null,

  _devicesSubscription: null as any,
  _pingInterval: null as any,
  _pairingInterval: null as any,

  setConnectionPreference: (pref) => {
    set({ connectionPreference: pref } as any);
  },
  
  fetchDevices: async (userId: string, skipSubscription = false) => {
    if (!userId) {
      console.log('[fetchDevices] No userId provided, skipping.');
      return;
    }
    try {
      if (!skipSubscription) {
        console.log(`[fetchDevices] Querying user_devices for userId: ${userId}`);
      }
      
      const { data, error } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_seen', { ascending: false });
      
      if (error) {
        console.error('[fetchDevices] Supabase error:', JSON.stringify(error));
      }
        
      if (!skipSubscription) {
        console.log(`[fetchDevices] Result: ${data?.length ?? 0} devices found`, JSON.stringify(data));
      }
        
      if (!error && data) {
        set({ availableDevices: data } as any);
      }

      if (skipSubscription) return;

      const { _devicesSubscription } = get() as any;
      if (_devicesSubscription) {
        supabase.removeChannel(_devicesSubscription);
      }

      const channel = supabase.channel('user_devices_changes_' + Math.random().toString(36).substring(7))
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_devices', filter: `user_id=eq.${userId}` },
          async () => {
            const { data: newData } = await supabase
              .from('user_devices')
              .select('*')
              .eq('user_id', userId)
              .order('last_seen', { ascending: false });
            if (newData) set({ availableDevices: newData } as any);
          }
        )
        .subscribe();
        
      set({ _devicesSubscription: channel } as any);
    } catch (e) {
      console.error('[fetchDevices] Exception:', e);
    }
  },

  removeDevice: async (deviceId: string) => {
    try {
      const { error } = await supabase
        .from('user_devices')
        .delete()
        .eq('id', deviceId);

      if (error) {
        console.error('[removeDevice] Error removing device:', error);
        return;
      }
      
      const currentDevices = get().availableDevices;
      set({ availableDevices: currentDevices.filter(d => d.id !== deviceId) } as any);
    } catch (err) {
      console.error('[removeDevice] Exception:', err);
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

    const { _pairingInterval: existingPairingInterval } = get() as any;
    if (existingPairingInterval) clearInterval(existingPairingInterval);

    set({ isConnecting: true, connectionError: null, ws: null, _connectionAttempt: currentAttempt, latency: null, pairingTimeLeft: null } as any);

    const setupWsHandlers = (ws: WebSocket, transport: TransportType) => {
      let lastPingTime = 0;

      let handshakeTimeout: any;

      const sendHandshake = () => {
        if ((get() as any)._connectionAttempt !== currentAttempt) return;
        ws.send(JSON.stringify({
          type: 'connect',
          device_name: Device.deviceName || 'Unknown Android Device',
          user_id: userId
        }));

        handshakeTimeout = setTimeout(() => {
          if (get().isConnecting) {
            set({ isConnecting: false, connectionError: 'PC did not respond. Is Gestro running?' } as any);
            ws.close();
          }
        }, 6000);
      };

      if (ws.readyState === WebSocket.OPEN) {
        sendHandshake();
      } else {
        ws.onopen = sendHandshake;
      }

      ws.onmessage = (event) => {
        if ((get() as any)._connectionAttempt !== currentAttempt) return;
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          
          if (data.status === 'pending') {
            if (handshakeTimeout) clearTimeout(handshakeTimeout);
            set({ pairingTimeLeft: 10 } as any);
            const pairingInterval = setInterval(() => {
              const currentLeft = (get() as any).pairingTimeLeft;
              if (currentLeft && currentLeft > 1) {
                set({ pairingTimeLeft: currentLeft - 1 } as any);
              } else {
                clearInterval((get() as any)._pairingInterval);
                set({ isConnecting: false, connectionError: 'Pairing request timed out.', ws: null, selectedDevice: null, pairingTimeLeft: null } as any);
                ws.close();
              }
            }, 1000);
            set({ _pairingInterval: pairingInterval } as any);
            return;
          }

          // Clear handshake interval on any other valid response
          if (handshakeTimeout) clearTimeout(handshakeTimeout);

          // Clear pairing interval if any other status arrives
          const { _pairingInterval } = get() as any;
          if (_pairingInterval) {
            clearInterval(_pairingInterval);
            set({ _pairingInterval: null, pairingTimeLeft: null } as any);
          }

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
            set({ isConnecting: false, connectionError: 'Connection denied by PC.', ws: null, selectedDevice: null } as any);
            ws.close();
          } else if (data.status === 'error') {
            set({ isConnecting: false, connectionError: data.message || 'Connection error.', ws: null } as any);
            ws.close();
          } else if (data.action && data.action.startsWith('TRANSFER_')) {
            useFileTransferStore.getState().handleIncomingMessage(data.action, data.payload);
          } else if (data.type) {
            if (data.type === 'PONG') {
              set({ latency: Date.now() - lastPingTime } as any);
            } else if (data.type === 'GET_APPS_RESPONSE' && data.success) set({ apps: data.data } as any);
            else if (data.type === 'GET_WINDOWS_RESPONSE' && data.success) set({ windows: data.data } as any);
            else if (data.type === 'SEARCH_APPS_RESPONSE' && data.success) set({ searchResults: data.data, isSearchingApps: false } as any);
            else if (data.type === 'GET_CLIPBOARD_RESPONSE' && data.success) set({ clipboardText: data.data } as any);
            else if (data.type === 'TAKE_SCREENSHOT_RESPONSE' && data.success) set({ screenshotData: data.data } as any);
            else if (data.type === 'GET_SYSTEM_STATS_RESPONSE' && data.success) set({ systemStats: data.data } as any);
            else if (data.type === 'LIST_DIRECTORY_RESPONSE' && data.success) set({ fileSystemItems: data.data } as any);
          }
        } catch (e) {
          console.error("Failed to parse WS message", e);
        }
      };

      ws.onclose = () => {
        if (handshakeTimeout) clearTimeout(handshakeTimeout);
        if ((get() as any)._connectionAttempt !== currentAttempt) return;
        set({ isConnected: false, isConnecting: false, ws: null, transportType: null, latency: null, pairingTimeLeft: null } as any);
        const { _pingInterval, _pairingInterval } = get() as any;
        if (_pingInterval) clearInterval(_pingInterval);
        if (_pairingInterval) clearInterval(_pairingInterval);
        
        // Notify file transfer store to pause active transfers
        useFileTransferStore.getState().handleDisconnect();
        

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
          console.log('USB connection failed...');
        }
      }

      if (targetDevice.local_ip) {
        try {
          console.log(`Trying LAN connection to ${targetDevice.local_ip}...`);
          const lanWs = await tryConnect(`ws://${targetDevice.local_ip}:8765`, 1500);
          console.log('LAN connected!');
          setupWsHandlers(lanWs, 'LAN');
          return;
        } catch (e) {
          console.log('LAN connection failed...');
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
          console.log('USB connection failed...');
        }
      }

      // Fallback to Supabase Relay
      console.log('Local connections failed, trying Supabase Relay...');
      
      const relayWs = new Promise<WebSocket>((resolve, reject) => {
        let isResolved = false;
        const channelName = `relay_${targetDevice.id}`;
        const channel = supabase.channel(channelName);
        
        let timeout = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            supabase.removeChannel(channel);
            reject(new Error("Relay timeout"));
          }
        }, 5000);

        const mockWs: any = {
          readyState: 0,
          onopen: null,
          onmessage: null,
          onclose: null,
          onerror: null,
          close: () => {
            mockWs.readyState = 3;
            supabase.removeChannel(channel);
            if (mockWs.onclose) mockWs.onclose();
          },
          send: (data: string) => {
            if (mockWs.readyState === 1) {
              // Send message to PC
              let payloadData = data;
              try {
                payloadData = JSON.parse(data);
              } catch (e) {}
              
              channel.send({
                type: 'broadcast',
                event: 'from_app',
                payload: payloadData
              });
            }
          },
          addEventListener: (event: string, callback: any) => {
            if (event === 'open') {
               const old = mockWs.onopen;
               mockWs.onopen = () => { if(old) old(); callback(); };
            } else if (event === 'error') {
               const old = mockWs.onerror;
               mockWs.onerror = (e: any) => { if(old) old(e); callback(e); };
            }
          }
        };

        channel
          .on('broadcast', { event: 'from_pc' }, (payload) => {
            if (mockWs.onmessage && payload.payload) {
              mockWs.onmessage({ data: payload.payload });
            }
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED' && !isResolved) {
              clearTimeout(timeout);
              isResolved = true;
              mockWs.readyState = 1;
              resolve(mockWs as WebSocket);
              // Do not call onopen here, setupWsHandlers will call it if it was bound or we trigger it via event listener
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              mockWs.readyState = 3;
              if (mockWs.onclose) mockWs.onclose();
              if (!isResolved) {
                isResolved = true;
                clearTimeout(timeout);
                reject(new Error(status === 'CHANNEL_ERROR' ? "Relay channel error" : "Relay closed"));
              }
            }
          });
      });

      const ws = await relayWs;
      console.log('Relay connected!');
      setupWsHandlers(ws, 'RELAY');
      return;

    } catch (err: any) {
      if ((get() as any)._connectionAttempt === currentAttempt) {
        let msg = 'Unable to connect to PC locally or via relay. Check that Gestro is running on your PC.';
        if (err?.message === 'Relay timeout' || err?.message === 'Timeout') {
          msg = 'Connection timed out. Try again.';
        } else if (err?.message === 'Relay channel error') {
          msg = 'Failed to connect to relay server (No Internet).';
        }
        set({ isConnecting: false, connectionError: msg } as any);
      }
    }
  },

  disconnect: () => {
    const { ws, _pingInterval, _pairingInterval } = get() as any;
    if (ws) ws.close();
    if (_pingInterval) clearInterval(_pingInterval);
    if (_pairingInterval) clearInterval(_pairingInterval);
    set({ isConnected: false, isConnecting: false, ws: null, connectionError: null, transportType: null, latency: null, pairingTimeLeft: null,
      apps: [],
      windows: [],
      clipboardText: null,
      screenshotData: null,
      systemStats: null,
      fileSystemItems: [],
      searchResults: [],
      isSearchingApps: false,
      selectedDevice: null
    } as any);
  },

  sendAction: (action, payload = {}) => {
    const { ws, isConnected } = get();
    if (ws && isConnected) {
      if (action === 'SEARCH_APPS') {
        set({ isSearchingApps: true } as any);
      }
      ws.send(JSON.stringify({ action, payload }));
      if (!['MOUSE_MOVE', 'SCROLL_UP', 'SCROLL_DOWN', 'GET_SYSTEM_STATS', 'GET_WINDOWS', 'GET_APPS', 'PING'].includes(action)) {
        import('./useCommandHistoryStore').then(({ useCommandHistoryStore }) => {
          useCommandHistoryStore.getState().addCommand(action);
        }).catch(err => console.error(err));
      }
    }
  }
}));

