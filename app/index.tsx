import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { getCurrentUser } from '@/services/auth';

export default function Index() {
  useEffect(() => {
    // Check if user is authenticated
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const user = await getCurrentUser();
    // For now, always redirect to auth
    // Later we'll check if user exists and redirect accordingly
  };

  // For MVP, always start with auth
  return <Redirect href="/(auth)/login" />;
}
