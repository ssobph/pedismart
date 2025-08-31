import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function DriverProfile() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.profilePhoto}>
            <Text style={styles.profilePhotoText}>👨‍🦱</Text>
          </View>
          <Text style={styles.profileName}>Juan Dela Cruz</Text>
          <Text style={styles.profileEmail}>juan.delacruz@email.com</Text>
          <View style={styles.ratingContainer}>
            <FontAwesome5 name="star" size={16} color="#F39C12" />
            <Text style={styles.ratingText}>4.8</Text>
            <Text style={styles.ratingLabel}>(156 ratings)</Text>
          </View>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>156</Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>98%</Text>
            <Text style={styles.statLabel}>Acceptance</Text>
          </View>
        </View>

        <View style={styles.vehicleSection}>
          <View style={styles.vehicleCard}>
            <FontAwesome5 name="car" size={24} color="#27AE60" />
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleTitle}>Pedicab #123</Text>
              <Text style={styles.vehicleSubtitle}>Active Vehicle</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <FontAwesome5 name="edit" size={16} color="#4A90E2" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <FontAwesome5 name="user-edit" size={20} color="#27AE60" />
            <Text style={styles.menuText}>Edit Profile</Text>
            <FontAwesome5 name="chevron-right" size={16} color="#BDC3C7" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <FontAwesome5 name="car" size={20} color="#27AE60" />
            <Text style={styles.menuText}>Vehicle Settings</Text>
            <FontAwesome5 name="chevron-right" size={16} color="#BDC3C7" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <FontAwesome5 name="bell" size={20} color="#27AE60" />
            <Text style={styles.menuText}>Notifications</Text>
            <FontAwesome5 name="chevron-right" size={16} color="#BDC3C7" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <FontAwesome5 name="shield-alt" size={20} color="#27AE60" />
            <Text style={styles.menuText}>Privacy & Security</Text>
            <FontAwesome5 name="chevron-right" size={16} color="#BDC3C7" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <FontAwesome5 name="question-circle" size={20} color="#27AE60" />
            <Text style={styles.menuText}>Help & Support</Text>
            <FontAwesome5 name="chevron-right" size={16} color="#BDC3C7" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <FontAwesome5 name="info-circle" size={20} color="#27AE60" />
            <Text style={styles.menuText}>About PediSmart</Text>
            <FontAwesome5 name="chevron-right" size={16} color="#BDC3C7" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton}>
          <FontAwesome5 name="sign-out-alt" size={20} color="#E74C3C" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileSection: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profilePhotoText: {
    fontSize: 40,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 15,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F39C12',
  },
  ratingLabel: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#27AE60',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  vehicleSection: {
    marginBottom: 20,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: 15,
  },
  vehicleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  vehicleSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  editButton: {
    padding: 8,
  },
  menuSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
    marginLeft: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    fontSize: 16,
    color: '#E74C3C',
    fontWeight: '600',
    marginLeft: 10,
  },
});
