import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Container } from '@/components/ui';
import { colors, typography, spacing } from '@/constants/design';
import { resendVerification } from '@/services/auth';

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [loading, setLoading] = useState(false);

  const handleResendVerification = async () => {
    if (!email) return;

    setLoading(true);
    try {
      const result = await resendVerification(email);
      
      if (result.success) {
        Alert.alert(
          'Verification Sent',
          'Please check your email for the verification link.'
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to resend verification');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/(auth)/login');
  };

  return (
    <Container style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a verification link to
          </Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Please check your email and click the verification link to activate your account.
          </Text>
          <Text style={styles.instructionText}>
            If you don't see the email, check your spam folder.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Resend Verification"
            variant="outline"
            onPress={handleResendVerification}
            loading={loading}
            style={styles.resendButton}
          />
          
          <Button
            title="Back to Sign In"
            variant="secondary"
            onPress={handleBackToLogin}
            style={styles.backButton}
          />
        </View>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  title: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  email: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    textAlign: 'center',
  },
  instructions: {
    marginBottom: spacing['3xl'],
    paddingHorizontal: spacing.md,
  },
  instructionText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
    marginBottom: spacing.md,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
  },
  resendButton: {
    marginBottom: spacing.lg,
    minWidth: 200,
  },
  backButton: {
    minWidth: 200,
  },
});
