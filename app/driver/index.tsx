import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(true);

  const handleToggleOnline = () => {
    setIsOnline(!isOnline);
  };

  const handleAcceptRide = () => {
    // Handle ride acceptance
    console.log('Ride accepted');
  };

  const handleDeclineRide = () => {
    // Handle ride decline
    console.log('Ride declined');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Driver Dashboard</Text>
        <View style={styles.headerActions}>
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

      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <FontAwesome5 name="users" size={24} color="#4A90E2" />
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          
          <View style={styles.statCard}>
            <FontAwesome5 name="star" size={24} color="#F39C12" />
            <Text style={styles.statNumber}>4.8</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          
          <View style={styles.statCard}>
            <FontAwesome5 name="clock" size={24} color="#27AE60" />
            <Text style={styles.statNumber}>8.5</Text>
            <Text style={styles.statLabel}>Hours</Text>
          </View>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <View style={styles.mapPin}>
            <FontAwesome5 name="map-marker-alt" size={24} color="#27AE60" />
          </View>
          <Text style={styles.mapText}>Driver Map View</Text>
          <Text style={styles.mapSubtext}>Tap passenger icons to offer rides</Text>
          
          {/* Passenger Icons on Map */}
          <View style={styles.passengerIcons}>
            <View style={styles.passengerIcon}>
              <FontAwesome5 name="user" size={16} color="white" />
            </View>
            <View style={styles.passengerIcon}>
              <FontAwesome5 name="user" size={16} color="white" />
            </View>
            <View style={styles.passengerIcon}>
              <FontAwesome5 name="user" size={16} color="white" />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.rideRequestContainer}>
        <View style={styles.rideRequestCard}>
          <View style={styles.rideRequestHeader}>
            <Text style={styles.rideRequestTitle}>New Ride Request!</Text>
            <View style={styles.requestId}>
              <Text style={styles.requestIdText}>25</Text>
            </View>
          </View>
          
          <View style={styles.rideRequestDetails}>
            <View style={styles.rideDetailRow}>
              <FontAwesome5 name="user" size={16} color="#4A90E2" />
              <Text style={styles.rideDetailText}>Passenger: Maria Santos</Text>
            </View>
            
            <View style={styles.rideDetailRow}>
              <FontAwesome5 name="map-marker-alt" size={16} color="#27AE60" />
              <Text style={styles.rideDetailText}>Pickup: Jollibee Branch</Text>
            </View>
            
            <View style={styles.rideDetailRow}>
              <FontAwesome5 name="flag-checkered" size={16} color="#E74C3C" />
              <Text style={styles.rideDetailText}>Destination: School Campus</Text>
            </View>
            
            
          </View>
          
          <View style={styles.rideRequestActions}>
            <TouchableOpacity style={styles.declineButton} onPress={handleDeclineRide}>
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptRide}>
              <Text style={styles.acceptButtonText}>Accept Ride</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  onlineButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
    borderWidth: 1,
    borderColor: '#BDC3C7',
  },
  onlineButtonActive: {
    backgroundColor: '#27AE60',
    borderColor: '#27AE60',
  },
  onlineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  onlineButtonTextActive: {
    color: 'white',
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
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 10,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '500',
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
  passengerIcons: {
    position: 'absolute',
    left: 20,
    top: 20,
    gap: 10,
  },
  passengerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rideRequestContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  rideRequestCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  rideRequestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  rideRequestTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E65100',
  },
  requestId: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestIdText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rideRequestDetails: {
    marginBottom: 20,
  },
  rideDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  rideDetailText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  rideRequestActions: {
    flexDirection: 'row',
    gap: 15,
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#E74C3C',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#27AE60',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
