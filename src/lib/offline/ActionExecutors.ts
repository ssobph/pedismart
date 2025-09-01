// this file will map action types to their respective service functions.
// as we build out the mutation hooks, we will import the actual service functions here.

// TODO: replace @bookingService
const bookingService = {
  endTrip: async (payload: any) => console.log('Simulating endTrip:', payload),
  updateTripStatus: async (payload: any) => console.log('Simulating updateTripStatus:', payload),
};

const ratingService = {
  submitRating: async (payload: any) => console.log('Simulating submitRating:', payload),
};

export const ActionExecutors = {
  'trip.end': bookingService.endTrip,
  'trip.updateStatus': bookingService.updateTripStatus,
  'rating.submit': ratingService.submitRating,
};