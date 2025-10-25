import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createNest } from '@/services/nests';
import { supabase } from '@/services/supabase';

const SUBJECTS = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Engineering',
  'Psychology',
  'Economics',
  'Literature',
  'History',
  'Art',
  'Music',
  'Business',
  'Medicine',
  'Law',
  'Education',
  'Other',
];

export default function CreateNestScreen() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');
  const [memberLimit, setMemberLimit] = useState(6);
  const [loading, setLoading] = useState(false);
  const [userSubjects, setUserSubjects] = useState<string[]>([]);

  useEffect(() => {
    loadUserSubjects();
  }, []);

  const loadUserSubjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('preferred_subjects')
        .eq('id', user.id)
        .single();

      if (userData?.preferred_subjects) {
        setUserSubjects(userData.preferred_subjects);
        // Pre-select first subject if available
        if (userData.preferred_subjects.length > 0) {
          setSubject(userData.preferred_subjects[0]);
        }
      }
    } catch (error) {
      console.error('Error loading user subjects:', error);
    }
  };

  const handleCreateNest = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a nest name.');
      return;
    }

    if (!subject) {
      Alert.alert('Error', 'Please select a subject.');
      return;
    }

    if (description.length > 200) {
      Alert.alert('Error', 'Description must be 200 characters or less.');
      return;
    }

    try {
      setLoading(true);
      
      const nest = await createNest({
        name: name.trim(),
        subject,
        class_name: className.trim() || undefined,
        description: description.trim() || undefined,
        member_limit: memberLimit,
      });

      if (nest) {
        Alert.alert(
          'Success',
          'Nest created successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.push(`/nest/${nest.id}`),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error creating nest:', error);
      Alert.alert('Error', 'Failed to create nest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderSubjectOption = (subjectOption: string) => {
    const isSelected = subject === subjectOption;
    const isUserSubject = userSubjects.includes(subjectOption);
    
    return (
      <TouchableOpacity
        key={subjectOption}
        style={[
          styles.subjectOption,
          isSelected && styles.selectedSubjectOption,
          isUserSubject && styles.userSubjectOption,
        ]}
        onPress={() => setSubject(subjectOption)}
      >
        <Text
          style={[
            styles.subjectOptionText,
            isSelected && styles.selectedSubjectOptionText,
            isUserSubject && styles.userSubjectOptionText,
          ]}
        >
          {subjectOption}
          {isUserSubject && ' ✓'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Nest</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.form}>
        {/* Nest Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nest Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., CS 101 Study Group"
            maxLength={50}
          />
          <Text style={styles.characterCount}>{name.length}/50</Text>
        </View>

        {/* Subject */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Subject *</Text>
          <Text style={styles.subLabel}>
            Your subjects: {userSubjects.join(', ') || 'None selected'}
          </Text>
          <View style={styles.subjectGrid}>
            {SUBJECTS.map(renderSubjectOption)}
          </View>
        </View>

        {/* Class Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Class Name (Optional)</Text>
          <TextInput
            style={styles.input}
            value={className}
            onChangeText={setClassName}
            placeholder="e.g., Data Structures"
            maxLength={50}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what this nest is for..."
            multiline
            numberOfLines={3}
            maxLength={200}
          />
          <Text style={styles.characterCount}>{description.length}/200</Text>
        </View>

        {/* Member Limit */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Member Limit</Text>
          <Text style={styles.subLabel}>
            {memberLimit} members (3-8 recommended)
          </Text>
          <View style={styles.sliderContainer}>
            <TouchableOpacity
              style={styles.sliderButton}
              onPress={() => setMemberLimit(Math.max(3, memberLimit - 1))}
              disabled={memberLimit <= 3}
            >
              <Ionicons name="remove" size={20} color="#007AFF" />
            </TouchableOpacity>
            
            <Text style={styles.sliderValue}>{memberLimit}</Text>
            
            <TouchableOpacity
              style={styles.sliderButton}
              onPress={() => setMemberLimit(Math.min(8, memberLimit + 1))}
              disabled={memberLimit >= 8}
            >
              <Ionicons name="add" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[
            styles.createButton,
            (!name.trim() || !subject || loading) && styles.createButtonDisabled,
          ]}
          onPress={handleCreateNest}
          disabled={!name.trim() || !subject || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Create Nest</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    paddingBottom: 20,
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
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 32,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 4,
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectOption: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedSubjectOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  userSubjectOption: {
    borderColor: '#34C759',
  },
  subjectOptionText: {
    fontSize: 14,
    color: '#000',
  },
  selectedSubjectOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  userSubjectOptionText: {
    color: '#34C759',
    fontWeight: '500',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 16,
  },
  sliderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginHorizontal: 24,
    minWidth: 40,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#8E8E93',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
