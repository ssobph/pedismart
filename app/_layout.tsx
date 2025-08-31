import { ProfileSetupModal } from '@/components/ProfileSetupModal';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LocationProvider } from '@/contexts/LocationContext';
import useCachedResources from '@/hooks/useCachedResources';
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AppState, View } from 'react-native';

const queryClient = new QueryClient();

// Tells Supabase Auth to continuously refresh the session automatically if
// the app is in the foreground. When this is added, you will continue to receive
// `onAuthStateChange` events with the `TOKEN_REFRESHED` or `SIGNED_OUT` event
// if the user's session is terminated. This should only be registered once.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

function RootNavigator() {
  const segments = useSegments();
  const router = useRouter();
  const { session, profile, isLoading, needsProfileSetup } = useAuth();
  const inAuthGroup = segments[0] === '(auth)';

  useEffect(() => {
    if (isLoading) return;

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && profile && !needsProfileSetup && inAuthGroup) {
      if (profile.role === 'driver') {
        router.replace('/(main)/driver/(tabs)/map');
      } else {
        router.replace('/(main)/passenger/(tabs)/map');
      }
    }
  }, [session, profile, isLoading, needsProfileSetup, inAuthGroup, segments, router]);

  const handleProfileSetupComplete = () => {};

  return (
    <>
      <Slot />
      <ProfileSetupModal
        visible={!!session && needsProfileSetup && !isLoading}
        onComplete={handleProfileSetupComplete}
      />
    </>
  );
}

export default function RootLayout() {
  const { appIsReady, onLayoutRootView } = useCachedResources();

  if (!appIsReady) {
    return null;
  }

  return (
    <View onLayout={onLayoutRootView} style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LocationProvider>
            <RootNavigator />
          </LocationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </View>
  );
}
