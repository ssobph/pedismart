import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { RealtimeChannel } from '@supabase/supabase-js';

type Trip = Database['public']['Tables']['trips']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export interface PassengerSeekingRide {
  trip_id: number;
  passenger_id: string;
  passenger_name: string;
  pickup_location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  pickup_address: string | null;
  requested_at: string;
  distance_meters?: number;
}

// Enhanced waypoint interface with multi-passenger support
export interface EnhancedWaypoint {
  id: number;
  passenger_id: string;
  type: 'pickup' | 'dropoff';
  location: unknown;
  address: string | null;
  sequence_order: number;
  status: 'pending' | 'completed';
  trip_id: number;
  completed_at: string | null;
  kind?: 'pickup' | 'dropoff';
  order_index?: number;
  profiles?: { full_name: string };
}

// Trip passenger status interface
export interface TripPassengerStatus {
  id: number;
  passenger_id: string;
  status: 'pending' | 'picked_up' | 'dropped_off' | 'cancelled';
  inserted_at: string;
  passenger_name?: string;
}

// Enhanced trip details with multi-passenger support
export interface TripWithDetails extends Trip {
  profiles?: Profile;
  trip_waypoints?: EnhancedWaypoint[];
  trip_passengers?: TripPassengerStatus[];
  passengers?: TripPassengerStatus[]; // Alias for convenience
}

export interface RideRequest {
  trip_id: number;
  passenger_id: string;
  passenger_name: string;
  pickup_location: {
    type: string;
    coordinates: [number, number];
  };
  pickup_address: string | null;
  dropoff_location?: {
    type: string;
    coordinates: [number, number];
  };
  dropoff_address?: string | null;
  estimated_pickup_time?: number; // in minutes
  estimated_trip_duration?: number; // in minutes
  distance_to_pickup?: number; // in meters
  total_distance?: number; // in meters
  requested_at: string;
  distance_meters?: number;
}

