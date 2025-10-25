import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabase';

const OFFLINE_MESSAGES_KEY = '@peerly_offline_messages';
const OFFLINE_ACTIONS_KEY = '@peerly_offline_actions';
const LAST_SYNC_KEY = '@peerly_last_sync';

export interface OfflineMessage {
  id: string; // Client-side ID for deduplication
  conversation_id: string;
  content: string;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'failed' | 'synced';
}

export interface OfflineAction {
  id: string;
  type: 'update_profile' | 'schedule_session' | 'unmatch' | 'swipe';
  payload: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'failed' | 'synced';
}

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string | null;
}

/**
 * Network state management
 */
let networkState: NetworkState = {
  isConnected: false,
  isInternetReachable: false,
  type: null,
};

let networkListeners: ((state: NetworkState) => void)[] = [];

/**
 * Initialize network monitoring
 */
export function initializeNetworkMonitoring(): () => void {
  const unsubscribe = NetInfo.addEventListener(state => {
    networkState = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable ?? false,
      type: state.type,
    };

    // Notify all listeners
    networkListeners.forEach(listener => listener(networkState));

    // Auto-sync when connection is restored
    if (networkState.isConnected && networkState.isInternetReachable) {
      syncOfflineData();
    }
  });

  return unsubscribe;
}

/**
 * Subscribe to network state changes
 */
export function onNetworkStateChange(callback: (state: NetworkState) => void): () => void {
  networkListeners.push(callback);

  // Immediately call with current state
  callback(networkState);

  // Return unsubscribe function
  return () => {
    networkListeners = networkListeners.filter(listener => listener !== callback);
  };
}

/**
 * Get current network state
 */
export function getNetworkState(): NetworkState {
  return networkState;
}

/**
 * Check if device is online
 */
export function isOnline(): boolean {
  return networkState.isConnected && (networkState.isInternetReachable ?? true);
}

/**
 * Offline message queue management
 */

/**
 * Queue a message for offline sending
 */
