// =====================================================
// EDIT PROFILE SCREEN - Settings Integration
// =====================================================
// Screen for editing user profile details:
// - Photo management (change/remove) using Supabase Storage
// - Basic info (name, bio)
// - Academic info (major, year)
// - Preferred subjects (add/remove chips)
// - Study preferences (style, goals)
// - Badge display preference
// Data flow:
// - Loads profile via getUserProfile()
// - Saves via updateProfile()
// - Photo updates via uploadProfilePhoto() + updateUserProfilePhotoUrl()
// Navigation: pushed from Settings -> "/settings/edit-profile"

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import type { WeeklyAvailability } from '@/services/supabase';
import {
  getUserProfile,
  updateProfile,
  type UserProfile,
} from '@/services/profile';
import {
  uploadProfilePhoto,
  updateUserProfilePhotoUrl,
  deleteProfilePhoto,
} from '@/services/storage';

const MAJORS = [
  'Computer Science',
  'Biology',
  'Chemistry',
  'Physics',
  'Mathematics',
  'Engineering',
  'Business',
  'Psychology',
  'English',
  'History',
  'Art',
  'Music',
  'Other',
];

const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];

const STUDY_STYLES: Array<NonNullable<UserProfile['study_style']>> = [
  'quiet',
  'with_music',
  'group_discussion',
  'teach_each_other',
];

const STUDY_GOALS: Array<NonNullable<UserProfile['study_goals']>> = [
  'ace_exams',
  'understand_concepts',
  'just_pass',
  'make_friends',
];

const BADGE_DISPLAY: Array<NonNullable<UserProfile['badge_display_preference']>> = [
  'show_all',
  'show_primary',
  'hide_all',
];

