import { useNetwork } from '@/contexts/NetworkContext';
import { useOfflineQueue } from '@/hooks/useOfflineActions';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
  showDetails?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  position = 'top',
  showDetails = false 
}) => {
  const { isConnected, connectionQuality, syncStatus, isOfflineMode } = useNetwork();
  const { getQueueStatus } = useOfflineQueue();
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    const updateQueueStatus = async () => {
      const status = getQueueStatus();
      setQueueStatus(status);
    };

    updateQueueStatus();
    const interval = setInterval(updateQueueStatus, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, [getQueueStatus]);

  useEffect(() => {
    if (isConnected === false || isOfflineMode || (queueStatus && queueStatus.pendingCount > 0)) {
      // Show indicator
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      // Hide indicator
      Animated.spring(slideAnim, {
        toValue: -100,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [isConnected, isOfflineMode, queueStatus, slideAnim]);

  const getConnectionIcon = () => {
    if (isOfflineMode) return 'airplane';
    if (isConnected === false) return 'cloud-offline';
    if (connectionQuality?.strength === 'poor') return 'cellular';
    if (connectionQuality?.type === 'wifi') return 'wifi';
    return 'cellular';
  };

  const getConnectionColor = () => {
    if (isOfflineMode) return '#FF9500';
    if (isConnected === false) return '#FF3B30';
    if (connectionQuality?.strength === 'poor') return '#FF9500';
    return '#34C759';
  };

  const getStatusText = () => {
    if (isOfflineMode) return 'Offline Mode';
    if (isConnected === false) return 'No Connection';
    if (syncStatus.isActive) return 'Syncing...';
    if (queueStatus?.pendingCount > 0) return `${queueStatus.pendingCount} actions pending`;
    if (queueStatus?.failedCount > 0) return `${queueStatus.failedCount} actions failed`;
    return 'Connected';
  };

  const getStatusDescription = () => {
    if (isOfflineMode) return 'Working offline with cached data';
    if (isConnected === false) return 'Changes will sync when connection is restored';
    if (syncStatus.isActive) return 'Syncing pending changes...';
    if (queueStatus?.pendingCount > 0) return 'Waiting for connection to sync';
    if (queueStatus?.failedCount > 0) return 'Some actions failed to sync';
    return `Connected via ${connectionQuality?.type} - ${connectionQuality?.strength} signal`;
  };

  const containerStyle = [
    styles.container,
    position === 'bottom' ? styles.bottomPosition : styles.topPosition,
    { backgroundColor: getConnectionColor() }
  ];

  return (
    <Animated.View 
      style={[
        containerStyle,
        { 
          transform: [{ 
            translateY: position === 'bottom' ? 
              slideAnim.interpolate({
                inputRange: [-100, 0],
                outputRange: [100, 0],
              }) : 
              slideAnim 
          }] 
        }
      ]}
    >
      <View style={styles.content}>
        <Ionicons 
          name={getConnectionIcon() as any} 
          size={20} 
          color="white" 
          style={styles.icon} 
        />
        <View style={styles.textContainer}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
          {showDetails && (
            <Text style={styles.descriptionText}>{getStatusDescription()}</Text>
          )}
        </View>
        {syncStatus.isActive && (
          <Animated.View style={[styles.syncIcon, { 
            transform: [{ 
              rotate: '0deg' // You could add rotation animation here
            }] 
          }]}>
            <Ionicons name="sync" size={16} color="white" />
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
};

interface OfflineBannerProps {
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ onRetry, onDismiss }) => {
  const { isConnected, syncStatus, retryFailedActions } = useNetwork();
  const { getQueueStatus } = useOfflineQueue();
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateQueueStatus = async () => {
      const status = getQueueStatus();
      setQueueStatus(status);
    };

    updateQueueStatus();
    const interval = setInterval(updateQueueStatus, 3000);
    
    return () => clearInterval(interval);
  }, [getQueueStatus]);

  useEffect(() => {
    setVisible(
      isConnected === false || 
      (queueStatus && (queueStatus.pendingCount > 0 || queueStatus.failedCount > 0))
    );
  }, [isConnected, queueStatus]);

  const handleRetry = async () => {
    if (onRetry) {
      onRetry();
    } else {
      await retryFailedActions();
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.bannerContent}>
        <Ionicons 
          name={isConnected === false ? "cloud-offline" : "sync"} 
          size={24} 
          color="#FF9500" 
        />
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>
            {isConnected === false ? 'Working Offline' : 'Sync Required'}
          </Text>
          <Text style={styles.bannerSubtitle}>
            {isConnected === false 
              ? 'Changes will sync when connection is restored'
              : `${queueStatus?.pendingCount || 0} pending, ${queueStatus?.failedCount || 0} failed`
            }
          </Text>
        </View>
        {isConnected && queueStatus?.failedCount > 0 && (
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={handleRetry}
            disabled={syncStatus.isActive}
          >
            <Text style={styles.retryButtonText}>
              {syncStatus.isActive ? 'Syncing...' : 'Retry'}
            </Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Ionicons name="close" size={20} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

interface SyncStatusModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SyncStatusModal: React.FC<SyncStatusModalProps> = ({ visible, onClose }) => {
  const { syncStatus, retryFailedActions, clearFailedActions } = useNetwork();
  const { getQueueStatus } = useOfflineQueue();
  const [queueStatus, setQueueStatus] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      const updateQueueStatus = async () => {
        const status = getQueueStatus();
        setQueueStatus(status);
      };

      updateQueueStatus();
      const interval = setInterval(updateQueueStatus, 2000);
      
      return () => clearInterval(interval);
    }
  }, [visible, getQueueStatus]);

  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Sync Status</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#8E8E93" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.modalContent}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status:</Text>
            <Text style={[styles.statusValue, { 
              color: syncStatus.isActive ? '#FF9500' : '#34C759' 
            }]}>
              {syncStatus.isActive ? 'Syncing...' : 'Idle'}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Pending Actions:</Text>
            <Text style={styles.statusValue}>{queueStatus?.pendingCount || 0}</Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Failed Actions:</Text>
            <Text style={[styles.statusValue, { 
              color: queueStatus?.failedCount > 0 ? '#FF3B30' : '#8E8E93' 
            }]}>
              {queueStatus?.failedCount || 0}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Last Sync:</Text>
            <Text style={styles.statusValue}>
              {syncStatus.lastSyncTime 
                ? new Date(syncStatus.lastSyncTime).toLocaleTimeString()
                : 'Never'
              }
            </Text>
          </View>
          
          {syncStatus.errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{syncStatus.errorMessage}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.modalActions}>
          {queueStatus?.failedCount > 0 && (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.retryButton]}
                onPress={retryFailedActions}
                disabled={syncStatus.isActive}
              >
                <Text style={styles.actionButtonText}>Retry Failed</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.clearButton]}
                onPress={clearFailedActions}
              >
                <Text style={styles.actionButtonText}>Clear Failed</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topPosition: {
    top: 0,
    paddingTop: 60, // Account for status bar
  },
  bottomPosition: {
    bottom: 0,
    paddingBottom: 50, // Account for tab bar
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  icon: {
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  syncIcon: {
    marginLeft: 8,
  },
  banner: {
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 20,
    maxWidth: 400,
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  modalContent: {
    padding: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
