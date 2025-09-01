import { useAuth } from '@/contexts/AuthContext';
import { bookingService } from '@/services/bookingService';
import { useQuery } from '@tanstack/react-query';

export function useRideHistory() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['rideHistory', userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return bookingService.getRideHistory(userId);
    },
    enabled: !!userId,
  });
}
