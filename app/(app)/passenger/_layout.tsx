import { Stack } from 'expo-router';

export default function PassengerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="locate"
        options={{ 
          presentation: 'modal',
          headerShown: true,
          title: 'Select Location'
        }}
      />
      <Stack.Screen
        name="manual-booking"
        options={{ 
          presentation: 'modal',
          headerShown: true,
          title: 'Book a Ride'
        }}
      />
      <Stack.Screen
        name="rating"
        options={{ 
          presentation: 'modal',
          headerShown: true,
          title: 'Rate Your Ride'
        }}
      />
    </Stack>
  );
}