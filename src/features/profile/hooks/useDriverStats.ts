import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Alert } from 'react-native';

export interface DriverStats {
  tripsCompleted: number;
  averageRating: number | null;
  hoursOnline: number;
}

const DEFAULT_STATS: DriverStats = {
  tripsCompleted: 0,
  averageRating: null,
  hoursOnline: 0,
};

export function useDriverStats() {
  const { user } = useAuth();
  const [manualRefreshTrigger, setManualRefreshTrigger] = useState(0);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setManualRefreshTrigger(prev => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const query = useQuery({
    queryKey: ['driverStats', user?.id, manualRefreshTrigger],
    queryFn: async () => {
      if (!user?.id) {
        return DEFAULT_STATS;
      }

      try {
        // Get user's timezone
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        
        // Call the RPC function
        const { data, error } = await supabase.rpc('get_driver_stats', {
          p_driver_id: user.id,
          p_tz: timezone,
        });

        if (error) {
          console.error('Error fetching driver stats:', error);
          throw error;
        }

        if (!data || data.length === 0) {
          return DEFAULT_STATS;
        }

        const stats = data[0];
        
        return {
          tripsCompleted: stats.trips_completed || 0,
          averageRating: stats.average_rating || null,
          hoursOnline: stats.hours_online || 0,
        };
      } catch (error) {
        console.error('Failed to fetch driver stats:', error);
        Alert.alert('Error', 'Failed to load driver statistics');
        return DEFAULT_STATS;
      }
    },
    enabled: !!user?.id,
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 60000, // Keep in cache for 1 minute
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  return {
    stats: query.data || DEFAULT_STATS,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
