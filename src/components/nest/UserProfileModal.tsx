// =====================================================
// USER PROFILE MODAL - NEST MEMBERS
// =====================================================
// Modal component for viewing limited profile info of nest members
// Allows users to send messages or view existing chats

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { checkExistingMatch, createManualMatch } from '@/services/matching';
import { getOrCreateConversation } from '@/services/chat';
import type { User } from '@/services/supabase';

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

export function UserProfileModal({ visible, onClose, userId }: UserProfileModalProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [existingMatchId, setExistingMatchId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (visible && userId) {
      loadUserProfile();
      loadCurrentUser();
    }
  }, [visible, userId]);

  async function loadCurrentUser() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setCurrentUserId(authUser.id);
        // Check if match already exists
        const matchId = await checkExistingMatch(authUser.id, userId);
        setExistingMatchId(matchId);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  }

  async function loadUserProfile() {
    if (!userId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        Alert.alert('Error', 'Failed to load profile. Please try again.');
        return;
      }

      setUser(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage() {
    if (!currentUserId || !user) return;

    setActionLoading(true);
    try {
      let matchId = existingMatchId;

      // If no existing match, create one
      if (!matchId) {
        matchId = await createManualMatch(currentUserId, userId);
        if (!matchId) {
          Alert.alert('Error', 'Failed to create connection. Please try again.');
          return;
        }
      }

      // Get or create conversation
      const conversationId = await getOrCreateConversation(matchId);
      if (!conversationId) {
        Alert.alert('Error', 'Failed to start conversation. Please try again.');
        return;
      }

      // Close modal and navigate to chat
      onClose();
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to start conversation. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }

  if (!user && loading) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </Modal>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Photo */}
          <View style={styles.photoContainer}>
            <Image
              source={{ 
                uri: user.profile_photo_url || 'https://via.placeholder.com/150x150.png?text=Peerly' 
              }}
              style={styles.photo}
            />
          </View>

          {/* Basic Info */}
          <View style={styles.infoSection}>
            <Text style={styles.name}>{user.full_name || 'Unknown User'}</Text>
            <Text style={styles.details}>
              {user.major || 'Major N/A'} • {user.year || 'Year N/A'}
            </Text>
            <Text style={styles.university}>{user.university}</Text>
          </View>

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
        </ScrollView>

        {/* Action Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.actionButton, actionLoading && styles.actionButtonDisabled]}
            onPress={handleSendMessage}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons 
                  name={existingMatchId ? "chatbubble" : "send"} 
                  size={20} 
                  color="#FFFFFF" 
                />
                <Text style={styles.actionButtonText}>
                  {existingMatchId ? 'View Chat' : 'Send Message'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  photoContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 8,
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  details: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 4,
  },
  university: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  bio: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#8E8E93',
    flex: 1,
  },
  preferenceValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectTag: {
    backgroundColor: '#4b3ca4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  subjectText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  actionSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
