import { useNetwork } from '@/contexts/NetworkContext';
import {
  DriverStatusUpdatePayload,
  LocationUpdatePayload,
  ProfileUpdatePayload,
  RatingSubmitPayload,
  TripEndPayload,
  TripStatusUpdatePayload,
  WaypointCompletePayload
} from '@/lib/offline/ActionExecutors';
import { OfflineActionQueue } from '@/lib/offline/ActionQueue';
import { offlineDataManager } from '@/lib/offline/OfflineDataManager';
import { bookingService } from '@/services/bookingService';
import { locationService } from '@/services/locationService';
import { profileService } from '@/services/profileService';
import { tripService } from '@/services/tripService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

interface OfflineAwareMutationOptions<TData, TError, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables) => void;
  priority?: 'low' | 'normal' | 'high';
  cacheUpdate?: (variables: TVariables) => Promise<void>;
}

export const useOfflineAwareMutation = <TData = unknown, TError = Error, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  actionType: string,
  options?: OfflineAwareMutationOptions<TData, TError, TVariables>
) => {
  const { isConnected } = useNetwork();
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      try {
        if (isConnected) {
          // ol: execute immediately
          const result = await mutationFn(variables);
          options?.onSuccess?.(result, variables);
          return result;
        } else {
          // off: queue for later execution
          await OfflineActionQueue.enqueue(
            actionType as any,
            variables,
            options?.priority || 'normal'
          );

          // update local cache if provided
          if (options?.cacheUpdate) {
            await options.cacheUpdate(variables);
          }

          const mockResult = { success: true, queued: true } as TData;
          options?.onSuccess?.(mockResult, variables);
          return mockResult;
        }
      } catch (error) {
        options?.onError?.(error as TError, variables);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [actionType] });
    }
  });
};

export const useEndTrip = (options?: OfflineAwareMutationOptions<any, Error, TripEndPayload>) => {
  return useOfflineAwareMutation(
    async (payload: TripEndPayload) => {
      return await bookingService.updateTripStatus(payload.tripId, 'completed', payload.driverId);
    },
    'trip.end',
    {
      ...options,
      cacheUpdate: async (payload) => {
        await offlineDataManager.updateTripStatus(payload.tripId, 'completed');
      }
    }
  );
};

export const useUpdateTripStatus = (options?: OfflineAwareMutationOptions<any, Error, TripStatusUpdatePayload>) => {
  return useOfflineAwareMutation(
    async (payload: TripStatusUpdatePayload) => {
      return await bookingService.updateTripStatus(payload.tripId, payload.status as any, payload.driverId);
    },
    'trip.updateStatus',
    {
      ...options,
      cacheUpdate: async (payload) => {
        await offlineDataManager.updateTripStatus(payload.tripId, payload.status);
      }
    }
  );
};

export const useSubmitRating = (options?: OfflineAwareMutationOptions<any, Error, RatingSubmitPayload>) => {
  return useOfflineAwareMutation(
    async (payload: RatingSubmitPayload) => {
      return await bookingService.submitRating(payload.tripId, payload.raterId, payload.rateeId, payload.rating, payload.comment);
    },
    'rating.submit',
    options
  );
};

export const useUpdateDriverStatus = (options?: OfflineAwareMutationOptions<any, Error, DriverStatusUpdatePayload>) => {
  return useOfflineAwareMutation(
    async (payload: DriverStatusUpdatePayload) => {
      return await profileService.updateDriverStatus(payload.driverId, payload.status);
    },
    'driver.updateStatus',
    options
  );
};

export const useUpdateLocation = (options?: OfflineAwareMutationOptions<any, Error, LocationUpdatePayload>) => {
  return useOfflineAwareMutation(
    async (payload: LocationUpdatePayload) => {
      return await locationService.updateDriverLocation(payload.driverId, { type: 'Point', coordinates: [payload.longitude, payload.latitude] });
    },
    'location.update',
    {
      ...options,
      cacheUpdate: async (payload) => {
        await offlineDataManager.cacheDriverLocation({
          latitude: payload.latitude,
          longitude: payload.longitude,
          timestamp: Date.now()
        });
      }
    }
  );
};

export const useCompleteWaypoint = (options?: OfflineAwareMutationOptions<any, Error, WaypointCompletePayload>) => {
  return useOfflineAwareMutation(
    async (payload: WaypointCompletePayload) => {
      return await bookingService.completeWaypoint(payload.waypointId);
    },
    'waypoint.complete',
    {
      ...options,
      cacheUpdate: async (payload) => {
        await offlineDataManager.updateTripWaypoint(
          payload.tripId,
          payload.waypointId,
          { status: 'completed', completed_at: new Date().toISOString() }
        );
      }
    }
  );
};

