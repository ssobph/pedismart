import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { Point } from 'geojson';

type Trip = Database['public']['Tables']['trips']['Row'];
type TripStatus = Database['public']['Enums']['trip_status'];

export const bookingService = {
  createRideRequest: async (
    passengerId: string,
    pickupLocation: Point,
    dropoffLocation: Point
  ): Promise<Trip> => {
    const { data, error } = await supabase.rpc('create_ride_request', {
      p_passenger_id: passengerId,
      p_pickup_location: pickupLocation,
      p_dropoff_location: dropoffLocation,
    });

    if (error) throw new Error(error.message);
    // RPC -> [], EXPECT a single new trip object
    if (!data || data.length === 0) throw new Error("Failed to create ride request.");
    return data[0] as Trip;
  },

  updateTripStatus: async (
    tripId: number,
    status: TripStatus,
    driverId?: string
  ): Promise<Trip> => {
    const updates: Partial<Trip> = { status };

    if (status === 'accepted' && driverId) updates.driver_id = driverId;
    if (status === 'in_progress') updates.started_at = new Date().toISOString();
    if (status === 'completed') updates.completed_at = new Date().toISOString();
    if (status === 'cancelled') updates.cancelled_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('trips')
      .update(updates)
      .eq('id', tripId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  submitRating: async (
    tripId: number,
    raterId: string,
    rateeId: string,
    rating: number,
    comment?: string
  ) => {
    const { data, error } = await supabase.from('ratings').insert({
      trip_id: tripId,
      rater_id: raterId,
      ratee_id: rateeId,
      rating,
      comment,
    });
    if (error) throw new Error(error.message);
    return data;
  },
};
