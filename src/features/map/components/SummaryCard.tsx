import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface SummaryCardProps {
  icon: string;
  iconColor?: string;
  value: string | number;
  label: string;
}

export function SummaryCard({ icon, iconColor = '#4A90E2', value, label }: SummaryCardProps) {
  return (
    <View style={styles.container}>
      <FontAwesome5 name={icon} size={24} color={iconColor} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 10,
    marginBottom: 5,
  },
  label: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '500',
  },
});
