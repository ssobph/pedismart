import { useEffect, useRef, useState } from 'react';
import { tripService, RideRequest } from '@/services/tripService';

interface UseRideRequestsSubscriptionParams {
  enabled: boolean;
  driverLocation?: { latitude: number; longitude: number } | null;
  radiusMeters?: number;
  onRideRequest: (request: RideRequest) => void;
}

interface UseRideRequestsSubscriptionResult {
  isActive: boolean;
  start: () => void;
  stop: () => void;
}

export function useRideRequestsSubscription(
  params: UseRideRequestsSubscriptionParams
): UseRideRequestsSubscriptionResult {
  const { enabled, driverLocation, radiusMeters = 5000, onRideRequest } = params;
  const unsubscribeRef = useRef<null | (() => void)>(null);
  const [isActive, setIsActive] = useState(false);
  const processedIdsRef = useRef<Set<number>>(new Set());

  const start = () => {
    if (!driverLocation || unsubscribeRef.current) return;
    unsubscribeRef.current = tripService.subscribeToRideRequestsRealtime(
      { latitude: driverLocation.latitude, longitude: driverLocation.longitude },
      radiusMeters,
      (request) => {
        if (processedIdsRef.current.has(request.trip_id)) return;
        processedIdsRef.current.add(request.trip_id);
        onRideRequest(request);
      }
    );
    setIsActive(true);
  };

  const stop = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setIsActive(false);
  };

  useEffect(() => {
    if (enabled && driverLocation) {
      start();
      return () => stop();
    } else {
      stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, driverLocation?.latitude, driverLocation?.longitude, radiusMeters]);

  useEffect(() => () => stop(), []);

  return { isActive, start, stop };
}
