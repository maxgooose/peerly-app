import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { getUserBadges } from '@/services/badges';
import { BadgeList } from '@/components/Badge';
import type { User } from '@/services/supabase';
import type { UserBadge } from '@/services/badges';

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    loadProfile();
  }, []);
  
  async function loadProfile() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.replace('/(auth)/login');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (profile) {
        setUser(profile);
        
        // Load user badges
        const { badges: userBadges } = await getUserBadges(authUser.id);
        setBadges(userBadges || []);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
  
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Error loading profile</Text>
        <TouchableOpacity onPress={loadProfile} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      {/* Profile Photo */}
      <View style={styles.photoContainer}>
        <Image 
          source={{ uri: user.profile_photo_url || 'https://via.placeholder.com/150x150.png?text=Peerly' }} 
          style={styles.photo} 
        />
      </View>
      
      {/* User Info */}
      <View style={styles.infoSection}>
        <Text style={styles.name}>{user.full_name || 'Unknown User'}</Text>
        <Text style={styles.details}>
          {user.major || 'Major N/A'} • {user.year || 'Year N/A'}
        </Text>
        <Text style={styles.university}>{user.university}</Text>
      </View>
      
      {/* Badges */}
      {badges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <BadgeList badges={badges} size="medium" showLabels={true} />
        </View>
      )}
      
      {/* Bio */}
      {user.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>
      )}
      
      {/* Study Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Study Preferences</Text>
        <View style={styles.preferenceItem}>
          <Text style={styles.preferenceLabel}>Study Style:</Text>
          <Text style={styles.preferenceValue}>
            {user.study_style ? user.study_style.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Not set'}
          </Text>
        </View>
        <View style={styles.preferenceItem}>
          <Text style={styles.preferenceLabel}>Study Goals:</Text>
          <Text style={styles.preferenceValue}>
            {user.study_goals ? user.study_goals.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Not set'}
          </Text>
        </View>
      </View>
      
      {/* Subjects */}
      {user.preferred_subjects && user.preferred_subjects.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Subjects</Text>
          <View style={styles.subjectsContainer}>
            {user.preferred_subjects.map((subject: string, index: number) => (
              <View key={index} style={styles.subjectTag}>
                <Text style={styles.subjectText}>{subject}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* Availability */}
      {user.availability && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <Text style={styles.availabilityText}>Weekly schedule configured</Text>
        </View>
      )}
      
      {/* Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/settings')}
        >
          <Text style={styles.actionButtonText}>Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.logoutButton]} 
          onPress={handleLogout}
        >
          <Text style={[styles.actionButtonText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  photoContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#f8f9fa',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#A67B5B',
  },
  infoSection: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  details: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  university: {
    fontSize: 14,
    color: '#888',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  preferenceItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    width: 100,
  },
  preferenceValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectTag: {
    backgroundColor: '#d5c6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  subjectText: {
    fontSize: 12,
    color: '#4b3ca4',
    fontWeight: '500',
  },
  availabilityText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  actionsSection: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#A67B5B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
  },
  logoutText: {
    color: '#fff',
  },
  retryButton: {
    backgroundColor: '#A67B5B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 10,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
