import { bookingService } from '@/services/bookingService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { Point } from 'geojson';

interface OfferRideParams {
  driverId: string;
  passengerId: string;
  pickupLocation: Point;
  dropoffLocation: Point;
}

export function useOfferRide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: OfferRideParams) => {
      return bookingService.createOfferedTrip(
        params.driverId,
        params.passengerId,
        params.pickupLocation,
        params.dropoffLocation
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['nearbyPassengers'] });
      
      Alert.alert(
        'Ride Offered',
        'Your ride offer has been sent to the passenger. You will be notified when they respond.',
        [{ text: 'OK' }]
      );
    },
    onError: (error: Error) => {
      console.error('Error offering ride:', error);
      Alert.alert(
        'Error',
        'Failed to send ride offer. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });
}
