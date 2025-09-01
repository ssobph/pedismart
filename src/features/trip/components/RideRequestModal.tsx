import { RideRequest } from '@/services/tripService';
import { FontAwesome5 } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface RideRequestModalProps {
  visible: boolean;
  rideRequest: RideRequest | null;
  onAccept: (request: RideRequest) => void;
  onDecline: (request: RideRequest) => void;
  timeoutSeconds?: number;
}

export function RideRequestModal({
  visible,
  rideRequest,
  onAccept,
  onDecline,
  timeoutSeconds = 30,
}: RideRequestModalProps) {
  const [remainingTime, setRemainingTime] = useState(timeoutSeconds);

  useEffect(() => {
    if (visible && rideRequest) {
      setRemainingTime(timeoutSeconds);
      
      const interval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            onDecline(rideRequest);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [visible, rideRequest, timeoutSeconds, onDecline]);

  if (!visible || !rideRequest) return null;

  const formatDistance = (meters?: number) => {
    if (!meters) return 'N/A';
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => onDecline(rideRequest)}
    >
      <View style={styles.container}>
        <View style={styles.backdrop} />
        <View style={styles.modalContent}>
          <View style={styles.timerContainer}>
            <View style={[styles.timerCircle, remainingTime <= 10 && styles.timerUrgent]}>
              <Text style={styles.timerText}>{remainingTime}</Text>
              <Text style={styles.timerLabel}>seconds</Text>
            </View>
          </View>

          <View style={styles.header}>
            <FontAwesome5 name="bell" size={24} color="#FF9800" />
            <Text style={styles.title}>New Ride Request!</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.infoRow}>
              <FontAwesome5 name="user" size={18} color="#4A90E2" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Passenger</Text>
                <Text style={styles.infoText}>{rideRequest.passenger_name}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.infoRow}>
              <FontAwesome5 name="map-marker-alt" size={18} color="#27AE60" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Pickup Location</Text>
                <Text style={styles.infoText} numberOfLines={2}>
                  {rideRequest.pickup_address || 'Location on map'}
                </Text>
              </View>
            </View>

            {rideRequest.dropoff_address && (
              <View style={styles.infoRow}>
                <FontAwesome5 name="flag-checkered" size={18} color="#E74C3C" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Destination</Text>
                  <Text style={styles.infoText} numberOfLines={2}>
                    {rideRequest.dropoff_address}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.metricsContainer}>
            <View style={styles.metricCard}>
              <FontAwesome5 name="route" size={16} color="#7F8C8D" />
              <Text style={styles.metricValue}>
                {formatDistance(rideRequest.distance_to_pickup)}
              </Text>
              <Text style={styles.metricLabel}>to pickup</Text>
            </View>

            <View style={styles.metricCard}>
              <FontAwesome5 name="clock" size={16} color="#7F8C8D" />
              <Text style={styles.metricValue}>
                {formatTime(rideRequest.estimated_pickup_time)}
              </Text>
              <Text style={styles.metricLabel}>ETA</Text>
            </View>

            <View style={styles.metricCard}>
              <FontAwesome5 name="road" size={16} color="#7F8C8D" />
              <Text style={styles.metricValue}>
                {formatTime(rideRequest.estimated_trip_duration)}
              </Text>
              <Text style={styles.metricLabel}>trip time</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.declineButton} 
              onPress={() => onDecline(rideRequest)}
            >
              <FontAwesome5 name="times" size={18} color="white" />
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.acceptButton} 
              onPress={() => onAccept(rideRequest)}
            >
              <FontAwesome5 name="check" size={18} color="white" />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: width - 40,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  timerContainer: {
    position: 'absolute',
    top: -40,
    alignSelf: 'center',
    zIndex: 1,
  },
  timerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  timerUrgent: {
    backgroundColor: '#E74C3C',
  },
  timerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  timerLabel: {
    fontSize: 10,
    color: 'white',
    marginTop: -4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 20,
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  section: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 5,
  },
  metricLabel: {
    fontSize: 11,
    color: '#95A5A6',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 15,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#E74C3C',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  declineButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#27AE60',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
