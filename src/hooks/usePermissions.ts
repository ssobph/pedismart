import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

type PermissionHookStatus = 'idle' | 'checking' | 'granted' | 'denied';

/**
 * A reusable hook to manage device location permissions.
 * It provides the current status and a function to request permission.
 * @returns An object with the location permission status and a request function.
 */
export function usePermissions() {
  const [status, setStatus] = useState<PermissionHookStatus>('idle');

  // check the current permission status when the hook is first used.
  useEffect(() => {
    const checkCurrentStatus = async () => {
      setStatus('checking');
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      if (currentStatus === Location.PermissionStatus.GRANTED) {
        setStatus('granted');
      } else {
        setStatus('denied');
      }
    };

    checkCurrentStatus();
  }, []);

  /**
   * A memoized function to request foreground location permission from the user.
   * Updates the hook's status based on the user's response.
   */
  const requestLocationPermission = useCallback(async () => {
    const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
    if (newStatus === Location.PermissionStatus.GRANTED) {
      setStatus('granted');
    } else {
      setStatus('denied');
    }
    return newStatus;
  }, []);

  return { status, requestLocationPermission };
}
