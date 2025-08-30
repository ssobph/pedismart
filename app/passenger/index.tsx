import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function PassengerHome() {
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [availablePedicabs, setAvailablePedicabs] = useState(4);
  const [avgETA, setAvgETA] = useState('3 min');
  const [isOnline, setIsOnline] = useState(true);

  const handleToggleOnline = () => {
    setIsOnline(!isOnline);
  };

  // Removed handleFindDrivers function since we're consolidating into one feature

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find a Ride</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.passengerBadge}>
            <Text style={styles.passengerBadgeText}>Passenger</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.onlineButton, isOnline && styles.onlineButtonActive]}
            onPress={handleToggleOnline}
          >
            <Text style={[styles.onlineButtonText, isOnline && styles.onlineButtonTextActive]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.locationInputs}>
        <View style={styles.inputContainer}>
          <View style={styles.locationDot} />
          <TextInput
            style={styles.locationInput}
            placeholder="Pickup location"
            value={pickupLocation}
            onChangeText={setPickupLocation}
            placeholderTextColor="#7F8C8D"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <View style={[styles.locationDot, styles.destinationDot]} />
          <TextInput
            style={styles.locationInput}
            placeholder="Where to?"
            value={destination}
            onChangeText={setDestination}
            placeholderTextColor="#7F8C8D"
          />
        </View>
      </View>

      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <View style={styles.mapPin}>
            <FontAwesome5 name="map-marker-alt" size={24} color="#4A90E2" />
          </View>
          <Text style={styles.mapText}>Available Pedicabs</Text>
          <Text style={styles.mapSubtext}>Tap to see details</Text>
          
          {/* Available Pedicab Icons */}
          <View style={styles.pedicabIcons}>
            <View style={styles.pedicabIcon}>
              <FontAwesome5 name="car" size={16} color="white" />
            </View>
            <View style={styles.pedicabIcon}>
              <FontAwesome5 name="car" size={16} color="white" />
            </View>
            <View style={styles.pedicabIcon}>
              <FontAwesome5 name="car" size={16} color="white" />
            </View>
            <View style={styles.pedicabIcon}>
              <FontAwesome5 name="car" size={16} color="white" />
            </View>
          </View>
          
          <View style={styles.mapControls}>
            <TouchableOpacity style={styles.mapButton}>
              <FontAwesome5 name="car" size={16} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapButton}>
              <FontAwesome5 name="sync" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.summaryCards}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{availablePedicabs}</Text>
          <Text style={styles.summaryLabel}>Available</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryNumber, styles.etaNumber]}>{avgETA}</Text>
          <Text style={styles.summaryLabel}>Avg ETA</Text>
        </View>
        
        
      </View>

      <TouchableOpacity style={styles.manualButton} onPress={() => router.push('/passenger/manual-booking')}>
        <Text style={styles.manualButtonText}>Find Available Pedicabs</Text>
        <Text style={styles.manualButtonSubtext}>Tap pedicab to request ride</Text>
      </TouchableOpacity>
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passengerBadge: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  passengerBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  onlineButton: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  onlineButtonActive: {
    backgroundColor: '#4A90E2',
  },
  onlineButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  onlineButtonTextActive: {
    color: 'white',
  },
  locationInputs: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#27AE60',
    marginRight: 12,
  },
  destinationDot: {
    backgroundColor: '#E74C3C',
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
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
  pedicabIcons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
    marginBottom: 30,
  },
  pedicabIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapControls: {
    position: 'absolute',
    right: 20,
    top: 20,
    gap: 10,
  },
  mapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27AE60',
    marginBottom: 5,
  },
  etaNumber: {
    color: '#4A90E2',
  },

  summaryLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  manualButton: {
    backgroundColor: '#2C3E50',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  manualButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  manualButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
});
