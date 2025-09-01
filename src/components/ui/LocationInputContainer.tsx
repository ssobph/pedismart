import { StyleSheet, View } from 'react-native';
import { LocationInputField } from './LocationInputField';

export interface LocationData {
  address?: string;
  coordinates?: [number, number];
}

export interface LocationInputContainerProps {
  pickupLocation?: LocationData;
  destinationLocation?: LocationData;
  onPickupPress?: () => void;
  onDestinationPress?: () => void;
  pickupDisabled?: boolean;
  showCurrentLocationAsPickup?: boolean;
}

export function LocationInputContainer({
  pickupLocation,
  destinationLocation,
  onPickupPress,
  onDestinationPress,
  pickupDisabled = false,
  showCurrentLocationAsPickup = true,
}: LocationInputContainerProps) {
  const pickupValue = pickupLocation?.address || 
    (showCurrentLocationAsPickup ? 'Current location' : undefined);
  
  const destinationValue = destinationLocation?.address;

  return (
    <View style={styles.container}>
      <LocationInputField
        label="Pick up"
        value={pickupValue}
        placeholder="Select pickup location"
        icon="dot-circle"
        iconColor="#4A90E2"
        onPress={onPickupPress}
        disabled={pickupDisabled}
      />
      
      <View style={styles.separator}>
        <View style={styles.separatorLine} />
        <View style={styles.separatorDots}>
          <View style={styles.separatorDot} />
          <View style={styles.separatorDot} />
          <View style={styles.separatorDot} />
        </View>
      </View>
      
      <LocationInputField
        label="Where to?"
        value={destinationValue}
        placeholder="Choose destination"
        icon="map-marker-alt"
        iconColor="#27AE60"
        onPress={onDestinationPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  separator: {
    position: 'relative',
    paddingVertical: 8,
    marginLeft: 12,
  },
  separatorLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#E8E8E8',
  },
  separatorDots: {
    alignItems: 'center',
    gap: 3,
  },
  separatorDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#BDC3C7',
  },
});
