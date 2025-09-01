import { ProfileSetupModal } from '@/components/ProfileSetupModal';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import useCachedResources from '@/hooks/useCachedResources';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const queryClient = new QueryClient();

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      const queryKey = query.queryKey as string[];
      return ['profile', 'rideHistory', 'activeTrip'].includes(queryKey[0]);
    },
  },
});

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

  return (
    <>
      <Slot />
      <ProfileSetupModal
        visible={!!session && needsProfileSetup && !isLoading}
        onComplete={() => {
          // when profile is set up, refetch queries that depend on it.
          queryClient.invalidateQueries({ queryKey: ['profile'] });
          queryClient.invalidateQueries({ queryKey: ['activeTrip'] });
        }}
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
      <SafeAreaView onLayout={onLayoutRootView} style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NetworkProvider>
              <LocationProvider>
                <RootNavigator />
              </LocationProvider>
            </NetworkProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaView>
  );
}
