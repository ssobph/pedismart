import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { useUpdateProfile } from '../hooks/useUpdateProfile';

interface ProfileFormProps {
  isVisible: boolean;
  onClose: () => void;
  profile: any;
}

export function EditVehicleModal({ isVisible, onClose, profile }: ProfileFormProps) {
  const [plateNumber, setPlateNumber] = useState(profile.plate_number || '');
  const [vehicleDetails, setVehicleDetails] = useState(profile.vehicle_details || '');

  const { mutate, isPending } = useUpdateProfile();

  const handleSave = () => {
    const updates: any = {
      plate_number: plateNumber.trim(),
      vehicle_details: vehicleDetails.trim(),
      role: profile.role,
    };

    mutate(
      updates,
      {
        onSuccess: () => {
          Alert.alert('Success', 'Vehicle updated successfully');
          onClose();
        },
        onError: (error) => {
          Alert.alert('Error', error.message || 'Failed to update vehicle');
        },
      }
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Edit Vehicle</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Plate Number</Text>
            <TextInput
              style={styles.input}
              value={plateNumber}
              onChangeText={setPlateNumber}
              placeholder="Enter your plate number"
              placeholderTextColor="#BDC3C7"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Vehicle Details</Text>
            <TextInput
              style={styles.input}
              value={vehicleDetails}
              onChangeText={setVehicleDetails}
              placeholder="Enter your vehicle details"
              placeholderTextColor="#BDC3C7"
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isPending}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={isPending}
            >
              <Text style={styles.saveButtonText}>
                {isPending ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2C3E50',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#7F8C8D',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});