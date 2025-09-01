import { locationService } from '@/services/locationService';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook for drivers to fetch nearby passengers who are seeking rides.
 * Auto-refreshes every 15 seconds to keep the data fresh.
 * @param location - Driver's current location with latitude and longitude
 * @param radiusInMeters - Search radius (default 5km)
 */
export function useNearbyPassengers(
  location: { latitude: number; longitude: number } | null,
  radiusInMeters: number = 5000
) {
  return useQuery({
    queryKey: ['nearbyPassengers', location, radiusInMeters],
    queryFn: () => {
      if (!location) {
        throw new Error('Driver location is not available');
      }
      // Use optimized locationService method with PostGIS RPC
      return locationService.getNearbyPassengers(
        location.latitude,
        location.longitude,
        radiusInMeters
      );
    },
    // Only execute if location is available
    enabled: !!location,
    // Automatically refresh every 15 seconds to show new passenger requests
    refetchInterval: 15000,
    // Keep previous data while fetching new data
    placeholderData: (previousData) => previousData,
  });
}
