import { supabase } from '@/lib/supabase';
import { locationService } from '@/services/locationService';
import { profileService } from '@/services/profileService';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';

// REMINDERS: maybe find a better way to do this
// FETCHING NEARBY DRIVERS WITHIN A GIVEN RADIUS FROM A CENTRAL POINT.
/**
 * fetching nearby drivers within a given radius from a central point.
 * The query automatically refetches data at a set interval to keep the map live.
 * @param location - AN OBJECT WITH `LATITUDE` AND `LONGITUDE`.
 * @param radiusInMeters - THE SEARCH RADIUS.
 */
export function useNearbyDrivers(
  location: { latitude: number; longitude: number } | null,
  radiusInMeters: number = 5000
) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const queryKey = useMemo(() => ['nearbyDrivers', location?.latitude, location?.longitude, radiusInMeters] as const, [location?.latitude, location?.longitude, radiusInMeters]);

  // Simple enrichment rate limiter (max 5 req/sec) and per-driver cooldown (15s)
  const enrichWindowRef = useRef<{ start: number; count: number }>({ start: 0, count: 0 });
  const lastEnrichRef = useRef<Record<string, number>>({});

  function canEnrich(driverId: string) {
    const now = Date.now();
    const window = enrichWindowRef.current;
    if (now - window.start >= 1000) {
      window.start = now;
      window.count = 0;
    }
    const lastForDriver = lastEnrichRef.current[driverId] ?? 0;
    const driverOk = now - lastForDriver >= 15_000; // 15s cooldown per driver
    const globalOk = window.count < 5;
    if (driverOk && globalOk) {
      window.count += 1;
      lastEnrichRef.current[driverId] = now;
      return true;
    }
    return false;
  }

  // initial fetch (no polling)
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!location) throw new Error('Location is not available');
      const result = await locationService.getNearbyDrivers(
        location.latitude,
        location.longitude,
        radiusInMeters
      );
      return result || [];
    },
    enabled: !!location,
    staleTime: 15_000,
    refetchInterval: false,
    retry: (failureCount, error: any) => {
      if (failureCount >= 3) return false;
      return !String(error?.message || '').includes('Location is not available');
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });

  // https://stackoverflow.com/questions/37984670/how-to-calculate-location-different-from-distance
  function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  useEffect(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    if (!location) return;

    const channel = supabase
      .channel(`drivers-nearby-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'drivers' },
        async (payload: any) => {
          try {
            const row = payload.new || payload.old;
            if (!row) return;

            const status = (payload.new?.status ?? payload.old?.status) as string | undefined;
            const currentLoc = (payload.new?.current_location ?? payload.old?.current_location) as any;

            const withinRadius = (() => {
              if (!currentLoc?.coordinates) return false;
              const [lng, lat] = currentLoc.coordinates as [number, number];
              const d = distanceMeters(location.latitude, location.longitude, lat, lng);
              return d <= radiusInMeters;
            })();

            let missingProfile = false;
            queryClient.setQueryData<any[]>(queryKey, (prev) => {
              const list = Array.isArray(prev) ? [...prev] : [];
              const idx = list.findIndex((d: any) => d.profile_id === row.profile_id);

              if (payload.eventType === 'DELETE' || status === 'offline' || !withinRadius) {
                if (idx >= 0) list.splice(idx, 1);
                return list;
              }

              const next = {
                ...(idx >= 0 ? list[idx] : {}),
                profile_id: row.profile_id,
                plate_number: row.plate_number,
                current_location: currentLoc,
                status,
              } as any;

              if (!next.full_name) missingProfile = true;

              if (idx >= 0) list[idx] = next; else list.push(next);
              return list;
            });

            if (missingProfile && canEnrich(row.profile_id)) {
              profileService.getDriverProfile(row.profile_id).then((prof) => {
                if (!prof) return;
                queryClient.setQueryData<any[]>(queryKey, (prev) => {
                  const list = Array.isArray(prev) ? [...prev] : [];
                  const idx = list.findIndex((d: any) => d.profile_id === row.profile_id);
                  if (idx >= 0) {
                    list[idx] = {
                      ...list[idx],
                      full_name: prof.full_name || list[idx].full_name || 'Driver',
                      plate_number: prof.plate_number ?? list[idx].plate_number,
                      current_location: prof.current_location ?? list[idx].current_location,
                    };
                  }
                  return list;
                });
              }).catch(() => {/* swallow enrichment errors */});
            }
          } catch (e) {
            // Guard against any runtime error in realtime handler
            // eslint-disable-next-line no-console
            console.warn('[useNearbyDrivers] Realtime handler error', e);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          // eslint-disable-next-line no-console
          console.warn('[useNearbyDrivers] Realtime channel error');
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [location?.latitude, location?.longitude, radiusInMeters, queryClient, queryKey]);

  return query;
}
