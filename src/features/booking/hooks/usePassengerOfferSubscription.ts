import { useEffect, useRef, useState } from 'react';
import { tripService, TripWithDetails } from '@/services/tripService';

interface UsePassengerOfferSubscriptionParams {
  passengerId: string;
  onOffer: (trip: TripWithDetails) => void;
  enabled: boolean;
}

export function usePassengerOfferSubscription({
  passengerId,
  onOffer,
  enabled,
}: UsePassengerOfferSubscriptionParams) {
  const unsubscribeRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    if (enabled) {
      unsubscribeRef.current = tripService.subscribeToPassengerOffers(
        passengerId,
        onOffer
      );
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [enabled, passengerId, onOffer]);
}