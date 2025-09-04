import { useNetwork } from '@/contexts/NetworkContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface OfflineGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiresConnection?: boolean;
  showFallback?: boolean;
  message?: string;
  onRetry?: () => void;
}

/**
 * A guard component that conditionally renders content based on network status
 * and provides fallback UI for offline scenarios
 */
export const OfflineGuard: React.FC<OfflineGuardProps> = ({
  children,
  fallback,
  requiresConnection = false,
  showFallback = true,
  message = "This feature requires an internet connection",
  onRetry
}) => {
  const { isConnected, isOfflineMode, forceSync } = useNetwork();

  const isOffline = isConnected === false || isOfflineMode;

  // If connection is required and we're offline, show fallback
  if (requiresConnection && isOffline) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showFallback) {
      return null;
    }

    return (
      <View style={styles.fallbackContainer}>
        <View style={styles.fallbackContent}>
          <Ionicons 
            name="cloud-offline" 
            size={48} 
            color="#8E8E93" 
            style={styles.fallbackIcon}
          />
          <Text style={styles.fallbackTitle}>Offline</Text>
          <Text style={styles.fallbackMessage}>{message}</Text>
          {onRetry && isConnected && (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}
          {isConnected && (
            <TouchableOpacity style={styles.syncButton} onPress={forceSync}>
              <Text style={styles.syncButtonText}>Force Sync</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return <>{children}</>;
};

interface OfflineMessageProps {
  title?: string;
  message?: string;
  icon?: string;
  type?: 'info' | 'warning' | 'error';
  showSyncButton?: boolean;
  onSync?: () => void;
}

/**
 * A message component specifically designed for offline scenarios
 */
export const OfflineMessage: React.FC<OfflineMessageProps> = ({
  title = "Working Offline",
  message = "You're viewing cached data. Changes will sync when connection is restored.",
  icon = "cloud-offline",
  type = 'info',
  showSyncButton = false,
  onSync
}) => {
  const { forceSync, isConnected } = useNetwork();

  const getTypeColor = () => {
    switch (type) {
      case 'warning': return '#FF9500';
      case 'error': return '#FF3B30';
      default: return '#007AFF';
    }
  };

  const handleSync = () => {
    if (onSync) {
      onSync();
    } else {
      forceSync();
    }
  };

  return (
    <View style={[styles.messageContainer, { borderLeftColor: getTypeColor() }]}>
      <View style={styles.messageHeader}>
        <Ionicons 
          name={icon as any} 
          size={20} 
          color={getTypeColor()} 
          style={styles.messageIcon}
        />
        <Text style={[styles.messageTitle, { color: getTypeColor() }]}>
          {title}
        </Text>
      </View>
      <Text style={styles.messageText}>{message}</Text>
      {showSyncButton && isConnected && (
        <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
          <Text style={styles.syncButtonText}>Sync Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface ConnectionQualityIndicatorProps {
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Shows current connection quality with visual indicator
 */
export const ConnectionQualityIndicator: React.FC<ConnectionQualityIndicatorProps> = ({
  showText = false,
  size = 'medium'
}) => {
  const { connectionQuality, isConnected, isOfflineMode } = useNetwork();

  const getIconSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 24;
      default: return 20;
    }
  };

  const getIcon = () => {
    if (isOfflineMode) return 'airplane';
    if (!isConnected) return 'cloud-offline';
    if (connectionQuality?.type === 'wifi') return 'wifi';
    return 'cellular';
  };

  const getColor = () => {
    if (isOfflineMode) return '#FF9500';
    if (!isConnected) return '#FF3B30';
    
    switch (connectionQuality?.strength) {
      case 'excellent': return '#34C759';
      case 'good': return '#34C759';
      case 'fair': return '#FF9500';
      case 'poor': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getText = () => {
    if (isOfflineMode) return 'Offline Mode';
    if (!isConnected) return 'No Connection';
    if (connectionQuality) {
      return `${connectionQuality.type} - ${connectionQuality.strength}`;
    }
    return 'Unknown';
  };

  return (
    <View style={styles.qualityContainer}>
      <Ionicons 
        name={getIcon() as any} 
        size={getIconSize()} 
        color={getColor()} 
      />
      {showText && (
        <Text style={[styles.qualityText, { color: getColor() }]}>
          {getText()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F2F2F7',
  },
  fallbackContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  fallbackIcon: {
    marginBottom: 16,
  },
  fallbackTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  fallbackMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  syncButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  syncButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  messageContainer: {
    backgroundColor: 'white',
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageIcon: {
    marginRight: 8,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 12,
  },
  qualityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qualityText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
});