export default function EditProfileScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState('');
  const [preferredSubjects, setPreferredSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [studyStyle, setStudyStyle] =
    useState<UserProfile['study_style']>(null);
  const [studyGoals, setStudyGoals] =
    useState<UserProfile['study_goals']>(null);
  const [availability, setAvailability] =
    useState<WeeklyAvailability | null>(null);
  const [badgeDisplayPreference, setBadgeDisplayPreference] =
    useState<UserProfile['badge_display_preference']>('show_all');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Pickers (simple modal lists)
  const [showMajorPicker, setShowMajorPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showStudyStylePicker, setShowStudyStylePicker] = useState(false);
  const [showStudyGoalsPicker, setShowStudyGoalsPicker] = useState(false);
  const [showBadgeDisplayPicker, setShowBadgeDisplayPicker] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const id = userData?.user?.id || null;
        setUserId(id);
        if (!id) {
          Alert.alert('Not signed in', 'Please sign in again.');
          router.replace('/(auth)/login');
          return;
        }
        const result = await getUserProfile(id);
        if (!result.success || !result.data) {
          Alert.alert('Error', result.error || 'Failed to load profile.');
          return;
        }
        const p = result.data;
        setProfile(p);
        setFullName(p.full_name || '');
        setBio(p.bio || '');
        setMajor(p.major || '');
        setYear(p.year || '');
        setPreferredSubjects(p.preferred_subjects || []);
        setStudyStyle(p.study_style);
        setStudyGoals(p.study_goals);
        setAvailability(p.availability || null);
        setBadgeDisplayPreference(p.badge_display_preference || 'show_all');
        setPhotoUrl(p.profile_photo_url || null);
      } catch (e) {
        Alert.alert('Error', 'Unable to load your profile.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const hasUnsavedChanges = useMemo(() => {
    if (!profile) return false;
    return (
      (fullName || '') !== (profile.full_name || '') ||
      (bio || '') !== (profile.bio || '') ||
      (major || '') !== (profile.major || '') ||
      (year || '') !== (profile.year || '') ||
      JSON.stringify(preferredSubjects || []) !==
        JSON.stringify(profile.preferred_subjects || []) ||
      (studyStyle || null) !== (profile.study_style || null) ||
      (studyGoals || null) !== (profile.study_goals || null) ||
      (badgeDisplayPreference || 'show_all') !==
        (profile.badge_display_preference || 'show_all') ||
      (photoUrl || null) !== (profile.profile_photo_url || null)
      // availability is edited elsewhere (future), not tracked here for unsaved change
    );
  }, [
    profile,
    fullName,
    bio,
    major,
    year,
    preferredSubjects,
    studyStyle,
    studyGoals,
    badgeDisplayPreference,
    photoUrl,
  ]);

  async function pickImageFromLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Photo library permission is required to change your profile photo.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await handleUploadPhoto(result.assets[0].uri);
    }
  }

  async function takePhotoWithCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Camera permission is required to take a photo.'
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await handleUploadPhoto(result.assets[0].uri);
    }
  }

  async function handleUploadPhoto(uri: string) {
    if (!userId) return;
    setSaving(true);
    try {
      const uploadResult = await uploadProfilePhoto(uri, userId);
      if (!uploadResult.success) {
        Alert.alert('Error', uploadResult.error || 'Failed to upload photo.');
        return;
      }
      const url = uploadResult.url || null;
      const updateResult = await updateUserProfilePhotoUrl(userId, url);
      if (!updateResult.success) {
        Alert.alert('Error', updateResult.error || 'Failed to update photo.');
        return;
      }
      setPhotoUrl(url);
    } catch (e) {
      Alert.alert('Error', 'Failed to set profile photo.');
    } finally {
      setSaving(false);
    }
  }

  function handleChangePhoto() {
    Alert.alert('Update Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhotoWithCamera },
      { text: 'Choose from Library', onPress: pickImageFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function handleRemovePhoto() {
    if (!userId) return;
    Alert.alert('Remove Photo', 'Are you sure you want to remove your photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            if (photoUrl) {
              // Best-effort delete from storage (ignore failures)
              await deleteProfilePhoto(photoUrl);
            }
            const res = await updateUserProfilePhotoUrl(userId, null);
            if (!res.success) {
              Alert.alert('Error', res.error || 'Failed to remove photo.');
              return;
            }
            setPhotoUrl(null);
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  }

  function addSubject() {
    const s = (newSubject || '').trim();
    if (!s) return;
    if (preferredSubjects.includes(s)) {
      setNewSubject('');
      return;
    }
    setPreferredSubjects((prev) => [...prev, s]);
    setNewSubject('');
  }

  function removeSubject(subject: string) {
    setPreferredSubjects((prev) => prev.filter((s) => s !== subject));
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    try {
      // Minimal validation
      if (!fullName.trim()) {
        Alert.alert('Required', 'Full name is required.');
        setSaving(false);
        return;
      }
      if (!major) {
        Alert.alert('Required', 'Please select your major.');
        setSaving(false);
        return;
      }
      if (!year) {
        Alert.alert('Required', 'Please select your academic year.');
        setSaving(false);
        return;
      }
      const result = await updateProfile(userId, {
        full_name: fullName,
        bio,
        major,
        year,
        preferred_subjects: preferredSubjects,
        availability: availability || undefined,
        study_style: studyStyle,
        study_goals: studyGoals,
        badge_display_preference: badgeDisplayPreference,
      });
      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to update profile.');
        return;
      }
      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to save your profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A67B5B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 68 }} />
      </View>

      <ScrollView style={styles.scroll}>
        {/* Photos Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo</Text>
          <View style={styles.photoRow}>
            <View style={styles.photoContainer}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderIcon}>📷</Text>
                </View>
              )}
            </View>
            <View style={styles.photoActions}>
              <TouchableOpacity style={styles.linkBtn} onPress={handleChangePhoto}>
                <Text style={styles.linkText}>Change Photo</Text>
              </TouchableOpacity>
              {photoUrl && (
                <TouchableOpacity style={styles.linkBtn} onPress={handleRemovePhoto}>
                  <Text style={[styles.linkText, { color: '#FF3B30' }]}>Remove Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Basic Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Info</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your full name"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Tell others about yourself"
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={200}
            />
            <Text style={styles.helperText}>{bio?.length || 0}/200</Text>
          </View>
        </View>

        {/* Academic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Academic</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowMajorPicker(true)}
          >
            <View style={styles.settingContent}>
              <Ionicons name="school-outline" size={22} color="#007AFF" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Major</Text>
                <Text style={styles.settingDescription}>
                  {major || 'Select your major'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowYearPicker(true)}
          >
            <View style={styles.settingContent}>
              <Ionicons name="calendar-outline" size={22} color="#007AFF" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Academic Year</Text>
                <Text style={styles.settingDescription}>
                  {year || 'Select your year'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* Subjects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Subjects</Text>
          <View style={styles.subjectRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Add a subject"
              value={newSubject}
              onChangeText={setNewSubject}
              onSubmitEditing={addSubject}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addBtn} onPress={addSubject}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chips}>
            {preferredSubjects.map((s) => (
              <View key={s} style={styles.chip}>
                <Text style={styles.chipText}>{s}</Text>
                <TouchableOpacity onPress={() => removeSubject(s)}>
                  <Ionicons name="close-circle" size={18} color="#C7C7CC" />
                </TouchableOpacity>
              </View>
            ))}
            {preferredSubjects.length === 0 && (
              <Text style={styles.helperText}>No subjects added yet.</Text>
            )}
          </View>
        </View>

        {/* Study Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study Preferences</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowStudyStylePicker(true)}
          >
            <View style={styles.settingContent}>
              <Ionicons name="book-outline" size={22} color="#007AFF" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Study Style</Text>
                <Text style={styles.settingDescription}>
                  {studyStyle || 'Select your style'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowStudyGoalsPicker(true)}
          >
            <View style={styles.settingContent}>
              <Ionicons name="flag-outline" size={22} color="#007AFF" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Study Goals</Text>
                <Text style={styles.settingDescription}>
                  {studyGoals || 'Select your goals'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowBadgeDisplayPicker(true)}
          >
            <View style={styles.settingContent}>
              <Ionicons name="ribbon-outline" size={22} color="#007AFF" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Badge Display</Text>
                <Text style={styles.settingDescription}>
                  {badgeDisplayPreference}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* Availability (placeholder link for future inline editor) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="time-outline" size={22} color="#8E8E93" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Weekly Schedule</Text>
                <Text style={styles.settingDescription}>
                  Edit your availability (coming soon)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom spacing to allow for footer button */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!hasUnsavedChanges || saving) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!hasUnsavedChanges || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Pickers */}
      <OptionPicker
        title="Select Major"
        visible={showMajorPicker}
        options={MAJORS}
        selected={major}
        onClose={() => setShowMajorPicker(false)}
        onSelect={(v) => {
          setMajor(v);
          setShowMajorPicker(false);
        }}
      />
      <OptionPicker
        title="Select Academic Year"
        visible={showYearPicker}
        options={YEARS}
        selected={year}
        onClose={() => setShowYearPicker(false)}
        onSelect={(v) => {
          setYear(v);
          setShowYearPicker(false);
        }}
      />
      <OptionPicker
        title="Select Study Style"
        visible={showStudyStylePicker}
        options={STUDY_STYLES}
        selected={studyStyle || undefined}
        onClose={() => setShowStudyStylePicker(false)}
        onSelect={(v) => {
          setStudyStyle(v as UserProfile['study_style']);
          setShowStudyStylePicker(false);
        }}
      />
      <OptionPicker
        title="Select Study Goals"
        visible={showStudyGoalsPicker}
        options={STUDY_GOALS}
        selected={studyGoals || undefined}
        onClose={() => setShowStudyGoalsPicker(false)}
        onSelect={(v) => {
          setStudyGoals(v as UserProfile['study_goals']);
          setShowStudyGoalsPicker(false);
        }}
      />
      <OptionPicker
        title="Badge Display"
        visible={showBadgeDisplayPicker}
        options={BADGE_DISPLAY}
        selected={badgeDisplayPreference}
        onClose={() => setShowBadgeDisplayPicker(false)}
        onSelect={(v) => {
          setBadgeDisplayPreference(
            v as NonNullable<UserProfile['badge_display_preference']>
          );
          setShowBadgeDisplayPicker(false);
        }}
      />
    </View>
  );
}

function OptionPicker({
  title,
  visible,
  options,
  selected,
  onClose,
  onSelect,
}: {
  title: string;
  visible: boolean;
  options: string[];
  selected?: string;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView style={{ maxHeight: 320 }}>
            {options.map((opt) => {
              const isSelected = selected === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={styles.modalItem}
                  onPress={() => onSelect(opt)}
                >
                  <Text style={[styles.modalItemText, isSelected && { color: '#007AFF', fontWeight: '600' }]}>
                    {opt}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={18} color="#007AFF" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>Close</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  scroll: {
    flex: 1,
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
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  photoContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderIcon: {
    fontSize: 28,
  },
  photoActions: {
    flex: 1,
  },
  linkBtn: {
    paddingVertical: 6,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  field: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  label: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    color: '#8E8E93',
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
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  subjectRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  addBtn: {
    backgroundColor: '#A67B5B',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFEFEF',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chipText: {
    fontSize: 14,
    color: '#000',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  saveButton: {
    backgroundColor: '#A67B5B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#D1C6BE',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#000',
  },
  modalClose: {
    marginTop: 12,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalCloseText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});


