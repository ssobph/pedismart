import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ActivityIndicator, SafeAreaView } from 'react-native';
import { ThemedView } from '@/components/ui/Themed';

export default function AppLayout() {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (profile?.role === 'driver') {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="driver" />
        </Stack>
      </SafeAreaView>
    );
  }

  if (profile?.role === 'passenger') {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="passenger" />
        </Stack>
      </SafeAreaView>
    );
  }

  return <Redirect href="/(auth)/login" />;
}