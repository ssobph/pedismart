import { Button } from '@/components/ui/Button';
import { spacing } from '@/constants/StyleGuide';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function signInWithEmail() {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error('Sign in error:', error);
        Alert.alert('Sign In Error', error.message);
      }
    } catch (unexpectedError) {
      console.error('Sign in failed:', unexpectedError);
      Alert.alert('Sign In Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#4A90E2', '#357ABD']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🚗</Text>
            </View>
            <Text style={styles.appName}>Welcome Back</Text>
            <Text style={styles.tagline}>Sign in to PediSmart</Text>
          </View>

          <View style={styles.formContainer}>
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

          <View style={styles.actionsContainer}>
            <Button
              title="Sign In"
              onPress={signInWithEmail}
              isLoading={isLoading}
              disabled={isLoading}
              variant="secondary"
              style={styles.mainButton}
            />
            <Link href="/(auth)/signup" asChild>
              <Button title="Create an Account" variant="outline" style={styles.outlineButton} onPress={() => {}} />
            </Link>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
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
  logoEmoji: { fontSize: 40 },
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
  formContainer: {
    marginBottom: spacing.lg,
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
  actionsContainer: {
    gap: spacing.md,
  },
  mainButton: {
    backgroundColor: '#27AE60', // Driver Green
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
});