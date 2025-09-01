import { FontAwesome5 } from '@expo/vector-icons';
import { Avatar } from '@rneui/themed';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { EditVehicleModal } from '../components/EditVehicleModal';
import { ProfileForm } from '../components/ProfileForm';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';

export default function ProfileScreen() {
  const { data: profile, isLoading, isError, error } = useProfile();
  const { mutate: updateProfile } = useUpdateProfile();
  const { logout } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isVehicleFormVisible, setIsVehicleFormVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      await logout();
      router.navigate('/(auth)/login');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'An error occurred during logout');
    }
  };

  const handleToggleOnline = () => {
    setIsOnline(!isOnline);
  };

  const handleEditProfile = () => {
    setIsFormVisible(true);
  };

  const handleEditVehicle = () => {
    setIsVehicleFormVisible(true);
  };

  const handleUploadAvatar = async () => {
    try {
      setUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        allowsEditing: true,
        quality: 1,
        aspect: [1, 1],
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const image = result.assets[0];
      if (!image.uri) {
        throw new Error('No image URI!');
      }

      const arraybuffer = await fetch(image.uri).then((res) => res.arrayBuffer());
      const fileExt = image.uri?.split('.').pop()?.toLowerCase() ?? 'jpeg';
      const path = `${Date.now()}.${fileExt}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arraybuffer, {
          contentType: image.mimeType ?? 'image/jpeg',
        });

      if (uploadError) {
        throw uploadError;
      }

      updateProfile({ avatar_url: data.path });
      setAvatarUrl(image.uri);
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
          <Text style={styles.errorSubtext}>{error?.message || 'Please try again'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Profile not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isPassenger = profile.role === 'passenger';
  const isDriver = profile.role === 'driver';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        {isPassenger && (
          <TouchableOpacity
            style={[styles.onlineButton, isOnline && styles.onlineButtonActive]}
            onPress={handleToggleOnline}
          >
            <Text style={[styles.onlineButtonText, isOnline && styles.onlineButtonTextActive]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Avatar
            size={80}
            rounded
            source={
              profile.avatar_url || avatarUrl ? { uri: avatarUrl || profile.avatar_url! } : undefined
            }
            title={profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
            containerStyle={{ backgroundColor: '#4A90E2' }}
            onPress={handleUploadAvatar}
          >
            <Avatar.Accessory size={23} />
          </Avatar>
          <Text style={styles.profileName}>{profile.full_name || 'Unknown'}</Text>
          {isDriver && (profile as any).rating && (
            <View style={styles.ratingContainer}>
              <FontAwesome5 name="star" size={16} color="#F39C12" />
              <Text style={styles.ratingText}>{(profile as any).rating.average || 0}</Text>
              <Text style={styles.ratingLabel}>({(profile as any).rating.count || 0} ratings)</Text>
            </View>
          )}
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{0}</Text>
            <Text style={styles.statLabel}>{isPassenger ? 'Total Rides' : 'Total Trips'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {isPassenger ? 0 : 0}
            </Text>
            <Text style={styles.statLabel}>
              {isPassenger ? 'Avg Rating' : 'Acceptance'}
            </Text>
          </View>
        </View>

        {isDriver && (
          <View style={styles.vehicleSection}>
            <View style={styles.vehicleCard}>
              <FontAwesome5 name="car" size={24} color="#27AE60" />
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleTitle}>{(profile as any).vehicle_details || 'Unknown Vehicle'}</Text>
                <Text style={styles.vehicleSubtitle}>{(profile as any).plate_number || 'No Plate'}</Text>
              </View>
              <TouchableOpacity style={styles.editButton} onPress={handleEditVehicle}>
                <FontAwesome5 name="edit" size={16} color="#4A90E2" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
            <FontAwesome5 name="user-edit" size={20} color="#4A90E2" />
            <Text style={styles.menuText}>Edit Profile</Text>
            <FontAwesome5 name="chevron-right" size={16} color="#BDC3C7" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <FontAwesome5 name="bell" size={20} color="#4A90E2" />
            <Text style={styles.menuText}>Notifications</Text>
            <FontAwesome5 name="chevron-right" size={16} color="#BDC3C7" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <FontAwesome5 name="shield-alt" size={20} color="#4A90E2" />
            <Text style={styles.menuText}>Privacy & Security</Text>
            <FontAwesome5 name="chevron-right" size={16} color="#BDC3C7" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <FontAwesome5 name="question-circle" size={20} color="#4A90E2" />
            <Text style={styles.menuText}>Help & Support</Text>
            <FontAwesome5 name="chevron-right" size={16} color="#BDC3C7" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <FontAwesome5 name="info-circle" size={20} color="#4A90E2" />
            <Text style={styles.menuText}>About PediSmart</Text>
            <FontAwesome5 name="chevron-right" size={16} color="#BDC3C7" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton}>
          <FontAwesome5 name="sign-out-alt" size={20} color="#E74C3C" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {isFormVisible && (
        <ProfileForm
          isVisible={isFormVisible}
          onClose={() => setIsFormVisible(false)}
          profile={profile}
        />
      )}

      {isVehicleFormVisible && (
        <EditVehicleModal
          isVisible={isVehicleFormVisible}
          onClose={() => setIsVehicleFormVisible(false)}
          profile={profile}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7F8C8D',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
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
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
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
    fontWeight: '600',
  },
  onlineButtonTextActive: {
    color: 'white',
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
    backgroundColor: '#4A90E2',
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
    marginTop: 15,
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
    color: '#4A90E2',
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