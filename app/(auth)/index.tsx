import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {

  const handleRoleSelectAndNavigate = (role: 'passenger' | 'driver') => {
    router.push({
      pathname: '/(auth)/signup',
      params: { selectedRole: role },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#ffffff', '#f8f9fa']} style={styles.gradient}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.carIcon}>
              <Text style={styles.carEmoji}>🚗</Text>
            </View>
            <Text style={styles.appName}>PediSmart</Text>
          </View>
          <Text style={styles.title}>Smart Transport for Everyone</Text>
          <Text style={styles.subtitle}>Begin by choosing your role or signing in.</Text>
        </View>

        <View style={styles.roleSelectionContainer}>
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => handleRoleSelectAndNavigate('passenger')}
          >
            <View style={styles.roleIconContainer}>
              <Text style={styles.roleIcon}>👤</Text>
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleName}>I'm a Passenger</Text>
              <Text style={styles.roleDesc}>I want to book a ride</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => handleRoleSelectAndNavigate('driver')}
          >
            <View style={styles.roleIconContainer}>
              <Text style={styles.roleIcon}>🚗</Text>
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleName}>I'm a Driver</Text>
              <Text style={styles.roleDesc}>I want to give rides</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.authButton}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.authButtonText}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1, paddingHorizontal: 20, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  carIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  carEmoji: { fontSize: 24 },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 22,
  },
  roleSelectionContainer: { marginBottom: 40 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  roleIcon: { fontSize: 24 },
  roleInfo: { flex: 1 },
  roleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  roleDesc: { fontSize: 14, color: '#7F8C8D' },
  arrow: { fontSize: 20, color: '#4A90E2', fontWeight: 'bold' },
  authButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  authButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
});