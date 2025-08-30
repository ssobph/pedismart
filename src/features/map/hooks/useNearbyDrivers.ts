import { locationService } from '@/services/locationService';
import { useQuery } from '@tanstack/react-query';

// REMINDERS: maybe find a better way to do this

// FETCHING NEARBY DRIVERS WITHIN A GIVEN RADIUS FROM A CENTRAL POINT.
/**
 * fetching nearby drivers within a given radius from a central point.
 * The query automatically refetches data at a set interval to keep the map live.
 * @param location - AN OBJECT WITH `LATITUDE` AND `LONGITUDE`.
 * @param radiusInMeters - THE SEARCH RADIUS.
 */
export function useNearbyDrivers(
  location: { latitude: number; longitude: number } | null,
  radiusInMeters: number = 5000 // DEFAULT TO 5KM BUT ASK JASTINE FOR DEFAULT
) {
  return useQuery({
    queryKey: ['nearbyDrivers', location, radiusInMeters],
    queryFn: () => {
      if (!location) {
        throw new Error('Location is not available');
      }
      return locationService.getNearbyDrivers(
        location.latitude,
        location.longitude,
        radiusInMeters
      );
    },
    // EXECUTE ONLY IF LOCATION IS PROVIDED.
    enabled: !!location,
    // AUTOMATICALLY REFRESH EVERY 10 SECONDS TO KEEP THE DRIVER POSITIONS FRESH.
    refetchInterval: 10000, // TODO: 10 seconds BUT ask jastine
  });
}
