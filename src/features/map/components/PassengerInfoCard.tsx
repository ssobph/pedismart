import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { PassengerSeekingRide } from '@/services/tripService';

interface PassengerInfoCardProps {
  passenger: PassengerSeekingRide & {
    rating?: number;
    destination_address?: string;
  };
  eta: number; // in minutes
  onPress: () => void;
  disabled?: boolean;
  isPending?: boolean;
}

export function PassengerInfoCard({ 
  passenger, 
  eta, 
  onPress, 
  disabled = false,
  isPending = false 
}: PassengerInfoCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isPending && styles.containerPending,
        disabled && styles.containerDisabled
      ]}
      onPress={onPress}
      disabled={disabled || isPending}
    >
      <View style={styles.passengerInfo}>
        {/* Avatar placeholder */}
        <View style={styles.avatarContainer}>
          <FontAwesome5 name="user" size={20} color="white" />
        </View>
        
        {/* Passenger details */}
        <View style={styles.passengerDetails}>
          <Text style={styles.passengerName}>{passenger.passenger_name}</Text>
          
          {/* Rating display */}
          <View style={styles.ratingRow}>
            {passenger.rating ? (
              <>
                <FontAwesome5 name="star" size={12} color="#F39C12" />
                <Text style={styles.ratingText}>{passenger.rating.toFixed(1)}</Text>
              </>
            ) : (
              <Text style={styles.noRatingText}>No rating</Text>
            )}
          </View>
        </View>
        
        {/* ETA display */}
        <View style={styles.etaContainer}>
          <Text style={styles.etaValue}>{eta} min</Text>
          <Text style={styles.etaLabel}>ETA</Text>
        </View>
      </View>
      
      {/* Location information */}
      <View style={styles.locationInfo}>
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, styles.pickupDot]} />
          <Text style={styles.locationText} numberOfLines={1}>
            {passenger.pickup_address || 'Pickup location'}
          </Text>
        </View>
        
        {passenger.destination_address && (
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, styles.destinationDot]} />
            <Text style={styles.locationText} numberOfLines={1}>
              {passenger.destination_address}
            </Text>
          </View>
        )}
      </View>
      
      {/* Pending indicator */}
      {isPending && (
        <View style={styles.pendingOverlay}>
          <FontAwesome5 name="clock" size={20} color="#F39C12" />
          <Text style={styles.pendingText}>Offering ride...</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
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
  containerPending: {
    borderColor: '#F39C12',
    backgroundColor: '#FFF3CD',
  },
  containerDisabled: {
    opacity: 0.5,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  passengerDetails: {
    flex: 1,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ratingText: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  noRatingText: {
    fontSize: 12,
    color: '#BDC3C7',
    fontStyle: 'italic',
  },
  etaContainer: {
    alignItems: 'center',
  },
  etaValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  etaLabel: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  locationInfo: {
    marginBottom: 5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  pickupDot: {
    backgroundColor: '#27AE60',
  },
  destinationDot: {
    backgroundColor: '#E74C3C',
  },
  locationText: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
    flex: 1,
  },
  pendingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    gap: 8,
  },
  pendingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F39C12',
  },
});
