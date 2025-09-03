import { LocationData, LocationInputContainer } from '@/components/ui/LocationInputContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { PassengerMapCanvas } from '@/features/map/components/PassengerMapCanvas';
import { useNearbyDrivers } from '@/features/map/hooks/useNearbyDrivers';
import { OfferModal } from '@/features/trip/components/OfferModal';
import { useCurrentTrip } from '@/features/trip/hooks/useCurrentTrip';
import { Camera, DEFAULT_CAMERA_CONFIG, MapView } from '@/lib/mapbox';
import { supabase } from '@/lib/supabase';
import { bookingService } from '@/services/bookingService';
import { profileService } from '@/services/profileService';
import { Database } from '@/types/database.types';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RealtimeChannel } from '@supabase/supabase-js';
import { PermissionStatus } from 'expo-location';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AssignedDriverInfo } from '../components/AssignedDriverInfo';

type Trip = Database['public']['Tables']['trips']['Row'];

export function PassengerDiscoverScreen() {
  const appStartRef = useRef<number>(Date.now());

  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<Camera>(null);
  const { user } = useAuth();
  const { location, errorMsg, permissionStatus, requestLocationPermission } = useLocation();
  const [offeredTrip, setOfferedTrip] = useState<Trip | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [pickupLocation, setPickupLocation] = useState<LocationData | undefined>();
  const [destinationLocation, setDestinationLocation] = useState<LocationData | undefined>();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { data: currentTrip } = useCurrentTrip();
  const [assignedDriverProfile, setAssignedDriverProfile] = useState<any | null>(null);

  const currentLocation = location
    ? { latitude: location.coords.latitude, longitude: location.coords.longitude }
    : null;

  const { data: nearbyDrivers, isLoading, error, refetch } = useNearbyDrivers(currentLocation, 5000);

  const onMapReady = () => {
    const loadTime = Date.now() - appStartRef.current;
  };

  useEffect(() => {
    if (nearbyDrivers && nearbyDrivers.length > 0) {
      const updateTime = Date.now();

      if (nearbyDrivers.length > 50) {
        // Performance optimization - limit drivers to 50 for optimal performance
      }
    }
  }, [nearbyDrivers]);

  const driversGeoJSON = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: nearbyDrivers
      ?.filter((d: any) => (d.status ? d.status === 'online' : true))
      .slice(0, 50)
      .map((driver) => {
      const coords = Array.isArray(driver.current_location) 
        ? driver.current_location 
        : (driver.current_location as any)?.coordinates || [0, 0];
      
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: coords,
        },
        properties: {
          id: driver.profile_id,
          name: driver.full_name,
          plateNumber: driver.plate_number,
          distance: driver.distance_meters,
        },
      };
    }) || [],
  }), [nearbyDrivers]);

  // load assigned driver profile for an active driver on a trip
  useEffect(() => {
    const driverId = (currentTrip as any)?.driver_id as string | undefined;
    if (!driverId) {
      setAssignedDriverProfile(null);
      return;
    }
    let active = true;
    profileService.getDriverProfile(driverId).then((prof) => {
      if (active) setAssignedDriverProfile(prof);
    }).catch(() => {});
    return () => { active = false; };
  }, [currentTrip?.driver_id]);

  useEffect(() => {
    const loadSavedLocations = async () => {
      try {
        const savedPickup = await AsyncStorage.getItem('selectedPickupLocation');
        const savedDestination = await AsyncStorage.getItem('selectedDestinationLocation');
        
        if (savedPickup) {
          setPickupLocation(JSON.parse(savedPickup));
          await AsyncStorage.removeItem('selectedPickupLocation');
        }
        
        if (savedDestination) {
          setDestinationLocation(JSON.parse(savedDestination));
          await AsyncStorage.removeItem('selectedDestinationLocation');
        }
      } catch (error) {
        // Error loading saved locations
      }
    };

    loadSavedLocations();
  }, []);

  useEffect(() => {
    if (location && !pickupLocation) {
      setPickupLocation({
        address: 'Current location',
        coordinates: [location.coords.longitude, location.coords.latitude],
      });
    }
  }, [location, pickupLocation]);

  useEffect(() => {
    if (!user || !currentLocation) return;

    const channel = supabase
      .channel(`passenger-realtime-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `passenger_id=eq.${user.id}`,
        },
        (payload) => {
          const trip = payload.new as Trip;

          if (trip.status === 'offered' && payload.eventType === 'INSERT') {
            setOfferedTrip(trip);
            setShowOfferModal(true);
          }
          else if (payload.eventType === 'UPDATE' &&
                   (trip.status === 'accepted' || trip.status === 'declined')) {
            if (trip.id === offeredTrip?.id) {
              setShowOfferModal(false);
              setOfferedTrip(null);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drivers',
        },
        (() => {
          let lastRefetch = 0;
          return (payload: any) => {
            // Only refetch if the driver's status changed
            if (payload.old.status !== payload.new.status) {
              const now = Date.now();
              if (now - lastRefetch > 100) {
                lastRefetch = now;
                refetch();
              }
            }
          };
        })()
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [user, offeredTrip, currentLocation, refetch]);


  const handleAcceptOffer = async (trip: Trip) => {
    try {
      await bookingService.respondToOffer({
        tripId: trip.id,
        action: 'accept',
      });
      
      Alert.alert(
        'Ride Accepted',
        'Your driver is on the way to pick you up!',
        [{ text: 'OK' }]
      );
      
      setShowOfferModal(false);
      setOfferedTrip(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to accept ride offer. Please try again.');
    }
  };

  const handleDeclineOffer = async (trip: Trip) => {
    try {
      await bookingService.respondToOffer({
        tripId: trip.id,
        action: 'decline',
      });
      
      setShowOfferModal(false);
      setOfferedTrip(null);
    } catch (error) {
      // Error declining offer
    }
  };

  const handleRequestPermission = async () => {
    const status = await requestLocationPermission();
    if (status !== PermissionStatus.GRANTED) {
      Alert.alert(
        'Location Permission Required',
        'PediSmart needs location access to show nearby drivers and help you book rides. Please enable location services in your device settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const centerOnUser = () => {
    if (location && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [location.coords.longitude, location.coords.latitude],
        zoomLevel: DEFAULT_CAMERA_CONFIG.zoomLevel,
        animationDuration: DEFAULT_CAMERA_CONFIG.animationDuration,
        animationMode: DEFAULT_CAMERA_CONFIG.animationMode,
      });
    }
  };

  const refreshDrivers = () => {
    refetch();
  };

  if (!location && permissionStatus === PermissionStatus.GRANTED) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (permissionStatus === PermissionStatus.DENIED || errorMsg) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <FontAwesome5 name="map-marker-alt" size={48} color="#E74C3C" />
          <Text style={styles.errorTitle}>Location Access Required</Text>
          <Text style={styles.errorMessage}>
            {errorMsg || 'Please enable location services to find nearby drivers and book rides.'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRequestPermission}>
            <Text style={styles.retryButtonText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Find a Ride</Text>
          <Text style={styles.headerSubtitle}>
            {isLoading ? 'Searching for drivers...' : `${nearbyDrivers?.length || 0} drivers nearby`}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.manualBookingButton} onPress={() => router.push('/passenger/manual-booking')}>
            <FontAwesome5 name="list" size={16} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshButton} onPress={refreshDrivers}>
            <FontAwesome5 name="sync" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.locationInputSection}>
        <LocationInputContainer
          pickupLocation={pickupLocation}
          destinationLocation={destinationLocation}
          onPickupPress={() => {
            router.push({
              pathname: '/passenger/locate',
              params: { mode: 'pickup', title: 'Choose Pickup Location' }
            });
          }}
          onDestinationPress={() => {
            router.push({
              pathname: '/passenger/locate',
              params: { mode: 'destination', title: 'Choose Destination' }
            });
          }}
          showCurrentLocationAsPickup={true}
        />
        
        <TouchableOpacity 
          style={styles.manualBookingQuickAccess} 
          onPress={() => router.push('/passenger/manual-booking')}
        >
          <FontAwesome5 name="list-alt" size={18} color="#4A90E2" />
          <Text style={styles.manualBookingText}>Browse Available Pedicabs</Text>
          <FontAwesome5 name="chevron-right" size={14} color="#7F8C8D" />
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        {location ? (
          <PassengerMapCanvas
            center={[location.coords.longitude, location.coords.latitude]}
            driversGeoJSON={driversGeoJSON as any}
            assignedDriver={currentTrip?.driver_id && (currentTrip as any).driver_current_location?.coordinates ? {
              id: currentTrip.driver_id as string,
              coordinate: (currentTrip as any).driver_current_location.coordinates as [number, number],
              name: assignedDriverProfile?.full_name,
            } : undefined}
            onMapReady={onMapReady}
          />
        ) : null}

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#4A90E2" />
            <Text style={styles.loadingOverlayText}>Updating driver locations...</Text>
          </View>
        )}

        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.mapControlButton} onPress={centerOnUser}>
            <FontAwesome5 name="location-arrow" size={16} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapControlButton} onPress={refreshDrivers}>
            <FontAwesome5 name="sync" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {currentTrip?.driver_id && (
        <AssignedDriverInfo
          style={{ position: 'absolute', bottom: 100, left: 20, right: 20 }}
          name={assignedDriverProfile?.full_name}
          avatarUrl={assignedDriverProfile?.avatar_url}
          plateNumber={assignedDriverProfile?.plate_number}
          vehicleType={assignedDriverProfile?.vehicle_details}
        />
      )}

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>
              {isLoading ? '...' : nearbyDrivers?.length || '0'}
            </Text>
            <Text style={styles.infoLabel}>Available Drivers</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoNumber, styles.etaNumber]}>
              {nearbyDrivers?.length ? '2-5' : '...'}
            </Text>
            <Text style={styles.infoLabel}>Minutes ETA</Text>
          </View>
        </View>
        
        {!isLoading && nearbyDrivers && nearbyDrivers.length > 0 && (
          <TouchableOpacity 
            style={styles.manualBookingCTA} 
            onPress={() => router.push('/passenger/manual-booking')}
          >
            <View style={styles.ctaContent}>
              <FontAwesome5 name="hand-pointer" size={16} color="#4A90E2" />
              <Text style={styles.ctaText}>Choose your driver manually</Text>
            </View>
            <FontAwesome5 name="arrow-right" size={14} color="#4A90E2" />
          </TouchableOpacity>
        )}
        
        {!isLoading && nearbyDrivers?.length === 0 && (
          <View style={styles.noDriversMessage}>
            <FontAwesome5 name="car" size={24} color="#7F8C8D" />
            <Text style={styles.noDriversText}>No drivers available nearby</Text>
            <Text style={styles.noDriversSubtext}>Try refreshing or check back later</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorMessage}>
            <FontAwesome5 name="exclamation-triangle" size={16} color="#E74C3C" />
            <Text style={styles.errorText}>Failed to load driver data</Text>
          </View>
        )}
      </View>

      <OfferModal
        visible={showOfferModal}
        trip={offeredTrip}
        onAccept={handleAcceptOffer}
        onDecline={handleDeclineOffer}
        timeoutSeconds={30}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapControls: {
    position: 'absolute',
    right: 15,
    top: 15,
    gap: 10,
  },
  mapControlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 15,
    left: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  loadingOverlayText: {
    fontSize: 12,
    color: '#2C3E50',
  },
  infoCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27AE60',
    marginBottom: 4,
  },
  etaNumber: {
    color: '#4A90E2',
  },
  infoLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  noDriversMessage: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  noDriversText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 8,
    fontWeight: '500',
  },
  noDriversSubtext: {
    fontSize: 12,
    color: '#BDC3C7',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#E74C3C',
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  locationInputSection: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  manualBookingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualBookingQuickAccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    gap: 12,
  },
  manualBookingText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
  },
  manualBookingCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A90E2',
  },
});
