import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const mockRides = [
  {
    id: 1,
    passenger: 'Maria Santos',
    pickup: 'Jollibee Branch',
    destination: 'School Campus',
    date: 'Today, 2:30 PM',
    status: 'completed',

    rating: 5,
  },
  {
    id: 2,
    passenger: 'John Doe',
    pickup: 'Mall Entrance',
    destination: 'Home',
    date: 'Today, 1:15 PM',
    status: 'completed',

    rating: 4,
  },
  {
    id: 3,
    passenger: 'Ana Garcia',
    pickup: 'Office Building',
    destination: 'Restaurant',
    date: 'Today, 12:45 PM',
    status: 'active',

    rating: null,
  },
  {
    id: 4,
    passenger: 'Carlos Lopez',
    pickup: 'Bus Station',
    destination: 'Shopping Center',
    date: 'Today, 11:30 AM',
    status: 'completed',

    rating: 5,
  },
];

export default function DriverRides() {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const filteredRides = mockRides.filter(ride => 
    activeTab === 'active' ? ride.status === 'active' : ride.status === 'completed'
  );

  const renderRideCard = (ride: any) => (
    <View key={ride.id} style={styles.rideCard}>
      <View style={styles.rideHeader}>
        <View style={styles.passengerInfo}>
          <View style={styles.passengerPhoto}>
            <Text style={styles.passengerPhotoText}>👤</Text>
          </View>
          <View>
            <Text style={styles.passengerName}>{ride.passenger}</Text>
            <Text style={styles.rideDate}>{ride.date}</Text>
          </View>
        </View>
        
        <View style={styles.rideStatus}>
          <Text style={[
            styles.statusText,
            ride.status === 'completed' ? styles.statusCompleted : styles.statusActive
          ]}>
            {ride.status === 'completed' ? 'Completed' : 'Active'}
          </Text>
          
        </View>
      </View>
      
      <View style={styles.rideDetails}>
        <View style={styles.locationRow}>
          <View style={styles.locationDot} />
          <Text style={styles.locationText}>{ride.pickup}</Text>
        </View>
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, styles.destinationDot]} />
          <Text style={styles.locationText}>{ride.destination}</Text>
        </View>
      </View>
      
      {ride.status === 'completed' && ride.rating && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingLabel}>Passenger Rating:</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <FontAwesome5
                key={star}
                name="star"
                size={16}
                color={star <= ride.rating ? '#F39C12' : '#E8E8E8'}
              />
            ))}
          </View>
        </View>
      )}
      
      {ride.status === 'active' && (
        <View style={styles.activeRideActions}>
          <TouchableOpacity style={styles.startTripButton}>
            <FontAwesome5 name="play" size={16} color="white" />
            <Text style={styles.startTripButtonText}>Start Trip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelTripButton}>
            <FontAwesome5 name="times" size={16} color="#E74C3C" />
            <Text style={styles.cancelTripButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Rides</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Active Rides
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredRides.length > 0 ? (
          filteredRides.map(renderRideCard)
        ) : (
          <View style={styles.noRidesContainer}>
            <FontAwesome5 
              name={activeTab === 'active' ? 'route' : 'check-circle'} 
              size={48} 
              color="#BDC3C7" 
            />
            <Text style={styles.noRidesTitle}>
              {activeTab === 'active' ? 'No Active Rides' : 'No Completed Rides'}
            </Text>
            <Text style={styles.noRidesSubtitle}>
              {activeTab === 'active' 
                ? 'You don\'t have any active rides at the moment'
                : 'Your completed rides will appear here'
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: '#27AE60',
  },
  tabText: {
    fontSize: 16,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  activeTabText: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  noRidesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noRidesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7F8C8D',
    marginTop: 20,
    marginBottom: 10,
  },
  noRidesSubtitle: {
    fontSize: 16,
    color: '#BDC3C7',
    textAlign: 'center',
    lineHeight: 22,
  },
  rideCard: {
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
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passengerPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  passengerPhotoText: {
    fontSize: 20,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  rideDate: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  rideStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
  statusCompleted: {
    color: '#27AE60',
  },
  statusActive: {
    color: '#F39C12',
  },

  rideDetails: {
    marginBottom: 15,
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
    backgroundColor: '#27AE60',
    marginRight: 10,
  },
  destinationDot: {
    backgroundColor: '#E74C3C',
  },
  locationText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  ratingLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginRight: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 5,
  },
  activeRideActions: {
    flexDirection: 'row',
    gap: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  startTripButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27AE60',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  startTripButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelTripButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E74C3C',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  cancelTripButtonText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: '600',
  },
});
