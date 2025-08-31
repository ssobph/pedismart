import { AuthProvider, useAuth } from '@/contexts/AuthContext';
// import { LocationProvider } from '@/contexts/LocationContext';
import useCachedResources from '@/hooks/useCachedResources';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

const queryClient = new QueryClient();

function RootNavigator() {
  const segments = useSegments();
  const router = useRouter();
  const { session, profile, isLoading } = useAuth();
  const inAuthGroup = segments[0] === '(auth)';

  useEffect(() => {
    if (isLoading) return;

    if (!session && !inAuthGroup) {
      router.replace('/(auth)'); 
    } else if (session && profile && inAuthGroup) {
      if (profile.role === 'driver') {
        router.replace('/(app)/driver/(tabs)/map');
      } else {
        router.replace('/(app)/passenger/(tabs)/map');
      }
    }
  }, [session, profile, isLoading, inAuthGroup, segments, router]);

  return isLoading ? null : <Slot />;
}

export default function RootLayout() {
  const { appIsReady, onLayoutRootView } = useCachedResources();

  if (!appIsReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* <LocationProvider> */}
          <RootNavigator />
        {/* </LocationProvider> */}
      </AuthProvider>
    </QueryClientProvider>
  );
}
