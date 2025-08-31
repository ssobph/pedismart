import { Button } from '@/components/ui/Button';
import { ThemedText, ThemedView } from '@/components/ui/Themed';
import { spacing } from '@/constants/StyleGuide';
import { supabase } from '@/lib/supabase';
import { FontAwesome5 } from '@expo/vector-icons';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SignupScreen() {
  // Get the role passed from the welcome screen
  const { selectedRole } = useLocalSearchParams<{ selectedRole: 'passenger' | 'driver' }>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'passenger' | 'driver' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Pre-fill the role state if it was passed as a parameter
  useEffect(() => {
    if (selectedRole) {
      setRole(selectedRole);
    }
  }, [selectedRole]);

  async function signUpWithEmail() {
    if (!role) {
      Alert.alert('Role required', 'Please select whether you are a Passenger or a Driver.');
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });

    if (error) {
      Alert.alert('Sign Up Error', error.message);
    } else {
      Alert.alert('Success!', 'Please check your email for a confirmation link to sign in.');
    }
    setIsLoading(false);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="h1">Create Account</ThemedText>
          <ThemedText type="body" style={styles.subtitle}>
            You're joining as a <Text style={{fontWeight: 'bold'}}>{role}</Text>.
          </ThemedText>
          
          <View style={styles.formContainer}>
            <TextInput style={styles.input} onChangeText={setFullName} value={fullName} placeholder="Full Name" placeholderTextColor="rgba(255, 255, 255, 0.7)" autoCapitalize="words" />
            <TextInput style={styles.input} onChangeText={setEmail} value={email} placeholder="Email" placeholderTextColor="rgba(255, 255, 255, 0.7)" autoCapitalize="none" keyboardType="email-address" />
            <TextInput style={styles.input} onChangeText={setPassword} value={password} secureTextEntry placeholder="Password" placeholderTextColor="rgba(255, 255, 255, 0.7)" autoCapitalize="none" />
          </View>

          {/* Role selection is now hidden if a role was pre-selected, for a cleaner UX */}
          {!selectedRole && (
            <View style={styles.inputGroup}>
              <ThemedText type="h3" style={styles.label}>I am a...</ThemedText>
              <View style={styles.roleSection}>
                <TouchableOpacity style={[styles.roleCard, role === 'passenger' && styles.roleCardSelected]} onPress={() => setRole('passenger')}>
                  <FontAwesome5 name="user" size={24} color={role === 'passenger' ? '#fff' : "#4A90E2"} />
                  <Text style={[styles.roleTitle, role === 'passenger' && { color: '#fff' }]}>Passenger</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.roleCard, role === 'driver' && styles.roleCardSelected]} onPress={() => setRole('driver')}>
                  <FontAwesome5 name="car" size={24} color={role === 'driver' ? '#fff' : "#27AE60"} />
                  <Text style={[styles.roleTitle, role === 'driver' && { color: '#fff' }]}>Driver</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.actionsContainer}>
            <Button title="Create Account" onPress={signUpWithEmail} isLoading={isLoading} disabled={isLoading} variant="secondary" style={styles.mainButton} />
            <Link href="/(auth)/login" asChild>
              <Button title="Already have an account? Sign In" variant="outline" style={styles.outlineButton} onPress={() => {}} />
            </Link>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// Styles remain the same, ensure they are present
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  subtitle: {
    marginBottom: spacing.lg,
  },
  formContainer: {
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: 12,
    color: 'white',
    fontSize: 16,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.sm,
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
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  roleTitle: {
    marginTop: spacing.sm,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  actionsContainer: {
    gap: spacing.md,
  },
  mainButton: {
    backgroundColor: '#27AE60',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
});