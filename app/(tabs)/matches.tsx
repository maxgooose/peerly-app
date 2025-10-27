import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Modal } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { supabase } from '@/services/supabase';
import { getEligibleMatches } from '@/services/matching';
import { checkRateLimitByKey, recordAction } from '@/services/rateLimiting';

const { width } = Dimensions.get('window');

type User = {
  id: string;
  full_name?: string | null;
  major?: string | null;
  year?: string | null;
  preferred_subjects?: string[] | null;
  profile_photo_url?: string | null;
};

// ---------- DEV MOCKS (used only if DB returns no rows) ----------
const MOCK_PROFILES: User[] = [
  {
    id: 'mock-1',
    full_name: 'Olivia Chen',
    major: 'Computer Science',
    year: 'Junior',
    preferred_subjects: ['Data Structures', 'Algorithms', 'Linear Algebra'],
    profile_photo_url:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 'mock-2',
    full_name: 'Ethan Wright',
    major: 'Mechanical Engineering',
    year: 'Sophomore',
    preferred_subjects: ['Calculus II', 'Physics II', 'Engineering Graphics'],
    profile_photo_url:
      'https://images.unsplash.com/photo-1531123414780-f7423da7a56a?q=80&w=1200&auto=format&fit=crop',
  },
];
// ----------------------------------------------------------------

export default function MatchesScreen() {
  const [profiles, setProfiles] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('No authenticated user');
          setLoading(false);
          return;
        }

        const eligible = await getEligibleMatches(user.id);
        console.log('Fetched eligible matches:', eligible);
        setProfiles(eligible);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      }
      setLoading(false);
    };
    fetchProfiles();
  }, []);

  const handleSwipe = async (index: number, direction: 'left' | 'right') => {
    const swipedUser = profiles[index];
    if (!swipedUser) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check rate limit before swipe action
      const withinLimit = await checkRateLimitByKey(user.id, 'SWIPE_ACTION');
      if (!withinLimit) {
        console.log('Rate limit exceeded for swipe actions');
        return;
      }

      const action = direction === 'right' ? 'like' : 'skip';
      
      // Record the swipe action
      try {
        await (supabase.from('swipe_actions') as any).insert([
          {
            user_id: user.id,
            target_user_id: swipedUser.id,
            action,
          },
        ]);
            } catch (insertError) {
              console.error('Error inserting swipe action:', insertError);
            }

            // Record successful swipe action for rate limiting
            await recordAction(user.id, 'swipe_action', {
              target_user_id: swipedUser.id,
              action: action
            });

            console.log(`Swiped ${direction} on ${swipedUser.full_name}`);

      // If it's a like, check for mutual match
      if (direction === 'right') {
        const { data: mutualSwipe } = await supabase
          .from('swipe_actions')
          .select('*')
          .eq('user_id', swipedUser.id)
          .eq('target_user_id', user.id)
          .eq('action', 'like')
          .single();
        
              if (mutualSwipe) {
                // Check rate limit for match creation
                const withinMatchLimit = await checkRateLimitByKey(user.id, 'CREATE_MATCH');
                if (!withinMatchLimit) {
                  console.log('Rate limit exceeded for match creation');
                  return;
                }

                // Create match
                try {
                  const { data: matchData } = await (supabase.from('matches') as any)
                    .insert({
                      user1_id: user.id,
                      user2_id: swipedUser.id,
                      match_type: 'manual',
                      status: 'active',
                    })
                    .select()
                    .single();

                  if (matchData) {
                    // Record successful match creation for rate limiting
                    await recordAction(user.id, 'match_created', {
                      match_id: matchData.id,
                      partner_id: swipedUser.id
                    });

                    // Show match modal
                    setMatchedUser(swipedUser);
                    setShowMatchModal(true);
                    console.log('It\'s a match!', matchData);
                  }
                } catch (matchError) {
                  console.error('Error creating match:', matchError);
                }
              }
      }
    } catch (err) {
      console.error('Swipe error:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading matches...</Text>
      </View>
    );
  }

  // DEV FALLBACK: show mock cards if DB returned nothing
  if (profiles.length === 0) {
    return (
      <View style={styles.container}>
        <Swiper
          cards={MOCK_PROFILES}
          renderCard={(u: User) => <ProfileCard user={u} />}
          onSwipedLeft={() => {}}
          onSwipedRight={() => {}}
          backgroundColor="#fdfcfb"
          cardVerticalMargin={60}
          stackSize={2}
          animateCardOpacity
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Swiper
        cards={profiles}
        renderCard={(user: User) => <ProfileCard user={user} />}
        onSwipedLeft={(i) => handleSwipe(i, 'left')}
        onSwipedRight={(i) => handleSwipe(i, 'right')}
        backgroundColor="#fdfcfb"
        cardVerticalMargin={60}
        stackSize={2}
        animateCardOpacity
      />
      
      <MatchModal
        user={matchedUser}
        visible={showMatchModal}
        onClose={() => {
          setShowMatchModal(false);
          setMatchedUser(null);
        }}
      />
    </View>
  );
}

function MatchModal({ user, visible, onClose }: { user: User | null; visible: boolean; onClose: () => void }) {
  if (!user) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.matchModal}>
          <Text style={styles.matchTitle}>It's a Match! 🎉</Text>
          <Image 
            source={{ uri: user.profile_photo_url || 'https://via.placeholder.com/200x200.png?text=Peerly' }} 
            style={styles.matchImage}
          />
          <Text style={styles.matchName}>{user.full_name}</Text>
          <Text style={styles.matchSubtext}>You both liked each other!</Text>
          <TouchableOpacity style={styles.matchButton} onPress={onClose}>
            <Text style={styles.matchButtonText}>Start Chatting</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ProfileCard({ user }: { user: User }) {
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: user.profile_photo_url || 'https://via.placeholder.com/600x400.png?text=Peerly' }}
        style={styles.image}
      />
      <View style={styles.cardContent}>
        <Text style={styles.name}>{user.full_name || 'Unknown User'}</Text>
        <Text style={styles.major}>
          {user.major || 'Major N/A'} {user.year ? ` • ${user.year}` : ''}
        </Text>

        <Text style={styles.sharedLabel}>Shared Classes:</Text>
        <View style={styles.tagsContainer}>
          {(user.preferred_subjects || []).slice(0, 3).map((subj, idx) => (
            <View key={`${subj}-${idx}`} style={styles.tag}>
              <Text style={styles.tagText}>{subj}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.skip]}>
            <Text style={styles.btnText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.message]}>
            <Text style={[styles.btnText, { color: 'white' }]}>Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: width * 0.9,
    height: 550,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: { width: '100%', height: 280, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  cardContent: { padding: 16 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#222' },
  major: { color: '#555', marginBottom: 10 },
  sharedLabel: { fontWeight: '600', marginBottom: 6 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: {
    backgroundColor: '#d5c6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: { fontSize: 12, color: '#4b3ca4' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  skip: { borderWidth: 1, borderColor: '#ccc' },
  message: { backgroundColor: '#A67B5B' },
  btnText: { fontWeight: '600' },
  // Match Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: width * 0.8,
    maxWidth: 300,
  },
  matchTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
    textAlign: 'center',
  },
  matchImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  matchName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  matchSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 25,
    textAlign: 'center',
  },
  matchButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  matchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
