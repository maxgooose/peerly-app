import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import type { UserBadge } from '@/src/services/badges';

interface BadgeProps {
  badge: UserBadge;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  style?: ViewStyle;
}

/**
 * Simple, subtle badge component
 * Displays a small badge with icon and optional label
 */
export function Badge({ badge, size = 'medium', showLabel = true, style }: BadgeProps) {
  const sizeStyles = {
    small: styles.containerSmall,
    medium: styles.containerMedium,
    large: styles.containerLarge,
  };

  const iconSizes = {
    small: styles.iconSmall,
    medium: styles.iconMedium,
    large: styles.iconLarge,
  };

  const labelSizes = {
    small: styles.labelSmall,
    medium: styles.labelMedium,
    large: styles.labelLarge,
  };

  return (
    <View style={[styles.container, sizeStyles[size], style]}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: badge.color + '15' }, // 15 = ~8% opacity
        ]}
      >
        <Text style={iconSizes[size]}>{badge.icon}</Text>
      </View>
      {showLabel && (
        <Text
          style={[styles.label, labelSizes[size], { color: badge.color }]}
          numberOfLines={1}
        >
          {badge.name}
        </Text>
      )}
    </View>
  );
}

/**
 * Display multiple badges in a row
 */
interface BadgeListProps {
  badges: UserBadge[];
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  maxDisplay?: number;
  style?: ViewStyle;
}

export function BadgeList({
  badges,
  size = 'small',
  showLabels = false,
  maxDisplay = 3,
  style,
}: BadgeListProps) {
  if (badges.length === 0) return null;

  const displayBadges = badges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

  return (
    <View style={[styles.listContainer, style]}>
      {displayBadges.map((badge) => (
        <Badge
          key={badge.id}
          badge={badge}
          size={size}
          showLabel={showLabels}
          style={styles.listItem}
        />
      ))}
      {remainingCount > 0 && (
        <View style={styles.moreContainer}>
          <Text style={styles.moreText}>+{remainingCount}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  containerSmall: {
    gap: 4,
  },
  containerMedium: {
    gap: 6,
  },
  containerLarge: {
    gap: 8,
  },
  iconContainer: {
    borderRadius: 6,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSmall: {
    fontSize: 12,
  },
  iconMedium: {
    fontSize: 14,
  },
  iconLarge: {
    fontSize: 16,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  labelSmall: {
    fontSize: 10,
  },
  labelMedium: {
    fontSize: 12,
  },
  labelLarge: {
    fontSize: 14,
  },
  listContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  listItem: {
    // Individual spacing handled by container gap
  },
  moreContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginLeft: 2,
  },
  moreText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
});
