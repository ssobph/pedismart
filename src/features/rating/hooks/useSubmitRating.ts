import { useAuth } from '@/contexts/AuthContext';
import { bookingService } from '@/services/bookingService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface SubmitRatingPayload {
  tripId: number;
  rateeId: string;
  rating: number;
  comment?: string;
}

// FOR SUBMITTING A RATING FOR A COMPLETED TRIP
export function useSubmitRating() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (payload: SubmitRatingPayload) => {
      if (!user?.id) throw new Error("User not authenticated");
      return bookingService.submitRating(
        payload.tripId,
        user.id, // RATER IS ALWAYS ANG PASAYRO
        payload.rateeId,
        payload.rating,
        payload.comment
      );
    },
    onSuccess: (_, variables) => {
      // AFTER MA-RATE, INVALIDATE ANG RIDE HISTORY PARA MAKITA ANG NEW RATING
      queryClient.invalidateQueries({ queryKey: ['rideHistory', user?.id] });
    },
  });
}
