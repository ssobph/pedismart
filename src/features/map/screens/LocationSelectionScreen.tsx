import { LocationData } from '@/components/ui/LocationInputContainer';
import { useLocation } from '@/contexts/LocationContext';
import { Camera, LocationPuck, MapView, ShapeSource, SymbolLayer } from '@/lib/mapbox';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export interface LocationSelectionScreenProps {
  currentLocation?: LocationData;
  onLocationSelected?: (location: LocationData) => void;
  title?: string;
  mode?: 'pickup' | 'destination';
}

export function LocationSelectionScreen({
  currentLocation,
  onLocationSelected,
  title = 'Choose Location',
  mode = 'destination',
}: LocationSelectionScreenProps) {
  const { location } = useLocation();
  const [searchText, setSearchText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);

  // Default to current location if available
  const defaultLocation = location ? {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  } : {
    latitude: 14.5995, // Manila default
    longitude: 120.9842,
  };

  const handleMapPress = async (event: any) => {
    const { geometry } = event;
    if (!geometry || geometry.type !== 'Point') return;
    const [lng, lat] = geometry.coordinates as [number, number];
    
    const reverseGeocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    const address = reverseGeocode[0] ? `${reverseGeocode[0].street}, ${reverseGeocode[0].city}` : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    
    const newLocation: LocationData = {
      address,
      coordinates: [lng, lat],
    };
    setSelectedLocation(newLocation);
  };

  const handleConfirmLocation = async () => {
    if (selectedLocation) {
      try {
        // Save location to AsyncStorage based on mode
        const storageKey = mode === 'pickup' ? 'selectedPickupLocation' : 'selectedDestinationLocation';
        await AsyncStorage.setItem(storageKey, JSON.stringify(selectedLocation));
        
        if (onLocationSelected) {
          onLocationSelected(selectedLocation);
        }
      } catch (error) {
        console.error('Error saving location:', error);
      }
    }
    router.back();
  };

  const handleUseCurrentLocation = () => {
    if (location) {
      const currentLocationData: LocationData = {
        address: 'Current location',
        coordinates: [location.coords.longitude, location.coords.latitude],
      };
      setSelectedLocation(currentLocationData);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome5 name="chevron-left" size={18} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Current Location Section */}
      {mode === 'destination' && (
        <View style={styles.currentLocationSection}>
          <View style={styles.currentLocationHeader}>
            <FontAwesome5 name="dot-circle" size={14} color="#4A90E2" />
            <Text style={styles.currentLocationLabel}>From</Text>
          </View>
          <Text style={styles.currentLocationText}>
            {currentLocation?.address || 'Current location'}
          </Text>
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <FontAwesome5 name="search" size={16} color="#7F8C8D" />
          <TextInput
            style={styles.searchInput}
            placeholder={mode === 'pickup' ? 'Search pickup location...' : 'Search destination...'}
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#BDC3C7"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <FontAwesome5 name="times-circle" size={16} color="#BDC3C7" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Map Section */}
      <View style={styles.mapSection}>
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            styleURL={"mapbox://styles/mapbox/navigation-day-v1"}
            onPress={handleMapPress}
            logoEnabled={false}
            attributionEnabled={false}
          >
            <Camera
              zoomLevel={16}
              centerCoordinate={[defaultLocation.longitude, defaultLocation.latitude]}
              animationMode="flyTo"
              animationDuration={750}
            />

            <LocationPuck visible pulsing={{ isEnabled: true, color: '#4A90E2', radius: 12 }} />

            {selectedLocation?.coordinates && (
              <ShapeSource
                id="selected-location"
                shape={{
                  type: 'FeatureCollection',
                  features: [
                    {
                      type: 'Feature',
                      geometry: {
                        type: 'Point',
                        coordinates: selectedLocation.coordinates,
                      },
                      properties: { name: 'Selected Location' },
                    },
                  ],
                }}
              >
                <SymbolLayer
                  id="selected-location-symbol"
                  style={{
                    iconImage: 'marker-15',
                    iconSize: 1.5,
                    iconColor: mode === 'pickup' ? '#4A90E2' : '#27AE60',
                    iconAllowOverlap: true,
                    iconIgnorePlacement: true,
                  }}
                />
              </ShapeSource>
            )}
          </MapView>
          
          {/* Map Instructions */}
          <View style={styles.mapInstructions}>
            <FontAwesome5 name="hand-pointer" size={14} color="#7F8C8D" />
            <Text style={styles.instructionText}>Tap on map to select location</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.currentLocationButton} 
          onPress={handleUseCurrentLocation}
        >
          <FontAwesome5 name="location-arrow" size={16} color="#4A90E2" />
          <Text style={styles.currentLocationButtonText}>Use current location</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Action */}
      <View style={styles.bottomSection}>
        {selectedLocation && (
          <View style={styles.selectedLocationInfo}>
            <FontAwesome5 
              name={mode === 'pickup' ? 'dot-circle' : 'map-marker-alt'} 
              size={14} 
              color={mode === 'pickup' ? '#4A90E2' : '#27AE60'} 
            />
            <Text style={styles.selectedLocationText} numberOfLines={2}>
              {selectedLocation.address}
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          style={[
            styles.confirmButton,
            !selectedLocation && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirmLocation}
          disabled={!selectedLocation}
        >
          <Text style={[
            styles.confirmButtonText,
            !selectedLocation && styles.confirmButtonTextDisabled,
          ]}>
            Confirm Location
          </Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  currentLocationSection: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  currentLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  currentLocationLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '500',
    marginLeft: 8,
  },
  currentLocationText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
    marginLeft: 22,
  },
  searchSection: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
  },
  mapSection: {
    flex: 1,
    padding: 20,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  map: {
    flex: 1,
  },
  mapInstructions: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  instructionText: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  quickActions: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currentLocationButtonText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  bottomSection: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  selectedLocationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
  },
  selectedLocationText: {
    flex: 1,
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 18,
  },
  confirmButton: {
    backgroundColor: '#27AE60',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  confirmButtonTextDisabled: {
    color: '#7F8C8D',
  },
});
