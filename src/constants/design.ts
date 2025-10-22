// Design system colors and styles
export const colors = {
  // Primary palette - light brown and soft tones
  primary: '#D4A574',      // Light brown
  primaryDark: '#B8935A',  // Darker brown
  primaryLight: '#E6C49A', // Lighter brown
  
  // Secondary palette - soft complementary colors
  secondary: '#A8C8A8',    // Soft sage green
  secondaryDark: '#8FB08F', // Darker sage
  secondaryLight: '#C4D4C4', // Lighter sage
  
  // Neutral palette
  background: '#FDFCF8',   // Warm white
  surface: '#F5F3F0',      // Soft beige
  card: '#FFFFFF',         // Pure white
  
  // Text colors
  textPrimary: '#3A3A3A',   // Dark brown
  textSecondary: '#6B6B6B',  // Medium gray
  textLight: '#9B9B9B',      // Light gray
  
  // Status colors
  success: '#A8C8A8',       // Soft green
  error: '#E6A8A8',         // Soft red
  warning: '#E6C49A',       // Soft yellow
  info: '#A8C8C8',          // Soft blue
  
  // Border and divider
  border: '#E0D8C8',        // Light brown border
  divider: '#F0E8D8',       // Very light brown
};

export const typography = {
  // Font families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
  },
  
  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};
