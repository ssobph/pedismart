import { Colors } from '@/constants/Colors';
import { radius, spacing, typography } from '@/constants/StyleGuide';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'outline';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const theme = useColorScheme() ?? 'light';
  const isDisabled = isLoading || disabled;

  const buttonStyles: { [key in ButtonVariant]: ViewStyle } = {
    primary: { backgroundColor: Colors[theme].primary },
    secondary: { backgroundColor: Colors[theme].secondary },
    destructive: { backgroundColor: Colors[theme].error },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: Colors[theme].primary,
    },
  };

  const textStyles: { [key in ButtonVariant]: TextStyle } = {
    primary: { color: '#FFFFFF' },
    secondary: { color: '#FFFFFF' },
    destructive: { color: '#FFFFFF' },
    outline: { color: Colors[theme].primary },
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        buttonStyles[variant],
        (isDisabled || isLoading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}>
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? Colors[theme].primary : '#FFFFFF'} />
      ) : (
        <Text style={[styles.text, textStyles[variant]]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    ...typography.button,
  },
  disabled: {
    opacity: 0.6,
  },
});