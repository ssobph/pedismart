import { useAuth } from '@/contexts/AuthContext';
import { useDriverStatus } from '@/contexts/DriverStatusContext';
import { useLocation } from '@/contexts/LocationContext';
import { useOfferRide } from '@/features/booking/hooks/useOfferRide';
import { AvailabilityToggle } from '@/features/driver/components/AvailabilityToggle';
import { useBroadcastLocation } from '@/features/map/hooks/useBroadcastLocation';
import { useNearbyPassengers } from '@/features/map/hooks/useNearbyPassengers';
import { useRideRequestsSubscription } from '@/features/map/hooks/useRideRequestsSubscription';
import { useDriverStats } from '@/features/profile/hooks/useDriverStats';
import { RideRequestModal } from '@/features/trip/components/RideRequestModal';
import { TripNavigationScreen } from '@/features/trip/screens/TripNavigationScreen';
import { Camera, LocationPuck, MAP_STYLES, MapView, ShapeSource, SymbolLayer } from '@/lib/mapbox';
import { bookingService } from '@/services/bookingService';
import { RideRequest, tripService, TripWithDetails } from '@/services/tripService';
import { FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Point } from 'geojson';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from 'react-native';

export function DriverMapScreen() {
  const [isReady, setIsReady] = useState(false);
  const { user } = useAuth();
  const { location } = useLocation();
  const { isOnline } = useDriverStatus();
  const { stats, isLoading: statsLoading } = useDriverStats();
  const [activeTrip, setActiveTrip] = useState<TripWithDetails | null>(null);
  const [rideRequest, setRideRequest] = useState<RideRequest | null>(null);
  const [showRideRequestModal, setShowRideRequestModal] = useState(false);
  const [processedRequests, setProcessedRequests] = useState<Set<number>>(new Set());
  const broadcastLocation = useBroadcastLocation();
  const offerRide = useOfferRide();
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const checkActiveTrip = async () => {
      if (user) {
        try {
          const trip = await tripService.getActiveTrip(user.id);
          if (trip) {
            setActiveTrip(trip);
          }
        } catch (error) { }
      }
    };
    checkActiveTrip();
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500); 

    return () => clearTimeout(timer);
  }, []);

  const currentLocation = location
    ? { latitude: location.coords.latitude, longitude: location.coords.longitude }
    : null;

  const { data: nearbyPassengers } = useNearbyPassengers(
    isOnline ? currentLocation : null,
    5000
  );

  const { isActive: _rideRequestsActive } = useRideRequestsSubscription({
    enabled: isOnline && !!currentLocation && !activeTrip,
    driverLocation: currentLocation,
    radiusMeters: 5000,
    onRideRequest: (request) => {
      if (!processedRequests.has(request.trip_id)) {
        setRideRequest(request);
        setShowRideRequestModal(true);
      }
    },
  });

  useEffect(() => {
    if (isOnline && location && user && !activeTrip) {
      const point: Point = {
        type: 'Point',
        coordinates: [location.coords.longitude, location.coords.latitude],
      };
      broadcastLocation.mutate({ driverId: user.id, location: point });

      intervalRef.current = setInterval(() => {
        if (location) {
          const updatedPoint: Point = {
            type: 'Point',
            coordinates: [location.coords.longitude, location.coords.latitude],
          };
          broadcastLocation.mutate({ driverId: user.id, location: updatedPoint });
        }
      }, 15000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isOnline, location, user, activeTrip, broadcastLocation]);


  const handleAcceptRide = async (request: RideRequest) => {
    if (!user) return;

    try {
      const acceptedTrip = await bookingService.updateTripStatus(
        request.trip_id,
        'accepted',
        user.id
      );
      const tripDetails = await tripService.getTripDetails(acceptedTrip.id);

      setActiveTrip(tripDetails);
      setShowRideRequestModal(false);
      setRideRequest(null);
      setProcessedRequests(prev => new Set([...prev, request.trip_id]));

      Alert.alert('Ride Accepted', 'Navigate to pickup location');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept ride. Please try again.');
    }
  };

  const handleDeclineRide = async (request: RideRequest) => {
    if (!user) return;

    await tripService.rejectTrip(request.trip_id, user.id);
    setShowRideRequestModal(false);
    setRideRequest(null);
    setProcessedRequests(prev => new Set([...prev, request.trip_id]));
  };

  const handleTripComplete = () => {
    setActiveTrip(null);
    setProcessedRequests(new Set());
  };

  const handleCancelNavigation = () => {
    setActiveTrip(null);
  };

  const handleOfferRide = (tripId: number, passengerId: string) => {
    const passenger = nearbyPassengers?.find(p => p.trip_id === tripId);

    if (!passenger || !user || !location) {
      Alert.alert('Error', 'Unable to offer ride. Please try again.');
      return;
    }

    const pickupLocation = passenger.pickup_location;

    offerRide.mutate({
      driverId: user.id,
      passengerId: passengerId,
      pickupLocation: pickupLocation as Point,
      dropoffLocation: pickupLocation as Point,
    });
  };

  if (activeTrip) {
    return (
      <TripNavigationScreen
        trip={activeTrip}
        onTripComplete={handleTripComplete}
        onCancel={handleCancelNavigation}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Driver Dashboard</Text>
        <View style={styles.headerActions}>
          <AvailabilityToggle variant="default" size="small" />
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <FontAwesome5 name="users" size={24} color="#4A90E2" />
            {statsLoading ? (
              <ActivityIndicator size="small" color="#4A90E2" style={styles.statLoader} />
            ) : (
              <Text style={styles.statNumber}>{stats.tripsCompleted}</Text>
            )}
            <Text style={styles.statLabel}>Trips</Text>
          </View>

          <View style={styles.statCard}>
            <FontAwesome5 name="star" size={24} color="#F39C12" />
            {statsLoading ? (
              <ActivityIndicator size="small" color="#F39C12" style={styles.statLoader} />
            ) : (
              <Text style={styles.statNumber}>
                {stats.averageRating ? stats.averageRating.toFixed(1) : '--'}
              </Text>
            )}
            <Text style={styles.statLabel}>Rating</Text>
          </View>

          <View style={styles.statCard}>
            <FontAwesome5 name="clock" size={24} color="#27AE60" />
            {statsLoading ? (
              <ActivityIndicator size="small" color="#27AE60" style={styles.statLoader} />
            ) : (
              <Text style={styles.statNumber}>{stats.hoursOnline.toFixed(1)}</Text>
            )}
            <Text style={styles.statLabel}>Hours</Text>
          </View>
        </View>
      </View>

      <View style={styles.mapContainer}>
        {location && isReady ? (
          <MapView
            style={styles.map}
            styleURL={MAP_STYLES.NAVIGATION}
            logoEnabled={false}
            attributionEnabled={false}
          >
            <Camera
              zoomLevel={15}
              centerCoordinate={[location.coords.longitude, location.coords.latitude]}
              animationMode="flyTo"
              animationDuration={750}
            />

            <LocationPuck visible pulsing={{ isEnabled: true, color: isOnline ? '#27AE60' : '#95A5A6', radius: 15 }} />

            {(() => {
              const features = isOnline && nearbyPassengers
                ? nearbyPassengers.map((p) => ({
                  type: 'Feature' as const,
                  geometry: { type: 'Point' as const, coordinates: p.pickup_location.coordinates },
                  properties: {
                    tripId: p.trip_id,
                    passengerId: p.passenger_id,
                    name: p.passenger_name,
                    address: p.pickup_address || 'Pickup location',
                  },
                }))
                : [];

              return (
                <ShapeSource
                  id="passengers"
                  shape={{ type: 'FeatureCollection', features }}
                  onPress={(e) => {
                    const feature = e.features?.[0];
                    if (!feature) return;
                    const tripId = feature.properties?.tripId as number;
                    const passengerId = feature.properties?.passengerId as string;
                    if (tripId && passengerId) {
                      handleOfferRide(tripId, passengerId);
                    }
                  }}
                >
                  <SymbolLayer
                    id="passenger-symbols"
                    style={{
                      iconImage: 'marker-15',
                      iconSize: 1.2,
                      iconColor: '#F39C12',
                      iconAllowOverlap: true,
                      iconIgnorePlacement: true,
                      textField: ['get', 'name'],
                      textFont: ['Open Sans Regular', 'Arial Unicode MS Regular'],
                      textSize: 12,
                      textColor: '#2C3E50',
                      textHaloColor: '#FFFFFF',
                      textHaloWidth: 1,
                      textOffset: [0, 2],
                      textAnchor: 'top',
                    }}
                  />
                </ShapeSource>
              );
            })()}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <View style={styles.mapPin}>
              <FontAwesome5 name="map-marker-alt" size={24} color="#27AE60" />
            </View>
            <Text style={styles.mapText}>Driver Map View</Text>
            <Text style={styles.mapSubtext}>Tap passenger icons to offer rides</Text>
          </View>
        )}
      </View>

      <RideRequestModal
        visible={showRideRequestModal}
        rideRequest={rideRequest}
        onAccept={handleAcceptRide}
        onDecline={handleDeclineRide}
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
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 10,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  statLoader: {
    marginTop: 10,
    marginBottom: 5,
    height: 29,
  },
  headerLeft: {
    flex: 1,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#BDC3C7',
    fontWeight: '500',
  },
  toggleLabelActive: {
    color: '#2C3E50',
    fontWeight: 'bold',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
    gap: 10,
  },
  statusOnline: {
    backgroundColor: '#27AE60',
  },
  statusOffline: {
    backgroundColor: '#95A5A6',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    flex: 1,
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
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#E8E8E8',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapPin: {
    marginBottom: 20,
  },
  mapText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  mapSubtext: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 30,
  },
  rideRequestContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  rideRequestCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  rideRequestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  rideRequestTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E65100',
  },
  requestId: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestIdText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rideRequestDetails: {
    marginBottom: 20,
  },
  rideDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  rideDetailText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  rideRequestActions: {
    flexDirection: 'row',
    gap: 15,
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#E74C3C',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#27AE60',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    color: '#95A5A6',
    marginBottom: 4,
  },
  onlineNumber: {
    color: '#F39C12',
  },
  statusNumber: {
    fontSize: 18,
    color: '#27AE60',
  },
  infoLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  noPassengersMessage: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  noPassengersText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 8,
    fontWeight: '500',
  },
  noPassengersSubtext: {
    fontSize: 12,
    color: '#BDC3C7',
    marginTop: 4,
  },
  offlineMessage: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  offlineText: {
    fontSize: 16,
    color: '#95A5A6',
    marginTop: 8,
    fontWeight: '500',
  },
  offlineSubtext: {
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
  },
  retryButton: {
    backgroundColor: '#27AE60',
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
});
