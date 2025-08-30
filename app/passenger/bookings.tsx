import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const mockBookings = [
  {
    id: 1,
    driverName: 'Juan Dela Cruz',
    pickup: 'Jollibee Branch',
    destination: 'School Campus',
    date: 'Today, 2:30 PM',
    status: 'completed',

    rating: 5,
  },
  {
    id: 2,
    driverName: 'Pedro Santos',
    pickup: 'Mall Entrance',
    destination: 'Home',
    date: 'Yesterday, 6:15 PM',
    status: 'completed',

    rating: 4,
  },
  {
    id: 3,
    driverName: 'Miguel Reyes',
    pickup: 'Office Building',
    destination: 'Restaurant',
    date: 'Dec 15, 1:00 PM',
    status: 'completed',

    rating: 5,
  },
];

export default function PassengerBookings() {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [isOnline, setIsOnline] = useState(true);

  const handleToggleOnline = () => {
    setIsOnline(!isOnline);
  };

  const renderBookingCard = (booking: any) => (
    <View key={booking.id} style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.driverInfo}>
          <View style={styles.driverPhoto}>
            <Text style={styles.driverPhotoText}>👨‍🦱</Text>
          </View>
          <View>
            <Text style={styles.driverName}>{booking.driverName}</Text>
            <Text style={styles.bookingDate}>{booking.date}</Text>
          </View>
        </View>
        <View style={styles.bookingStatus}>
          <Text style={[styles.statusText, styles.statusCompleted]}>
            {booking.status === 'completed' ? 'Completed' : 'Active'}
          </Text>
          
        </View>
      </View>
      
      <View style={styles.bookingDetails}>
        <View style={styles.locationRow}>
          <View style={styles.locationDot} />
          <Text style={styles.locationText}>{booking.pickup}</Text>
        </View>
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, styles.destinationDot]} />
          <Text style={styles.locationText}>{booking.destination}</Text>
        </View>
      </View>
      
      {booking.status === 'completed' && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingLabel}>Your Rating:</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <FontAwesome5
                key={star}
                name="star"
                size={16}
                color={star <= booking.rating ? '#F39C12' : '#E8E8E8'}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Rides</Text>
        <TouchableOpacity
          style={[styles.onlineButton, isOnline && styles.onlineButtonActive]}
          onPress={handleToggleOnline}
        >
          <Text style={[styles.onlineButtonText, isOnline && styles.onlineButtonTextActive]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'current' && styles.activeTab]}
          onPress={() => setActiveTab('current')}
        >
          <Text style={[styles.tabText, activeTab === 'current' && styles.activeTabText]}>
            Current Ride
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            Ride History
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'current' ? (
          <View style={styles.currentRideContainer}>
            <View style={styles.noCurrentRide}>
              <FontAwesome5 name="car" size={48} color="#BDC3C7" />
              <Text style={styles.noRideTitle}>No Active Ride</Text>
              <Text style={styles.noRideSubtitle}>
                You don't have any active rides at the moment
              </Text>
              <TouchableOpacity style={styles.bookRideButton}>
                <Text style={styles.bookRideButtonText}>Book a Ride</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.historyContainer}>
            {mockBookings.length > 0 ? (
              mockBookings.map(renderBookingCard)
            ) : (
              <View style={styles.noHistory}>
                <FontAwesome5 name="history" size={48} color="#BDC3C7" />
                <Text style={styles.noHistoryTitle}>No Ride History</Text>
                <Text style={styles.noHistorySubtitle}>
                  Your completed rides will appear here
                </Text>
              </View>
            )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  onlineButton: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BDC3C7',
  },
  onlineButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  onlineButtonText: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  onlineButtonTextActive: {
    color: 'white',
    fontWeight: '600',
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
    backgroundColor: '#4A90E2',
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
  currentRideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noCurrentRide: {
    alignItems: 'center',
  },
  noRideTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7F8C8D',
    marginTop: 20,
    marginBottom: 10,
  },
  noRideSubtitle: {
    fontSize: 16,
    color: '#BDC3C7',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  bookRideButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  bookRideButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  historyContainer: {
    paddingBottom: 20,
  },
  noHistory: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noHistoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7F8C8D',
    marginTop: 20,
    marginBottom: 10,
  },
  noHistorySubtitle: {
    fontSize: 16,
    color: '#BDC3C7',
    textAlign: 'center',
    lineHeight: 22,
  },
  bookingCard: {
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
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverPhotoText: {
    fontSize: 20,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  bookingStatus: {
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

  bookingDetails: {
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
});