export const useUpdateProfile = (options?: OfflineAwareMutationOptions<any, Error, ProfileUpdatePayload>) => {
  return useOfflineAwareMutation(
    async (payload: ProfileUpdatePayload) => {
      return await profileService.updateProfile(payload.userId, payload.updates);
    },
    'profile.update',
    {
      ...options,
      cacheUpdate: async (payload) => {
        const cachedProfile = await offlineDataManager.getUserProfile();
        if (cachedProfile) {
          const updatedProfile = { ...cachedProfile, ...payload.updates };
          await offlineDataManager.cacheUserProfile(updatedProfile);
        }
      }
    }
  );
};

// offline-aware query hooks
export const useOfflineFirstQuery = <TData = unknown>(
  queryKey: (string | number | undefined)[],
  queryFn: () => Promise<TData>,
  cacheGetter: () => Promise<TData | null>,
  options?: {
    staleTime?: number;
    cacheTime?: number;
    refetchOnWindowFocus?: boolean;
  }
) => {
  const { isConnected } = useNetwork();

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (isConnected) {
        try {
          // ol: fetch from API
          return await queryFn();
        } catch (error) {
          console.warn('API failed, falling back to cache:', error);
          const cached = await cacheGetter();
          if (cached) return cached;
          throw error;
        }
      } else {
        // off: return cached data
        const cached = await cacheGetter();
        if (cached) return cached;
        throw new Error('No cached data available offline');
      }
    },
    staleTime: options?.staleTime || (isConnected ? 5 * 60 * 1000 : Infinity), // 5 min online, never stale offline
    gcTime: options?.cacheTime || 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? !!isConnected,
    retry: isConnected ? 3 : 0, // retry only when online
  });
};

export const useCurrentTrip = (userId?: string) => {
  return useOfflineFirstQuery(
    ['currentTrip', userId],
    async () => {
      if (!userId) throw new Error('User ID is required');
      return await tripService.getActivePassengerTrip(userId);
    },
    () => offlineDataManager.getCurrentTrip()
  );
};

export const useActiveTrips = (userId?: string) => {
  return useOfflineFirstQuery(
    ['activeTrips', userId],
    async () => {
      if (!userId) throw new Error('User ID is required');
      return await tripService.getActiveTrip(userId);
    },
    async () => {
      const trips = await offlineDataManager.getActiveTrips();
      return trips && trips.length > 0 ? trips[0] : null;
    }
  );
};

export const useNearbyPassengers = (location?: { lat: number; lng: number }) => {
  return useOfflineFirstQuery(
    ['nearbyPassengers', location?.lat, location?.lng],
    async () => {
      if (!location) throw new Error('Location is required');
      // Uses the optimized PostGIS-based RPC
      // @deprecated tripService.getNearbyPassengersSeeking reminder for fallback
      return await tripService.getNearbyRequestsRPC(
        { latitude: location.lat, longitude: location.lng }, 
        5000
      );
    },
    () => offlineDataManager.getNearbyPassengers()
  );
};

export const useTripHistory = (userId?: string) => {
  return useOfflineFirstQuery(
    ['tripHistory', userId],
    async () => {
      if (!userId) throw new Error('User ID is required');
      return await bookingService.getRideHistory(userId);
    },
    () => offlineDataManager.getTripHistory() as any
  );
};

export const useUserProfile = (userId?: string) => {
  return useOfflineFirstQuery(
    ['userProfile', userId],
    async () => {
      if (!userId) throw new Error('User ID is required');
      return await profileService.getProfile(userId);
    },
    () => offlineDataManager.getUserProfile()
  );
};

export const useOfflineQueue = () => {
  const { syncStatus, retryFailedActions, clearFailedActions } = useNetwork();

  const getQueueStatus = useCallback(() => {
    return OfflineActionQueue.getQueueStatus();
  }, []);

  const clearQueue = useCallback(async () => {
    await OfflineActionQueue.clearAllQueues();
  }, []);

  return {
    syncStatus,
    getQueueStatus,
    retryFailedActions,
    clearFailedActions,
    clearQueue
  };
};

export const useOfflineCache = () => {
  const clearCache = useCallback(async () => {
    await offlineDataManager.clearAllCache();
  }, []);

  const clearExpiredCache = useCallback(async () => {
    return await offlineDataManager.clearExpiredCache();
  }, []);

  const getCacheInfo = useCallback(async () => {
    return await offlineDataManager.getCacheInfo();
  }, []);

  const getCacheSize = useCallback(async () => {
    return await offlineDataManager.getCacheSize();
  }, []);

  return {
    clearCache,
    clearExpiredCache,
    getCacheInfo,
    getCacheSize
  };
};
