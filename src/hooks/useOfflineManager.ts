import { useNetwork } from '@/contexts/NetworkContext';
import { OfflineActionQueue } from '@/lib/offline/ActionQueue';
import { offlineDataManager } from '@/lib/offline/OfflineDataManager';
import { profileService } from '@/services/profileService';
import { tripService } from '@/services/tripService';
import { useCallback, useEffect, useState } from 'react';

interface OfflineCapabilities {
  canViewTrips: boolean;
  canViewMap: boolean;
  canViewProfile: boolean;
  canCommunicate: boolean;
  canNavigate: boolean;
}

interface OfflineStats {
  cacheSize: number;
  pendingActions: number;
  failedActions: number;
  lastSyncTime: number | null;
  offlineCapabilities: OfflineCapabilities;
}

export const useOfflineManager = () => {
  const { 
    isConnected, 
    connectionQuality, 
    syncStatus, 
    isOfflineMode, 
    toggleOfflineMode,
    forceSync,
    retryFailedActions,
    clearFailedActions
  } = useNetwork();

  const [offlineStats, setOfflineStats] = useState<OfflineStats | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeOfflineCapabilities = useCallback(async () => {
    try {
      const capabilities = await offlineDataManager.getOfflineCapabilities();
      if (capabilities) {
        setOfflineStats(prev => prev ? { ...prev, offlineCapabilities: capabilities } : null);
      }
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize offline capabilities:', error);
      setIsInitialized(true);
    }
  }, []);

  const updateOfflineStats = useCallback(async () => {
    try {
      const [cacheSize, queueStatus, capabilities] = await Promise.all([
        offlineDataManager.getCacheSize(),
        Promise.resolve(OfflineActionQueue.getQueueStatus()),
        offlineDataManager.getOfflineCapabilities()
      ]);

      setOfflineStats({
        cacheSize,
        pendingActions: queueStatus.pendingCount,
        failedActions: queueStatus.failedCount,
        lastSyncTime: syncStatus.lastSyncTime,
        offlineCapabilities: capabilities || {
          canViewTrips: true,
          canViewMap: true,
          canViewProfile: true,
          canCommunicate: false,
          canNavigate: true
        }
      });
    } catch (error) {
      console.error('Failed to update offline stats:', error);
    }
  }, [syncStatus.lastSyncTime]);

  const clearOfflineData = useCallback(async () => {
    try {
      await Promise.all([
        offlineDataManager.clearAllCache(),
        OfflineActionQueue.clearAllQueues()
      ]);
      await updateOfflineStats();
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      throw error;
    }
  }, [updateOfflineStats]);

  const clearExpiredCache = useCallback(async () => {
    try {
      const clearedCount = await offlineDataManager.clearExpiredCache();
      await updateOfflineStats();
      return clearedCount;
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
      throw error;
    }
  }, [updateOfflineStats]);

  const updateOfflineCapability = useCallback(async (
    capability: keyof OfflineCapabilities, 
    enabled: boolean
  ) => {
    try {
      const currentCapabilities = await offlineDataManager.getOfflineCapabilities();
      if (currentCapabilities) {
        const updatedCapabilities = {
          ...currentCapabilities,
          [capability]: enabled
        };
        await offlineDataManager.setOfflineCapabilities(updatedCapabilities);
        await updateOfflineStats();
      }
    } catch (error) {
      console.error('Failed to update offline capability:', error);
      throw error;
    }
  }, [updateOfflineStats]);

  const isFeatureAvailableOffline = useCallback((feature: keyof OfflineCapabilities): boolean => {
    if (!offlineStats) return false;
    return offlineStats.offlineCapabilities[feature];
  }, [offlineStats]);

  const getFormattedCacheSize = useCallback((): string => {
    if (!offlineStats) return '0 B';
    
    const bytes = offlineStats.cacheSize;
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, [offlineStats]);

  const getOfflineReadiness = useCallback(() => {
    if (!offlineStats) return 'unknown';
    
    const hasCache = offlineStats.cacheSize > 0;
    const hasPendingActions = offlineStats.pendingActions > 0;
    const hasFailedActions = offlineStats.failedActions > 0;
    
    if (hasFailedActions) return 'degraded';
    if (hasPendingActions) return 'syncing';
    if (hasCache) return 'ready';
    return 'limited';
  }, [offlineStats]);

  useEffect(() => {
    initializeOfflineCapabilities();
  }, [initializeOfflineCapabilities]);

  // update stats periodically and when network status changes
  useEffect(() => {
    if (isInitialized) {
      updateOfflineStats();
      
      const interval = setInterval(updateOfflineStats, 30000); 
      return () => clearInterval(interval);
    }
  }, [isInitialized, updateOfflineStats, isConnected, syncStatus]);

  return {
    isConnected,
    connectionQuality,
    syncStatus,
    isOfflineMode,
    
    offlineStats,
    isInitialized,
    
    toggleOfflineMode,
    forceSync,
    retryFailedActions,
    clearFailedActions,
    clearOfflineData,
    clearExpiredCache,
    updateOfflineCapability,
    
    isFeatureAvailableOffline,
    getFormattedCacheSize,
    getOfflineReadiness,
    
    isOffline: isConnected === false || isOfflineMode,
    hasInternetIssues: connectionQuality?.strength === 'poor' || isConnected === false,
    canSync: isConnected === true && !isOfflineMode,
    hasPendingChanges: (offlineStats?.pendingActions || 0) > 0,
    hasFailedChanges: (offlineStats?.failedActions || 0) > 0,
  };
};

// THIS for checking if current operation should be performed offline
export const useOfflineCheck = () => {
  const { isConnected, isOfflineMode } = useNetwork();
  
  const shouldUseOffline = useCallback((forceOffline = false): boolean => {
    return forceOffline || isConnected === false || isOfflineMode;
  }, [isConnected, isOfflineMode]);
  
  const shouldShowOfflineWarning = useCallback((): boolean => {
    return isConnected === false;
  }, [isConnected]);
  
  const canPerformAction = useCallback((requiresConnection = false): boolean => {
    if (requiresConnection) {
      return isConnected === true && !isOfflineMode;
    }
    return true; // can always perform offline-capable actions
  }, [isConnected, isOfflineMode]);
  
  return {
    shouldUseOffline,
    shouldShowOfflineWarning,
    canPerformAction,
    isOffline: shouldUseOffline(),
  };
};

export const useOfflinePreloader = () => {
  const { isConnected } = useNetwork();
  
  const preloadTripData = useCallback(async (tripId: number) => {
    if (!isConnected) return;
    
    try {
      const tripDetails = await tripService.getTripDetails(tripId);
      if (tripDetails) {
        await offlineDataManager.cacheCurrentTrip(tripDetails);
        console.log('Preloaded trip data for offline use:', tripId);
      }
    } catch (error) {
      console.error('Failed to preload trip data:', error);
    }
  }, [isConnected]);
  
  const preloadProfileData = useCallback(async (userId: string) => {
    if (!isConnected) return;
    
    try {
      const profile = await profileService.getProfile(userId);
      if (profile) {
        await offlineDataManager.cacheUserProfile(profile);
        console.log('Preloaded profile data for offline use:', userId);
      }
    } catch (error) {
      console.error('Failed to preload profile data:', error);
    }
  }, [isConnected]);
  
  const preloadMapData = useCallback(async (region: { lat: number; lng: number; radius: number }) => {
    if (!isConnected) return;
    
    try {
      // Map data preloading is not implemented in this version
      // This would typically involve caching map tiles or other map-related data
      console.log('Map data preloading is not implemented in this version:', region);
    } catch (error) {
      console.error('Failed to preload map data:', error);
    }
  }, [isConnected]);
  
  return {
    preloadTripData,
    preloadProfileData,
    preloadMapData,
  };
};
