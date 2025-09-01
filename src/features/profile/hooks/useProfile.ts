import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/services/profileService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useProfile() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User is not authenticated');
      }
      
      const basicProfile = await profileService.getProfile(userId);
      if (!basicProfile) {
        throw new Error('Profile not found');
      }
      
      if (basicProfile.role === 'driver') {
        return profileService.getDriverProfile(userId);
      }
      
      return basicProfile;
    },
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: (updates: any) => {
      if (!userId) {
        throw new Error('User is not authenticated');
      }
      return profileService.updateProfile(userId, updates);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.setQueryData(['profile', userId], data);
    },
    onError: (error) => {
      console.error('Failed to update profile:', error);
    },
  });
}
