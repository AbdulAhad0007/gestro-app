import { create } from 'zustand';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import { TRANSFER_ACTIONS, TransferDirection, TransferFileInfo, TransferSessionData, TransferStatus } from '../services/transferProtocol';
import { usePCConnectionStore } from './usePCConnectionStore';

// Generate UUID for transfers
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface FileTransferState {
  activeTransfers: Record<string, TransferSessionData>;
  transferHistory: TransferSessionData[];
  
  // App-level handlers
  addIncomingRequest: (payload: any) => void;
  acceptTransfer: (transferId: string) => void;
  rejectTransfer: (transferId: string) => void;
  
  // Outgoing
  sendFiles: (files: {uri: string, name: string, size: number, mimeType: string}[], deviceName: string) => Promise<string>;
  sendClipboard: (text: string) => void;
  
  // Network handlers (called by usePCConnectionStore)
  handleIncomingMessage: (action: string, payload: any) => void;
  handleDisconnect: () => void;
  
  // Actions
  cancelTransfer: (transferId: string) => void;
  resumeTransfer: (transferId: string) => void;
}

const CHUNK_SIZE = 64 * 1024; // 64KB (Safe limit for React Native WebSockets to prevent silent frame dropping)

export const useFileTransferStore = create<FileTransferState>((set, get) => ({
  activeTransfers: {},
  transferHistory: [],

  addIncomingRequest: (payload) => {
    const { transferId, senderDeviceId, files, totalSize } = payload;
    
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    const newTransfer: TransferSessionData = {
      transferId,
      direction: 'receive',
      deviceName: senderDeviceId,
      transportType: usePCConnectionStore.getState().transportType || 'LAN',
      status: TransferStatus.WAITING_ACCEPTANCE,
      fileInfo: {
        fileId: file.fileId,
        fileName: file.fileName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        sha256: file.sha256,
      },
      files: files,
      currentFileIndex: 0,
      totalSize: totalSize,
      overallBytesTransferred: 0,
      overallProgress: 0,
      
      bytesTransferred: 0,
      progress: 0,
      speed: 0,
      etaSeconds: 0,
      currentChunk: 0,
      totalChunks: Math.max(1, Math.ceil(file.fileSize / CHUNK_SIZE)),
    };
    
    set((state) => ({
      activeTransfers: {
        ...state.activeTransfers,
        [transferId]: newTransfer,
      }
    }));
  },

  acceptTransfer: (transferId) => {
    const transfer = get().activeTransfers[transferId];
    if (!transfer) return;
    
    set((state) => ({
      activeTransfers: {
        ...state.activeTransfers,
        [transferId]: { ...transfer, status: TransferStatus.PENDING } // Will become active when START arrives
      }
    }));
    
    usePCConnectionStore.getState().sendAction(TRANSFER_ACTIONS.ACCEPT, { transferId });
  },

  rejectTransfer: (transferId) => {
    const transfer = get().activeTransfers[transferId];
    if (!transfer) return;
    
    set((state) => {
      const { [transferId]: _, ...rest } = state.activeTransfers;
      return { 
        activeTransfers: rest,
        transferHistory: [
          ...state.transferHistory, 
          { ...transfer, status: TransferStatus.CANCELLED, errorMessage: 'Rejected' }
        ]
      };
    });
    
    usePCConnectionStore.getState().sendAction(TRANSFER_ACTIONS.REJECT, { transferId });
  },

  sendFiles: async (files, deviceName) => {
    const transferId = generateId();
    if (files.length === 0) return transferId;
    
    const transferFiles = await Promise.all(files.map(async f => {
      let finalUri = f.uri;
      // On Android, reading chunks from content:// URIs loads the entire file into memory.
      // Copy to cache first to allow fast chunking from file:// URIs.
      if (finalUri.startsWith('content://')) {
        const destPath = `${FileSystem.cacheDirectory}gestro_send_${generateId()}_${f.name}`;
        try {
          await FileSystem.copyAsync({ from: finalUri, to: destPath });
          finalUri = destPath;
        } catch (err) {
          console.error("Failed to cache content URI", err);
        }
      }
      return {
        fileId: generateId(),
        fileName: f.name,
        fileSize: f.size,
        mimeType: f.mimeType,
        uri: finalUri,
      };
    }));
    
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    const file = transferFiles[0];
    
    const newTransfer: TransferSessionData = {
      transferId,
      direction: 'send',
      deviceName,
      transportType: usePCConnectionStore.getState().transportType || 'LAN',
      status: TransferStatus.WAITING_ACCEPTANCE,
      
      fileInfo: file,
      files: transferFiles,
      currentFileIndex: 0,
      totalSize: totalSize,
      overallBytesTransferred: 0,
      overallProgress: 0,
      
      bytesTransferred: 0,
      progress: 0,
      speed: 0,
      etaSeconds: 0,
      currentChunk: 0,
      totalChunks: Math.max(1, Math.ceil(file.fileSize / CHUNK_SIZE)),
    };
    
    set((state) => ({
      activeTransfers: {
        ...state.activeTransfers,
        [transferId]: newTransfer,
      }
    }));
    
    const payload = {
      transferId,
      senderDeviceId: 'Android Device',
      files: transferFiles.map(f => ({
        fileId: f.fileId,
        fileName: f.fileName,
        fileSize: f.fileSize,
        mimeType: f.mimeType,
      })),
      totalSize: totalSize,
      totalFiles: files.length
    };
    
    usePCConnectionStore.getState().sendAction(TRANSFER_ACTIONS.REQUEST, payload);
    return transferId;
  },

  sendClipboard: (text: string) => {
    usePCConnectionStore.getState().sendAction(TRANSFER_ACTIONS.CLIPBOARD, { text });
  },

  handleDisconnect: () => {
    set((state) => {
      const updatedTransfers = { ...state.activeTransfers };
      for (const tid of Object.keys(updatedTransfers)) {
        const t = updatedTransfers[tid];
        if (t.status === TransferStatus.ACTIVE || t.status === TransferStatus.PENDING || t.status === TransferStatus.WAITING_ACCEPTANCE) {
          updatedTransfers[tid] = { ...t, status: TransferStatus.PAUSED };
        }
      }
      return { activeTransfers: updatedTransfers };
    });
  },

  handleIncomingMessage: async (action, payload) => {
    const { activeTransfers } = get();
    
    switch (action) {
      case TRANSFER_ACTIONS.REQUEST:
        get().addIncomingRequest(payload);
        break;
        
      case TRANSFER_ACTIONS.ACCEPT:
        if (payload.transferId && activeTransfers[payload.transferId]) {
          set((state) => ({
            activeTransfers: {
              ...state.activeTransfers,
              [payload.transferId]: { 
                ...state.activeTransfers[payload.transferId], 
                status: TransferStatus.ACTIVE 
              }
            }
          }));
          startSending(payload.transferId);
        }
        break;
        
      case TRANSFER_ACTIONS.REJECT:
        if (payload.transferId && activeTransfers[payload.transferId]) {
          moveToHistory(payload.transferId, TransferStatus.CANCELLED, 'Rejected by receiver');
        }
        break;
        
      case TRANSFER_ACTIONS.START:
        if (payload.transferId && activeTransfers[payload.transferId]) {
          const t = activeTransfers[payload.transferId];
          const destUri = FileSystem.documentDirectory + t.fileInfo.fileName;
          
          try {
            const info = await FileSystem.getInfoAsync(destUri);
            if (info.exists) {
              await FileSystem.deleteAsync(destUri);
            }
          } catch (e) {}
          
          set((state) => ({
            activeTransfers: {
              ...state.activeTransfers,
              [payload.transferId]: { 
                ...state.activeTransfers[payload.transferId], 
                status: TransferStatus.ACTIVE,
                fileInfo: { ...t.fileInfo, uri: destUri, sha256: payload.sha256 },
                totalChunks: payload.totalChunks
              }
            }
          }));
        }
        break;
        
      case TRANSFER_ACTIONS.CHUNK:
        if (payload.transferId && activeTransfers[payload.transferId]) {
          const t = activeTransfers[payload.transferId];
          if (t.status !== TransferStatus.ACTIVE) return;
          
          const destUri = t.fileInfo.uri;
          if (destUri) {
            try {
              await FileSystem.writeAsStringAsync(destUri, payload.data, {
                encoding: 'base64',
                position: t.bytesTransferred
              });
              
              const newBytes = t.bytesTransferred + payload.size;
              const newProgress = Math.min(100, (newBytes / t.fileInfo.fileSize) * 100);
              
              const newOverallBytes = t.overallBytesTransferred + payload.size;
              const newOverallProgress = Math.min(100, (newOverallBytes / t.totalSize) * 100);
              
              set((state) => ({
                activeTransfers: {
                  ...state.activeTransfers,
                  [payload.transferId]: {
                    ...state.activeTransfers[payload.transferId],
                    bytesTransferred: newBytes,
                    progress: newProgress,
                    overallBytesTransferred: newOverallBytes,
                    overallProgress: newOverallProgress,
                    currentChunk: payload.chunkIndex + 1
                  }
                }
              }));
              
              usePCConnectionStore.getState().sendAction(TRANSFER_ACTIONS.ACK, {
                transferId: payload.transferId,
                fileId: payload.fileId,
                chunkIndex: payload.chunkIndex
              });
              
            } catch (error) {
              console.error("Error writing chunk", error);
              moveToHistory(payload.transferId, TransferStatus.FAILED, 'Storage error');
              usePCConnectionStore.getState().sendAction(TRANSFER_ACTIONS.FAILED, {
                transferId: payload.transferId,
                fileId: payload.fileId,
                error: 'Storage error'
              });
            }
          }
        }
        break;
        
      case TRANSFER_ACTIONS.ACK:
        if (payload.transferId && activeTransfers[payload.transferId]) {
          const t = activeTransfers[payload.transferId];
          const nextChunk = payload.chunkIndex + 1;
          const chunkSizeAck = Math.min(CHUNK_SIZE, t.fileInfo.fileSize - payload.chunkIndex * CHUNK_SIZE);
          const newOverallBytes = t.overallBytesTransferred + chunkSizeAck;
          const newOverallProgress = Math.min(100, (newOverallBytes / t.totalSize) * 100);

          set((state) => ({
            activeTransfers: {
              ...state.activeTransfers,
              [payload.transferId]: {
                ...state.activeTransfers[payload.transferId],
                currentChunk: nextChunk,
                overallBytesTransferred: newOverallBytes,
                overallProgress: newOverallProgress
              }
            }
          }));
          
          sendNextChunk(payload.transferId);
        }
        break;
        
      case TRANSFER_ACTIONS.COMPLETE:
        if (payload.transferId && activeTransfers[payload.transferId]) {
          const t = activeTransfers[payload.transferId];
          usePCConnectionStore.getState().sendAction(TRANSFER_ACTIONS.VERIFIED, {
            transferId: payload.transferId,
            fileId: payload.fileId
          });
          
          const nextIndex = t.currentFileIndex + 1;
          if (nextIndex < (t.files?.length || 1)) {
            const nextFile = t.files[nextIndex];
            set((state) => ({
              activeTransfers: {
                ...state.activeTransfers,
                [payload.transferId]: {
                  ...state.activeTransfers[payload.transferId],
                  currentFileIndex: nextIndex,
                  fileInfo: nextFile,
                  bytesTransferred: 0,
                  progress: 0,
                  currentChunk: 0,
                  totalChunks: Math.max(1, Math.ceil(nextFile.fileSize / CHUNK_SIZE)),
                  status: TransferStatus.ACTIVE,
                }
              }
            }));
            usePCConnectionStore.getState().sendAction(TRANSFER_ACTIONS.NEXT_FILE, {
              transferId: payload.transferId
            });
          } else {
            moveToHistory(payload.transferId, TransferStatus.COMPLETED);
          }
        }
        break;
        
      case TRANSFER_ACTIONS.VERIFIED:
        if (payload.transferId && activeTransfers[payload.transferId]) {
          const t = activeTransfers[payload.transferId];
          const nextIndex = t.currentFileIndex + 1;
          if (nextIndex < (t.files?.length || 1)) {
            const nextFile = t.files[nextIndex];
            set((state) => ({
              activeTransfers: {
                ...state.activeTransfers,
                [payload.transferId]: {
                  ...state.activeTransfers[payload.transferId],
                  currentFileIndex: nextIndex,
                  fileInfo: nextFile,
                  bytesTransferred: 0,
                  progress: 0,
                  currentChunk: 0,
                  totalChunks: Math.max(1, Math.ceil(nextFile.fileSize / CHUNK_SIZE)),
                  status: TransferStatus.ACTIVE,
                }
              }
            }));
            // Sender waits for NEXT_FILE action from receiver before starting next file chunking
          } else {
            moveToHistory(payload.transferId, TransferStatus.COMPLETED);
          }
        }
        break;
        
      case TRANSFER_ACTIONS.NEXT_FILE:
        if (payload.transferId && activeTransfers[payload.transferId]) {
           startSending(payload.transferId);
        }
        break;
        
      case TRANSFER_ACTIONS.FAILED:
        if (payload.transferId && activeTransfers[payload.transferId]) {
          moveToHistory(payload.transferId, TransferStatus.FAILED, payload.error);
        }
        break;
        
      case TRANSFER_ACTIONS.CANCEL:
        if (payload.transferId && activeTransfers[payload.transferId]) {
          const t = activeTransfers[payload.transferId];
          if (t.direction === 'receive' && t.fileInfo.uri) {
            FileSystem.deleteAsync(t.fileInfo.uri, { idempotent: true }).catch(() => {});
          }
          moveToHistory(payload.transferId, TransferStatus.CANCELLED, 'Cancelled by remote');
        }
        break;

      case TRANSFER_ACTIONS.VERIFIED:
        if (payload.transferId && activeTransfers[payload.transferId]) {
          const t = activeTransfers[payload.transferId];
          const nextIndex = t.currentFileIndex + 1;
          if (nextIndex < (t.files?.length || 1)) {
            const nextFile = t.files[nextIndex];
            set((state) => ({
              activeTransfers: {
                ...state.activeTransfers,
                [payload.transferId]: {
                  ...state.activeTransfers[payload.transferId],
                  currentFileIndex: nextIndex,
                  fileInfo: nextFile,
                  bytesTransferred: 0,
                  progress: 0,
                  currentChunk: 0,
                  totalChunks: Math.max(1, Math.ceil(nextFile.fileSize / CHUNK_SIZE)),
                  status: TransferStatus.ACTIVE,
                }
              }
            }));
            startSending(payload.transferId);
          } else {
            moveToHistory(payload.transferId, TransferStatus.COMPLETED);
          }
        }
        break;

      case TRANSFER_ACTIONS.RESUME:
        if (payload.transferId && activeTransfers[payload.transferId]) {
          const t = activeTransfers[payload.transferId];
          if (t.direction === 'send') {
             set((state) => ({
                activeTransfers: {
                  ...state.activeTransfers,
                  [payload.transferId]: {
                    ...state.activeTransfers[payload.transferId],
                    currentChunk: payload.fromChunk || 0,
                    status: TransferStatus.ACTIVE,
                  }
                }
              }));
              sendNextChunk(payload.transferId);
          }
        }
        break;

      case TRANSFER_ACTIONS.CLIPBOARD:
        if (payload.text) {
          import('expo-clipboard').then((Clipboard) => {
            Clipboard.setStringAsync(payload.text);
          });
        }
        break;
    }
  },

  cancelTransfer: (transferId) => {
    const transfer = get().activeTransfers[transferId];
    if (!transfer) return;
    
    if (transfer.direction === 'receive' && transfer.fileInfo.uri) {
        FileSystem.deleteAsync(transfer.fileInfo.uri, { idempotent: true }).catch(() => {});
    }
    
    moveToHistory(transferId, TransferStatus.CANCELLED, 'Cancelled by user');
    usePCConnectionStore.getState().sendAction(TRANSFER_ACTIONS.CANCEL, { transferId });
  },
  
  resumeTransfer: (transferId) => {
    const transfer = get().activeTransfers[transferId];
    if (!transfer) return;
    
    if (transfer.direction === 'receive') {
        usePCConnectionStore.getState().sendAction(TRANSFER_ACTIONS.RESUME, { 
            transferId, 
            fileId: transfer.fileInfo.fileId, 
            fromChunk: transfer.currentChunk 
        });
    }
  }
}));

