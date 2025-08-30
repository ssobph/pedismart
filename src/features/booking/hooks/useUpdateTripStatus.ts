import { useAuth } from '@/contexts/AuthContext';
import { bookingService } from '@/services/bookingService';
import { Database } from '@/types/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type TripStatus = Database['public']['Enums']['trip_status'];

// para ma-update ang status ng trip BUT we strictly use ENUM accept, start, complete, cancel
export function useUpdateTripStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ tripId, status }: { tripId: number, status: TripStatus }) => {
      // the driverId is automatically inferred from the authenticated user if they are accepting.
      const driverId = status === 'accepted' ? user?.id : undefined;
      return bookingService.updateTripStatus(tripId, status, driverId);
    },
    onSuccess: (updatedTrip) => {
      // INVALIDATE THE ENTIRE RIDE HISTORY LIST FOR BOTH USERS INVOLVED.
      queryClient.invalidateQueries({ queryKey: ['rideHistory', updatedTrip.passenger_id] });
      if (updatedTrip.driver_id) {
        queryClient.invalidateQueries({ queryKey: ['rideHistory', updatedTrip.driver_id] });
      }
    },
  });
}
