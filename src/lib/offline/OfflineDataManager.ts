import { PassengerSeekingRide, TripWithDetails } from '@/services/tripService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEYS = {
  CURRENT_TRIP: 'offline:current_trip',
  ACTIVE_TRIPS: 'offline:active_trips', 
  NEARBY_PASSENGERS: 'offline:nearby_passengers',
  DRIVER_LOCATION: 'offline:driver_location',
  TRIP_HISTORY: 'offline:trip_history',
  USER_PROFILE: 'offline:user_profile',
  OFFLINE_CAPABILITIES: 'offline:capabilities'
} as const;

const CACHE_EXPIRY_MS = {
  CURRENT_TRIP: 24 * 60 * 60 * 1000, // 24 hours
  ACTIVE_TRIPS: 30 * 60 * 1000, // 30 minutes
  NEARBY_PASSENGERS: 5 * 60 * 1000, // 5 minutes
  DRIVER_LOCATION: 2 * 60 * 1000, // 2 minutes
  TRIP_HISTORY: 7 * 24 * 60 * 60 * 1000, // 7 days
  USER_PROFILE: 24 * 60 * 60 * 1000, // 24 hours
  OFFLINE_CAPABILITIES: Infinity // Never expires
} as const;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

interface OfflineCapabilities {
  canViewTrips: boolean;
  canViewMap: boolean;
  canViewProfile: boolean;
  canCommunicate: boolean;
  canNavigate: boolean;
}

export class OfflineDataManager {
  private static instance: OfflineDataManager;

  public static getInstance(): OfflineDataManager {
    if (!OfflineDataManager.instance) {
      OfflineDataManager.instance = new OfflineDataManager();
    }
    return OfflineDataManager.instance;
  }

