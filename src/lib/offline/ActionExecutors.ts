import { bookingService } from '@/services/bookingService';
import { locationService } from '@/services/locationService';
import { Point } from 'geojson';
import { profileService } from '@/services/profileService';
import { offlineDataManager } from './OfflineDataManager';

interface TripEndPayload {
  tripId: number;
  driverId?: string;
}

interface TripStatusUpdatePayload {
  tripId: number;
  status: string;
  driverId?: string;
}

interface RatingSubmitPayload {
  tripId: number;
  raterId: string;
  rateeId: string;
  rating: number;
  comment?: string;
}

interface DriverStatusUpdatePayload {
  driverId: string;
  status: 'online' | 'offline';
}

interface LocationUpdatePayload {
  driverId: string;
  latitude: number;
  longitude: number;
}

interface WaypointCompletePayload {
  tripId: number;
  waypointId: number;
}

interface ProfileUpdatePayload {
  userId: string;
  updates: Record<string, any>;
}

const tripEndExecutor = async (payload: TripEndPayload) => {
  try {
    console.log('Executing trip end:', payload);
    
    const result = await bookingService.updateTripStatus(
      payload.tripId, 
      'completed', 
      payload.driverId
    );
    
    await offlineDataManager.updateTripStatus(payload.tripId, 'completed');
    
    console.log('Trip ended successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to end trip:', error);
    throw error;
  }
};

const tripStatusUpdateExecutor = async (payload: TripStatusUpdatePayload) => {
  try {
    console.log('Executing trip status update:', payload);
    
    const result = await bookingService.updateTripStatus(
      payload.tripId,
      payload.status as any,
      payload.driverId
    );
    
    await offlineDataManager.updateTripStatus(payload.tripId, payload.status);
    
    console.log('Trip status updated successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to update trip status:', error);
    throw error;
  }
};

const ratingSubmitExecutor = async (payload: RatingSubmitPayload) => {
  try {
    console.log('Executing rating submission:', payload);
    
    const result = await bookingService.submitRating(
      payload.tripId,
      payload.raterId,
      payload.rateeId,
      payload.rating,
      payload.comment
    );
    
    console.log('Rating submitted successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to submit rating:', error);
    throw error;
  }
};

const driverStatusUpdateExecutor = async (payload: DriverStatusUpdatePayload) => {
  try {
    console.log('Executing driver status update:', payload);
    
    const result = await profileService.updateDriverStatus(
      payload.driverId, 
      payload.status
    );
    
    console.log('Driver status updated successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to update driver status:', error);
    throw error;
  }
};

const locationUpdateExecutor = async (payload: LocationUpdatePayload) => {
  try {
    console.log('Executing location update:', payload);
    
    await locationService.updateDriverLocation(payload.driverId, {
      type: 'Point',
      coordinates: [payload.longitude, payload.latitude],
    });
    
    // cache location locally for offline viewing
    await offlineDataManager.cacheDriverLocation({
      latitude: payload.latitude,
      longitude: payload.longitude,
      timestamp: Date.now()
    });
    
    console.log('Location updated and cached locally:', payload);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update location:', error);
    throw error;
  }
};

const waypointCompleteExecutor = async (payload: WaypointCompletePayload) => {
  try {
    console.log('Executing waypoint completion:', payload);
    
    await bookingService.completeWaypoint(payload.waypointId);
    
    // rn, just update local cache
    await offlineDataManager.updateTripWaypoint(
      payload.tripId,
      payload.waypointId,
      { status: 'completed', completed_at: new Date().toISOString() }
    );
    
    const result = {
      success: true,
      tripId: payload.tripId,
      waypointId: payload.waypointId
    };
    
    console.log('Waypoint completed successfully (cached locally):', result);
    return result;
  } catch (error) {
    console.error('Failed to complete waypoint:', error);
    throw error;
  }
};

const profileUpdateExecutor = async (payload: ProfileUpdatePayload) => {
  try {
    console.log('Executing profile update:', payload);
    
    const result = await profileService.updateProfile(payload.userId, payload.updates);
    
    // cache profile updates locally
    const cachedProfile = await offlineDataManager.getUserProfile();
    if (cachedProfile) {
      const updatedProfile = { ...cachedProfile, ...payload.updates };
      await offlineDataManager.cacheUserProfile(updatedProfile);
    }
    
    console.log('Profile updated successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to update profile:', error);
    throw error;
  }
};

export const ActionExecutors = {
  'trip.end': tripEndExecutor,
  'trip.updateStatus': tripStatusUpdateExecutor,
  'rating.submit': ratingSubmitExecutor,
  'driver.updateStatus': driverStatusUpdateExecutor,
  'location.update': locationUpdateExecutor,
  'waypoint.complete': waypointCompleteExecutor,
  'profile.update': profileUpdateExecutor,
};

export type {
  DriverStatusUpdatePayload,
  LocationUpdatePayload, ProfileUpdatePayload, RatingSubmitPayload, TripEndPayload,
  TripStatusUpdatePayload, WaypointCompletePayload
};
