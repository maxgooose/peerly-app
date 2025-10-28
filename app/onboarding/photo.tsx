import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { completeOnboarding } from '@/services/onboarding';
import { uploadProfilePhoto, updateUserProfilePhotoUrl } from '@/services/storage';
import { supabase } from '@/services/supabase';
import type { WeeklyAvailability } from '@/services/supabase';

export default function PhotoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function requestPermissions() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your photos to set a profile picture'
      );
      return false;
    }
    return true;
  }

  async function pickImage() {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your camera to take a profile picture'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  function showImageOptions() {
    Alert.alert('Add Profile Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Library', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function handleSkip() {
    // Navigate to complete onboarding without photo
    await completeOnboardingFlow(null);
  }

  async function handleContinue() {
    if (!photoUri) {
      Alert.alert('Required', 'Please add a profile photo or skip this step');
      return;
    }
    await completeOnboardingFlow(photoUri);
  }

  async function completeOnboardingFlow(photo: string | null) {
    setIsUploading(true);
    try {
      // 1. Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        Alert.alert('Error', 'You must be signed in to complete onboarding.');
        return;
      }

      // 2. Upload photo if provided
      let photoUrl: string | null = null;
      if (photo) {
        const uploadResult = await uploadProfilePhoto(photo, userData.user.id);
        if (!uploadResult.success) {
          Alert.alert('Error', uploadResult.error || 'Failed to upload photo');
          return;
        }
        photoUrl = uploadResult.url || null;
      }

      // 3. Parse onboarding data from params
      const subjects = params.subjects
        ? JSON.parse(params.subjects as string)
        : [];

      const availability = params.availability
        ? JSON.parse(params.availability as string) as WeeklyAvailability
        : null;

      // 4. Complete onboarding
      const result = await completeOnboarding({
        fullName: params.fullName as string,
        major: params.major as string,
        academicYear: params.year as string,
        bio: params.bio as string || undefined,
        preferredSubjects: subjects,
        availability: availability,
        studyStyle: params.studyStyle as any || null,
        studyGoals: params.studyGoals as any || null,
      });

      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to complete onboarding');
        return;
      }

      // 5. Update profile photo URL if we uploaded one
      if (photoUrl) {
        await updateUserProfilePhotoUrl(userData.user.id, photoUrl);
      }

      // 6. Navigate to main app
      router.replace('/(tabs)/matches');
    } catch (error) {
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
      console.error('Onboarding error:', error);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: '100%' }]} />
      </View>

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.step}>Step 5 of 5</Text>
          <Text style={styles.title}>Add a profile photo</Text>
          <Text style={styles.subtitle}>
            Help others recognize you when you meet up to study
          </Text>
        </View>

        {/* Photo Preview */}
        <View style={styles.photoSection}>
          <TouchableOpacity
            style={styles.photoContainer}
            onPress={showImageOptions}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderIcon}>📷</Text>
                <Text style={styles.photoPlaceholderText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          {photoUri && (
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={showImageOptions}
            >
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Guidelines */}
        <View style={styles.guidelines}>
          <Text style={styles.guidelinesTitle}>Photo Guidelines</Text>
          <View style={styles.guidelinesList}>
            <GuidelineItem text="Use a clear, recent photo" />
            <GuidelineItem text="Show your face (no sunglasses or hats)" />
            <GuidelineItem text="Keep it appropriate and professional" />
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={isUploading}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            (!photoUri || isUploading) && styles.buttonSecondary,
          ]}
          onPress={handleContinue}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {photoUri ? 'Complete Setup' : 'Skip'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function GuidelineItem({ text }: { text: string }) {
  return (
    <View style={styles.guidelineItem}>
      <Text style={styles.guidelineBullet}>•</Text>
      <Text style={styles.guidelineText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#F0F0F0',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#A67B5B',
  },
  content: {
    flex: 1,
    paddingBottom: 120,
  },
  header: {
    padding: 24,
  },
  step: {
    fontSize: 14,
    color: '#A67B5B',
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  photoContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: 'hidden',
    marginBottom: 16,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 90,
  },
  photoPlaceholderIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  photoPlaceholderText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changePhotoText: {
    color: '#A67B5B',
    fontSize: 16,
    fontWeight: '600',
  },
  guidelines: {
    paddingHorizontal: 24,
    marginTop: 16,
  },
  guidelinesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  guidelinesList: {
    gap: 8,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  guidelineBullet: {
    fontSize: 16,
    color: '#A67B5B',
    fontWeight: 'bold',
    lineHeight: 22,
  },
  guidelineText: {
    flex: 1,
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#A67B5B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#E0E0E0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
