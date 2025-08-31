import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ActivityIndicator } from 'react-native';
import { ThemedView } from '@/components/ui/Themed';

export default function AppLayout() {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (profile?.role === 'driver') {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="driver" />
      </Stack>
    );
  }

  if (profile?.role === 'passenger') {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="passenger" />
      </Stack>
    );
  }

  return <Redirect href="/(auth)/login" />;
}