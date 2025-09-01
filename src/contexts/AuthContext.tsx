import { supabase } from '@/lib/supabase';
import { profileService } from '@/services/profileService';
import { Database } from '@/types/database.types';
import { DriverProfile } from '@/types/index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUnion = Profile | DriverProfile;

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: ProfileUnion | null;
  isLoading: boolean;
  needsProfileSetup: boolean;
  createProfile: (fullName: string, role: 'passenger' | 'driver') => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  needsProfileSetup: false,
  createProfile: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileUnion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const queryClient = useQueryClient();

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const basicProfile = await profileService.getProfile(userId);
      if (!basicProfile) {
        setProfile(null);
        setNeedsProfileSetup(true);
        return;
      }

      if (basicProfile.role === 'driver') {
        const driverProfile = await profileService.getDriverProfile(userId);
        if (driverProfile) {
          setProfile(driverProfile);
          setNeedsProfileSetup(false);
        } else {
          setProfile(null);
          setNeedsProfileSetup(true);
        }
      } else {
        setProfile(basicProfile);
        setNeedsProfileSetup(false);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setProfile(null);
      setNeedsProfileSetup(true);
    }
  }, []);

  const clearAuthState = useCallback(async () => {
    // Clear React Query cache
    queryClient.clear();

    // Clear persisted query data from AsyncStorage
    try {
      const keys = await AsyncStorage.getAllKeys();
      const queryKeys = keys.filter(key => key.startsWith('REACT_QUERY'));
      if (queryKeys.length > 0) {
        await AsyncStorage.multiRemove(queryKeys);
      }
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
    }

    setSession(null);
    setUser(null);
    setProfile(null);
    setNeedsProfileSetup(false);
    setIsLoading(false);
  }, [queryClient]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Fetch the initial session from Supabase
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session fetch error:', sessionError);
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // If a session exists, fetch the associated profile
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        } else {
          setProfile(null);
          setNeedsProfileSetup(false);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Set up a listener for auth state changes (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Add a small delay to ensure the profile is available after signup trigger
          setTimeout(async () => {
            await fetchProfile(newSession.user.id);
            setIsLoading(false);
          }, 100);
        } else {
          await clearAuthState();
        }
      }
    );

    // Clean up the subscription when the component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, clearAuthState]);

  const createProfile = useCallback(async (fullName: string, role: 'passenger' | 'driver') => {
    if (!user) {
      throw new Error('No user session available');
    }

    try {
      const newProfile = await profileService.createProfile(user.id, fullName, role);
      setProfile(newProfile);
      setNeedsProfileSetup(false);
    } catch (error) {
      console.error('Failed to create profile:', error);
      throw error;
    }
  }, [user]);

  const logout = useCallback(async () => {
    try {
      // Clear React Query cache first
      queryClient.clear();

      // Clear persisted query data from AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const queryKeys = keys.filter(key => key.startsWith('REACT_QUERY'));
      if (queryKeys.length > 0) {
        await AsyncStorage.multiRemove(queryKeys);
      }

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        throw error;
      }

      // Clear local auth state
      await clearAuthState();
    } catch (error) {
      console.error('Failed to logout:', error);
      throw error;
    }
  }, [queryClient, clearAuthState]);

  const value = {
    session,
    user,
    profile,
    isLoading,
    needsProfileSetup,
    createProfile,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}