import { Colors } from '@/constants/Colors';
import { radius, spacing } from '@/constants/StyleGuide';
import { useColorScheme } from '@/hooks/useColorScheme';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  const theme = useColorScheme() ?? 'light';
  const backgroundColor = Colors[theme].card;
  const borderColor = Colors[theme].border;

  return <View style={[{ backgroundColor, borderColor }, styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
});