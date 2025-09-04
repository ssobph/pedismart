import { bookingService } from '@/services/bookingService';
import { useQuery } from '@tanstack/react-query';

export function useTripCapacity(tripId: number | null) {
  return useQuery({
    queryKey: ['tripCapacity', tripId],
    queryFn: async () => {
      if (!tripId) return null;
      return await bookingService.canAddMorePassengers(tripId);
    },
    enabled: !!tripId,
    refetchInterval: 5000, // Refresh every 5 seconds to get real-time updates
  });
}