export const tripService = {
  getNearbyPassengersSeeking: async (
    driverLat: number,
    driverLong: number,
    radiusInMeters: number = 5000
  ): Promise<PassengerSeekingRide[]> => {
    // Get trips with 'requested' status and their pickup waypoints
    const { data, error } = await supabase
      .from('trips')
      .select(`
        id,
        passenger_id,
        requested_at,
        profiles!trips_passenger_id_fkey (
          full_name
        ),
        trip_waypoints!inner (
          location,
          address,
          type
        )
      `)
      .eq('status', 'requested')
      .eq('trip_waypoints.type', 'pickup')
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching passenger requests:', error);
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform and filter by distance
    const passengersWithDistance = data.map((trip: any) => {
      const waypoint = Array.isArray(trip.trip_waypoints) 
        ? trip.trip_waypoints[0] 
        : trip.trip_waypoints;
      
      const profile = Array.isArray(trip.profiles) 
        ? trip.profiles[0] 
        : trip.profiles;

      // Calculate distance (approximate - for actual use, should use PostGIS ST_Distance)
      const location = waypoint?.location;
      if (!location || !location.coordinates) return null;

      const [passengerLong, passengerLat] = location.coordinates;
      const distance = calculateDistance(
        driverLat,
        driverLong,
        passengerLat,
        passengerLong
      );

      if (distance > radiusInMeters) return null;

      return {
        trip_id: trip.id,
        passenger_id: trip.passenger_id,
        passenger_name: profile?.full_name || 'Unknown Passenger',
        pickup_location: location,
        pickup_address: waypoint?.address,
        requested_at: trip.requested_at,
        distance_meters: distance,
      };
    }).filter(Boolean) as PassengerSeekingRide[];

    return passengersWithDistance;
  },

  // Reject a ride request
  rejectTrip: async (tripId: number, driverId: string): Promise<void> => {
    // Log the rejection (could be useful for analytics)
    console.log(`Driver ${driverId} rejected trip ${tripId}`);
    // In a real app, you might want to track rejections in a separate table
  },

  // Get active trip for driver
  getActiveTrip: async (driverId: string): Promise<TripWithDetails | null> => {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        profiles!trips_passenger_id_fkey (
          *
        ),
        trip_waypoints (
          *
        )
      `)
      .eq('driver_id', driverId)
      .in('status', ['accepted', 'in_progress'])
      .order('accepted_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching active trip:', error);
      throw new Error(error.message);
    }

    return data as TripWithDetails | null;
  },

  // Get active trip for passenger
  getActivePassengerTrip: async (passengerId: string): Promise<TripWithDetails | null> => {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        profiles!trips_passenger_id_fkey (
          *
        ),
        trip_waypoints (
          *
        )
      `)
      .eq('passenger_id', passengerId)
      .in('status', ['requested', 'accepted', 'in_progress'])
      .order('requested_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching active passenger trip:', error);
      return null;
    }

    return data as TripWithDetails | null;
  },

  // Get trip details with waypoints
  getTripDetails: async (tripId: number): Promise<TripWithDetails | null> => {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        profiles!trips_passenger_id_fkey (
          *
        ),
        trip_waypoints (
          *
        )
      `)
      .eq('id', tripId)
      .single();

    if (error) {
      console.error('Error fetching trip details:', error);
      throw new Error(error.message);
    }

    return data as TripWithDetails;
  },

  // Get nearby requests using RPC (for initial load and validation)
  getNearbyRequestsRPC: async (
    driverLocation: { latitude: number; longitude: number },
    radiusInMeters: number,
    since?: Date
  ): Promise<any[]> => {
    const { data, error } = await supabase.rpc('get_nearby_requests', {
      driver_lat: driverLocation.latitude,
      driver_lng: driverLocation.longitude,
      radius_m: radiusInMeters,
      since: since?.toISOString(),
    });

    if (error) {
      console.error('Error fetching nearby requests:', error);
      throw new Error(error.message);
    }

    return data || [];
  },

  // Real-time subscription for ride requests (WebSocket-based)
  subscribeToRideRequestsRealtime: (
    driverLocation: { latitude: number; longitude: number },
    radiusInMeters: number,
    onRideRequest: (request: RideRequest) => void
  ): (() => void) => {
    let channel: RealtimeChannel | null = null;
    const processedRequestIds = new Set<number>();
    
    // Performance tracking
    const performanceMarkers: Record<number, number> = {};

    const setupSubscription = async () => {
      try {
        // Initial fetch of recent requests
        const recentRequests = await tripService.getNearbyRequestsRPC(
          driverLocation,
          radiusInMeters,
          new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        );

        // Process any recent requests that haven't been seen
        for (const trip of recentRequests) {
          if (!processedRequestIds.has(trip.id)) {
            processedRequestIds.add(trip.id);
            await processRideRequest(trip);
          }
        }

        // Set up real-time subscription
        channel = supabase
          .channel(`ride-requests-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'trips',
              filter: 'status=eq.requested',
            },
            async (payload) => {
              const startTime = Date.now();
              console.log('[Realtime] New ride request received:', payload.new.id);
              
              const trip = payload.new as any;
              performanceMarkers[trip.id] = startTime;
              
              // We need to get the pickup location from waypoints
              // For now, skip distance validation in realtime and rely on the initial RPC fetch
              // In production, you'd want to fetch the waypoint data here
              const shouldProcess = !processedRequestIds.has(trip.id);

              if (shouldProcess) {
                processedRequestIds.add(trip.id);
                // Fetch full details including waypoints
                const fullTrip = await tripService.getTripDetails(trip.id);
                if (fullTrip && fullTrip.trip_waypoints) {
                  const pickupWaypoint = fullTrip.trip_waypoints.find(w => w.type === 'pickup');
                  if (pickupWaypoint && pickupWaypoint.location) {
                    const coords = pickupWaypoint.location as any;
                    const distance = calculateDistance(
                      driverLocation.latitude,
                      driverLocation.longitude,
                      coords.coordinates[1],
                      coords.coordinates[0]
                    );
                    
                    if (distance <= radiusInMeters) {
                      await processRideRequest(fullTrip);
                      
                      // Log performance metrics
                      const endTime = Date.now();
                      const latency = endTime - startTime;
                      console.log(`[Performance] Request ${trip.id} processed in ${latency}ms`);
                    }
                  }
                }
              }
            }
          )
          .subscribe((status) => {
            console.log('[Realtime] Subscription status:', status);
          });
      } catch (error) {
        console.error('[Realtime] Error setting up subscription:', error);
      }
    };

    const processRideRequest = async (trip: TripWithDetails) => {
      try {
        const pickupWaypoint = trip.trip_waypoints?.find(w => w.type === 'pickup');
        const dropoffWaypoint = trip.trip_waypoints?.find(w => w.type === 'dropoff');
        
        if (pickupWaypoint && pickupWaypoint.location) {
          const pickupCoords = pickupWaypoint.location as any;
          const distance = calculateDistance(
            driverLocation.latitude,
            driverLocation.longitude,
            pickupCoords.coordinates[1],
            pickupCoords.coordinates[0]
          );
          
          const rideRequest: RideRequest = {
            trip_id: trip.id,
            passenger_id: trip.passenger_id || '',
            passenger_name: trip.profiles?.full_name || 'Unknown Passenger',
            pickup_location: pickupWaypoint.location as any,
            pickup_address: pickupWaypoint.address || null,
            dropoff_location: dropoffWaypoint?.location as any,
            dropoff_address: dropoffWaypoint?.address || null,
            requested_at: trip.requested_at,
            distance_meters: distance,
            estimated_pickup_time: Math.ceil(distance / 500), // 500m/min estimate
            estimated_trip_duration: 15, // Default estimate
            distance_to_pickup: distance,
          };
          
          onRideRequest(rideRequest);
        }
      } catch (error) {
        console.error('[Realtime] Error processing ride request:', error);
      }
    };

    // Start the subscription
    setupSubscription();

    // Return unsubscribe function
    return () => {
      console.log('[Realtime] Unsubscribing from ride requests');
      if (channel) {
        channel.unsubscribe();
      }
      processedRequestIds.clear();
    };
  },

  // DEPRECATED: Old polling-based subscription (kept for fallback)
  /** @deprecated Use subscribeToRideRequestsRealtime instead for better performance */
  subscribeToRideRequests: (
    driverLocation: { latitude: number; longitude: number },
    radiusInMeters: number,
    onRideRequest: (request: RideRequest) => void
  ) => {
    // For now, we'll use polling. In production, use WebSocket/real-time subscriptions
    const intervalId = setInterval(async () => {
      try {
        const requests = await tripService.getNearbyPassengersSeeking(
          driverLocation.latitude,
          driverLocation.longitude,
          radiusInMeters
        );

        if (requests.length > 0) {
          // Get the most recent request
          const latestRequest = requests[0];
          
          // Get additional trip details
          const tripDetails = await tripService.getTripDetails(latestRequest.trip_id);
          
          if (tripDetails) {
            const dropoffWaypoint = tripDetails.trip_waypoints?.find(w => w.type === 'dropoff');
            
            const rideRequest: RideRequest = {
              ...latestRequest,
              dropoff_location: dropoffWaypoint?.location as any,
              dropoff_address: dropoffWaypoint?.address || null,
              estimated_pickup_time: Math.ceil((latestRequest.distance_meters || 0) / 500), // Rough estimate: 500m/min
              estimated_trip_duration: 15, // Default estimate
              distance_to_pickup: latestRequest.distance_meters,
            };
            
            onRideRequest(rideRequest);
          }
        }
      } catch (error) {
        console.error('Error checking for ride requests:', error);
      }
    }, 10000); // Check every 10 seconds

    // Return unsubscribe function
    return () => clearInterval(intervalId);
  },
};

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}
