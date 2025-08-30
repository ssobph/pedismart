import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

// understandable naman
export function useRideHistory() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['rideHistory', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('trips')
        .select(`
          id,
          status,
          requested_at,
          passenger:profiles!trips_passenger_id_fkey(id, full_name),
          driver:profiles!trips_driver_id_fkey(id, full_name)
        `)
        .or(`passenger_id.eq.${userId},driver_id.eq.${userId}`)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
