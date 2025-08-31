import { supabase } from '@/lib/supabase';
import { profileService } from '@/services/profileService';
import { Database } from '@/types/supabase';
import { Session, User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  needsProfileSetup: boolean;
  createProfile: (fullName: string, role: 'passenger' | 'driver') => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  needsProfileSetup: false,
  createProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const fetchedProfile = await profileService.getProfile(userId);
      if (fetchedProfile) {
        setProfile(fetchedProfile);
        setNeedsProfileSetup(false);
      } else {
        setProfile(null);
        setNeedsProfileSetup(true);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setProfile(null);
      setNeedsProfileSetup(true);
    }
  }, []);

  const clearAuthState = useCallback(() => {
    setSession(null);
    setUser(null);
    setProfile(null);
    setNeedsProfileSetup(false);
    setIsLoading(false);
  }, []);

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
          clearAuthState();
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

  const value = {
    session,
    user,
    profile,
    isLoading,
    needsProfileSetup,
    createProfile,
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