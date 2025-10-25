import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register device for push notifications and get Expo push token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Check if running on physical device
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permission not granted');
      return null;
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'your-project-id', // Replace with actual Expo project ID
    });

    const token = tokenData.data;

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#A67B5B',
      });
    }

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Save push token to user's profile in database
 */
export async function savePushToken(token: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('No authenticated user');
      return false;
    }

    const { error } = await supabase
      .from('users')
      .update({ push_token: token })
      .eq('id', user.id);

    if (error) {
      console.error('Error saving push token:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in savePushToken:', error);
    return false;
  }
}

/**
 * Register for push notifications and save token
 * Call this after user logs in or completes onboarding
 */
export async function initializePushNotifications(): Promise<boolean> {
  const token = await registerForPushNotifications();

  if (!token) {
    return false;
  }

  return await savePushToken(token);
}

/**
 * Send a push notification to a user
 * This is called from the backend/Edge Function
 */
export async function sendPushNotification(params: {
  expoPushToken: string;
  title: string;
  body: string;
  data?: any;
}): Promise<boolean> {
  try {
    const message = {
      to: params.expoPushToken,
      sound: 'default',
      title: params.title,
      body: params.body,
      data: params.data || {},
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result.data?.status === 'error') {
      console.error('Push notification error:', result.data);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

/**
 * Send nest message notification to nest members
 * Called when a new message is sent to a nest
 */
export async function sendNestMessageNotification(params: {
  nestId: string;
  senderId: string;
  senderName: string;
  nestName: string;
  messageContent: string;
}): Promise<boolean> {
  try {
    // Get all nest members except the sender
    const { data: members, error } = await supabase
      .from('nest_members')
      .select(`
        user_id,
        user:users!nest_members_user_id_fkey (
          push_token
        )
      `)
      .eq('nest_id', params.nestId)
      .neq('user_id', params.senderId);

    if (error || !members) {
      console.log('No members found for nest:', params.nestId);
      return false;
    }

    // Send notification to all members with push tokens
    const notifications = members
      .filter(member => member.user?.push_token)
      .map(member => ({
        expoPushToken: member.user!.push_token!,
        title: `${params.nestName}`,
        body: `${params.senderName}: ${params.messageContent}`,
        data: {
          type: 'nest_message',
          nestId: params.nestId,
        },
      }));

    // Send all notifications
    const results = await Promise.all(
      notifications.map(notification => sendPushNotification(notification))
    );

    return results.some(result => result);
  } catch (error) {
    console.error('Error sending nest message notification:', error);
    return false;
  }
}

/**
 * Listen for notification interactions (when user taps notification)
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Listen for notifications received while app is in foreground
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Clear all notifications from notification center
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Get notification badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set notification badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear notification badge
 */
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}
