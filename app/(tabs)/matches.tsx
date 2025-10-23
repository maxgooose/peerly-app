import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { supabase } from '@services/supabase';

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

  useEffect(() => {
    const fetchProfiles = async () => {
      // (Optional) Exclude current user once auth wired:
      // const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.from('users').select('*').limit(20);
      if (error) {
        console.error('Error fetching profiles:', error);
      } else {
        console.log('Fetched profiles:', data);
        setProfiles((data || []) as User[]);
      }
      setLoading(false);
    };
    fetchProfiles();
  }, []);

  const handleSwipe = async (index: number, direction: 'left' | 'right') => {
    const swipedUser = profiles[index];
    if (!swipedUser) return;

    try {
      const action = direction === 'right' ? 'like' : 'skip';
      // TODO: replace with actual session user ID
      await supabase.from('swipe_actions').insert([
        {
          user_id: 'CURRENT_USER_ID',
          target_user_id: swipedUser.id,
          action,
        },
      ]);
      console.log(`Swiped ${direction} on ${swipedUser.full_name}`);
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
    </View>
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
});
