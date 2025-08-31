import * as Location from 'expo-location';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface LocationContextValue {
  location: Location.LocationObject | null;
  errorMsg: string | null;
  permissionStatus: Location.PermissionStatus | null;
  requestLocationPermission: () => Promise<Location.PermissionStatus>;
}

const LocationContext = createContext<LocationContextValue>({
  location: null,
  errorMsg: null,
  permissionStatus: null,
  requestLocationPermission: async () => Location.PermissionStatus.UNDETERMINED,
});

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

  const requestPermissionAndFetchLocation = useCallback(async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(status);

    if (status !== Location.PermissionStatus.GRANTED) {
      setErrorMsg('Permission to access location was denied. The map functionality will be limited.');
      return status;
    }

    try {
      // fetch location with high accuracy for ride-hailing purposes
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);
      setErrorMsg(null); // clear previous errors
    } catch (error) {
      setErrorMsg('Could not fetch location. Please ensure GPS is enabled.');
      console.error('Error fetching location:', error);
    }
    return status;
  }, []);

  useEffect(() => {
    // automatically request permission and fetch location when the provider mounts.
    requestPermissionAndFetchLocation();
  }, []); // Remove the dependency to prevent infinite loops

  const value = {
    location,
    errorMsg,
    permissionStatus,
    requestLocationPermission: requestPermissionAndFetchLocation,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}