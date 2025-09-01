import { FontAwesome5 } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface LocationInputFieldProps {
  label: string;
  value?: string;
  placeholder?: string;
  icon?: string;
  iconColor?: string;
  onPress?: () => void;
  disabled?: boolean;
}

export function LocationInputField({
  label,
  value,
  placeholder,
  icon = 'map-marker-alt',
  iconColor = '#4A90E2',
  onPress,
  disabled = false,
}: LocationInputFieldProps) {
  const displayText = value || placeholder;
  const isPlaceholder = !value && placeholder;

  return (
    <TouchableOpacity 
      style={[styles.container, disabled && styles.disabled]} 
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.iconContainer}>
        <FontAwesome5 name={icon} size={12} color={iconColor} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text 
          style={[
            styles.value, 
            isPlaceholder && styles.placeholder
          ]} 
          numberOfLines={1}
        >
          {displayText}
        </Text>
      </View>
      {onPress && !disabled && (
        <View style={styles.chevronContainer}>
          <FontAwesome5 name="chevron-right" size={12} color="#BDC3C7" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  disabled: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  placeholder: {
    color: '#BDC3C7',
  },
  chevronContainer: {
    marginLeft: 8,
  },
});
