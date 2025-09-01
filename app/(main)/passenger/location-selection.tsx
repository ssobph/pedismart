import { LocationSelectionScreen } from '@/features/map/screens/LocationSelectionScreen';
import { useLocalSearchParams } from 'expo-router';

export default function LocationSelectionRoute() {
  const params = useLocalSearchParams<{
    mode?: 'pickup' | 'destination';
    title?: string;
  }>();

  return (
    <LocationSelectionScreen 
      mode={params.mode || 'destination'}
      title={params.title || 'Choose Location'}
    />
  );
}
