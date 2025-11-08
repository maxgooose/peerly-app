// =====================================================
// SETTINGS SCREEN - PHASE 3
// =====================================================
// User settings and account management
// Clean interface without analytics exposure

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { deactivateAccount } from '@/services/profile';

export default function SettingsScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [matchNotifications, setMatchNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [studyReminders, setStudyReminders] = useState(true);

  async function handleLogout() {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  }

  function handleDeactivateAccount() {
    Alert.alert(
      'Deactivate Account',
      'Deactivating your account will hide your profile and sign you out. Your data will be preserved and can be restored later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deactivation',
              'Are you sure you want to deactivate your account? You can contact support to reactivate it later.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Deactivate Account',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const { data: userData } = await supabase.auth.getUser();
                      const userId = userData?.user?.id;
                      if (!userId) {
                        Alert.alert('Error', 'You must be signed in.');
                        return;
                      }
                      const result = await deactivateAccount(userId);
                      if (!result.success) {
                        Alert.alert('Error', result.error || 'Failed to deactivate account.');
                        return;
                      }
                      await supabase.auth.signOut();
                      Alert.alert('Account Deactivated', 'Your account has been deactivated. Contact support if you want to restore it.', [
                        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
                      ]);
                    } catch (e) {
                      console.error('Deactivate account error:', e);
                      Alert.alert('Error', 'Failed to deactivate account. Please try again.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }

  function handleEditProfile() {
    router.push('/settings/edit-profile');
  }

  function handleChangePassword() {
    router.push('/settings/change-password');
  }

  function handleContactSupport() {
    Alert.alert(
      'Contact Support',
      'How would you like to contact us?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email',
          onPress: () => {
            Linking.openURL('mailto:support@peerly.app?subject=Support Request');
          },
        },
        {
          text: 'Report Bug',
          onPress: () => {
            Linking.openURL('mailto:bugs@peerly.app?subject=Bug Report');
          },
        },
      ]
    );
  }

  function handlePrivacyPolicy() {
    Alert.alert(
      'Privacy Policy',
      'Our privacy policy explains how we collect, use, and protect your data.',
      [
        { text: 'Close', style: 'cancel' },
        {
          text: 'View Online',
          onPress: () => {
            Linking.openURL('https://peerly.app/privacy');
          },
        },
      ]
    );
  }

  function handleTermsOfService() {
    Alert.alert(
      'Terms of Service',
      'Our terms of service outline the rules and guidelines for using Peerly.',
      [
        { text: 'Close', style: 'cancel' },
        {
          text: 'View Online',
          onPress: () => {
            Linking.openURL('https://peerly.app/terms');
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Manage your account and preferences</Text>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="notifications-outline" size={24} color="#007AFF" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>All Notifications</Text>
              <Text style={styles.settingDescription}>Enable or disable all notifications</Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
            thumbColor={notificationsEnabled ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="heart-outline" size={24} color="#FF3B30" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Match Notifications</Text>
              <Text style={styles.settingDescription}>Get notified when someone likes you back</Text>
            </View>
          </View>
          <Switch
            value={matchNotifications}
            onValueChange={setMatchNotifications}
            trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
            thumbColor={matchNotifications ? '#FFFFFF' : '#FFFFFF'}
            disabled={!notificationsEnabled}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="chatbubble-outline" size={24} color="#34C759" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Message Notifications</Text>
              <Text style={styles.settingDescription}>Get notified of new messages</Text>
            </View>
          </View>
          <Switch
            value={messageNotifications}
            onValueChange={setMessageNotifications}
            trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
            thumbColor={messageNotifications ? '#FFFFFF' : '#FFFFFF'}
            disabled={!notificationsEnabled}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="book-outline" size={24} color="#FF9500" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Study Reminders</Text>
              <Text style={styles.settingDescription}>Reminders for scheduled study sessions</Text>
            </View>
          </View>
          <Switch
            value={studyReminders}
            onValueChange={setStudyReminders}
            trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
            thumbColor={studyReminders ? '#FFFFFF' : '#FFFFFF'}
            disabled={!notificationsEnabled}
          />
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleEditProfile}>
          <View style={styles.settingContent}>
            <Ionicons name="person-outline" size={24} color="#007AFF" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Edit Profile</Text>
              <Text style={styles.settingDescription}>Update your information and photos</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleChangePassword}>
          <View style={styles.settingContent}>
            <Ionicons name="lock-closed-outline" size={24} color="#007AFF" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Change Password</Text>
              <Text style={styles.settingDescription}>Update your account password</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="shield-outline" size={24} color="#007AFF" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Privacy Settings</Text>
              <Text style={styles.settingDescription}>Control who can see your profile</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleContactSupport}>
          <View style={styles.settingContent}>
            <Ionicons name="help-circle-outline" size={24} color="#007AFF" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Contact Support</Text>
              <Text style={styles.settingDescription}>Get help or report issues</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="star-outline" size={24} color="#FF9500" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Rate Peerly</Text>
              <Text style={styles.settingDescription}>Rate us on the App Store</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>
      </View>

      {/* Legal Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPolicy}>
          <View style={styles.settingContent}>
            <Ionicons name="document-text-outline" size={24} color="#8E8E93" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Privacy Policy</Text>
              <Text style={styles.settingDescription}>How we protect your data</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleTermsOfService}>
          <View style={styles.settingContent}>
            <Ionicons name="document-outline" size={24} color="#8E8E93" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Terms of Service</Text>
              <Text style={styles.settingDescription}>Rules and guidelines</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>
      </View>

      {/* App Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="information-circle-outline" size={24} color="#8E8E93" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Version</Text>
              <Text style={styles.settingDescription}>1.0.0</Text>
            </View>
          </View>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="school-outline" size={24} color="#8E8E93" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Made for Students</Text>
              <Text style={styles.settingDescription}>Connecting study partners worldwide</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        
        <TouchableOpacity style={styles.dangerItem} onPress={handleLogout}>
          <View style={styles.settingContent}>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            <View style={styles.settingText}>
              <Text style={styles.dangerLabel}>Logout</Text>
              <Text style={styles.settingDescription}>Sign out of your account</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FF3B30" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerItem} onPress={handleDeactivateAccount}>
          <View style={styles.settingContent}>
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            <View style={styles.settingText}>
              <Text style={styles.dangerLabel}>Deactivate Account</Text>
              <Text style={styles.settingDescription}>Hide profile and sign out (data preserved)</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  section: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  dangerLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF3B30',
    marginBottom: 2,
  },
  bottomSpacing: {
    height: 40,
  },
});
