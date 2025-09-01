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
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', driverId)
      .single();

    if (profileError) throw new Error(profileError.message);
    if (!profileData) return null;

    const { data: driverData, error: driverError } = await supabase
      .from('drivers')
      .select('*')
      .eq('profile_id', driverId)
      .single();

    if (driverError?.code === 'PGRST116') {
      const { data: newDriverData, error: createError } = await supabase
        .from('drivers')
        .insert({
          profile_id: driverId,
          plate_number: '',
          vehicle_details: '',
          status: 'offline',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) throw new Error(createError.message);
      
      return {
        ...profileData,
        plate_number: newDriverData.plate_number,
        vehicle_details: newDriverData.vehicle_details,
        status: newDriverData.status,
        current_location: newDriverData.current_location,
      } as DriverProfile;
    }

    if (driverError) throw new Error(driverError.message);

    return {
      ...profileData,
      plate_number: driverData.plate_number,
      vehicle_details: driverData.vehicle_details,
      status: driverData.status,
      current_location: driverData.current_location,
    } as DriverProfile;
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

  updateDriverProfile: async (
    userId: string,
    updates: Partial<DriverProfile>
  ): Promise<DriverProfile> => {
    let profileData = null;
    let driverData = null;

    const profileUpdates: any = {};
    if (updates.full_name !== undefined) profileUpdates.full_name = updates.full_name;
    if (updates.avatar_url !== undefined) profileUpdates.avatar_url = updates.avatar_url;
    
    if (Object.keys(profileUpdates).length > 0) {
      profileUpdates.updated_at = new Date().toISOString();
      const { data, error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      profileData = data;
    } else {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw new Error(error.message);
      profileData = data;
    }

    const { data: existingDriver, error: checkError } = await supabase
      .from('drivers')
      .select('*')
      .eq('profile_id', userId)
      .single();

    if (checkError?.code === 'PGRST116') {
      const { data: newDriverData, error: createError } = await supabase
        .from('drivers')
        .insert({
          profile_id: userId,
          plate_number: updates.plate_number || '',
          vehicle_details: updates.vehicle_details || '',
          status: 'offline',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) throw new Error(createError.message);
      driverData = newDriverData;
    } else if (checkError) {
      throw new Error(checkError.message);
    } else {
      const driverUpdates: any = {};
      if (updates.plate_number !== undefined) driverUpdates.plate_number = updates.plate_number;
      if (updates.vehicle_details !== undefined) driverUpdates.vehicle_details = updates.vehicle_details;
      
      if (Object.keys(driverUpdates).length > 0) {
        driverUpdates.updated_at = new Date().toISOString();
        const { data, error } = await supabase
          .from('drivers')
          .update(driverUpdates)
          .eq('profile_id', userId)
          .select()
          .single();
        
        if (error) throw new Error(error.message);
        driverData = data;
      } else {
        driverData = existingDriver;
      }
    }

    if (!profileData) throw new Error('Profile not found.');
    if (!driverData) throw new Error('Driver data not found.');

    return {
      ...profileData,
      plate_number: driverData.plate_number,
      vehicle_details: driverData.vehicle_details,
      status: driverData.status,
      current_location: driverData.current_location,
    } as DriverProfile;
  },

  createProfile: async (userId: string, fullName: string, role: 'passenger' | 'driver'): Promise<Profile> => {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: fullName,
        role: role,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  updateDriverStatus: async (
    driverId: string,
    status: 'online' | 'offline' | 'on_trip'
  ): Promise<void> => {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'offline') {
      updateData.current_location = null;
    }

    const { error } = await supabase
      .from('drivers')
      .update(updateData)
      .eq('profile_id', driverId);
    
    if (error) throw new Error(error.message);
  },
};
