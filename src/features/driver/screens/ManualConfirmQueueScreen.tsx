import { useAuth } from '@/contexts/AuthContext';
import { bookingService } from '@/services/bookingService';
import { RideRequest, tripService } from '@/services/tripService';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export function ManualConfirmQueueScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [processedRequests, setProcessedRequests] = useState<Set<number>>(new Set());

  const { data: pendingRequests, isLoading, refetch } = useQuery({
    queryKey: ['pendingRideRequests', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      return tripService.getPendingRideRequestsForDriver(user.id);
    },
    enabled: !!user,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleAcceptRequest = async (request: RideRequest) => {
    if (!user) return;

    try {
      await bookingService.updateTripStatus(request.trip_id, 'accepted', user.id);
      setProcessedRequests(prev => new Set(prev).add(request.trip_id));
      
      Alert.alert('Success', 'Ride request accepted!');
      refetch();
    } catch (error) {
      console.error('Error accepting ride request:', error);
      Alert.alert('Error', 'Failed to accept ride request. Please try again.');
    }
  };

  const handleDeclineRequest = async (request: RideRequest) => {
    if (!user) return;

    try {
      await bookingService.updateTripStatus(request.trip_id, 'declined');
      setProcessedRequests(prev => new Set(prev).add(request.trip_id));
      
      Alert.alert('Success', 'Ride request declined.');
      refetch();
    } catch (error) {
      console.error('Error declining ride request:', error);
      Alert.alert('Error', 'Failed to decline ride request. Please try again.');
    }
  };

  const filteredRequests = pendingRequests?.filter(
    request => !processedRequests.has(request.trip_id)
  ) || [];

  const renderRequestItem = ({ item }: { item: RideRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.passengerName}>{item.passenger_name}</Text>
        <Text style={styles.requestTime}>
          {new Date(item.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      
      <View style={styles.locationInfo}>
        <View style={styles.locationRow}>
          <FontAwesome5 name="map-marker-alt" size={16} color="#27AE60" style={styles.locationIcon} />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.pickup_address || 'Pickup location'}
          </Text>
        </View>
        
        {item.dropoff_address && (
          <View style={styles.locationRow}>
            <FontAwesome5 name="flag-checkered" size={16} color="#E74C3C" style={styles.locationIcon} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.dropoff_address}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.declineButton]}
          onPress={() => handleDeclineRequest(item)}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAcceptRequest(item)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!isLoading && filteredRequests.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Manual Confirm Queue</Text>
        </View>
        
        <View style={styles.emptyState}>
          <FontAwesome5 name="check-circle" size={64} color="#27AE60" />
          <Text style={styles.emptyStateTitle}>No Pending Requests</Text>
          <Text style={styles.emptyStateSubtext}>
            You have no pending ride requests to confirm.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manual Confirm Queue</Text>
        <Text style={styles.headerSubtitle}>
          {filteredRequests.length} pending request{filteredRequests.length !== 1 ? 's' : ''}
        </Text>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.trip_id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={isLoading}
          onRefresh={refetch}
        />
      )}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  requestTime: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  locationInfo: {
    marginBottom: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    width: 20,
    textAlign: 'center',
    marginRight: 10,
  },
  locationText: {
    fontSize: 16,
    color: '#2C3E50',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
 actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#E74C3C',
  },
  declineButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: '#27AE60',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 22,
  },
});