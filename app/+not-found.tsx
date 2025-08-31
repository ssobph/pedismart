import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, Stack } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found' }} />
      <LinearGradient
        colors={['#4A90E2', '#357ABD', '#2E5984']}
        style={styles.gradient}
      >
        <ThemedView style={styles.container}>
          <View style={styles.iconContainer}>
            <FontAwesome5 name="map-marked-alt" size={64} color="#E74C3C" />
          </View>
          
          <ThemedText type="title" style={styles.title}>Oops! Wrong Turn</ThemedText>
          <ThemedText style={styles.subtitle}>
            Looks like you've taken a detour from your route.
          </ThemedText>
          <ThemedText style={styles.description}>
            This page doesn't exist in PediSmart. Let's get you back on track!
          </ThemedText>

          <View style={styles.buttonContainer}>
            <Link href="/" asChild>
              <TouchableOpacity style={styles.primaryButton}>
                <FontAwesome5 name="home" size={16} color="white" style={styles.buttonIcon} />
                <ThemedText style={styles.primaryButtonText}>Back to Home</ThemedText>
              </TouchableOpacity>
            </Link>
            
            <Link href="/passenger" asChild>
              <TouchableOpacity style={styles.secondaryButton}>
                <FontAwesome5 name="user" size={16} color="#4A90E2" style={styles.buttonIcon} />
                <ThemedText style={styles.secondaryButtonText}>Passenger Dashboard</ThemedText>
              </TouchableOpacity>
            </Link>
            
            <Link href="/driver" asChild>
              <TouchableOpacity style={styles.secondaryButton}>
                <FontAwesome5 name="car" size={16} color="#4A90E2" style={styles.buttonIcon} />
                <ThemedText style={styles.secondaryButtonText}>Driver Dashboard</ThemedText>
              </TouchableOpacity>
            </Link>
          </View>

          <View style={styles.helpContainer}>
            <FontAwesome5 name="question-circle" size={16} color="#7F8C8D" />
            <ThemedText style={styles.helpText}>
              Need help? Contact support
            </ThemedText>
          </View>
        </ThemedView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 50,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  primaryButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(74, 144, 226, 0.3)',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    gap: 8,
  },
  helpText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
});
