import { supabase } from '@/lib/supabase';
import { Point } from 'geojson';

export const locationService = {
  updateDriverLocation: async (driverId: string, location: Point): Promise<void> => {
    const { error } = await supabase
      .from('drivers')
      .update({ current_location: location })
      .eq('profile_id', driverId);
    if (error) throw new Error(error.message);
  },

  getNearbyDrivers: async (latitude: number, longitude: number, radiusInMeters: number) => {
    const { data, error } = await supabase.rpc('nearby_drivers', {
      lat: latitude,
      long: longitude,
      radius_meters: radiusInMeters,
    });
    if (error) throw new Error(error.message);
    return data;
  },
};
