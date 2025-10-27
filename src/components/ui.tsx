import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  TouchableOpacityProps,
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '@/constants/design';

// Button Component
interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({ 
  title, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  style,
  ...props 
}: ButtonProps) {
  const buttonStyle = [
    styles.button,
    styles[`button_${variant}`],
    styles[`button_${size}`],
    style,
  ];

  const textStyle = [
    styles.buttonText,
    styles[`buttonText_${variant}`],
    styles[`buttonText_${size}`],
  ];

  return (
    <TouchableOpacity style={buttonStyle} {...props}>
      <Text style={textStyle}>
        {loading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
}

// Input Component
interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: any;
}

export function Input({ 
  label, 
  error, 
  containerStyle, 
  style, 
  ...props 
}: InputProps) {
  return (
    <View style={[styles.inputContainer, containerStyle]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : undefined,
          style,
        ].filter(Boolean)}
        placeholderTextColor={colors.textLight}
        {...props}
      />
      {error && <Text style={styles.inputErrorText}>{error}</Text>}
    </View>
  );
}

// Card Component
interface CardProps {
  children: React.ReactNode;
  style?: any;
}

export function Card({ children, style }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

// Container Component
interface ContainerProps {
  children: React.ReactNode;
  style?: any;
}

export function Container({ children, style }: ContainerProps) {
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // Button styles
  button: {
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  button_primary: {
    backgroundColor: colors.primary,
  },
  button_secondary: {
    backgroundColor: colors.secondary,
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  button_sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  button_md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  button_lg: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  buttonText: {
    fontFamily: typography.fontFamily.medium,
    fontWeight: typography.fontWeight.semibold,
  },
  buttonText_primary: {
    color: colors.card,
  },
  buttonText_secondary: {
    color: colors.card,
  },
  buttonText_outline: {
    color: colors.primary,
  },
  buttonText_sm: {
    fontSize: typography.fontSize.sm,
  },
  buttonText_md: {
    fontSize: typography.fontSize.base,
  },
  buttonText_lg: {
    fontSize: typography.fontSize.lg,
  },

  // Input styles
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    backgroundColor: colors.card,
    ...shadows.sm,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputErrorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },

  // Card styles
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },

  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
});
