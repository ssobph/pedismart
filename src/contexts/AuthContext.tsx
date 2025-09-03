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
        // new user who just signed up, their profile trigger might not have run yet.
        // We set needsProfileSetup to true. If ghost session, the ProfileSetupModal
        // will fail gracefully or the user will be logged out by other means.
        const { data: { user } } = await supabase.auth.getUser();
        // profile might not exist for a brand new user.
        if (user) {
           setProfile(null);
           setNeedsProfileSetup(true);
        } else {
           // no user, no profile, we log out.
           await supabase.auth.signOut();
        }
        return;
      }
      
      if (basicProfile.role === 'driver') {
        const driverProfile = await profileService.getDriverProfile(userId);
        if (driverProfile) {
          setProfile(driverProfile);
          setNeedsProfileSetup(false);
        } else {
          console.error(`Could not fetch or create driver-specific profile for ${userId}. Forcing sign-out.`);
          await supabase.auth.signOut();
        }
      } else {
        setProfile(basicProfile);
        setNeedsProfileSetup(false);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      await supabase.auth.signOut();
    }
  }, []);

  const clearAuthState = useCallback(async () => {
    queryClient.clear();

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
        
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session fetch error:', sessionError);
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_IN' && newSession?.user) {
          await fetchProfile(newSession.user.id);
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          await clearAuthState();
        } else if (event === 'INITIAL_SESSION' && newSession?.user) {
          await fetchProfile(newSession.user.id);
          setIsLoading(false);
        }
      }
    );

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
      queryClient.clear();

      const keys = await AsyncStorage.getAllKeys();
      const queryKeys = keys.filter(key => key.startsWith('REACT_QUERY'));
      if (queryKeys.length > 0) {
        await AsyncStorage.multiRemove(queryKeys);
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        throw error;
      }

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