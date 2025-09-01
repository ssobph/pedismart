export * from './database.types';
export * from './supabase';

import type { Database } from './supabase';

export type DriverProfile = Database['public']['Tables']['profiles']['Row'] &
  Partial<Database['public']['Tables']['drivers']['Row']>;

export type TripWithDetails = Omit<Database['public']['Tables']['trips']['Row'], 'passenger_id' | 'driver_id'> & {
  passenger: Database['public']['Tables']['profiles']['Row'] | null;
  driver: Database['public']['Tables']['profiles']['Row'] | null;
  trip_waypoints: Database['public']['Tables']['trip_waypoints']['Row'][];
};