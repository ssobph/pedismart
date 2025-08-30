import { useAuth } from '@/contexts/AuthContext';
import { bookingService } from '@/services/bookingService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Point } from 'geojson';

export function useCreateRideRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ pickup, dropoff }: { pickup: Point; dropoff: Point }) => {
      if (!user?.id) throw new Error("User not authenticated");
      return bookingService.createRideRequest(user.id, pickup, dropoff);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rideHistory', user?.id] });
    },
  });
}
