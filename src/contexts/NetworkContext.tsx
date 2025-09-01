import { OfflineActionQueue } from '@/lib/offline/ActionQueue';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface NetworkContextType {
  isConnected: boolean | null;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: null,
});

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isOnline = state.isConnected != null && state.isInternetReachable === true;
      setIsConnected(isOnline);

      if (isOnline) {
        OfflineActionQueue.process();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected }}>
      {children}
    </NetworkContext.Provider>
  );
};