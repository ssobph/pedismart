import { supabase } from '@/lib/supabase';
import { Database, Json } from '@/types/database.types';
import { Point } from 'geojson';

type Trip = Database['public']['Tables']['trips']['Row'];
type TripUpdate = Database['public']['Tables']['trips']['Update'];
type TripStatus = Database['public']['Enums']['trip_status'];

export const bookingService = {
  createRideRequest: async (
    passengerId: string,
    pickupLocation: Point,
    dropoffLocation: Point
  ): Promise<Trip> => {
    const { data, error } = await supabase.rpc('create_ride_request', {
      p_passenger_id: passengerId,
      p_pickup_location: pickupLocation as unknown as Json,
      p_dropoff_location: dropoffLocation as unknown as Json,
    });

    if (error) throw new Error(error.message);
    // RPC -> [], EXPECT a single new trip object
    if (!data || data.length === 0) throw new Error('Failed to create ride request.');
    return data[0] as Trip;
  },

  updateTripStatus: async (
    tripId: number,
    status: TripStatus,
    driverId?: string
  ): Promise<Trip> => {
    const updates: TripUpdate = { status };

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

  getRideHistory: async (userId: string) => {
    const { data, error } = await supabase
      .from('trips')
      .select(
        `
        *,
        passenger:profiles!trips_passenger_id_fkey(*),
        driver:drivers!trips_driver_id_fkey(
          profile:profiles(*)
        ),
        trip_waypoints(*)
      `
      )
      .or(`passenger_id.eq.${userId},driver_id.eq.${userId}`)
      .order('requested_at', { ascending: false });

    if (error) throw new Error(error.message);

    return data.map((trip) => ({
      ...trip,
      driver: trip.driver?.profile,
    }));
  },

  // offered trip (driver initiates ride offer to passenger)
  createOfferedTrip: async (
    driverId: string,
    passengerId: string,
    pickupLocation: Point,
    dropoffLocation: Point
  ): Promise<Trip> => {
    // create the trip with 'offered' status
    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .insert({
        driver_id: driverId,
        passenger_id: passengerId,
        status: 'offered' as TripStatus,
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (tripError) throw new Error(tripError.message);

    // create the waypoints
    const { error: waypointError } = await supabase
      .from('trip_waypoints')
      .insert([
        {
          trip_id: tripData.id,
          passenger_id: passengerId,
          type: 'pickup' as const,
          location: pickupLocation as unknown as Json,
          sequence_order: 1,
        },
        {
          trip_id: tripData.id,
          passenger_id: passengerId,
          type: 'dropoff' as const,
          location: dropoffLocation as unknown as Json,
          sequence_order: 2,
        },
      ]);

    if (waypointError) {
      await supabase.from('trips').delete().eq('id', tripData.id);
      throw new Error(waypointError.message);
    }

    return tripData;
  },

  // respond to a ride offer (passenger accepts or declines)
  respondToOffer: async ({
    tripId,
    action,
  }: {
    tripId: number;
    action: 'accept' | 'decline';
  }): Promise<Trip> => {
    const updates: TripUpdate = {};

    if (action === 'accept') {
      updates.status = 'accepted' as TripStatus;
      updates.accepted_at = new Date().toISOString();
    } else if (action === 'decline') {
      updates.status = 'declined' as TripStatus;
      updates.cancelled_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('trips')
      .update(updates)
      .eq('id', tripId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // add passenger to an existing active trip (multi-passenger support)
  addPassengerToActiveTrip: async (
    tripId: number,
    passengerId: string,
    pickupLocation: Point,
    dropoffLocation: Point
  ): Promise<void> => {
    // add the passenger to the trip_passengers table
    const { error: passengerError } = await supabase
      .from('trip_passengers')
      .insert({
        trip_id: tripId,
        passenger_id: passengerId,
        status: 'pending',
      });

    if (passengerError) throw new Error(passengerError.message);

    // get current waypoints to determine order_index for new waypoints
    const { data: existingWaypoints, error: waypointsError } = await supabase
      .from('trip_waypoints')
      .select('order_index')
      .eq('trip_id', tripId)
      .order('order_index', { ascending: false })
      .limit(1);

    if (waypointsError) throw new Error(waypointsError.message);

    const nextOrderIndex = existingWaypoints?.[0]?.order_index
      ? existingWaypoints[0].order_index + 1
      : 1;

    // add pickup and dropoff waypoints for the new passenger
    const { error: waypointInsertError } = await supabase
      .from('trip_waypoints')
      .insert([
        {
          trip_id: tripId,
          passenger_id: passengerId,
          type: 'pickup',
          kind: 'pickup',
          location: pickupLocation as unknown as Json,
          order_index: nextOrderIndex,
          sequence_order: nextOrderIndex,
        },
        {
          trip_id: tripId,
          passenger_id: passengerId,
          type: 'dropoff',
          kind: 'dropoff',
          location: dropoffLocation as unknown as Json,
          order_index: nextOrderIndex + 1,
          sequence_order: nextOrderIndex + 1,
        },
      ]);

    if (waypointInsertError) {
      // rollback passenger insertion if waypoint creation fails
      await supabase
        .from('trip_passengers')
        .delete()
        .eq('trip_id', tripId)
        .eq('passenger_id', passengerId);
      throw new Error(waypointInsertError.message);
    }
  },

  // update waypoints after route optimization
  resequenceWaypoints: async (
    tripId: number,
    newOrder: number[]
  ): Promise<void> => {
    // update waypoints with new order_index based on optimized route
    const updates = newOrder.map((waypointId, index) => ({
      id: waypointId,
      order_index: index + 1,
    }));

    // batch update waypoints
    for (const update of updates) {
      const { error } = await supabase
        .from('trip_waypoints')
        .update({ order_index: update.order_index })
        .eq('id', update.id);

      if (error) throw new Error(error.message);
    }
  },

  // picked up, dropped off, cancelled
  updatePassengerStatus: async (
    tripId: number,
    passengerId: string,
    status: 'pending' | 'picked_up' | 'dropped_off' | 'cancelled'
  ): Promise<void> => {
    const { error } = await supabase
      .from('trip_passengers')
      .update({ status })
      .eq('trip_id', tripId)
      .eq('passenger_id', passengerId);

    if (error) throw new Error(error.message);
  },

  completeWaypoint: async (
    waypointId: number,
    passengerId?: string
  ): Promise<void> => {
    const { data: waypoint, error: waypointError } = await supabase
      .from('trip_waypoints')
      .select('*')
      .eq('id', waypointId)
      .single();

    if (waypointError) throw new Error(waypointError.message);

    if (waypoint.passenger_id) {
      const newStatus = waypoint.kind === 'pickup' ? 'picked_up' : 'dropped_off';
      await bookingService.updatePassengerStatus(
        waypoint.trip_id,
        waypoint.passenger_id,
        newStatus as any
      );
    }

    // REMIDNER: could delete the waypoint or mark it as completed
    // could add a 'completed' field
  },

  getTripWithPassengers: async (tripId: number) => {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        trip_passengers (
          *,
          profiles!trip_passengers_passenger_id_fkey (
            full_name
          )
        ),
        trip_waypoints (
          *
        )
      `)
      .eq('id', tripId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  getActiveTripWithPassengers: async (driverId: string) => {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        trip_passengers (
          id,
          passenger_id,
          status,
          inserted_at,
          profiles!trip_passengers_passenger_id_fkey (
            full_name,
            avatar_url
          )
        ),
        trip_waypoints (
          id,
          passenger_id,
          type,
          kind,
          location,
          address,
          order_index,
          sequence_order,
          status
        )
      `)
      .eq('driver_id', driverId)
      .in('status', ['accepted', 'in_progress'])
      .order('accepted_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return data || null;
  },

  getRemainingWaypoints: async (tripId: number): Promise<any[]> => {
    const { data, error } = await supabase
      .from('trip_waypoints')
      .select(`
        id,
        passenger_id,
        type,
        kind,
        location,
        address,
        order_index,
        sequence_order,
        status,
        profiles!trip_waypoints_passenger_id_fkey (
          full_name
        )
      `)
      .eq('trip_id', tripId)
      .or('status.is.null,status.eq.pending')
      .order('order_index', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // mark multiple waypoints as completed in order
  completeWaypointsBatch: async (waypointIds: number[]): Promise<void> => {
    const { error } = await supabase
      .from('trip_waypoints')
      .update({ status: 'completed' })
      .in('id', waypointIds);

    if (error) throw new Error(error.message);
  },
};