export async function queueOfflineMessage(message: Omit<OfflineMessage, 'retryCount' | 'status'>): Promise<void> {
  try {
    const messages = await getOfflineMessages();
    messages.push({
      ...message,
      retryCount: 0,
      status: 'pending',
    });
    await AsyncStorage.setItem(OFFLINE_MESSAGES_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Error queuing offline message:', error);
  }
}

/**
 * Get all queued offline messages
 */
export async function getOfflineMessages(): Promise<OfflineMessage[]> {
  try {
    const data = await AsyncStorage.getItem(OFFLINE_MESSAGES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting offline messages:', error);
    return [];
  }
}

/**
 * Remove a message from the offline queue
 */
export async function removeOfflineMessage(messageId: string): Promise<void> {
  try {
    const messages = await getOfflineMessages();
    const filtered = messages.filter(m => m.id !== messageId);
    await AsyncStorage.setItem(OFFLINE_MESSAGES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing offline message:', error);
  }
}

/**
 * Update message status in queue
 */
async function updateMessageStatus(
  messageId: string,
  status: 'pending' | 'failed' | 'synced',
  incrementRetry = false
): Promise<void> {
  try {
    const messages = await getOfflineMessages();
    const updated = messages.map(m =>
      m.id === messageId
        ? { ...m, status, retryCount: incrementRetry ? m.retryCount + 1 : m.retryCount }
        : m
    );
    await AsyncStorage.setItem(OFFLINE_MESSAGES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error updating message status:', error);
  }
}

/**
 * Offline action queue management
 */

/**
 * Queue an action for offline execution
 */
export async function queueOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<void> {
  try {
    const actions = await getOfflineActions();
    actions.push({
      ...action,
      id: `action_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    });
    await AsyncStorage.setItem(OFFLINE_ACTIONS_KEY, JSON.stringify(actions));
  } catch (error) {
    console.error('Error queuing offline action:', error);
  }
}

/**
 * Get all queued offline actions
 */
export async function getOfflineActions(): Promise<OfflineAction[]> {
  try {
    const data = await AsyncStorage.getItem(OFFLINE_ACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting offline actions:', error);
    return [];
  }
}

/**
 * Remove an action from the offline queue
 */
export async function removeOfflineAction(actionId: string): Promise<void> {
  try {
    const actions = await getOfflineActions();
    const filtered = actions.filter(a => a.id !== actionId);
    await AsyncStorage.setItem(OFFLINE_ACTIONS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing offline action:', error);
  }
}

/**
 * Sync offline data when connection is restored
 */
export async function syncOfflineData(): Promise<{
  success: boolean;
  messagesSynced: number;
  actionsSynced: number;
  errors: string[];
}> {
  if (!isOnline()) {
    return { success: false, messagesSynced: 0, actionsSynced: 0, errors: ['Device is offline'] };
  }

  const errors: string[] = [];
  let messagesSynced = 0;
  let actionsSynced = 0;

  // Sync messages
  const messages = await getOfflineMessages();
  const pendingMessages = messages.filter(m => m.status === 'pending' && m.retryCount < 3);

  for (const message of pendingMessages) {
    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: message.conversation_id,
        content: message.content,
        client_id: message.id,
        created_at: new Date(message.timestamp).toISOString(),
      });

      if (error) {
        await updateMessageStatus(message.id, 'failed', true);
        errors.push(`Message ${message.id}: ${error.message}`);
      } else {
        await removeOfflineMessage(message.id);
        messagesSynced++;
      }
    } catch (error) {
      await updateMessageStatus(message.id, 'failed', true);
      errors.push(`Message ${message.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Sync actions
  const actions = await getOfflineActions();
  const pendingActions = actions.filter(a => a.status === 'pending' && a.retryCount < 3);

  for (const action of pendingActions) {
    try {
      const result = await executeAction(action);
      if (result.success) {
        await removeOfflineAction(action.id);
        actionsSynced++;
      } else {
        errors.push(`Action ${action.id}: ${result.error}`);
      }
    } catch (error) {
      errors.push(`Action ${action.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update last sync timestamp
  await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

  return {
    success: errors.length === 0,
    messagesSynced,
    actionsSynced,
    errors,
  };
}

/**
 * Execute a queued offline action
 */
async function executeAction(action: OfflineAction): Promise<{ success: boolean; error?: string }> {
  try {
    switch (action.type) {
      case 'update_profile':
        const { error: updateError } = await supabase
          .from('users')
          .update(action.payload)
          .eq('id', action.payload.userId);

        if (updateError) return { success: false, error: updateError.message };
        return { success: true };

      case 'schedule_session':
        const { error: sessionError } = await supabase
          .from('study_sessions')
          .insert(action.payload);

        if (sessionError) return { success: false, error: sessionError.message };
        return { success: true };

      case 'unmatch':
        const { error: unmatchError } = await supabase
          .from('matches')
          .update({ status: 'unmatched', unmatched_at: new Date().toISOString() })
          .eq('id', action.payload.matchId);

        if (unmatchError) return { success: false, error: unmatchError.message };
        return { success: true };

      case 'swipe':
        const { error: swipeError } = await supabase
          .from('swipe_actions')
          .insert(action.payload);

        if (swipeError) return { success: false, error: swipeError.message };
        return { success: true };

      default:
        return { success: false, error: 'Unknown action type' };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get last sync timestamp
 */
export async function getLastSyncTime(): Promise<number | null> {
  try {
    const timestamp = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Clear all offline data (use with caution)
 */
export async function clearOfflineData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      OFFLINE_MESSAGES_KEY,
      OFFLINE_ACTIONS_KEY,
      LAST_SYNC_KEY,
    ]);
  } catch (error) {
    console.error('Error clearing offline data:', error);
  }
}

/**
 * Get offline queue stats
 */
export async function getOfflineStats(): Promise<{
  pendingMessages: number;
  failedMessages: number;
  pendingActions: number;
  failedActions: number;
  lastSync: number | null;
}> {
  const messages = await getOfflineMessages();
  const actions = await getOfflineActions();
  const lastSync = await getLastSyncTime();

  return {
    pendingMessages: messages.filter(m => m.status === 'pending').length,
    failedMessages: messages.filter(m => m.status === 'failed').length,
    pendingActions: actions.filter(a => a.status === 'pending').length,
    failedActions: actions.filter(a => a.status === 'failed').length,
    lastSync,
  };
}
