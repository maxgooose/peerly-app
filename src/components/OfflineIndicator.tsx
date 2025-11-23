// =====================================================
// OFFLINE INDICATOR COMPONENT
// =====================================================
// Shows banner when device is offline
// Auto-hides when connection is restored

import React, {useEffect, useState} from 'react';
import {Animated, StyleSheet, Text} from 'react-native';
import {onNetworkStateChange} from '@/services/offline';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-50)); // Start off-screen

  useEffect(() => {
    // Subscribe to network state changes
      return onNetworkStateChange((state) => {
        const offline = !state.isConnected || !state.isInternetReachable;
        setIsOffline(offline);

        // Animate banner in/out
        Animated.timing(slideAnim, {
            toValue: offline ? 0 : -50,
            duration: 300,
            useNativeDriver: true,
        }).start();
    });
  }, [slideAnim]);

  if (!isOffline) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.text}>
        You're offline. Changes will sync when connection is restored.
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF9500', // Orange color for warning
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
