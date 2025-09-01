import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useRideHistory } from '@/features/booking/hooks/useRideHistory';
import { RideHistoryCard } from '@/features/booking/components/RideHistoryCard';
import { TripWithDetails } from '@/types';
import EmptyState from '../components/EmptyState';

export function DriverRidesScreen() {
  const { data: rides, isLoading, isError } = useRideHistory();

  if (isLoading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (isError) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Error fetching ride history.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {rides && rides.length > 0 ? (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <RideHistoryCard ride={item as TripWithDetails} />}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <EmptyState role="driver" />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
});