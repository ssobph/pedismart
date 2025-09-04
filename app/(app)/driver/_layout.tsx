import { Stack } from 'expo-router';

export default function DriverLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />

      {/* driver-specific modals*/}
      {/* <Stack.Screen name="trip-details" options={{ presentation: 'modal' }} /> */}
    </Stack>
  );
}
