import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { StyleSheet } from "react-native";

import { Button } from "@/components/ui/Button";
import { Link } from "expo-router";

type EmptyStateProps = {
  role: "passenger" | "driver";
};

export default function EmptyState({ role }: EmptyStateProps) {
  const isPassenger = role === "passenger";
  const title = isPassenger
    ? "No bookings yet"
    : "No ride history to show";
  const message = isPassenger
    ? "You have no past or ongoing bookings. Book a ride to get started!"
    : "You haven't completed any rides yet. Find a passenger to start earning!";
  const ctaText = isPassenger ? "Book a Ride" : "Find a Passenger";
  const ctaHref = isPassenger
    ? "/(main)/passenger/(tabs)/map"
    : "/(main)/driver/(tabs)/find-passengers";

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText style={styles.message}>{message}</ThemedText>
        <Link href={ctaHref} asChild>
          <Button title={ctaText} onPress={() => {}} />
        </Link>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
    gap: 16,
  },
  title: {
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    marginBottom: 8,
  },
});