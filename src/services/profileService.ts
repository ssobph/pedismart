import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type DriverData = Database['public']['Tables']['drivers']['Row'];
type DriverProfile = Profile & DriverData;

export const profileService = {
  getProfile: async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  getDriverProfile: async (driverId: string): Promise<DriverProfile | null> => {
    const { data, error } = await supabase
      .from('drivers')
      .select('*, profiles(*)')
      .eq('profile_id', driverId)
      .single();

    if (error) throw new Error(error.message);
    if (!data || !data.profiles) return null;

    const { profiles, ...driverData } = data;
    return { ...profiles, ...driverData } as DriverProfile;
  },

  updateProfile: async (userId: string, updates: Partial<Profile>): Promise<Profile> => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
};
