import { supabase } from './supabase';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_ID_KEY = '@peerly_session_id';
const SESSION_START_KEY = '@peerly_session_start';

let currentSessionId: string | null = null;
let sessionStartTime: number = 0;

/**
 * Event categories for analytics
 */
export type EventCategory =
  | 'engagement'
  | 'matching'
  | 'messaging'
  | 'session'
  | 'profile'
  | 'onboarding'
  | 'system';

/**
 * Common event types
 */
export const AnalyticsEvents = {
  // Engagement
  APP_OPENED: 'app_opened',
  APP_BACKGROUNDED: 'app_backgrounded',
  APP_CLOSED: 'app_closed',
  SCREEN_VIEWED: 'screen_viewed',

  // Onboarding
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_ABANDONED: 'onboarding_abandoned',

  // Profile
  PROFILE_UPDATED: 'profile_updated',
  PHOTO_UPLOADED: 'photo_uploaded',
  BADGE_ASSIGNED: 'badge_assigned',

  // Matching
  AUTO_MATCH_RECEIVED: 'auto_match_received',
  SWIPE_LIKE: 'swipe_like',
  SWIPE_SKIP: 'swipe_skip',
  MATCH_CREATED: 'match_created',
  MATCH_UNMATCHED: 'match_unmatched',

  // Messaging
  MESSAGE_SENT: 'message_sent',
  MESSAGE_RECEIVED: 'message_received',
  CONVERSATION_OPENED: 'conversation_opened',
  AI_MESSAGE_GENERATED: 'ai_message_generated',

  // Study Sessions
  SESSION_SCHEDULED: 'session_scheduled',
  SESSION_RESCHEDULED: 'session_rescheduled',
  SESSION_CANCELLED: 'session_cancelled',
  SESSION_COMPLETED: 'session_completed',

  // System
  ERROR_OCCURRED: 'error_occurred',
  SYNC_COMPLETED: 'sync_completed',
  NOTIFICATION_RECEIVED: 'notification_received',
  NOTIFICATION_TAPPED: 'notification_tapped',
} as const;

/**
 * Initialize analytics session
 */
export async function initializeAnalyticsSession(): Promise<void> {
  try {
    // Generate or retrieve session ID
    let sessionId = await AsyncStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await AsyncStorage.setItem(SESSION_ID_KEY, sessionId);
    }

    currentSessionId = sessionId;
    sessionStartTime = Date.now();
    await AsyncStorage.setItem(SESSION_START_KEY, sessionStartTime.toString());

    // Track app opened
    await trackEvent({
      eventType: AnalyticsEvents.APP_OPENED,
      category: 'engagement',
    });
  } catch (error) {
    console.error('Error initializing analytics session:', error);
  }
}

/**
 * End analytics session
 */
export async function endAnalyticsSession(): Promise<void> {
  try {
    const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000 / 60); // minutes

    await trackEvent({
      eventType: AnalyticsEvents.APP_CLOSED,
      category: 'engagement',
      properties: {
        session_duration_minutes: sessionDuration,
      },
    });

    // Update user engagement metrics
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      await supabase.rpc('update_user_engagement', {
        p_user_id: userData.user.id,
        p_date: new Date().toISOString().split('T')[0],
        p_time_spent_minutes: sessionDuration,
      });
    }

    // Clear session
    await AsyncStorage.removeItem(SESSION_ID_KEY);
    currentSessionId = null;
  } catch (error) {
    console.error('Error ending analytics session:', error);
  }
}

/**
 * Get device info for analytics
 */
function getDeviceInfo() {
  return {
    platform: Platform.OS,
    version: Platform.Version,
    device_name: Device.deviceName,
    device_model: Device.modelName,
    os_name: Device.osName,
    os_version: Device.osVersion,
    brand: Device.brand,
    manufacturer: Device.manufacturer,
    is_device: Device.isDevice,
  };
}

/**
 * Track an analytics event
 */
export async function trackEvent(params: {
  eventType: string; // Event type from AnalyticsEvents object
  category: EventCategory;
  properties?: Record<string, any>;
  userId?: string;
}): Promise<void> {
  try {
    // Get user ID if not provided
    let userId = params.userId;
    if (!userId) {
      const { data: userData } = await supabase.auth.getUser();
      userId = userData?.user?.id;
    }

    // Don't track if no user (except for certain events)
    const allowedAnonymousEvents: string[] = [
      AnalyticsEvents.APP_OPENED,
      AnalyticsEvents.ONBOARDING_STARTED,
    ];

    if (!userId && !allowedAnonymousEvents.includes(params.eventType as string)) {
      return;
    }

    // Track event
    await supabase.rpc('track_event', {
      p_user_id: userId || null,
      p_event_type: params.eventType,
      p_event_category: params.category,
      p_event_properties: params.properties || {},
      p_device_info: getDeviceInfo(),
      p_session_id: currentSessionId,
    });
  } catch (error) {
    console.error('Error tracking event:', error);
    // Don't throw - analytics should never break the app
  }
}

/**
 * Track screen view
 */
export async function trackScreenView(screenName: string, properties?: Record<string, any>): Promise<void> {
  await trackEvent({
    eventType: AnalyticsEvents.SCREEN_VIEWED,
    category: 'engagement',
    properties: {
      screen_name: screenName,
      ...properties,
    },
  });
}

