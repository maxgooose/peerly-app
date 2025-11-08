// app/(tabs)/matches.tsx
// UPDATED FOR DAILY AUTO-MATCH CYCLE
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions, 
  ScrollView,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { getConversations } from '@/services/chat';

const { width } = Dimensions.get('window');

type User = {
  id: string;
  full_name?: string | null;
  major?: string | null;
  year?: string | null;
  preferred_subjects?: string[] | null;
  profile_photo_url?: string | null;
  last_auto_match_cycle?: string | null;
};

type TodaysMatch = {
  id: string;
  match_id: string;
  other_user: User;
  matched_at: string;
  has_ai_message: boolean;
  conversation_id?: string;
  last_message_content?: string | null;
};

export default function MatchesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [todaysMatches, setTodaysMatches] = useState<TodaysMatch[]>([]);
  const [nextMatchTime, setNextMatchTime] = useState<Date | null>(null);
  const [timeUntilMatch, setTimeUntilMatch] = useState('');
  const [hasNewMatch, setHasNewMatch] = useState(false);

  useEffect(() => {
    loadUserAndMatches();
  }, []);

  // Update countdown timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      updateCountdown();
    }, 1000);
    return () => clearInterval(interval);
  }, [nextMatchTime]);

  async function loadUserAndMatches() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user');
        setLoading(false);
        return;
      }

      // Fetch current user data
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userData) {
        setCurrentUser(userData);
        calculateNextMatchTime(userData.last_auto_match_cycle);
      }

      // Fetch today's auto-matches
      await loadTodaysMatches(user.id);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadTodaysMatches(userId: string) {
    try {
      // Get matches from the last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: matches, error } = await supabase
        .from('matches')
        .select(`
          id,
          matched_at,
          ai_message_sent,
          user1_id,
          user2_id,
          user1:users!matches_user1_id_fkey (
            id, full_name, major, year, preferred_subjects, profile_photo_url
          ),
          user2:users!matches_user2_id_fkey (
            id, full_name, major, year, preferred_subjects, profile_photo_url
          )
        `)
        .eq('match_type', 'auto')
        .eq('status', 'active')
        .gte('matched_at', twentyFourHoursAgo)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (error) {
        console.error('Error fetching matches:', error);
        return;
      }

      // Get conversations for these matches
      const { data: conversations } = await getConversations();

      // Transform to TodaysMatch format
      const transformedMatches: TodaysMatch[] = (matches || []).map((match: any) => {
        const otherUser = match.user1_id === userId ? match.user2 : match.user1;
        const conversation = conversations.find((c: any) => c.match.id === match.id);
        
        return {
          id: match.id,
          match_id: match.id,
          other_user: otherUser,
          matched_at: match.matched_at,
          has_ai_message: match.ai_message_sent,
          conversation_id: conversation?.id,
          last_message_content: conversation?.last_message_content,
        };
      });

      setTodaysMatches(transformedMatches);
      
      // Check if there are new unviewed matches
      const hasUnread = transformedMatches.some((m: TodaysMatch) => 
        !m.last_message_content || new Date(m.matched_at) > new Date(Date.now() - 60 * 60 * 1000)
      );
      setHasNewMatch(hasUnread);
    } catch (error) {
      console.error('Error loading today\'s matches:', error);
    }
  }

  function calculateNextMatchTime(lastMatchCycle: string | null) {
    if (!lastMatchCycle) {
      // No previous match, next one is at 8 AM tomorrow (or today if before 8 AM)
      const now = new Date();
      const next = new Date(now);
      next.setHours(8, 0, 0, 0);
      
      if (next <= now) {
        // 8 AM has passed, set for tomorrow
        next.setDate(next.getDate() + 1);
      }
      
      setNextMatchTime(next);
      return;
    }

    // Next match is 24 hours after last cycle
    const lastCycle = new Date(lastMatchCycle);
    const next = new Date(lastCycle.getTime() + 24 * 60 * 60 * 1000);
    setNextMatchTime(next);
  }

  function updateCountdown() {
    if (!nextMatchTime) return;

    const now = new Date();
    const diff = nextMatchTime.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeUntilMatch('Matching now...');
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeUntilMatch(`${hours}h ${minutes}m ${seconds}s`);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadUserAndMatches();
  }

  function handleMatchPress(match: TodaysMatch) {
    if (match.conversation_id) {
      router.push(`/chat/${match.conversation_id}` as any);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your matches...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#007AFF"
        />
      }
    >
      {/* Countdown Timer Section */}
      <View style={styles.timerCard}>
        <View style={styles.timerHeader}>
          <Ionicons name="time-outline" size={24} color="#007AFF" />
          <Text style={styles.timerTitle}>Next Match In</Text>
        </View>
        <Text style={styles.timerCountdown}>{timeUntilMatch || 'Calculating...'}</Text>
        <Text style={styles.timerSubtext}>
          Daily matches happen automatically at 8 AM
        </Text>
      </View>

      {/* New Match Notification */}
      {hasNewMatch && todaysMatches.length > 0 && (
        <View style={styles.notification}>
          <Ionicons name="notifications" size={20} color="#FF3B30" />
          <Text style={styles.notificationText}>
            You have {todaysMatches.length} new {todaysMatches.length === 1 ? 'match' : 'matches'}!
          </Text>
        </View>
      )}

      {/* Today's Matches Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Matches</Text>
        {todaysMatches.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={48} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>No Matches Yet</Text>
            <Text style={styles.emptyText}>
              Come back tomorrow for your next match!
            </Text>
            <Text style={styles.emptyHint}>
              {timeUntilMatch && `Next match in ${timeUntilMatch}`}
            </Text>
          </View>
        ) : (
          todaysMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onPress={() => handleMatchPress(match)}
            />
          ))
        )}
      </View>

      {/* How It Works Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>How Daily Matches Work</Text>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={20} color="#007AFF" />
          <Text style={styles.infoText}>Get matched with compatible study partners every 24 hours</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="sparkles-outline" size={20} color="#007AFF" />
          <Text style={styles.infoText}>AI generates a personalized icebreaker to start the conversation</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="chatbubbles-outline" size={20} color="#007AFF" />
          <Text style={styles.infoText}>Start chatting immediately with your new match!</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function MatchCard({ match, onPress }: { match: TodaysMatch; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.matchCard} onPress={onPress}>
      <View style={styles.matchCardLeft}>
        {match.other_user.profile_photo_url ? (
          <Image
            source={{ uri: match.other_user.profile_photo_url }}
            style={styles.matchAvatar}
          />
        ) : (
          <View style={[styles.matchAvatar, styles.matchAvatarPlaceholder]}>
            <Text style={styles.matchAvatarText}>
              {match.other_user.full_name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.matchCardContent}>
        <View style={styles.matchCardHeader}>
          <Text style={styles.matchCardName}>
            {match.other_user.full_name || 'Study Partner'}
          </Text>
          {match.has_ai_message && (
            <View style={styles.aiChip}>
              <Ionicons name="sparkles" size={12} color="#007AFF" />
              <Text style={styles.aiChipText}>AI Message</Text>
            </View>
          )}
        </View>

        <Text style={styles.matchCardInfo}>
          {match.other_user.major || 'Student'} • {match.other_user.year || 'Year N/A'}
        </Text>

        {match.other_user.preferred_subjects && match.other_user.preferred_subjects.length > 0 && (
          <View style={styles.matchCardSubjects}>
            {match.other_user.preferred_subjects.slice(0, 2).map((subj, idx) => (
              <View key={`${subj}-${idx}`} style={styles.subjectTag}>
                <Text style={styles.subjectTagText}>{subj}</Text>
              </View>
            ))}
          </View>
        )}

        {match.last_message_content && (
          <Text style={styles.matchCardLastMessage} numberOfLines={1}>
            {match.last_message_content}
          </Text>
        )}
      </View>

      <View style={styles.matchCardRight}>
        <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F2F2F7',
  },
  center: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  // Timer Card Styles
  timerCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  timerCountdown: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
    marginVertical: 8,
  },
  timerSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  // Notification Banner
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
  },
  notificationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 8,
  },
  // Section Styles
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  // Match Card Styles
  matchCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  matchCardLeft: {
    marginRight: 12,
  },
  matchAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  matchAvatarPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchAvatarText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  matchCardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  matchCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchCardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  aiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 4,
  },
  matchCardInfo: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  matchCardSubjects: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  subjectTag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  subjectTagText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  matchCardLastMessage: {
    fontSize: 13,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  matchCardRight: {
    justifyContent: 'center',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyHint: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 12,
    fontWeight: '500',
  },
  // Info Section
  infoSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#000',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});
