import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { RideHistoryCard } from '@/features/booking/components/RideHistoryCard';
import { useRideHistory } from '@/features/booking/hooks/useRideHistory';
import { useCurrentTrip } from '@/features/trip/hooks/useCurrentTrip';
import { useColorScheme } from '@/hooks/useColorScheme';
import { TripWithDetails } from '@/services/tripService';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

export function PassengerBookingsScreen() {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const { data: currentTrip, isLoading: currentTripLoading } = useCurrentTrip();
  const { data: rides, isLoading: historyLoading, isError } = useRideHistory();
  const theme = useColorScheme() ?? 'light';
  const { user } = useAuth();
  const router = useRouter();

  const renderCurrentRideTab = () => {
    if (currentTripLoading) {
      return (
        <ThemedView style={styles.center}>
          <ActivityIndicator size="large" color={Colors[theme].primary} />
        </ThemedView>
      );
    }

    if (!currentTrip) {
      return (
        <ThemedView style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <FontAwesome5 
              name="car" 
              size={60} 
              color={Colors[theme].icon} 
              style={styles.emptyIcon}
            />
          </View>
          <ThemedText style={styles.emptyTitle}>No Active Ride</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            You don't have any active rides at the moment
          </ThemedText>
          <TouchableOpacity 
            style={[styles.bookButton, { backgroundColor: Colors[theme].primary }]}
            onPress={() => router.push('/(main)/passenger/(tabs)/map')}
          >
            <ThemedText style={styles.bookButtonText}>Book a Ride</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      );
    }

    return (
      <ThemedView style={styles.currentRideContainer}>
        <RideHistoryCard ride={currentTrip as any} />
      </ThemedView>
    );
  };

  const renderRideHistoryTab = () => {
    if (historyLoading) {
      return (
        <ThemedView style={styles.center}>
          <ActivityIndicator size="large" color={Colors[theme].primary} />
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

    const completedRides = rides?.filter(ride => ride.status === 'completed') || [];

    if (completedRides.length === 0) {
      return (
        <ThemedView style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <FontAwesome5 
              name="history" 
              size={60} 
              color={Colors[theme].icon} 
              style={styles.emptyIcon}
            />
          </View>
          <ThemedText style={styles.emptyTitle}>No Ride History</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Your completed rides will appear here
          </ThemedText>
        </ThemedView>
      );
    }

    return (
      <FlatList
        data={completedRides}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <RideHistoryCard ride={item as TripWithDetails & any} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>My Rides</ThemedText>
        <View style={[styles.statusBadge, { backgroundColor: Colors[theme].primary }]}>
          <ThemedText style={styles.statusText}>Online</ThemedText>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'current' && styles.activeTab,
            activeTab === 'current' && { backgroundColor: Colors[theme].primary }
          ]}
          onPress={() => setActiveTab('current')}
        >
          <ThemedText 
            style={[
              styles.tabText,
              activeTab === 'current' && styles.activeTabText
            ]}
          >
            Current Ride
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'history' && styles.activeTab,
            activeTab === 'history' && { backgroundColor: Colors[theme].primary }
          ]}
          onPress={() => setActiveTab('history')}
        >
          <ThemedText 
            style={[
              styles.tabText,
              activeTab === 'history' && styles.activeTabText
            ]}
          >
            Ride History
          </ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContent}>
        {activeTab === 'current' ? renderCurrentRideTab() : renderRideHistoryTab()}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    // backgroundColor set dynamically
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: 'white',
  },
  tabContent: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIcon: {
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  bookButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  currentRideContainer: {
    padding: 16,
  },
  listContent: {
    padding: 16,
  },
});