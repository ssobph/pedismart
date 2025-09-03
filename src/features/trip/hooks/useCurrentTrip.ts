import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { tripService, TripWithDetails } from '@/services/tripService';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';

export function useCurrentTrip() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const tripChannelRef = useRef<RealtimeChannel | null>(null);
  const driverChannelRef = useRef<RealtimeChannel | null>(null);
  const baseKey = useMemo(() => ['currentTrip', user?.id] as const, [user?.id]);

  const query = useQuery<TripWithDetails | (TripWithDetails & { driver_current_location?: any }) | null>({
    queryKey: baseKey,
    queryFn: async () => {
      if (!user) return null;
      try {
        if (user.role === 'driver') {
          return await tripService.getActiveTrip(user.id);
        } else {
          return await tripService.getActivePassengerTrip(user.id);
        }
      } catch {
        return null;
      }
    },
    enabled: !!user,
    refetchInterval: false,
    staleTime: 30_000,
  });

  // realtime when we have a trip
  useEffect(() => {
    const current = query.data;

    // ENSURE we clean up old channels first
    if (tripChannelRef.current) {
      tripChannelRef.current.unsubscribe();
      tripChannelRef.current = null;
    }
    if (driverChannelRef.current) {
      driverChannelRef.current.unsubscribe();
      driverChannelRef.current = null;
    }

    if (!user) return;

    // if no current trip yet, listen for one assigned/accepted
    if (!current) {
      const channel = supabase
        .channel(`current-trip-watch-${user.id}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'trips',
            filter: user.role === 'driver' ? `driver_id=eq.${user.id}` : `passenger_id=eq.${user.id}`,
          },
          async () => {
            queryClient.invalidateQueries({ queryKey: baseKey });
          }
        )
        .subscribe();
      tripChannelRef.current = channel;
      return () => {
        channel.unsubscribe();
      };
    }

    // subscribe to this trip's row updates
    const tripChannel = supabase
      .channel(`trip-${current.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trips', filter: `id=eq.${current.id}` },
        (payload: any) => {
          const updated = payload.new as TripWithDetails;
          queryClient.setQueryData(baseKey, (prev: any) => ({ ...prev, ...updated }));
        }
      )
      .subscribe();
    tripChannelRef.current = tripChannel;

    // subscribe to driver's live location if we know the driver
    const driverId = (current as any).driver_id as string | null;
    if (driverId) {
      const drvChannel = supabase
        .channel(`driver-${driverId}-${Date.now()}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'drivers', filter: `profile_id=eq.${driverId}` },
          (payload: any) => {
            const loc = payload.new?.current_location;
            if (!loc) return;
            queryClient.setQueryData(baseKey, (prev: any) => {
              if (!prev) return prev;
              return { ...prev, driver_current_location: loc };
            });
          }
        )
        .subscribe();
      driverChannelRef.current = drvChannel;
    }

    return () => {
      if (tripChannelRef.current) {
        tripChannelRef.current.unsubscribe();
        tripChannelRef.current = null;
      }
      if (driverChannelRef.current) {
        driverChannelRef.current.unsubscribe();
        driverChannelRef.current = null;
      }
    };
  }, [user?.id, (user as any)?.role, query.data, queryClient, baseKey]);

  return query;
}
