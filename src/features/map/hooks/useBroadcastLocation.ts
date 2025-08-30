import { locationService } from '@/services/locationService';
import { useMutation } from '@tanstack/react-query';
import { Point } from 'geojson';

// FOR BROADCASTING A DRIVER'S LOCATION TO THE BACKEND
// NOTE: this is a "fire-and-forget" mutation, this is used in background effect.
export function useBroadcastLocation() {
  return useMutation({
    mutationFn: ({ driverId, location }: { driverId: string, location: Point }) => {
      return locationService.updateDriverLocation(driverId, location);
    },
    onError: (error) => {
      // SIMPLY LOG THE ERRORS, AS THIS IS A BACKGROUND TASK AND WE DONT'T
      // WANT TO INTERRUPT THE DRIVER WITH FREQUENT ERROR MESSAGES.
      console.warn("Failed to broadcast location:", error.message);
    }
  });
}
