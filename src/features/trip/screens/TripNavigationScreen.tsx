import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useRideRequestsSubscription } from '@/features/map/hooks/useRideRequestsSubscription';
import { RideRequestModal } from '@/features/trip/components/RideRequestModal';
import { useTripCapacity } from '@/features/trip/hooks/useTripCapacity';
import { Camera, LineLayer, LocationPuck, MapView, ShapeSource, SymbolLayer } from '@/lib/mapbox';
import { bookingService } from '@/services/bookingService';
import { RouteResponse, routingService, Waypoint } from '@/services/routingService';
import { RideRequest, tripService, TripWithDetails } from '@/services/tripService';
import { FontAwesome5 } from '@expo/vector-icons';
import polyline from '@mapbox/polyline';
import { StatusBar } from 'expo-status-bar';
import { Point } from 'geojson';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface TripNavigationScreenProps {
  trip: TripWithDetails;
  onTripComplete: () => void;
  onCancel?: () => void;
}

export function TripNavigationScreen({ 
  trip, 
  onTripComplete,
  onCancel 
}: TripNavigationScreenProps) {
  const mapRef = useRef<MapView>(null);
  const { user } = useAuth();
  const { location } = useLocation();
  const [tripStatus, setTripStatus] = useState(trip.status);
  const [isLoading, setIsLoading] = useState(false);
  const [multiStopRoute, setMultiStopRoute] = useState<RouteResponse | null>(null);
  const [remainingWaypoints, setRemainingWaypoints] = useState<Waypoint[]>([]);
  const [passengerNames, setPassengerNames] = useState<Record<string, string>>({});
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);
  const [routeRecalculating, setRouteRecalculating] = useState(false);
  const lastRecalcRef = useRef<number>(0);

  const [rideRequest, setRideRequest] = useState<RideRequest | null>(null);
  const [showRideRequestModal, setShowRideRequestModal] = useState(false);
  const [processedRequests, setProcessedRequests] = useState<Set<number>>(new Set());

  // Get capacity information for the current trip
  const { data: capacityInfo } = useTripCapacity(trip.id);

  const currentCoords = useMemo(() => 
    location
      ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }
      : null,
    [location]
  );

  const currentWaypoint = remainingWaypoints[currentWaypointIndex] || null;

  const pickupWaypoint = trip.trip_waypoints?.find(wp => wp.type === 'pickup') || null;
  const dropoffWaypoint = trip.trip_waypoints?.find(wp => wp.type === 'dropoff') || null;

  const { isActive: _rideRequestsActive } = useRideRequestsSubscription({
    enabled: tripStatus === 'in_progress' && !!currentCoords,
    driverLocation: currentCoords,
    radiusMeters: 5000,
    onRideRequest: (request) => {
      if (!processedRequests.has(request.trip_id)) {
        setRideRequest(request);
        setShowRideRequestModal(true);
      }
    },
  });

  const fetchTripAndRecalculateRoute = useCallback(async () => {
    if (!user || !currentCoords) return;

    try {
      setRouteRecalculating(true);

      const tripWithPassengers = await bookingService.getActiveTripWithPassengers(user.id);

      if (!tripWithPassengers || tripWithPassengers.id !== trip.id) {
        return;
      }

      const names: Record<string, string> = {};
      if (tripWithPassengers && tripWithPassengers.trip_passengers) {
        tripWithPassengers.trip_passengers.forEach((tp: any) => {
          if (tp.profiles?.full_name) {
            names[tp.passenger_id] = tp.profiles.full_name;
          }
        });
      }
      setPassengerNames(names);

      const remaining = await bookingService.getRemainingWaypoints(trip.id);

      if (remaining.length === 0) {
        setRemainingWaypoints([]);
        setMultiStopRoute(null);
        return;
      }

      const waypoints: Waypoint[] = remaining.map(wp => ({
        id: wp.id,
        passenger_id: wp.passenger_id || '',
        kind: (wp.kind || wp.type) as 'pickup' | 'dropoff',
        location: wp.location as Point,
        passenger_name: passengerNames[wp.passenger_id || ''] || 'Passenger',
        address: wp.address,
      }));

      const route = await routingService.buildMultiStopRoute(
        {
          type: 'Point',
          coordinates: [currentCoords.longitude, currentCoords.latitude],
        },
        waypoints,
        { traffic: true }
      );

      setMultiStopRoute(route);
      setRemainingWaypoints(route.orderedWaypoints);
    } catch (error) {
      console.error('Error recalculating route:', error);
    } finally {
      setRouteRecalculating(false);
    }
  }, [user, currentCoords, trip.id, passengerNames]);

  useEffect(() => {
    fetchTripAndRecalculateRoute();
  }, [fetchTripAndRecalculateRoute]);

  // Recalculate when driver's device location updates (debounced)
  useEffect(() => {
    if (!currentCoords || remainingWaypoints.length === 0) return;
    const now = Date.now();
    if (now - lastRecalcRef.current < 5000) return; // debounce 5s
    lastRecalcRef.current = now;
    fetchTripAndRecalculateRoute();
  }, [currentCoords?.latitude, currentCoords?.longitude, remainingWaypoints.length, fetchTripAndRecalculateRoute]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentCoords && remainingWaypoints.length > 0) {
        fetchTripAndRecalculateRoute();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchTripAndRecalculateRoute, currentCoords, remainingWaypoints.length]);

  const handleWaypointComplete = async (waypoint: Waypoint) => {
    if (!user || isLoading) return;

    setIsLoading(true);
    try {
      await bookingService.completeWaypoint(waypoint.id);
      setCurrentWaypointIndex(prev => prev + 1);

      if (currentWaypointIndex >= remainingWaypoints.length - 1) {
        await bookingService.updateTripStatus(trip.id, 'completed');
        Alert.alert(
          'Trip Completed',
          'All passengers have been dropped off successfully!',
          [{ text: 'OK', onPress: onTripComplete }]
        );
        return;
      }

      setTimeout(() => {
        fetchTripAndRecalculateRoute();
      }, 1000);

    } catch (error) {
      Alert.alert('Error', `Failed to mark ${waypoint.kind} as complete. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTripStart = async () => {
    if (!user || isLoading) return;

    setIsLoading(true);
    try {
      await bookingService.updateTripStatus(trip.id, 'in_progress');
      setTripStatus('in_progress');
    } catch (error) {
      Alert.alert('Error', 'Failed to start trip. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRideRequest = async (request: RideRequest) => {
    if (!user || isLoading) return;

    setIsLoading(true);
    try {
      const pickupPoint: Point = {
        type: 'Point',
        coordinates: request.pickup_location.coordinates,
      };

      const dropoffPoint: Point = request.dropoff_location ? {
        type: 'Point',
        coordinates: request.dropoff_location.coordinates,
      } : pickupPoint;

      await bookingService.addPassengerToActiveTrip(
        trip.id,
        request.passenger_id,
        pickupPoint,
        dropoffPoint
      );

      await fetchTripAndRecalculateRoute();

      setShowRideRequestModal(false);
      setRideRequest(null);
      setProcessedRequests(prev => new Set([...prev, request.trip_id]));

      Alert.alert(
        'Passenger Added',
        `${request.passenger_name} has been added to your trip. Route updated!`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add passenger. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineRideRequest = async (request: RideRequest) => {
    if (!user) return;

    try {
      await tripService.rejectTrip(request.trip_id, user.id);

      setShowRideRequestModal(false);
      setRideRequest(null);
      setProcessedRequests(prev => new Set([...prev, request.trip_id]));
    } catch (error) {
      // Don't show error to user for decline failures
    }
  };

  const getStatusMessage = () => {
    if (routeRecalculating) return 'Recalculating route...';
    if (!currentWaypoint) return 'No waypoints remaining';

    const passengerName = currentWaypoint.passenger_name || 'Passenger';
    const action = currentWaypoint.kind === 'pickup' ? 'Pick up' : 'Drop off';

    return `${action} ${passengerName}`;
  };

  const getTripSummary = () => {
    const totalStops = remainingWaypoints.length;
    const completedStops = currentWaypointIndex;
    const etaMins = multiStopRoute ? Math.round(multiStopRoute.duration / 60) : null;
    const kmLeft = multiStopRoute ? (multiStopRoute.distance / 1000).toFixed(1) : null;
    const base = `${completedStops}/${totalStops + completedStops} stops completed`;
    if (etaMins != null && kmLeft != null) return `${base} • ${etaMins} min • ${kmLeft} km`;
    return base;
  };

  const getActionButton = () => {
    if (tripStatus === 'accepted') {
      return (
        <TouchableOpacity
          style={[styles.actionButton, styles.startTripButton]}
          onPress={handleTripStart}
          disabled={isLoading}
        >
          <FontAwesome5 name="play" size={20} color="white" />
          <Text style={styles.actionButtonText}>
            {isLoading ? 'Starting...' : 'Start Multi-Stop Trip'}
          </Text>
        </TouchableOpacity>
      );
    }

    if (!currentWaypoint) {
      return (
        <TouchableOpacity
          style={[styles.actionButton, styles.endTripButton]}
          onPress={onTripComplete}
          disabled={isLoading}
        >
          <FontAwesome5 name="flag-checkered" size={20} color="white" />
          <Text style={styles.actionButtonText}>All Stops Complete</Text>
        </TouchableOpacity>
      );
    }

    const actionText = currentWaypoint.kind === 'pickup' 
      ? `Picked up ${currentWaypoint.passenger_name || 'Passenger'}` 
      : `Dropped off ${currentWaypoint.passenger_name || 'Passenger'}`;
    
    return (
      <TouchableOpacity
        style={[
          styles.actionButton, 
          currentWaypoint.kind === 'pickup' ? styles.pickupButton : styles.dropoffButton
        ]}
        onPress={() => handleWaypointComplete(currentWaypoint)}
        disabled={isLoading || routeRecalculating}
      >
        <FontAwesome5 
          name={currentWaypoint.kind === 'pickup' ? 'user-plus' : 'user-check'} 
          size={20} 
          color="white" 
        />
        <Text style={styles.actionButtonText}>
          {isLoading ? 'Completing...' : actionText}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={20} color="#2C3E50" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Multi-Stop Trip</Text>
          <Text style={styles.headerSubtitle}>{getStatusMessage()}</Text>
          {remainingWaypoints.length > 0 && (
            <Text style={styles.tripSummary}>{getTripSummary()}</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusBadge,
            tripStatus === 'in_progress' && styles.statusInProgress,
            routeRecalculating && styles.statusRecalculating
          ]}>
            <Text style={styles.statusText}>
              {routeRecalculating ? 'updating' : tripStatus.replace('_', ' ')}
            </Text>
          </View>
          {multiStopRoute && (
            <View style={styles.etaPill}>
              <FontAwesome5 name="clock" size={12} color="#2C3E50" />
              <Text style={styles.etaText}>{Math.max(1, Math.round(multiStopRoute.duration / 60))} min</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.mapContainer}>
        {currentCoords ? (
          <MapView style={styles.map} logoEnabled={false} attributionEnabled={false}>
            <Camera
              zoomLevel={14}
              centerCoordinate={[currentCoords.longitude, currentCoords.latitude]}
              animationMode="flyTo"
              animationDuration={750}
            />

            <LocationPuck visible pulsing={{ isEnabled: true, color: '#4A90E2', radius: 15 }} />

            {remainingWaypoints.length > 0 && (
              <ShapeSource
                id="waypoints"
                shape={{
                  type: 'FeatureCollection',
                  features: remainingWaypoints.map((wp, index) => ({
                    type: 'Feature' as const,
                    geometry: { type: 'Point' as const, coordinates: wp.location.coordinates },
                    properties: {
                      id: wp.id,
                      index,
                      isPickup: wp.kind === 'pickup',
                      isNext: index === currentWaypointIndex,
                      label: `${wp.kind === 'pickup' ? 'Pickup' : 'Dropoff'} ${wp.passenger_name || 'Passenger'}`,
                    },
                  })),
                }}
              >
                <SymbolLayer
                  id="waypoint-symbols"
                  style={{
                    iconImage: ['case', ['get', 'isPickup'], 'marker-15', 'marker-15'],
                    iconColor: ['case', ['get', 'isPickup'], '#4A90E2', '#E74C3C'],
                    iconSize: 1.2,
                    iconAllowOverlap: true,
                    iconIgnorePlacement: true,
                    textField: ['to-string', ['+', ['get', 'index'], 1]],
                    textFont: ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    textSize: 12,
                    textColor: '#FFFFFF',
                    textHaloColor: '#000000',
                    textHaloWidth: 0.5,
                    textOffset: [0, 1.2],
                    textAnchor: 'top',
                  }}
                />
              </ShapeSource>
            )}

            {multiStopRoute && (
              <ShapeSource
                id="route"
                shape={{
                  type: 'Feature',
                  geometry: {
                    type: 'LineString',
                    coordinates: polyline.decode(multiStopRoute.polyline).map((coords: number[]) => [coords[1], coords[0]]),
                  },
                  properties: {},
                }}
              >
                <LineLayer
                  id="route-line"
                  style={{
                    lineColor: '#4A90E2',
                    lineWidth: 4,
                    lineDasharray: routeRecalculating ? [2, 2] : undefined,
                  }}
                />
              </ShapeSource>
            )}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <FontAwesome5 name="map-marked-alt" size={48} color="#BDC3C7" />
            <Text style={styles.mapPlaceholderText}>Loading map...</Text>
          </View>
        )}
      </View>

      <View style={styles.tripInfoCard}>
        <View style={styles.passengerInfo}>
          <View style={styles.passengerAvatar}>
            <FontAwesome5 name="user" size={24} color="#4A90E2" />
          </View>
          <View style={styles.passengerDetails}>
            <Text style={styles.passengerName}>
              {trip.profiles?.full_name || 'Passenger'}
            </Text>
            <Text style={styles.tripId}>Trip #{trip.id}</Text>
            {capacityInfo && (
              <Text style={styles.capacityInfo}>
                {capacityInfo.currentCount}/{capacityInfo.maxCapacity} passengers
                {!capacityInfo.canAdd && ' • Full'}
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.callButton}>
            <FontAwesome5 name="phone" size={18} color="#27AE60" />
          </TouchableOpacity>
        </View>

        <View style={styles.locationInfo}>
          {tripStatus !== 'in_progress' && (
            <View style={styles.locationRow}>
              <View style={styles.locationIcon}>
                <FontAwesome5 name="circle" size={12} color="#27AE60" />
              </View>
              <View style={styles.locationDetails}>
                <Text style={styles.locationLabel}>Pickup</Text>
                <Text style={styles.locationAddress} numberOfLines={1}>
                  {pickupWaypoint?.address || 'Pickup location'}
                </Text>
              </View>
            </View>
          )}

          {tripStatus === 'in_progress' && (
            <View style={styles.locationRow}>
              <View style={styles.locationIcon}>
                <FontAwesome5 name="map-marker-alt" size={14} color="#E74C3C" />
              </View>
              <View style={styles.locationDetails}>
                <Text style={styles.locationLabel}>Destination</Text>
                <Text style={styles.locationAddress} numberOfLines={1}>
                  {dropoffWaypoint?.address || 'Drop-off location'}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.actionContainer}>
          {getActionButton()}
        </View>
      </View>

      <RideRequestModal
        visible={showRideRequestModal}
        rideRequest={rideRequest}
        currentTripId={trip.id}
        onAccept={handleAcceptRideRequest}
        onDecline={handleDeclineRideRequest}
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  etaPill: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECF0F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  etaText: {
    color: '#2C3E50',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#F39C12',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusInProgress: {
    backgroundColor: '#27AE60',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
  },
  mapPlaceholderText: {
    marginTop: 15,
    fontSize: 16,
    color: '#7F8C8D',
  },
  driverMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  tripInfoCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  passengerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  passengerDetails: {
    flex: 1,
    marginLeft: 12,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  tripId: {
    fontSize: 14,
    color: '#95A5A6',
    marginTop: 2,
  },
  capacityInfo: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
    fontWeight: '500',
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    paddingVertical: 15,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationIcon: {
    width: 30,
    alignItems: 'center',
  },
  locationDetails: {
    flex: 1,
    marginLeft: 10,
  },
  locationLabel: {
    fontSize: 12,
    color: '#95A5A6',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  actionContainer: {
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#F39C12',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  startTripButton: {
    backgroundColor: '#27AE60',
  },
  endTripButton: {
    backgroundColor: '#E74C3C',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  tripSummary: {
    fontSize: 12,
    color: '#95A5A6',
    marginTop: 2,
    fontStyle: 'italic',
  },
  statusRecalculating: {
    backgroundColor: '#E67E22',
  },
  pickupButton: {
    backgroundColor: '#27AE60',
  },
  dropoffButton: {
    backgroundColor: '#E74C3C',
  },
  waypointMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  pickupMarker: {
    backgroundColor: '#27AE60',
  },
  dropoffMarker: {
    backgroundColor: '#E74C3C',
  },
  nextWaypointMarker: {
    borderWidth: 3,
    borderColor: '#F39C12',
    transform: [{ scale: 1.2 }],
  },
  waypointNumber: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'white',
    color: '#2C3E50',
    fontSize: 10,
    fontWeight: 'bold',
    width: 16,
    height: 16,
    borderRadius: 8,
    textAlign: 'center',
    lineHeight: 16,
  },
});
