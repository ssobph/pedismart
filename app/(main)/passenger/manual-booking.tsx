import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { LocationData } from '@/components/ui/LocationInputContainer';
import { LocationInputContainer } from '@/components/ui/LocationInputContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useNearbyDrivers } from '@/features/map/hooks/useNearbyDrivers';
import { supabase } from '@/lib/supabase';
import { bookingService } from '@/services/bookingService';
import { ratingService } from '@/services/ratingService';

type GeoPoint = { type: 'Point'; coordinates: [number, number] };

type NearbyDriver = {
  profile_id: string;
  full_name: string;
  plate_number: string;
  distance_meters: number;
  current_location?: unknown;
};

export default function ManualBooking() {
  const { user } = useAuth();
  const { location } = useLocation();
  const queryClient = useQueryClient();

  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [createdTripId, setCreatedTripId] = useState<number | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [pickup, setPickup] = useState<LocationData | null>(null);
  const [destination, setDestination] = useState<LocationData | null>(null);

  const countdownRef = useRef<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const tripChannelRef = useRef<RealtimeChannel | null>(null);

  const [radius, setRadius] = useState<number>(5000);
  const [autoExpand, setAutoExpand] = useState<boolean>(true);
  const [hasAutoExpanded, setHasAutoExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (location && !pickup) {
      setPickup({
        address: 'Current location',
        coordinates: [location.coords.longitude, location.coords.latitude],
      });
    }
  }, [location, pickup]);

  useEffect(() => {
    const loadSelections = async () => {
      const savedPickup = await AsyncStorage.getItem('selectedPickupLocation');
      const savedDest = await AsyncStorage.getItem('selectedDestinationLocation');
      if (savedPickup) setPickup(JSON.parse(savedPickup));
      if (savedDest) setDestination(JSON.parse(savedDest));
    };
    loadSelections();
  }, []);
  
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('manualBookingRadius');
      const parsed = saved ? parseInt(saved, 10) : NaN;
      if (!Number.isNaN(parsed) && parsed > 0) setRadius(parsed);

      const autoExpandSaved = await AsyncStorage.getItem('manualBookingAutoExpand');
      if (autoExpandSaved !== null) setAutoExpand(autoExpandSaved === 'true');
    })();
  }, []);

  const handleRadiusChange = async (value: number) => {
    setRadius(value);
    setHasAutoExpanded(false);
    await AsyncStorage.setItem('manualBookingRadius', String(value));
  };

  const handleAutoExpandChange = async (value: boolean) => {
    setAutoExpand(value);
    await AsyncStorage.setItem('manualBookingAutoExpand', String(value));
  };

  const currentLoc = location
    ? { latitude: location.coords.latitude, longitude: location.coords.longitude }
    : null;
  const { data: drivers, isLoading, isError, refetch } = useNearbyDrivers(currentLoc, radius);

  useEffect(() => {
    if (!isLoading && !isError && autoExpand && !hasAutoExpanded &&
        Array.isArray(drivers) && drivers.length === 0 && radius < 10000) {
      setRadius(10000);
      setHasAutoExpanded(true);
      AsyncStorage.setItem('manualBookingRadius', '10000');
    }
  }, [isLoading, isError, drivers, autoExpand, hasAutoExpanded, radius]);

  const driverIds = useMemo(() => (drivers || []).map((d: NearbyDriver) => d.profile_id), [drivers]);
  const { data: ratingsMap } = useQuery({
    queryKey: ['driverRatings', driverIds],
    queryFn: async () => ratingService.getAverageRatings(driverIds),
    enabled: driverIds.length > 0,
    staleTime: 60_000,
  });

  const createOfferMutation = useMutation({
    mutationKey: ['createOfferedTrip'],
    mutationFn: async ({ driverId, pickupPoint, dropoffPoint }: { driverId: string; pickupPoint: GeoPoint; dropoffPoint: GeoPoint }) => {
      if (!user) throw new Error('You must be logged in to book a ride.');
      const trip = await bookingService.createOfferedTrip(driverId, user.id, pickupPoint, dropoffPoint);
      return trip;
    },
    onSuccess: (trip) => {
      setCreatedTripId(trip.id);
      subscribeToTrip(trip.id);
      startCountdown();
    },
    onError: (err: any) => {
      setIsRequesting(false);
      setSelectedDriverId(null);
      Alert.alert('Booking Failed', err?.message || 'Could not create ride request.');
    },
  });

  const startCountdown = () => {
    setIsRequesting(true);
    setCountdown(30);
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  };

  const subscribeToTrip = (tripId: number) => {
    if (tripChannelRef.current) {
      tripChannelRef.current.unsubscribe();
      tripChannelRef.current = null;
    }

    const channel = supabase
      .channel(`manual-booking-trip-${tripId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'trips', filter: `id=eq.${tripId}` },
        (payload) => {
          const trip = payload.new as any;
          if (trip.status === 'accepted') {
            cleanupRealtime();
            Alert.alert('Driver Accepted', 'Your driver is on the way to pick you up.');
            router.back();
          } else if (trip.status === 'declined' || trip.status === 'cancelled') {
            cleanupRealtime();
            setIsRequesting(false);
            setSelectedDriverId(null);
            setCreatedTripId(null);
            Alert.alert('Not Available', 'This driver is not available. Please try another.');
          }
        }
      )
      .subscribe();

    tripChannelRef.current = channel;
  };

  const cleanupRealtime = () => {
    if (countdownRef.current) clearTimeout(countdownRef.current);
    if (tripChannelRef.current) {
      tripChannelRef.current.unsubscribe();
      tripChannelRef.current = null;
    }
    fadeAnim.setValue(1);
  };

  useEffect(() => {
    if (isRequesting && countdown > 0) {
      countdownRef.current = setTimeout(() => setCountdown((p) => p - 1), 1000) as unknown as number;
    } else if (isRequesting && countdown === 0) {
      // Timeout -> cancel trip if created
      if (createdTripId) {
        bookingService
          .updateTripStatus(createdTripId, 'cancelled')
          .catch(() => {})
          .finally(() => {
            cleanupRealtime();
            setIsRequesting(false);
            setSelectedDriverId(null);
            setCreatedTripId(null);
            Alert.alert('Request Timeout', 'Driver did not respond in time. Try another driver.');
          });
      } else {
        setIsRequesting(false);
        setSelectedDriverId(null);
        setCreatedTripId(null);
      }
    }

    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current);
    };
  }, [isRequesting, countdown, createdTripId]);

  const handleDriverSelect = (driverId: string) => {
    if (isRequesting) return;
    if (!pickup) {
      Alert.alert('Pickup Required', 'We could not get your current location yet.');
      return;
    }
    if (!destination) {
      Alert.alert('Destination Required', 'Please set a destination before requesting.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Set Destination', onPress: () => router.push({ pathname: '/passenger/location-selection', params: { mode: 'destination', title: 'Choose Destination' } }) },
      ]);
      return;
    }

    setSelectedDriverId(driverId);
  const pickupPoint: GeoPoint = { type: 'Point', coordinates: [pickup.coordinates![0], pickup.coordinates![1]] };
  const dropoffPoint: GeoPoint = { type: 'Point', coordinates: [destination.coordinates![0], destination.coordinates![1]] };
    createOfferMutation.mutate({ driverId, pickupPoint, dropoffPoint });
  };

  const cancelRequest = () => {
    if (createdTripId) {
      bookingService
        .updateTripStatus(createdTripId, 'cancelled')
        .catch(() => {})
        .finally(() => {
          cleanupRealtime();
          setIsRequesting(false);
          setSelectedDriverId(null);
          setCreatedTripId(null);
        });
    } else {
      cleanupRealtime();
      setIsRequesting(false);
      setSelectedDriverId(null);
      setCreatedTripId(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const computeEta = (meters: number | undefined) => {
    if (!meters || meters <= 0) return '—';
    const minutes = Math.max(1, Math.ceil(meters / 300)); // ~18 km/h
    return `${minutes} min`;
  };

  const driverCount = Array.isArray(drivers) ? drivers.length : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={20} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Available Pedicabs</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.tripInfo}>
        <LocationInputContainer
          pickupLocation={pickup || undefined}
          destinationLocation={destination || undefined}
          onPickupPress={() => router.push({
            pathname: '/passenger/location-selection',
            params: { mode: 'pickup', title: 'Choose Pickup Location' }
          })}
          onDestinationPress={() => router.push({
            pathname: '/passenger/location-selection',
            params: { mode: 'destination', title: 'Choose Destination' }
          })}
          showCurrentLocationAsPickup={true}
        />
      </View>

      {isRequesting && selectedDriverId && (
        <View style={styles.requestStatus}>
          <Animated.View style={[styles.countdownContainer, { opacity: fadeAnim }]}>
            <Text style={styles.countdownText}>{formatTime(countdown)}</Text>
            <Text style={styles.countdownLabel}>Waiting for driver response...</Text>
          </Animated.View>
          <TouchableOpacity style={styles.cancelButton} onPress={cancelRequest}>
            <Text style={styles.cancelButtonText}>Cancel Request</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.radiusContainer}>
        <View style={styles.radiusHeader}>
          <Text style={styles.radiusLabel}>Search radius</Text>
          <TouchableOpacity
            style={styles.autoExpandToggle}
            onPress={() => handleAutoExpandChange(!autoExpand)}
          >
            <View style={[styles.toggleDot, autoExpand && styles.toggleDotActive]} />
            <Text style={styles.autoExpandText}>Auto-expand if empty</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.radiusChips}>
          {[1000, 3000, 5000, 10000].map((r) => {
            const active = radius === r;
            const label = r >= 1000 ? `${r / 1000}km` : `${r}m`;
            return (
              <TouchableOpacity
                key={r}
                style={[styles.radiusChip, active && styles.radiusChipActive]}
                onPress={() => handleRadiusChange(r)}
                disabled={isLoading}
              >
                <Text style={[styles.radiusChipText, active && styles.radiusChipTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView style={styles.driversList} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Available Pedicabs ({driverCount})</Text>
        <Text style={styles.sectionSubtitle}>
          Tap a pedicab to request a ride · within {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}
        </Text>

        {isLoading && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Finding nearby drivers...</Text>
            <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
          </View>
        )}

        {isError && (
          <View style={styles.errorState}>
            <FontAwesome5 name="exclamation-triangle" size={48} color="#E74C3C" />
            <Text style={styles.errorTitle}>Unable to Load Drivers</Text>
            <Text style={styles.errorMessage}>
              We couldn't connect to find nearby drivers. Please check your internet connection and try again.
            </Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => refetch()}
            >
              <FontAwesome5 name="redo" size={16} color="white" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && !isError && driverCount === 0 && (
          <View style={styles.emptyState}>
            <FontAwesome5 name="car" size={48} color="#7F8C8D" />
            <Text style={styles.emptyTitle}>No Drivers Available</Text>
            <Text style={styles.emptyMessage}>
              There are no pedicab drivers online in your area right now. You can try refreshing or go back to the map to see the broader area.
            </Text>
            <View style={styles.emptyActions}>
              <TouchableOpacity 
                style={styles.refreshButton} 
                onPress={() => refetch()}
              >
                <FontAwesome5 name="sync" size={16} color="#4A90E2" />
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.mapButton} 
                onPress={() => router.back()}
              >
                <FontAwesome5 name="map" size={16} color="#27AE60" />
                <Text style={styles.mapButtonText}>Back to Map</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {(drivers || []).map((driver: NearbyDriver) => {
          const rating = ratingsMap?.get(driver.profile_id)?.average_rating ?? 0;
          const ratingText = rating > 0 ? rating.toFixed(1) : '—';
          const eta = computeEta(driver.distance_meters);
          return (
            <TouchableOpacity
              key={driver.profile_id}
              style={[
                styles.driverCard,
                selectedDriverId === driver.profile_id && styles.driverCardSelected,
                isRequesting && styles.driverCardUnavailable,
              ]}
              onPress={() => handleDriverSelect(driver.profile_id)}
              disabled={isRequesting}
            >
              <View style={styles.driverInfo}>
                <View style={styles.driverPhoto}>
                  <Text style={styles.driverPhotoText}>🛺</Text>
                </View>

                <View style={styles.driverDetails}>
                  <Text style={styles.driverName}>{driver.full_name || 'Driver'}</Text>
                  <Text style={styles.vehicleInfo}>{driver.plate_number || 'Pedicab'}</Text>

                  <View style={styles.statsRow}>
                    <View style={styles.stat}>
                      <FontAwesome5 name="star" size={12} color="#F39C12" />
                      <Text style={styles.statText}>{ratingText}</Text>
                    </View>
                    <View style={styles.stat}>
                      <FontAwesome5 name="check-circle" size={12} color="#27AE60" />
                      <Text style={styles.statText}>—%</Text>
                    </View>
                    <View style={styles.stat}>
                      <FontAwesome5 name="times-circle" size={12} color="#E74C3C" />
                      <Text style={styles.statText}>—%</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.etaContainer}>
                  <Text style={styles.etaText}>{eta}</Text>
                  <Text style={styles.etaLabel}>ETA</Text>
                </View>
              </View>

              {selectedDriverId === driver.profile_id && isRequesting && (
                <View style={styles.requestIndicator}>
                  <FontAwesome5 name="clock" size={20} color="#F39C12" />
                  <Text style={styles.requestText}>Requesting...</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  placeholder: {
    width: 36,
  },
  tripInfo: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  requestStatus: {
    backgroundColor: '#FFF3CD',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  countdownText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F39C12',
    marginBottom: 5,
  },
  countdownLabel: {
    fontSize: 16,
    color: '#856404',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#E74C3C',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  driversList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 15,
    textAlign: 'center',
  },
  driverCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  driverCardSelected: {
    borderColor: '#F39C12',
    backgroundColor: '#FFF3CD',
  },
  driverCardUnavailable: {
    opacity: 0.5,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  driverPhotoText: {
    fontSize: 24,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  etaContainer: {
    alignItems: 'center',
  },
  etaText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  etaLabel: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  requestIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    gap: 8,
  },
  requestText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F39C12',
  },
  loadingState: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  errorState: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
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
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E74C3C',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    flex: 1,
  },
  refreshButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
  radiusContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  radiusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  radiusLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  autoExpandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#BDC3C7',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  toggleDotActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  autoExpandText: {
    fontSize: 11,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  radiusChips: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  radiusChipActive: {
    backgroundColor: 'rgba(74,144,226,0.12)',
    borderColor: '#4A90E2',
  },
  radiusChipText: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
  radiusChipTextActive: {
    color: '#4A90E2',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27AE60',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    flex: 1,
  },
  mapButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