/**
 * Track user engagement action
 */
export async function trackEngagement(action: string, properties?: Record<string, any>): Promise<void> {
  await trackEvent({
    eventType: action,
    category: 'engagement',
    properties,
  });
}

/**
 * Track error
 */
export async function trackError(error: Error, context?: Record<string, any>): Promise<void> {
  await trackEvent({
    eventType: AnalyticsEvents.ERROR_OCCURRED,
    category: 'system',
    properties: {
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    },
  });
}

/**
 * Update user engagement metrics
 */
export async function updateEngagementMetrics(metrics: {
  messagesSent?: number;
  messagesReceived?: number;
  matchesMade?: number;
  studySessionsScheduled?: number;
  studySessionsCompleted?: number;
}): Promise<void> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;

    await supabase.rpc('update_user_engagement', {
      p_user_id: userData.user.id,
      p_date: new Date().toISOString().split('T')[0],
      p_messages_sent: metrics.messagesSent || 0,
      p_messages_received: metrics.messagesReceived || 0,
      p_matches_made: metrics.matchesMade || 0,
      p_study_sessions_scheduled: metrics.studySessionsScheduled || 0,
      p_study_sessions_completed: metrics.studySessionsCompleted || 0,
    });
  } catch (error) {
    console.error('Error updating engagement metrics:', error);
  }
}

/**
 * Get analytics dashboard data
 */
export async function getAnalyticsDashboard(params: {
  startDate: string;
  endDate: string;
}): Promise<{
  success: boolean;
  data?: {
    dailyActiveUsers: number[];
    totalUsers: number;
    totalMatches: number;
    totalMessages: number;
    avgMessagesPerUser: number;
    retentionRates: { day: number; rate: number }[];
  };
  error?: string;
}> {
  try {
    // Get DAU data
    const { data: dauData, error: dauError } = await supabase
      .from('analytics_daily_metrics')
      .select('date, metric_value')
      .eq('metric_type', 'dau')
      .gte('date', params.startDate)
      .lte('date', params.endDate)
      .order('date', { ascending: true });

    if (dauError) throw dauError;

    // Get total users
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Get total matches
    const { count: totalMatches, error: matchesError } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true });

    if (matchesError) throw matchesError;

    // Get total messages
    const { count: totalMessages, error: messagesError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });

    if (messagesError) throw messagesError;

    // Get retention rates
    const { data: retentionData, error: retentionError } = await supabase
      .from('analytics_cohorts')
      .select('day_number, retention_rate')
      .order('day_number', { ascending: true })
      .limit(10);

    if (retentionError) throw retentionError;

    // Calculate averages
    const avgMessagesPerUser = totalUsers ? (totalMessages || 0) / totalUsers : 0;

    // Aggregate retention by day
    const retentionMap = new Map<number, number[]>();
    retentionData?.forEach((item: any) => {
      if (!retentionMap.has(item.day_number)) {
        retentionMap.set(item.day_number, []);
      }
      retentionMap.get(item.day_number)!.push(parseFloat(item.retention_rate.toString()));
    });

    const retentionRates = Array.from(retentionMap.entries())
      .map(([day, rates]) => ({
        day,
        rate: rates.reduce((sum, r) => sum + r, 0) / rates.length,
      }))
      .sort((a, b) => a.day - b.day);

    return {
      success: true,
      data: {
        dailyActiveUsers: dauData?.map((d: any) => parseFloat(d.metric_value.toString())) || [],
        totalUsers: totalUsers || 0,
        totalMatches: totalMatches || 0,
        totalMessages: totalMessages || 0,
        avgMessagesPerUser,
        retentionRates,
      },
    };
  } catch (error) {
    console.error('Error getting analytics dashboard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load analytics',
    };
  }
}

/**
 * Get user's personal analytics
 */
export async function getUserAnalytics(userId: string, days: number = 30): Promise<{
  success: boolean;
  data?: {
    totalMessages: number;
    totalMatches: number;
    studySessionsCompleted: number;
    avgDailyEngagement: number;
    streakDays: number;
  };
  error?: string;
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get engagement metrics
    const { data: engagementData, error: engagementError } = await supabase
      .from('user_engagement_metrics')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (engagementError) throw engagementError;

    const totalMessages = engagementData?.reduce((sum: number, day: any) => sum + (day.messages_sent || 0), 0) || 0;
    const totalMatches = engagementData?.reduce((sum: number, day: any) => sum + (day.matches_made || 0), 0) || 0;
    const studySessionsCompleted = engagementData?.reduce((sum: number, day: any) => sum + (day.study_sessions_completed || 0), 0) || 0;
    const avgDailyEngagement = engagementData?.length ? totalMessages / engagementData.length : 0;

    // Calculate streak
    let streakDays = 0;
    const sortedDays = [...(engagementData || [])].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (let i = 0; i < sortedDays.length; i++) {
      const currentDate = new Date(sortedDays[i].date);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);

      if (currentDate.toDateString() === expectedDate.toDateString()) {
        streakDays++;
      } else {
        break;
      }
    }

    return {
      success: true,
      data: {
        totalMessages,
        totalMatches,
        studySessionsCompleted,
        avgDailyEngagement,
        streakDays,
      },
    };
  } catch (error) {
    console.error('Error getting user analytics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load analytics',
    };
  }
}
