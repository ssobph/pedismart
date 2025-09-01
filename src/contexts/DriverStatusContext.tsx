import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { profileService } from '@/services/profileService';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface DriverStatusContextValue {
  isOnline: boolean;
  isLoading: boolean;
  setOnline: (newState: boolean) => Promise<void>;
  toggle: () => Promise<void>;
}

const DriverStatusContext = createContext<DriverStatusContextValue | undefined>(undefined);

export function DriverStatusProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [isOnline, setIsOnlineState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeStatus = async () => {
      if (!user || profile?.role !== 'driver') {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('drivers')
          .select('status')
          .eq('profile_id', user.id)
          .single();

        if (!error && data) {
          setIsOnlineState(data.status === 'online');
        }
      } catch (error) {
        console.error('Error fetching driver status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeStatus();
  }, [user, profile]);

  const setOnline = useCallback(async (newState: boolean) => {
    if (!user || profile?.role !== 'driver') {
      return;
    }

    try {
      const newStatus = newState ? 'online' : 'offline';
      await profileService.updateDriverStatus(user.id, newStatus);
      setIsOnlineState(newState);
    } catch (error) {
      throw error;
    }
  }, [user, profile]);

  const toggle = useCallback(async () => {
    await setOnline(!isOnline);
  }, [isOnline, setOnline]);

  const value: DriverStatusContextValue = {
    isOnline,
    isLoading,
    setOnline,
    toggle,
  };

  return (
    <DriverStatusContext.Provider value={value}>
      {children}
    </DriverStatusContext.Provider>
  );
}

export function useDriverStatus() {
  const context = useContext(DriverStatusContext);
  if (context === undefined) {
    throw new Error('useDriverStatus must be used within a DriverStatusProvider');
  }
  return context;
}