const moveToHistory = (transferId: string, status: TransferStatus, errorMessage?: string) => {
  useFileTransferStore.setState((state) => {
    const transfer = state.activeTransfers[transferId];
    if (!transfer) return state;
    
    const { [transferId]: _, ...rest } = state.activeTransfers;
    
    // Clean up cached sending files
    if (transfer.direction === 'send' && transfer.fileInfo?.uri?.startsWith(FileSystem.cacheDirectory)) {
       FileSystem.deleteAsync(transfer.fileInfo.uri, { idempotent: true }).catch(() => {});
    }
    
    return {
      activeTransfers: rest,
      transferHistory: [
        { ...transfer, status, errorMessage },
        ...state.transferHistory
      ]
    };
  });
};

const startSending = async (transferId: string) => {
  const transfer = useFileTransferStore.getState().activeTransfers[transferId];
  if (!transfer || !transfer.fileInfo.uri) return;
  
  usePCConnectionStore.getState().sendAction(TRANSFER_ACTIONS.START, {
    transferId,
    fileId: transfer.fileInfo.fileId,
    fileName: transfer.fileInfo.fileName,
    fileSize: transfer.fileInfo.fileSize,
    totalChunks: transfer.totalChunks,
    chunkSize: CHUNK_SIZE,
    sha256: '' 
  });
  
  sendNextChunk(transferId);
};

