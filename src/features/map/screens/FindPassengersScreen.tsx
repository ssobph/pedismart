import { useAuth } from '@/contexts/AuthContext';
import { useDriverStatus } from '@/contexts/DriverStatusContext';
import { useLocation } from '@/contexts/LocationContext';
import { AvailabilityToggle } from '@/features/driver/components/AvailabilityToggle';
import { PassengerInfoCard } from '@/features/map/components/PassengerInfoCard';
import { SummaryCard } from '@/features/map/components/SummaryCard';
import { useNearbyPassengers } from '@/features/map/hooks/useNearbyPassengers';
import { bookingService } from '@/services/bookingService';
import { PassengerRating, ratingService } from '@/services/ratingService';
import { PassengerSeekingRide } from '@/services/tripService';
import { FontAwesome5 } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export function FindPassengersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { location } = useLocation();
  const { isOnline, isLoading: statusLoading } = useDriverStatus();
  
  const [selectedPassenger, setSelectedPassenger] = useState<PassengerSeekingRide | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingTripId, setPendingTripId] = useState<number | null>(null);
  const [passengerRatings, setPassengerRatings] = useState<Map<string, PassengerRating>>(new Map());

  const { 
    data: nearbyPassengers, 
    isLoading: passengersLoading
  } = useNearbyPassengers(
    isOnline && location 
      ? { latitude: location.coords.latitude, longitude: location.coords.longitude } 
      : null, 
    5000
  );

  useEffect(() => {
    const fetchRatings = async () => {
      if (nearbyPassengers && nearbyPassengers.length > 0) {
        const passengerIds = nearbyPassengers.map(p => p.passenger_id);
        const ratings = await ratingService.getAverageRatings(passengerIds);
        setPassengerRatings(ratings);
      }
    };
    fetchRatings();
  }, [nearbyPassengers]);

  const acceptRideMutation = useMutation({
    mutationFn: async (tripId: number) => {
      if (!user) throw new Error('User not authenticated');
      return bookingService.updateTripStatus(tripId, 'accepted', user.id);
    },
    onSuccess: () => {
      Alert.alert('Success', 'Ride accepted! Navigate to pickup location.', [
        {
          text: 'OK',
          onPress: () => router.push('/(app)/driver/(tabs)/dashboard'),
        },
      ]);
      setShowConfirmModal(false);
      setPendingTripId(null);
      setSelectedPassenger(null);
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to accept ride. Please try again.');
      console.error('Error accepting ride:', error);
      setPendingTripId(null);
    },
  });

  const availableCount = nearbyPassengers?.length || 0;
  
  const averageETA = nearbyPassengers && nearbyPassengers.length > 0
    ? Math.round(
        nearbyPassengers.reduce((acc, p) => acc + Math.ceil((p.distance_meters || 0) / 500), 0) / 
        nearbyPassengers.length
      )
    : 0;

  const averageRating = nearbyPassengers && nearbyPassengers.length > 0
    ? nearbyPassengers.reduce((acc, p) => {
        const rating = passengerRatings.get(p.passenger_id);
        return acc + (rating?.average_rating || 0);
      }, 0) / nearbyPassengers.length
    : 0;

  const handlePassengerSelect = (passenger: PassengerSeekingRide) => {
    setSelectedPassenger(passenger);
    setShowConfirmModal(true);
  };

  const handleConfirmOffer = () => {
    if (selectedPassenger) {
      setPendingTripId(selectedPassenger.trip_id);
      acceptRideMutation.mutate(selectedPassenger.trip_id);
    }
  };

  const handleCancelOffer = () => {
    setShowConfirmModal(false);
    setSelectedPassenger(null);
  };

  const calculateETA = (distanceMeters: number | undefined): number => {
    if (!distanceMeters) return 0;
    return Math.ceil(distanceMeters / 500); // 500 meters per minute
  };

  if (statusLoading || (isOnline && passengersLoading && !nearbyPassengers)) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading passengers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Passengers</Text>
        <AvailabilityToggle variant="default" size="small" />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <SummaryCard
            icon="users"
            iconColor="#4A90E2"
            value={availableCount}
            label="Available"
          />
          <SummaryCard
            icon="clock"
            iconColor="#F39C12"
            value={`${averageETA} min`}
            label="Avg ETA"
          />
          <SummaryCard
            icon="star"
            iconColor="#27AE60"
            value={averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
            label="Avg Rating"
          />
        </View>
      </View>

      <ScrollView style={styles.passengersList} showsVerticalScrollIndicator={false}>
        {!isOnline ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="toggle-off" size={48} color="#BDC3C7" />
            <Text style={styles.emptyStateTitle}>You&apos;re Offline</Text>
            <Text style={styles.emptyStateSubtext}>
              Go online to start finding passengers
            </Text>
          </View>
        ) : nearbyPassengers && nearbyPassengers.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>
              Available Passengers ({nearbyPassengers.length})
            </Text>
            <Text style={styles.sectionSubtitle}>Tap passenger to offer ride</Text>
            
            {nearbyPassengers.map((passenger) => {
              const rating = passengerRatings.get(passenger.passenger_id);
              const eta = calculateETA(passenger.distance_meters);
              const isPending = pendingTripId === passenger.trip_id;
              const isDisabled = pendingTripId !== null && !isPending;
              
              return (
                <PassengerInfoCard
                  key={passenger.trip_id}
                  passenger={{
                    ...passenger,
                    rating: rating?.average_rating,
                  }}
                  eta={eta}
                  onPress={() => handlePassengerSelect(passenger)}
                  disabled={isDisabled}
                  isPending={isPending}
                />
              );
            })}
          </>
        ) : (
          <View style={styles.emptyState}>
            <FontAwesome5 name="users-slash" size={48} color="#BDC3C7" />
            <Text style={styles.emptyStateTitle}>No Passengers Available</Text>
            <Text style={styles.emptyStateSubtext}>
              No passengers are looking for rides nearby
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showConfirmModal}
        onRequestClose={handleCancelOffer}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalBackdrop} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Offer Ride</Text>
            <Text style={styles.modalText}>
              Do you want to offer a ride to {selectedPassenger?.passenger_name}?
            </Text>
            {selectedPassenger?.pickup_address && (
              <View style={styles.modalDetail}>
                <FontAwesome5 name="map-marker-alt" size={16} color="#27AE60" />
                <Text style={styles.modalDetailText}>
                  Pickup: {selectedPassenger.pickup_address}
                </Text>
              </View>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelOffer}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirmOffer}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
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
  passengersList: {
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  modalDetailText: {
    fontSize: 14,
    color: '#7F8C8D',
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E8E8E8',
  },
  cancelButtonText: {
    color: '#7F8C8D',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#27AE60',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
