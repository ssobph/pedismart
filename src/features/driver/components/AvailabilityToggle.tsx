import { useDriverStatus } from '@/contexts/DriverStatusContext';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

interface AvailabilityToggleProps {
  variant?: 'default' | 'compact' | 'inline';
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

export function AvailabilityToggle({ 
  variant = 'default', 
  size = 'medium',
  showLabel = true,
  className
}: AvailabilityToggleProps) {
  const { isOnline, toggle } = useDriverStatus();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await toggle();
    } catch (error) {
      // Failed to toggle driver status
    } finally {
      setIsToggling(false);
    }
  };

  const getButtonStyles = (): ViewStyle[] => {
    const baseStyles: ViewStyle[] = [styles.button];
    
    // Size styles
    if (size === 'small') baseStyles.push(styles.buttonSmall);
    if (size === 'large') baseStyles.push(styles.buttonLarge);
    
    // Variant styles
    if (variant === 'compact') baseStyles.push(styles.buttonCompact);
    if (variant === 'inline') baseStyles.push(styles.buttonInline);
    
    // Status styles
    baseStyles.push(isOnline ? styles.buttonOnline : styles.buttonOffline);
    
    return baseStyles;
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 28;
      default: return 22;
    }
  };

  const getTextStyles = (): TextStyle[] => {
    const baseStyles: TextStyle[] = [styles.text];
    if (size === 'small') baseStyles.push(styles.textSmall);
    if (size === 'large') baseStyles.push(styles.textLarge);
    return baseStyles;
  };

  if (variant === 'inline') {
    return (
      <TouchableOpacity
        onPress={handleToggle}
        disabled={isToggling}
        style={styles.inlineContainer}
        activeOpacity={0.7}
      >
        <View style={[styles.inlineToggle, isOnline ? styles.inlineOnline : styles.inlineOffline]}>
          <View style={[styles.inlineSlider, isOnline ? styles.inlineSliderOnline : styles.inlineSliderOffline]} />
        </View>
        {showLabel && (
          <Text style={[styles.inlineLabel, isOnline ? styles.inlineLabelOnline : styles.inlineLabelOffline]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        )}
        {isToggling && <ActivityIndicator size="small" color={isOnline ? '#10b981' : '#6b7280'} style={styles.inlineLoader} />}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handleToggle}
      disabled={isToggling}
      style={getButtonStyles()}
      activeOpacity={0.8}
    >
      {isToggling ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <View style={styles.content}>
          <Ionicons
            name={isOnline ? 'checkmark-circle' : 'close-circle'}
            size={getIconSize()}
            color="white"
          />
          {showLabel && variant !== 'compact' && (
            <Text style={getTextStyles()}>
              {isOnline ? 'Online' : 'Go Online'}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 48,
  },
  buttonSmall: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  buttonLarge: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 56,
  },
  buttonCompact: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 50,
    minHeight: 44,
    minWidth: 44,
  },
  buttonInline: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 'auto' as any,
  },
  buttonOnline: {
    backgroundColor: '#10b981',
  },
  buttonOffline: {
    backgroundColor: '#6b7280',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 14,
  },
  textLarge: {
    fontSize: 18,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineToggle: {
    width: 48,
    height: 26,
    borderRadius: 13,
    padding: 2,
  },
  inlineOnline: {
    backgroundColor: '#10b981',
  },
  inlineOffline: {
    backgroundColor: '#d1d5db',
  },
  inlineSlider: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'white',
  },
  inlineSliderOnline: {
    transform: [{ translateX: 22 }],
  },
  inlineSliderOffline: {
    transform: [{ translateX: 0 }],
  },
  inlineLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  inlineLabelOnline: {
    color: '#10b981',
  },
  inlineLabelOffline: {
    color: '#6b7280',
  },
  inlineLoader: {
    marginLeft: 4,
  },
});