  private async setCache<T>(key: string, data: T, expiry?: number): Promise<void> {
    try {
      const expiresAt = expiry ? Date.now() + expiry : Date.now() + (24 * 60 * 60 * 1000);
      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt
      };
      
      await AsyncStorage.setItem(key, JSON.stringify(cacheEntry));
      console.log(`Cached data for key: ${key}`);
    } catch (error) {
      console.error(`Failed to cache data for key ${key}:`, error);
    }
  }

  private async getCache<T>(key: string): Promise<T | null> {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return null;

      const cacheEntry: CacheEntry<T> = JSON.parse(stored);
      
      if (Date.now() > cacheEntry.expiresAt) {
        // Expired, remove from cache
        await AsyncStorage.removeItem(key);
        console.log(`Expired cache removed for key: ${key}`);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.error(`Failed to get cached data for key ${key}:`, error);
      return null;
    }
  }

  private async removeCache(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove cached data for key ${key}:`, error);
    }
  }

  // Current Trip Management
  async cacheCurrentTrip(trip: TripWithDetails): Promise<void> {
    await this.setCache(CACHE_KEYS.CURRENT_TRIP, trip, CACHE_EXPIRY_MS.CURRENT_TRIP);
  }

  async getCurrentTrip(): Promise<TripWithDetails | null> {
    return this.getCache<TripWithDetails>(CACHE_KEYS.CURRENT_TRIP);
  }

  async clearCurrentTrip(): Promise<void> {
    await this.removeCache(CACHE_KEYS.CURRENT_TRIP);
  }

  // Active Trips Management  
  async cacheActiveTrips(trips: TripWithDetails[]): Promise<void> {
    await this.setCache(CACHE_KEYS.ACTIVE_TRIPS, trips, CACHE_EXPIRY_MS.ACTIVE_TRIPS);
  }

  async getActiveTrips(): Promise<TripWithDetails[] | null> {
    return this.getCache<TripWithDetails[]>(CACHE_KEYS.ACTIVE_TRIPS);
  }

  // Nearby Passengers Management
  async cacheNearbyPassengers(passengers: PassengerSeekingRide[]): Promise<void> {
    await this.setCache(CACHE_KEYS.NEARBY_PASSENGERS, passengers, CACHE_EXPIRY_MS.NEARBY_PASSENGERS);
  }

  async getNearbyPassengers(): Promise<PassengerSeekingRide[] | null> {
    return this.getCache<PassengerSeekingRide[]>(CACHE_KEYS.NEARBY_PASSENGERS);
  }

  // Driver Location Management
  async cacheDriverLocation(location: LocationData): Promise<void> {
    await this.setCache(CACHE_KEYS.DRIVER_LOCATION, location, CACHE_EXPIRY_MS.DRIVER_LOCATION);
  }

  async getDriverLocation(): Promise<LocationData | null> {
    return this.getCache<LocationData>(CACHE_KEYS.DRIVER_LOCATION);
  }

  // Trip History Management
  async cacheTripHistory(trips: TripWithDetails[]): Promise<void> {
    await this.setCache(CACHE_KEYS.TRIP_HISTORY, trips, CACHE_EXPIRY_MS.TRIP_HISTORY);
  }

  async getTripHistory(): Promise<TripWithDetails[] | null> {
    return this.getCache<TripWithDetails[]>(CACHE_KEYS.TRIP_HISTORY);
  }

  // User Profile Management
  async cacheUserProfile(profile: any): Promise<void> {
    await this.setCache(CACHE_KEYS.USER_PROFILE, profile, CACHE_EXPIRY_MS.USER_PROFILE);
  }

  async getUserProfile(): Promise<any | null> {
    return this.getCache<any>(CACHE_KEYS.USER_PROFILE);
  }

  // Offline Capabilities Management
  async setOfflineCapabilities(capabilities: OfflineCapabilities): Promise<void> {
    await this.setCache(CACHE_KEYS.OFFLINE_CAPABILITIES, capabilities, CACHE_EXPIRY_MS.OFFLINE_CAPABILITIES);
  }

  async getOfflineCapabilities(): Promise<OfflineCapabilities | null> {
    const cached = await this.getCache<OfflineCapabilities>(CACHE_KEYS.OFFLINE_CAPABILITIES);
    
    // Default capabilities if none cached
    if (!cached) {
      const defaultCapabilities: OfflineCapabilities = {
        canViewTrips: true,
        canViewMap: true,
        canViewProfile: true,
        canCommunicate: false,
        canNavigate: true
      };
      await this.setOfflineCapabilities(defaultCapabilities);
      return defaultCapabilities;
    }
    
    return cached;
  }

  // Utility Methods
  async getCacheInfo(): Promise<{ key: string; size: number; hasData: boolean; expiresAt?: number }[]> {
    const cacheInfo = [];
    
    for (const [name, key] of Object.entries(CACHE_KEYS)) {
      try {
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const cacheEntry = JSON.parse(stored);
          cacheInfo.push({
            key: name,
            size: new Blob([stored]).size,
            hasData: true,
            expiresAt: cacheEntry.expiresAt
          });
        } else {
          cacheInfo.push({
            key: name,
            size: 0,
            hasData: false
          });
        }
      } catch (error) {
        console.error(`Error getting cache info for ${key}:`, error);
      }
    }
    
    return cacheInfo;
  }

  async clearExpiredCache(): Promise<number> {
    let clearedCount = 0;
    
    for (const key of Object.values(CACHE_KEYS)) {
      try {
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const cacheEntry = JSON.parse(stored);
          if (Date.now() > cacheEntry.expiresAt) {
            await AsyncStorage.removeItem(key);
            clearedCount++;
            console.log(`Cleared expired cache: ${key}`);
          }
        }
      } catch (error) {
        console.error(`Error clearing expired cache for ${key}:`, error);
      }
    }
    
    return clearedCount;
  }

  async clearAllCache(): Promise<void> {
    try {
      const keys = Object.values(CACHE_KEYS);
      await AsyncStorage.multiRemove(keys);
      console.log('All offline cache cleared');
    } catch (error) {
      console.error('Failed to clear all cache:', error);
    }
  }

  async getCacheSize(): Promise<number> {
    let totalSize = 0;
    
    for (const key of Object.values(CACHE_KEYS)) {
      try {
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          totalSize += new Blob([stored]).size;
        }
      } catch (error) {
        console.error(`Error calculating cache size for ${key}:`, error);
      }
    }
    
    return totalSize;
  }

  async updateTripWaypoint(tripId: number, waypointId: number, updates: Partial<any>): Promise<void> {
    const currentTrip = await this.getCurrentTrip();
    if (currentTrip && currentTrip.id === tripId && currentTrip.trip_waypoints) {
      const waypointIndex = currentTrip.trip_waypoints.findIndex(w => w.id === waypointId);
      if (waypointIndex !== -1) {
        currentTrip.trip_waypoints[waypointIndex] = {
          ...currentTrip.trip_waypoints[waypointIndex],
          ...updates
        };
        await this.cacheCurrentTrip(currentTrip);
      }
    }
  }

  async updateTripStatus(tripId: number, status: string): Promise<void> {
    const currentTrip = await this.getCurrentTrip();
    if (currentTrip && currentTrip.id === tripId) {
      currentTrip.status = status as any;
      await this.cacheCurrentTrip(currentTrip);
    }
  }
}

export const offlineDataManager = OfflineDataManager.getInstance();
