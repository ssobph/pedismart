import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from '../../../components/ui/Themed';
import { RatingForm } from '../components/RatingForm';

export default function PostTripRatingScreen() {
  const router = useRouter();
  const { tripId, rateeId } = useLocalSearchParams();

  if (!tripId || !rateeId) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Error: Missing trip or ratee information.</ThemedText>
      </ThemedView>
    );
  }

  const handleRatingSubmitted = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <RatingForm
        tripId={Number(tripId)}
        rateeId={String(rateeId)}
        onRatingSubmitted={handleRatingSubmitted}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});