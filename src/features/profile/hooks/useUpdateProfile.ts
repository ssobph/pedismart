import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/services/profileService';
import { Database } from '@/types/database.types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type ProfileUpdate = Partial<Database['public']['Tables']['profiles']['Row']>;
type DriverProfileUpdate = Partial<Database['public']['Tables']['drivers']['Row']>;
type CombinedProfileUpdate = ProfileUpdate & DriverProfileUpdate;

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (updates: CombinedProfileUpdate) => {
      if (!userId) {
        throw new Error('User is not authenticated');
      }

      const currentProfile = await profileService.getProfile(userId);
      if (!currentProfile) {
        throw new Error('Profile not found');
      }

      if (currentProfile.role === 'driver') {
        return profileService.updateDriverProfile(userId, updates);
      }
      
      return profileService.updateProfile(userId, updates);
    },
    onSuccess: (updatedProfile) => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.setQueryData(['profile', userId], updatedProfile);
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
    },
  });
}
