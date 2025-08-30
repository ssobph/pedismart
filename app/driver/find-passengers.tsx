import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert, Animated } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const mockPassengers = [
  {
    id: 1,
    name: 'Maria Santos',
    rating: 4.9,
    pickup: 'Jollibee Branch',
    destination: 'School Campus',
    eta: '3 min',
    photo: '👩‍🦰',
    isAvailable: true,
  },
  {
    id: 2,
    name: 'Ana Garcia',
    rating: 4.7,
    pickup: 'Mall Entrance',
    destination: 'Home',
    eta: '5 min',
    photo: '👩‍🦱',
    isAvailable: true,
  },
  {
    id: 3,
    name: 'Sofia Rodriguez',
    rating: 4.8,
    pickup: 'Office Building',
    destination: 'Restaurant',
    eta: '7 min',
    photo: '👩‍🦲',
    isAvailable: true,
  },
  {
    id: 4,
    name: 'Isabella Martinez',
    rating: 4.6,
    pickup: 'Hospital',
    destination: 'Shopping Center',
    eta: '4 min',
    photo: '👩‍🦳',
    isAvailable: true,
  },
];

export default function FindPassengers() {
  const [selectedPassenger, setSelectedPassenger] = useState<number | null>(null);
  const [isOffering, setIsOffering] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [passengers, setPassengers] = useState(mockPassengers);
  const [isOnline, setIsOnline] = useState(true);
  const countdownRef = useRef<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isOffering && countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      handleOfferTimeout();
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [isOffering, countdown]);

  const handleToggleOnline = () => {
    setIsOnline(!isOnline);
  };

  const handlePassengerSelect = (passengerId: number) => {
    if (isOffering) return;
    
    setSelectedPassenger(passengerId);
    setIsOffering(true);
    setCountdown(30);
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleOfferTimeout = () => {
    setIsOffering(false);
    setCountdown(30);
    setSelectedPassenger(null);
    fadeAnim.setValue(1);
    
    Alert.alert(
      'Offer Timeout',
      'Passenger did not respond in time. You can try another passenger.',
      [{ text: 'OK' }]
    );
  };

  const cancelOffer = () => {
    setIsOffering(false);
    setCountdown(30);
    setSelectedPassenger(null);
    fadeAnim.setValue(1);
    
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Passengers</Text>
        <TouchableOpacity
          style={[styles.onlineButton, isOnline && styles.onlineButtonActive]}
          onPress={handleToggleOnline}
        >
          <Text style={[styles.onlineButtonText, isOnline && styles.onlineButtonTextActive]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <FontAwesome5 name="users" size={24} color="#4A90E2" />
            <Text style={styles.statNumber}>{passengers.filter(p => p.isAvailable).length}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          
          <View style={styles.statCard}>
            <FontAwesome5 name="clock" size={24} color="#F39C12" />
            <Text style={styles.statNumber}>{passengers.reduce((acc, p) => acc + parseInt(p.eta), 0) / passengers.length} min</Text>
            <Text style={styles.statLabel}>Avg ETA</Text>
          </View>
          
          <View style={styles.statCard}>
            <FontAwesome5 name="star" size={24} color="#27AE60" />
            <Text style={styles.statNumber}>4.8</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>
      </View>

      {isOffering && selectedPassenger && (
        <View style={styles.offerStatus}>
          <Animated.View style={[styles.countdownContainer, { opacity: fadeAnim }]}>
            <Text style={styles.countdownText}>{formatTime(countdown)}</Text>
            <Text style={styles.countdownLabel}>Waiting for passenger response...</Text>
          </Animated.View>
          
          <TouchableOpacity style={styles.cancelButton} onPress={cancelOffer}>
            <Text style={styles.cancelButtonText}>Cancel Offer</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.passengersList} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>
          Available Passengers ({passengers.filter(p => p.isAvailable).length})
        </Text>
        <Text style={styles.sectionSubtitle}>Tap passenger to offer ride</Text>
        
        {passengers.map((passenger) => (
          <TouchableOpacity
            key={passenger.id}
            style={[
              styles.passengerCard,
              selectedPassenger === passenger.id && styles.passengerCardSelected,
              !passenger.isAvailable && styles.passengerCardUnavailable
            ]}
            onPress={() => handlePassengerSelect(passenger.id)}
            disabled={!passenger.isAvailable || isOffering}
          >
            <View style={styles.passengerInfo}>
              <View style={styles.passengerPhoto}>
                <Text style={styles.passengerPhotoText}>{passenger.photo}</Text>
              </View>
              
              <View style={styles.passengerDetails}>
                <Text style={styles.passengerName}>{passenger.name}</Text>
                
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <FontAwesome5 name="star" size={12} color="#F39C12" />
                    <Text style={styles.statText}>{passenger.rating}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.etaContainer}>
                <Text style={styles.etaText}>{passenger.eta}</Text>
                <Text style={styles.etaLabel}>ETA</Text>
              </View>
            </View>
            
            <View style={styles.locationInfo}>
              <View style={styles.locationRow}>
                <View style={styles.locationDot} />
                <Text style={styles.locationText}>{passenger.pickup}</Text>
              </View>
              <View style={styles.locationRow}>
                <View style={[styles.locationDot, styles.destinationDot]} />
                <Text style={styles.locationText}>{passenger.destination}</Text>
              </View>
            </View>
            
            {selectedPassenger === passenger.id && isOffering && (
              <View style={styles.offerIndicator}>
                <FontAwesome5 name="clock" size={20} color="#F39C12" />
                <Text style={styles.offerText}>Offering ride...</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
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
  onlineButton: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
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
  offerStatus: {
    backgroundColor: '#FFF3CD',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  countdownText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F39C12',
    marginBottom: 5,
  },
  countdownLabel: {
    fontSize: 16,
    color: '#856404',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#E74C3C',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  passengersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 15,
    textAlign: 'center',
  },
  passengerCard: {
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
  passengerCardSelected: {
    borderColor: '#F39C12',
    backgroundColor: '#FFF3CD',
  },
  passengerCardUnavailable: {
    opacity: 0.5,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  passengerPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  passengerPhotoText: {
    fontSize: 24,
  },
  passengerDetails: {
    flex: 1,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  etaContainer: {
    alignItems: 'center',
  },
  etaText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  etaLabel: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  locationInfo: {
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
    fontWeight: '500',
  },
  offerIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    gap: 8,
  },
  offerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F39C12',
  },
});
