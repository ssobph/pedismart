// app/(app)/passenger/(tabs)/_layout.tsx
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FontAwesome5 } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function PassengerTabLayout() {
  const theme = useColorScheme() ?? 'light';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors[theme].primary,
        tabBarInactiveTintColor: Colors[theme].placeholder,
        tabBarStyle: {
          backgroundColor: Colors[theme].card,
          borderTopWidth: 1,
          borderTopColor: Colors[theme].border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="map-marked-alt" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Rides',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="list-alt" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="history" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="user-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}