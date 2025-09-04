import { TripWithDetails } from '@/services/tripService';
import { FontAwesome5 } from '@expo/vector-icons';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PassengerOfferModalProps {
  visible: boolean;
  offer: TripWithDetails | null;
  onAccept: (trip: TripWithDetails) => void;
  onDecline: (trip: TripWithDetails) => void;
}

export function PassengerOfferModal({
  visible,
  offer,
  onAccept,
  onDecline,
}: PassengerOfferModalProps) {
  if (!offer) {
    return null;
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => onDecline(offer)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>You have a ride offer!</Text>
          <View style={styles.driverInfo}>
            <FontAwesome5 name="car-side" size={24} color="#3498DB" />
            <Text style={styles.driverName}>{offer.profiles?.full_name || 'A driver'}</Text>
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.declineButton]}
              onPress={() => onDecline(offer)}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.acceptButton]}
              onPress={() => onAccept(offer)}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginLeft: 10,
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
});