import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { getCurrentUser } from '@/services/auth';
import { getOnboardingStatus, ensureUserRecordExists } from '@/services/onboarding';
import { colors } from '@/constants/design';

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // 1. Check if user is authenticated
      const user = await getCurrentUser();

      if (!user) {
        // No user logged in → go to login
        setDestination('/(auth)/login');
        return;
      }

      // 2. User is authenticated, ensure their record exists in users table
      const recordResult = await ensureUserRecordExists();
      
      if (!recordResult.success) {
        console.error('Failed to ensure user record:', recordResult.error);
        // If we can't create/find user record, send to login to retry
        setDestination('/(auth)/login');
        return;
      }

      // 3. Check onboarding status
      const onboardingStatus = await getOnboardingStatus();

      if (!onboardingStatus.success) {
        console.error('Failed to check onboarding status:', onboardingStatus.error);
        // If we can't check status, assume not completed
        setDestination('/(auth)/onboarding');
        return;
      }

      // 4. Route based on onboarding completion
      if (onboardingStatus.onboardingCompleted) {
        // User is fully set up → go to main app
        setDestination('/(tabs)/matches');
      } else {
        // User needs to complete onboarding
        setDestination('/(auth)/onboarding');
      }

    } catch (error) {
      console.error('App initialization error:', error);
      // On any error, default to login for safety
      setDestination('/(auth)/login');
    } finally {
      setIsReady(true);
    }
  };

  // Show loading state while checking auth
  if (!isReady || !destination) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Redirect to determined destination
  return <Redirect href={destination as any} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});