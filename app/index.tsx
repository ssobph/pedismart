import { Redirect } from 'expo-router';

import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'Mapbox [error] ViewTagResolver | view:',
]);

export default function AppEntry() {
  return <Redirect href="/(auth)/login" />;
}