import { useAuth } from '@/contexts/AuthContext'; // Assuming you create this
import { profileService } from '@/services/profileService';
import { useQuery } from '@tanstack/react-query';

export function useProfile() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => {
      if (!userId) {
        // safeguard lang, though naa nay enabled props
        throw new Error('User is not authenticated');
      }
      return profileService.getProfile(userId);
    },
    // DILI NI MA-EXECUTE IF WALAY USERID
    enabled: !!userId,
  });
}
