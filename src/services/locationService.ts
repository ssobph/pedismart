import { supabase } from '@/lib/supabase';
import { PassengerSeekingRide } from '@/services/tripService';
import { Point } from 'geojson';

export const locationService = {
  updateDriverLocation: async (driverId: string, location: Point): Promise<void> => {
    try {
      const [lng, lat] = location.coordinates as [number, number];
  const { error } = await (supabase as any).rpc('update_driver_location', {
        p_driver_id: driverId,
        p_long: lng,
        p_lat: lat,
      });
      if (error) {
        console.error('[locationService] update_driver_location RPC error:', error);
        throw new Error(error.message);
      }
    } catch (e: any) {
      console.error('[locationService] Failed to update driver location:', e);
      throw e;
    }
  },

  getNearbyDrivers: async (latitude: number, longitude: number, radiusInMeters: number) => {
    try {
      console.log('[locationService] Calling nearby_drivers RPC with:', { latitude, longitude, radiusInMeters });
      
      const { data, error } = await supabase.rpc('nearby_drivers', {
        lat: latitude,
        long: longitude,
        radius_meters: radiusInMeters,
      });
      
      if (error) {
        console.error('[locationService] RPC error:', error);
        throw new Error(`Failed to fetch nearby drivers: ${error.message}`);
      }
      
      console.log('[locationService] RPC returned:', data?.length || 0, 'drivers');
      return data || [];
    } catch (error) {
      console.error('[locationService] Exception in getNearbyDrivers:', error);
      throw error;
    }
  },

  /**
   * uses the optimized PostGIS-based rpc
   * @deprecated tripService.getNearbyPassengersSeeking reminder for fallback
   */
  getNearbyPassengers: async (
    latitude: number, 
    longitude: number, 
    radiusInMeters: number
  ): Promise<PassengerSeekingRide[]> => {
    const { data, error } = await supabase.rpc('nearby_passengers', {
      lat: latitude,
      long: longitude,
      radius_meters: radiusInMeters,
    });
    
    if (error) throw new Error(error.message);
    
    return (data || []).map((passenger: any) => ({
      trip_id: passenger.trip_id,
      passenger_id: passenger.passenger_id,
      passenger_name: passenger.passenger_name,
      pickup_location: passenger.pickup_location,
      pickup_address: passenger.pickup_address,
      requested_at: passenger.requested_at,
      distance_meters: passenger.distance_meters,
    }));
  },
};