const sendNextChunk = async (transferId: string) => {
  const transfer = useFileTransferStore.getState().activeTransfers[transferId];
  if (!transfer || transfer.status !== TransferStatus.ACTIVE || !transfer.fileInfo.uri) return;
  
  const { currentChunk, totalChunks, fileInfo } = transfer;
  if (currentChunk >= totalChunks) {
    usePCConnectionStore.getState().sendAction(TRANSFER_ACTIONS.COMPLETE, {
      transferId,
      fileId: fileInfo.fileId,
      sha256: ''
    });
    return;
  }
  
  try {
    const position = currentChunk * CHUNK_SIZE;
    const length = Math.min(CHUNK_SIZE, fileInfo.fileSize - position);
    
    const data = await FileSystem.readAsStringAsync(fileInfo.uri, {
      encoding: 'base64',
      position,
      length
    });
    
    const newBytes = position + length;
    const newProgress = Math.min(100, (newBytes / fileInfo.fileSize) * 100);
    
    useFileTransferStore.setState((state) => {
      const t = state.activeTransfers[transferId];
      if (!t) return state;
      return {
        activeTransfers: {
          ...state.activeTransfers,
          [transferId]: {
            ...t,
            bytesTransferred: newBytes,
            progress: newProgress
          }
        }
      };
    });
    
    usePCConnectionStore.getState().sendAction(TRANSFER_ACTIONS.CHUNK, {
      transferId,
      fileId: fileInfo.fileId,
      chunkIndex: currentChunk,
      data,
      size: length
    });
    
  } catch (error) {
    console.error("Error sending chunk", error);
    moveToHistory(transferId, TransferStatus.FAILED, 'Failed to read file');
    usePCConnectionStore.getState().sendAction(TRANSFER_ACTIONS.FAILED, {
      transferId,
      fileId: fileInfo.fileId,
      error: 'File read error'
    });
  }
};
