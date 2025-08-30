import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert, Animated } from 'react-native';
import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const mockDrivers = [
  {
    id: 1,
    name: 'Juan Dela Cruz',
    rating: 4.8,
    acceptanceRate: 95,
    cancelRate: 2,
    eta: '3 min',
    vehicle: 'Pedicab #123',
    photo: '👨‍🦱',
    isAvailable: true,
  },
  {
    id: 2,
    name: 'Pedro Santos',
    rating: 4.6,
    acceptanceRate: 92,
    cancelRate: 5,
    eta: '5 min',
    vehicle: 'Pedicab #456',
    photo: '👨‍🦳',
    isAvailable: true,
  },
  {
    id: 3,
    name: 'Miguel Reyes',
    rating: 4.9,
    acceptanceRate: 98,
    cancelRate: 1,
    eta: '7 min',
    vehicle: 'Pedicab #789',
    photo: '👨‍🦲',
    isAvailable: true,
  },
  {
    id: 4,
    name: 'Carlos Lopez',
    rating: 4.7,
    acceptanceRate: 94,
    cancelRate: 3,
    eta: '4 min',
    vehicle: 'Pedicab #012',
    photo: '👨‍🦰',
    isAvailable: true,
  },
];

export default function ManualBooking() {
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [drivers, setDrivers] = useState(mockDrivers);
  const [isOnline, setIsOnline] = useState(true);
  const countdownRef = useRef<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRequesting && countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      handleRequestTimeout();
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [isRequesting, countdown]);

  const handleDriverSelect = (driverId: number) => {
    if (isRequesting) return;
    
    setSelectedDriver(driverId);
    setIsRequesting(true);
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

  const handleRequestTimeout = () => {
    setIsRequesting(false);
    setCountdown(30);
    setSelectedDriver(null);
    fadeAnim.setValue(1);
    
    Alert.alert(
      'Request Timeout',
      'Driver did not respond in time. You can try another driver.',
      [{ text: 'OK' }]
    );
  };

  // Removed handleDriverResponse function since we no longer have accept/decline buttons

  const cancelRequest = () => {
    setIsRequesting(false);
    setCountdown(30);
    setSelectedDriver(null);
    fadeAnim.setValue(1);
    
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
    }
  };

  const handleToggleOnline = () => {
    setIsOnline(!isOnline);
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={20} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Available Pedicabs</Text>
        <TouchableOpacity
          style={[styles.onlineButton, isOnline && styles.onlineButtonActive]}
          onPress={handleToggleOnline}
        >
          <Text style={[styles.onlineButtonText, isOnline && styles.onlineButtonTextActive]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tripInfo}>
        <View style={styles.locationInfo}>
          <View style={styles.locationRow}>
            <View style={styles.locationDot} />
            <Text style={styles.locationText}>Jollibee Branch</Text>
          </View>
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, styles.destinationDot]} />
            <Text style={styles.locationText}>School Campus</Text>
          </View>
        </View>
      </View>

      {isRequesting && selectedDriver && (
        <View style={styles.requestStatus}>
          <Animated.View style={[styles.countdownContainer, { opacity: fadeAnim }]}>
            <Text style={styles.countdownText}>{formatTime(countdown)}</Text>
            <Text style={styles.countdownLabel}>Waiting for driver response...</Text>
          </Animated.View>
          
          <TouchableOpacity style={styles.cancelButton} onPress={cancelRequest}>
            <Text style={styles.cancelButtonText}>Cancel Request</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.driversList} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>
          Available Pedicabs ({drivers.filter(d => d.isAvailable).length})
        </Text>
        <Text style={styles.sectionSubtitle}>Tap pedicab to request a ride</Text>
        
        {drivers.map((driver) => (
          <TouchableOpacity
            key={driver.id}
            style={[
              styles.driverCard,
              selectedDriver === driver.id && styles.driverCardSelected,
              !driver.isAvailable && styles.driverCardUnavailable
            ]}
            onPress={() => handleDriverSelect(driver.id)}
            disabled={!driver.isAvailable || isRequesting}
          >
            <View style={styles.driverInfo}>
              <View style={styles.driverPhoto}>
                <Text style={styles.driverPhotoText}>{driver.photo}</Text>
              </View>
              
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{driver.name}</Text>
                <Text style={styles.vehicleInfo}>{driver.vehicle}</Text>
                
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <FontAwesome5 name="star" size={12} color="#F39C12" />
                    <Text style={styles.statText}>{driver.rating}</Text>
                  </View>
                  <View style={styles.stat}>
                    <FontAwesome5 name="check-circle" size={12} color="#27AE60" />
                    <Text style={styles.statText}>{driver.acceptanceRate}%</Text>
                  </View>
                  <View style={styles.stat}>
                    <FontAwesome5 name="times-circle" size={12} color="#E74C3C" />
                    <Text style={styles.statText}>{driver.cancelRate}%</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.etaContainer}>
                <Text style={styles.etaText}>{driver.eta}</Text>
                <Text style={styles.etaLabel}>ETA</Text>
              </View>
            </View>
            
            {selectedDriver === driver.id && isRequesting && (
              <View style={styles.requestIndicator}>
                <FontAwesome5 name="clock" size={20} color="#F39C12" />
                <Text style={styles.requestText}>Requesting...</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Removed the bottom actions section with accept/decline buttons */}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  placeholder: {
    width: 36,
  },
  onlineButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#B0B0B0',
  },
  onlineButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  onlineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  onlineButtonTextActive: {
    color: 'white',
  },
  tripInfo: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
  },
  locationInfo: {
    marginBottom: 15,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#27AE60',
    marginRight: 12,
  },
  destinationDot: {
    backgroundColor: '#E74C3C',
  },
  locationText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  requestStatus: {
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
  driversList: {
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
  driverCard: {
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
  driverCardSelected: {
    borderColor: '#F39C12',
    backgroundColor: '#FFF3CD',
  },
  driverCardUnavailable: {
    opacity: 0.5,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  driverPhotoText: {
    fontSize: 24,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#7F8C8D',
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
  requestIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    gap: 8,
  },
  requestText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F39C12',
  },
});
