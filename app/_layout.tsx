import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { initializePushNotifications, addNotificationResponseListener } from '@/services/notifications';
import { initializeNetworkMonitoring, onNetworkStateChange } from '@/services/offline';
import { OfflineIndicator } from '@/components/OfflineIndicator';

export default function RootLayout() {
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Initialize push notifications when app loads
    initializePushNotifications();

    // Initialize network monitoring for offline support
    const unsubscribeNetwork = initializeNetworkMonitoring();

    // Listen for network state changes
    const unsubscribeNetworkListener = onNetworkStateChange((state) => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('Online - Auto-syncing queued items...');
      } else {
        console.log('Offline - Queueing enabled');
      }
    });

    // Listen for notification taps
    responseListener.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;

      // Handle different notification types
      if (data.type === 'new_match' && data.matchId) {
        // Navigate to chats tab to see new match
        router.push('/(tabs)/chats');
      } else if (data.type === 'nest_message' && data.nestId) {
        // Navigate to nest chat
        router.push(`/nest/${data.nestId}`);
      }
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeNetwork();
      unsubscribeNetworkListener();
      
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <OfflineIndicator />
      <Stack>
        <Stack.Screen 
          name="(auth)" 
          options={{ 
            headerShown: false,
            title: 'Authentication'
          }} 
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
            title: 'Main App'
          }} 
        />
        <Stack.Screen 
          name="chat/[id]" 
          options={{ 
            title: 'Chat',
            headerBackTitle: 'Back'
          }} 
        />
        <Stack.Screen 
          name="nest/[id]" 
          options={{ 
            title: 'Nest',
            headerBackTitle: 'Back'
          }} 
        />
        <Stack.Screen 
          name="nest/create" 
          options={{ 
            title: 'Create Nest',
            headerBackTitle: 'Back'
          }} 
        />
        <Stack.Screen 
          name="nest/discover" 
          options={{ 
            title: 'Discover Nests',
            headerBackTitle: 'Back'
          }} 
        />
      </Stack>
    </>
  );
}
