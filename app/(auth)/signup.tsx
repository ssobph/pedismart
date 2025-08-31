import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/Themed';
import { spacing } from '@/constants/StyleGuide';
import { supabase } from '@/lib/supabase';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SignupScreen() {
  const { selectedRole } = useLocalSearchParams<{ selectedRole: 'passenger' | 'driver' }>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'passenger' | 'driver' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

    try {
      const {
        data: { session, user },
        error,
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        Alert.alert('Sign Up Error', error.message);
      } else {
        if (!session) {
          Alert.alert('Please check your inbox for email verification!');
        } else {
          Alert.alert('Success!', 'Account created successfully!');
        }
      }
    } catch (unexpectedError) {
      console.error('Sign up failed:', unexpectedError);
      Alert.alert('Sign Up Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#4A90E2', '#357ABD', '#2E5984']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🚌</Text>
            </View>
            <Text style={styles.appName}>PediSmart</Text>
            <Text style={styles.tagline}>Create Account</Text>
          </View>

          <View style={styles.formContainer}>
            <ThemedText type="body" style={styles.subtitle}>
              You're joining as a <Text style={{ fontWeight: 'bold' }}>{role || 'user'}</Text>.
            </ThemedText>

            <TextInput 
              style={styles.input} 
              onChangeText={setFullName} 
              value={fullName} 
              placeholder="Full Name" 
              placeholderTextColor="rgba(255, 255, 255, 0.7)" 
              autoCapitalize="words" 
            />
            <TextInput 
              style={styles.input} 
              onChangeText={setEmail} 
              value={email} 
              placeholder="Email" 
              placeholderTextColor="rgba(255, 255, 255, 0.7)" 
              autoCapitalize="none" 
              keyboardType="email-address" 
            />
            <TextInput 
              style={styles.input} 
              onChangeText={setPassword} 
              value={password} 
              secureTextEntry 
              placeholder="Password" 
              placeholderTextColor="rgba(255, 255, 255, 0.7)" 
              autoCapitalize="none" 
            />
          </View>

          {!selectedRole && (
            <View style={styles.inputGroup}>
              <ThemedText type="h3" style={styles.label}>I am a...</ThemedText>
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
          )}

          <View style={styles.actionsContainer}>
            <Button 
              title="Create Account" 
              onPress={signUpWithEmail} 
              isLoading={isLoading} 
              disabled={isLoading} 
              variant="secondary" 
              style={styles.mainButton} 
            />
            <Link href="/(auth)/login" asChild>
              <Button 
                title="Already have an account? Sign In" 
                variant="outline" 
                style={styles.outlineButton} 
                onPress={() => {}} 
              />
            </Link>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  gradient: { 
    flex: 1 
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  logoSection: {
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
    marginBottom: 20,
  },
  logoEmoji: { 
    fontSize: 40 
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  subtitle: {
    marginBottom: spacing.lg,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
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
    color: 'white',
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