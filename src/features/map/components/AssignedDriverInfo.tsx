import { FontAwesome5 } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface Props {
  name?: string;
  avatarUrl?: string | null;
  plateNumber?: string | null;
  vehicleType?: string | null;
  style?: ViewStyle;
}

export function AssignedDriverInfo({ name, avatarUrl, plateNumber, vehicleType, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerRow}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <FontAwesome5 name="user" size={18} color="#4A90E2" />
          </View>
        )}
        <View style={styles.infoCol}>
          <Text style={styles.nameText}>{name || 'Assigned Driver'}</Text>
          <Text style={styles.subText}>{vehicleType || 'Vehicle'}</Text>
        </View>
        <View style={styles.plateBadge}>
          <Text style={styles.plateText}>{plateNumber || '— — —'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  subText: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  plateBadge: {
    backgroundColor: '#2C3E50',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  plateText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
});
