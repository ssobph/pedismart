import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<'passenger' | 'driver' | null>(null);

  const handleContinue = () => {
    if (selectedRole === 'passenger') {
      router.push('/passenger');
    } else if (selectedRole === 'driver') {
      router.push('/driver');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.carIcon}>
              <Text style={styles.carEmoji}>🚗</Text>
            </View>
            <Text style={styles.appName}>PediSmart</Text>
          </View>
          
          <Text style={styles.title}>Smart Transport for Everyone</Text>
          <Text style={styles.subtitle}>Real-time path optimization & driver-passenger pairing for informal transport.</Text>
        </View>



        <View style={styles.roleSelectionContainer}>
          <Text style={styles.roleTitle}>Choose Your Role</Text>
          
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'passenger' && styles.roleCardSelected
            ]}
            onPress={() => setSelectedRole('passenger')}
          >
            <View style={styles.roleIconContainer}>
              <Text style={styles.roleIcon}>👤</Text>
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleName}>Passenger</Text>
              <Text style={styles.roleDesc}>Book rides easily</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'driver' && styles.roleCardSelected
            ]}
            onPress={() => setSelectedRole('driver')}
          >
            <View style={styles.roleIconContainer}>
              <Text style={styles.roleIcon}>🚗</Text>
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleName}>Driver</Text>
              <Text style={styles.roleDesc}>Start earning today</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedRole && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!selectedRole}
        >
          <Text style={styles.continueButtonText}>
            Continue as {selectedRole === 'passenger' ? 'Passenger' : selectedRole === 'driver' ? 'Driver' : '...'}
          </Text>
          <Text style={styles.continueButtonArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.authButton}
          onPress={() => router.push('/auth')}
        >
          <Text style={styles.authButtonText}>Sign In / Sign Up</Text>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  carIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  carEmoji: {
    fontSize: 24,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 22,
  },

  roleSelectionContainer: {
    marginBottom: 40,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
    textAlign: 'center',
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleCardSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#F0F8FF',
  },
  roleIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  roleIcon: {
    fontSize: 24,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  roleDesc: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  arrow: {
    fontSize: 20,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  continueButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  continueButtonArrow: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  authButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  authButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
});
