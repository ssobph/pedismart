import { supabase } from '@/lib/supabase';

export interface PassengerRating {
  passenger_id: string;
  average_rating: number;
  rating_count: number;
}

export const ratingService = {
  getAverageRatings: async (passengerIds: string[]): Promise<Map<string, PassengerRating>> => {
    if (passengerIds.length === 0) {
      return new Map();
    }

    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('ratee_id, rating')
        .in('ratee_id', passengerIds);

      if (error) {
        console.error('Error fetching passenger ratings:', error);
        return new Map();
      }

      const ratingsMap = new Map<string, PassengerRating>();
      const ratingGroups = new Map<string, number[]>();

      // GROUPS ratings by passenger ID
      data?.forEach((rating) => {
        if (!ratingGroups.has(rating.ratee_id)) {
          ratingGroups.set(rating.ratee_id, []);
        }
        ratingGroups.get(rating.ratee_id)?.push(rating.rating);
      });

      ratingGroups.forEach((ratings, passengerId) => {
        const sum = ratings.reduce((acc, rating) => acc + rating, 0);
        const average = sum / ratings.length;
        
        ratingsMap.set(passengerId, {
          passenger_id: passengerId,
          average_rating: Number(average.toFixed(1)),
          rating_count: ratings.length,
        });
      });

      passengerIds.forEach((id) => {
        if (!ratingsMap.has(id)) {
          ratingsMap.set(id, {
            passenger_id: id,
            average_rating: 0,
            rating_count: 0,
          });
        }
      });

      return ratingsMap;
    } catch (error) {
      console.error('Error in getAverageRatings:', error);
      return new Map();
    }
  },

  getPassengerRating: async (passengerId: string): Promise<PassengerRating | null> => {
    const ratingsMap = await ratingService.getAverageRatings([passengerId]);
    return ratingsMap.get(passengerId) || null;
  },
};
