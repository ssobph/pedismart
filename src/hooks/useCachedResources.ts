import { FontAwesome5 } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';

// PREVENT THE SPLASH SCREEN FROM AUTO-HIDING BEFORE ASSET LOADING IS COMPLETE.
SplashScreen.preventAutoHideAsync();

export default function useCachedResources() {
  const [appIsReady, setAppIsReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    ...FontAwesome5.font,
    'SpaceMono': require('../../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      if (fontError) {
        console.warn('An error occurred while loading fonts:', fontError);
      }
      setAppIsReady(true);
    }
  }, [fontsLoaded, fontError]);

  // CREATE A MEMOIZED CALLBACK TO HIDE THE SPLASH SCREEN.
  // TODO: THIS SHOULD BE PASSED TO THE `onLayout` PROP 
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  return { appIsReady, onLayoutRootView };
}
