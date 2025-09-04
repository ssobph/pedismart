import { useOfflineManager } from '@/hooks/useOfflineManager';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { OfflineGuard } from './OfflineComponents';
import { OfflineBanner, OfflineIndicator } from './OfflineIndicator';

interface OfflineAwareLayoutProps {
  children: React.ReactNode;
  showTopIndicator?: boolean;
  showBottomIndicator?: boolean;
  showBanner?: boolean;
  requiresConnection?: boolean;
  style?: any;
}

/**
 * A layout wrapper that provides offline awareness and indicators
 * This can be used to wrap pages or sections that need offline handling
 */
export const OfflineAwareLayout: React.FC<OfflineAwareLayoutProps> = ({
  children,
  showTopIndicator = true,
  showBottomIndicator = false,
  showBanner = true,
  requiresConnection = false,
  style
}) => {
  const { 
    isOffline, 
    hasPendingChanges, 
    hasFailedChanges,
    forceSync 
  } = useOfflineManager();

  const shouldShowIndicators = isOffline || hasPendingChanges || hasFailedChanges;

  return (
    <View style={[styles.container, style]}>
      {/* Top offline indicator */}
      {showTopIndicator && shouldShowIndicators && (
        <OfflineIndicator position="top" showDetails />
      )}
      
      {/* Banner for more prominent offline notifications */}
      {showBanner && (isOffline || hasFailedChanges) && (
        <OfflineBanner onRetry={forceSync} />
      )}
      
      {/* Main content with offline guard */}
      <View style={styles.content}>
        <OfflineGuard 
          requiresConnection={requiresConnection}
          onRetry={forceSync}
        >
          {children}
        </OfflineGuard>
      </View>
      
      {/* Bottom offline indicator */}
      {showBottomIndicator && shouldShowIndicators && (
        <OfflineIndicator position="bottom" />
      )}
    </View>
  );
};

/**
 * A simplified wrapper for components that should show offline status
 */
export const WithOfflineStatus: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <OfflineAwareLayout 
      showTopIndicator={true}
      showBanner={false}
      showBottomIndicator={false}
    >
      {children}
    </OfflineAwareLayout>
  );
};

/**
 * A wrapper for features that require internet connection
 */
export const OnlineOnly: React.FC<{ 
  children: React.ReactNode;
  fallbackMessage?: string;
}> = ({ children, fallbackMessage }) => {
  return (
    <OfflineAwareLayout 
      requiresConnection={true}
      showTopIndicator={true}
      showBanner={true}
    >
      <OfflineGuard 
        requiresConnection={true}
        message={fallbackMessage}
      >
        {children}
      </OfflineGuard>
    </OfflineAwareLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
  },
});
