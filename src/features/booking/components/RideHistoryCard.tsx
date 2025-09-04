import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { TripWithDetails } from '@/services/tripService';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { ThemedText, ThemedView } from '../../../components/ui/Themed';
import { useAuth } from '../../../contexts/AuthContext';

type RideHistoryCardProps = {
  ride: TripWithDetails;
};

export function RideHistoryCard({ ride }: RideHistoryCardProps) {
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';

  const driverProfile = ride.profiles;
  const driverName = driverProfile?.full_name || 'Driver';
  
  const pickupLocation = ride.trip_waypoints?.find(w => w.type === 'pickup');
  const dropoffLocation = ride.trip_waypoints?.find(w => w.type === 'dropoff');
  
  const rideDate = new Date(ride.requested_at);
  const isToday = rideDate.toDateString() === new Date().toDateString();
  const timeStr = rideDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = isToday ? 'Today' : rideDate.toLocaleDateString();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'in_progress':
        return Colors[theme].primary;
      case 'accepted':
        return '#FF9800';
      case 'requested':
        return '#2196F3';
      case 'cancelled':
        return '#F44336';
      default:
        return Colors[theme].text;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'accepted':
        return 'Accepted';
      case 'requested':
        return 'Requested';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.driverInfo}>
          <View style={styles.avatarContainer}>
            <FontAwesome5 name="user" size={20} color="white" />
          </View>
          <View style={styles.driverDetails}>
            <ThemedText style={styles.driverName}>{driverName}</ThemedText>
            <ThemedText style={styles.rideTime}>{dateStr}, {timeStr}</ThemedText>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) }]}>
          <ThemedText style={styles.statusText}>{getStatusText(ride.status)}</ThemedText>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.locationRow}>
          <View style={styles.locationIcon}>
            <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
          </View>
          <ThemedText style={styles.locationText} numberOfLines={1}>
            {pickupLocation?.address || 'Pickup Location'}
          </ThemedText>
        </View>

        <View style={styles.locationRow}>
          <View style={styles.locationIcon}>
            <View style={[styles.dot, { backgroundColor: '#F44336' }]} />
          </View>
          <ThemedText style={styles.locationText} numberOfLines={1}>
            {dropoffLocation?.address || 'Destination'}
          </ThemedText>
        </View>
      </View>

      {ride.status === 'completed' && !ratingSubmitted && (
        <View style={styles.ratingContainer}>
          <ThemedText style={styles.ratingLabel}>Your Rating:</ThemedText>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <FontAwesome5 
                key={star}
                name="star" 
                size={16} 
                color="#FFD700" 
                style={styles.star}
              />
            ))}
          </View>
        </View>
      )}

      {ride.status === 'completed' && !ratingSubmitted && (
        <View style={styles.buttonContainer}>
          <Button
            title="Rate Trip"
            onPress={() => {
              setRatingSubmitted(true);
              const rateeId = ride.profiles?.id;
              if (rateeId) {
                router.push({
                  pathname: '/(app)/passenger/rating',
                  params: { tripId: ride.id.toString(), rateeId: rateeId },
                });
              }
            }}
          />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  rideTime: {
    fontSize: 14,
    opacity: 0.6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  routeContainer: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    marginRight: 2,
  },
  buttonContainer: {
    marginTop: 8,
  },
});