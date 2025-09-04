import { useAuth } from '@/contexts/AuthContext';
import { bookingService } from '@/services/bookingService';
import { FontAwesome5 } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export function OfferHistoryScreen() {
  const { user } = useAuth();

  const { data: offerHistory, isLoading } = useQuery({
    queryKey: ['offerHistory', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      return bookingService.getOfferHistory(user.id);
    },
    enabled: !!user,
  });

  const renderOfferItem = ({ item }: { item: any }) => (
    <View style={styles.offerCard}>
      <View style={styles.offerHeader}>
        <Text style={styles.driverName}>{item.driver?.full_name || 'Unknown Driver'}</Text>
        <Text style={styles.offerTime}>
          {new Date(item.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <View style={styles.statusContainer}>
        <FontAwesome5
          name={item.status === 'accepted' ? 'check-circle' : 'times-circle'}
          size={16}
          color={item.status === 'accepted' ? '#27AE60' : '#E74C3C'}
        />
        <Text style={[styles.statusText, { color: item.status === 'accepted' ? '#27AE60' : '#E74C3C' }]}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Offer History</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Offer History</Text>
      </View>
      <FlatList
        data={offerHistory}
        renderItem={renderOfferItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FontAwesome5 name="history" size={64} color="#BDC3C7" />
            <Text style={styles.emptyStateTitle}>No Offer History</Text>
            <Text style={styles.emptyStateSubtext}>You have no accepted or declined offers.</Text>
          </View>
        }
      />
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  offerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  offerTime: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 22,
  },
});