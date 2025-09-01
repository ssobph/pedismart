import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/Themed';
import { spacing } from '@/constants/StyleGuide';
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface ProfileSetupModalProps {
  visible: boolean;
  onComplete: () => void;
}

export function ProfileSetupModal({ visible, onComplete }: ProfileSetupModalProps) {
  const { createProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'passenger' | 'driver' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCompleteSetup = async () => {
    if (!fullName.trim()) {
      Alert.alert('Name Required', 'Please enter your full name');
      return;
    }

    if (!role) {
      Alert.alert('Role Required', 'Please select whether you are a Passenger or Driver');
      return;
    }

    setIsLoading(true);
    try {
      await createProfile(fullName.trim(), role);
      onComplete();
    } catch (error) {
      console.error('Profile setup failed:', error);
      Alert.alert('Setup Failed', 'Unable to complete profile setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {}} // Prevent closing without completing setup
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🚌</Text>
            </View>
            <ThemedText type="h1" style={styles.title}>
              Welcome to PediSmart!
            </ThemedText>
            <ThemedText type="body" style={styles.subtitle}>
              We need a few details to get you started
            </ThemedText>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <ThemedText type="h3" style={styles.label}>
                What&apos;s your name?
              </ThemedText>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                autoCapitalize="words"
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="h3" style={styles.label}>
                I am a...
              </ThemedText>
              <View style={styles.roleSection}>
                <TouchableOpacity
                  style={[styles.roleCard, role === 'passenger' && styles.roleCardSelected]}
                  onPress={() => setRole('passenger')}
                >
                  <FontAwesome5
                    name="user"
                    size={24}
                    color={role === 'passenger' ? '#fff' : '#4A90E2'}
                  />
                  <Text style={[styles.roleTitle, role === 'passenger' && { color: '#fff' }]}>
                    Passenger
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleCard, role === 'driver' && styles.roleCardSelected]}
                  onPress={() => setRole('driver')}
                >
                  <FontAwesome5
                    name="car"
                    size={24}
                    color={role === 'driver' ? '#fff' : '#27AE60'}
                  />
                  <Text style={[styles.roleTitle, role === 'driver' && { color: '#fff' }]}>
                    Driver
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title="Complete Setup"
              onPress={handleCompleteSetup}
              isLoading={isLoading}
              disabled={isLoading}
              variant="secondary"
              style={styles.mainButton}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A90E2',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontSize: 16,
  },
  form: {
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.sm,
    color: 'white',
    fontSize: 18,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: 12,
    color: 'white',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  roleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  roleCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleCardSelected: {
    borderColor: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  roleTitle: {
    marginTop: spacing.sm,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  actions: {
    gap: spacing.md,
  },
  mainButton: {
    backgroundColor: '#27AE60',
  },
});
