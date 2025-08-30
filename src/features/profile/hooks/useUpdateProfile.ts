import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/services/profileService';
import { Database } from '@/types/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type ProfileUpdate = Partial<Database['public']['Tables']['profiles']['Row']>;

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: (updates: ProfileUpdate) => {
      if (!userId) {
        throw new Error('User is not authenticated');
      }
      return profileService.updateProfile(userId, updates);
    },
    onSuccess: (updatedProfile) => {
      // IF SUCCESSFUL, i-invalidate ang 'profile' query.
      // TANSTACK PROFILE IS OLD NOW, REFERESH EVERYTHING RELATED TO 'useProfile'
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.setQueryData(['profile', userId], updatedProfile);
    },
    onError: (error) => {
      // TODO: console.error("Error updating profile:", error);
    }
  });
}
