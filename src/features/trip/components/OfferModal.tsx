import { Database } from '@/types/database.types';
import { FontAwesome5 } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Trip = Database['public']['Tables']['trips']['Row'];

interface OfferModalProps {
  visible: boolean;
  trip: Trip | null;
  onAccept: (trip: Trip) => void;
  onDecline: (trip: Trip) => void;
  timeoutSeconds?: number;
}

const { width } = Dimensions.get('window');

export function OfferModal({
  visible,
  trip,
  onAccept,
  onDecline,
  timeoutSeconds = 30,
}: OfferModalProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeoutSeconds);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = async () => {
    if (!trip || isProcessing) return;
    setIsProcessing(true);
    try {
      await onAccept(trip);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!trip || isProcessing) return;
    setIsProcessing(true);
    try {
      await onDecline(trip);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (visible && trip) {
      setTimeRemaining(timeoutSeconds);
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Auto-decline if timeout
            handleDecline();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [visible, trip, handleDecline, timeoutSeconds]);





  if (!trip) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="car" size={24} color="#27AE60" />
            </View>
            <Text style={styles.title}>Ride Offer Received!</Text>
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>{timeRemaining}s</Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Driver is offering you a ride</Text>
            <Text style={styles.infoText}>
              A driver nearby has offered to pick you up at your location
            </Text>
          </View>

          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <FontAwesome5 name="map-marker-alt" size={16} color="#4A90E2" />
              <Text style={styles.detailText}>Pickup at your current location</Text>
            </View>
            <View style={styles.detailRow}>
              <FontAwesome5 name="clock" size={16} color="#F39C12" />
              <Text style={styles.detailText}>Driver will arrive soon</Text>
            </View>
            <View style={styles.detailRow}>
              <FontAwesome5 name="route" size={16} color="#27AE60" />
              <Text style={styles.detailText}>Direct route to destination</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={handleDecline}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <FontAwesome5 name="times" size={18} color="white" />
                  <Text style={styles.buttonText}>Decline</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={handleAccept}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <FontAwesome5 name="check" size={18} color="white" />
                  <Text style={styles.buttonText}>Accept Ride</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.warningText}>
            This offer will expire in {timeRemaining} seconds
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  timerContainer: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F57C00',
  },
  infoSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 20,
  },
  detailsSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#2C3E50',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  declineButton: {
    backgroundColor: '#E74C3C',
  },
  acceptButton: {
    backgroundColor: '#27AE60',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  warningText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#95A5A6',
    fontStyle: 'italic',
  },
});
