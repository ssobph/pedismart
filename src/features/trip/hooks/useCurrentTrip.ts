import { useAuth } from '@/contexts/AuthContext';
import { tripService, TripWithDetails } from '@/services/tripService';
import { useQuery } from '@tanstack/react-query';

export function useCurrentTrip() {
  const { user } = useAuth();

  return useQuery<TripWithDetails | null>({
    queryKey: ['currentTrip', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      try {
        if (user.role === 'driver') {
          return await tripService.getActiveTrip(user.id);
        } else {
          return await tripService.getActivePassengerTrip(user.id);
        }
      } catch (error) {
        return null;
      }
    },
    enabled: !!user,
    refetchInterval: 5000,
  });
}
