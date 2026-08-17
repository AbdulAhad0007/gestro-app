export type TransferDirection = 'send' | 'receive';

export enum TransferStatus {
  PENDING = 'pending',
  WAITING_ACCEPTANCE = 'waiting_acceptance',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  VERIFYING = 'verifying',
}

// Protocol action names
export const TRANSFER_ACTIONS = {
  REQUEST: 'TRANSFER_REQUEST',
  ACCEPT: 'TRANSFER_ACCEPT',
  REJECT: 'TRANSFER_REJECT',
  START: 'TRANSFER_START',
  CHUNK: 'FILE_CHUNK',
  ACK: 'TRANSFER_ACK',
  CANCEL: 'TRANSFER_CANCEL',
  COMPLETE: 'TRANSFER_COMPLETE',
  VERIFIED: 'TRANSFER_VERIFIED',
  FAILED: 'TRANSFER_FAILED',
  RESUME: 'TRANSFER_RESUME',
  NEXT_FILE: 'TRANSFER_NEXT_FILE',
  CLIPBOARD: 'TRANSFER_CLIPBOARD',
};

export interface TransferFileInfo {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  sha256?: string;
  uri?: string;
}

export interface TransferSessionData {
  transferId: string;
  direction: TransferDirection;
  deviceName: string;
  transportType: string;
  status: TransferStatus;
  
  // Single file info (for backwards compatibility & current file)
  fileInfo: TransferFileInfo;
  
  // Multi-file support
  files: TransferFileInfo[];
  currentFileIndex: number;
  totalSize: number;
  overallBytesTransferred: number;
  overallProgress: number;

  bytesTransferred: number;
  progress: number;
  speed: number;
  etaSeconds: number;
  errorMessage?: string;
  currentChunk: number;
  totalChunks: number;
}
