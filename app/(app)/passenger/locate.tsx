import { LocationSelectionScreen } from '@/features/map/screens/LocationSelectionScreen';
import { useLocalSearchParams } from 'expo-router';

const LocateRoute = () => {
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
};

export default LocateRoute;
