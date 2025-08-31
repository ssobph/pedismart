import { ThemedView } from '@/components/ui/Themed';
import { ActivityIndicator } from 'react-native';

export default function AppEntry() {
  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </ThemedView>
  );
}