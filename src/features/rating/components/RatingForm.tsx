import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { ThemedText, ThemedView } from '../../../components/ui/Themed';
import { Colors } from '../../../constants/Colors';
import { useSubmitRating } from '../hooks/useSubmitRating';

interface RatingFormProps {
  tripId: number;
  rateeId: string;
  onRatingSubmitted: () => void;
}

export function RatingForm({ tripId, rateeId, onRatingSubmitted }: RatingFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const { mutate: submitRating, isPending, isSuccess } = useSubmitRating();

  const handleSubmit = () => {
    if (rating > 0) {
      submitRating(
        {
          tripId: tripId,
          rateeId: rateeId,
          rating,
          comment,
        },
        {
          onSuccess: () => {
            onRatingSubmitted();
          },
        }
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Rate your experience
      </ThemedText>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Ionicons
              name={rating >= star ? 'star' : 'star-outline'}
              size={32}
              color={Colors.light.tint}
            />
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        placeholder="Optional comment"
        value={comment}
        onChangeText={setComment}
        multiline
        style={styles.commentInput}
      />
      <Button
        onPress={handleSubmit}
        disabled={rating === 0 || isPending}
        title={isPending ? 'Submitting...' : isSuccess ? 'Rating Submitted!' : 'Submit Rating'}
      />
      {isSuccess && (
        <ThemedText style={styles.successMessage}>
          Thank you for your feedback!
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  commentInput: {
    width: '100%',
    height: 80,
    borderColor: Colors.light.border,
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  successMessage: {
    marginTop: 10,
    color: Colors.light.success,
  },
});