import { OfflineActionQueue } from '@/lib/offline/ActionQueue';
import { offlineDataManager } from '@/lib/offline/OfflineDataManager';
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface ConnectionQuality {
  type: NetInfoStateType;
  isConnected: boolean;
  isInternetReachable: boolean | null;
  strength: 'poor' | 'fair' | 'good' | 'excellent' | 'unknown';
  effectiveType?: '2g' | '3g' | '4g' | '5g' | 'wifi' | 'unknown';
}

interface SyncStatus {
  isActive: boolean;
  lastSyncTime: number | null;
  pendingActions: number;
  failedActions: number;
  errorMessage: string | null;
}

interface NetworkContextType {
  isConnected: boolean | null;
  connectionQuality: ConnectionQuality | null;
  syncStatus: SyncStatus;
  forceSync: () => Promise<void>;
  isOfflineMode: boolean;
  toggleOfflineMode: () => void;
  retryFailedActions: () => Promise<void>;
  clearFailedActions: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: null,
  connectionQuality: null,
  syncStatus: {
    isActive: false,
    lastSyncTime: null,
    pendingActions: 0,
    failedActions: 0,
    errorMessage: null
  },
  forceSync: async () => {},
  isOfflineMode: false,
  toggleOfflineMode: () => {},
  retryFailedActions: async () => {},
  clearFailedActions: async () => {}
});

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isActive: false,
    lastSyncTime: null,
    pendingActions: 0,
    failedActions: 0,
    errorMessage: null
  });

  const determineConnectionQuality = useCallback((state: NetInfoState): ConnectionQuality => {
    const isOnline = state.isConnected === true && state.isInternetReachable === true;
    
    let strength: ConnectionQuality['strength'] = 'unknown';
    let effectiveType: ConnectionQuality['effectiveType'] = 'unknown';

    if (state.type === 'wifi') {
      effectiveType = 'wifi';
      strength = 'excellent';
    } else if (state.type === 'cellular') {
      effectiveType = (state.details as any)?.effectiveType || '4g';
      
      switch (effectiveType) {
        case '5g':
          strength = 'excellent';
          break;
        case '4g':
          strength = 'good';
          break;
        case '3g':
          strength = 'fair';
          break;
        case '2g':
          strength = 'poor';
          break;
        default:
          strength = 'unknown';
      }
    }

    return {
      type: state.type,
      isConnected: isOnline,
      isInternetReachable: state.isInternetReachable,
      strength,
      effectiveType
    };
  }, []);

  const updateSyncStatus = useCallback(async () => {
    try {
      const queueStatus = OfflineActionQueue.getQueueStatus();
      setSyncStatus(prev => ({
        ...prev,
        pendingActions: queueStatus.pendingCount,
        failedActions: queueStatus.failedCount,
        isActive: queueStatus.isProcessing
      }));
    } catch (error) {
      console.error('Failed to update sync status:', error);
    }
  }, []);

  const performSync = useCallback(async (): Promise<void> => {
    if (!isConnected || isOfflineMode) {
      return;
    }

    try {
      setSyncStatus(prev => ({ ...prev, isActive: true, errorMessage: null }));
      
      // process offline queue
      await OfflineActionQueue.process();
      
      await offlineDataManager.clearExpiredCache();
      
      setSyncStatus(prev => ({
        ...prev,
        isActive: false,
        lastSyncTime: Date.now(),
        errorMessage: null
      }));
      
      await updateSyncStatus();
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus(prev => ({
        ...prev,
        isActive: false,
        errorMessage: error instanceof Error ? error.message : 'Sync failed'
      }));
    }
  }, [isConnected, isOfflineMode, updateSyncStatus]);

  const forceSync = useCallback(async (): Promise<void> => {
    console.log('Force sync triggered');
    await performSync();
  }, [performSync]);

  const retryFailedActions = useCallback(async (): Promise<void> => {
    try {
      await OfflineActionQueue.retryFailedActions();
      await updateSyncStatus();
    } catch (error) {
      console.error('Failed to retry actions:', error);
    }
  }, [updateSyncStatus]);

  const clearFailedActions = useCallback(async (): Promise<void> => {
    try {
      await OfflineActionQueue.clearFailedQueue();
      await updateSyncStatus();
    } catch (error) {
      console.error('Failed to clear failed actions:', error);
    }
  }, [updateSyncStatus]);

  const toggleOfflineMode = useCallback(() => {
    setIsOfflineMode(prev => !prev);
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const quality = determineConnectionQuality(state);
      const wasConnected = isConnected;
      const isNowConnected = quality.isConnected && !isOfflineMode;
      
      setIsConnected(isNowConnected);
      setConnectionQuality(quality);

      // auto-sync when connection is restored
      if (!wasConnected && isNowConnected) {
        console.log('Connection restored, triggering sync...');
        performSync();
      }
    });

    const syncStatusInterval = setInterval(updateSyncStatus, 30000); // 30 seconds

    // initial sync status update
    updateSyncStatus();

    return () => {
      unsubscribe();
      clearInterval(syncStatusInterval);
    };
  }, [determineConnectionQuality, isConnected, isOfflineMode, performSync, updateSyncStatus]);

  // monitor offline mode changes
  useEffect(() => {
    if (!isOfflineMode && connectionQuality?.isConnected) {
      performSync();
    }
  }, [isOfflineMode, connectionQuality?.isConnected, performSync]);

  const value: NetworkContextType = {
    isConnected,
    connectionQuality,
    syncStatus,
    forceSync,
    isOfflineMode,
    toggleOfflineMode,
    retryFailedActions,
    clearFailedActions
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};