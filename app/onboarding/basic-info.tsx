import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

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

export default function BasicInfoScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState('');
  const [bio, setBio] = useState('');
  const [showMajorPicker, setShowMajorPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  function handleContinue() {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your full name');
      return;
    }
    if (!major) {
      Alert.alert('Required', 'Please select your major');
      return;
    }
    if (!year) {
      Alert.alert('Required', 'Please select your academic year');
      return;
    }

    // Store in context or navigation params
    router.push({
      pathname: '/onboarding/subjects',
      params: { fullName, major, year, bio },
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: '20%' }]} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.step}>Step 1 of 5</Text>
          <Text style={styles.title}>Tell us about yourself</Text>
          <Text style={styles.subtitle}>
            This helps us find the best study partners for you
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>

          {/* Major */}
          <View style={styles.field}>
            <Text style={styles.label}>Major *</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowMajorPicker(!showMajorPicker)}
            >
              <Text style={major ? styles.pickerText : styles.pickerPlaceholder}>
                {major || 'Select your major'}
              </Text>
              <Text style={styles.pickerArrow}>{showMajorPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showMajorPicker && (
              <View style={styles.pickerOptions}>
                {MAJORS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={styles.pickerOption}
                    onPress={() => {
                      setMajor(m);
                      setShowMajorPicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Year */}
          <View style={styles.field}>
            <Text style={styles.label}>Academic Year *</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowYearPicker(!showYearPicker)}
            >
              <Text style={year ? styles.pickerText : styles.pickerPlaceholder}>
                {year || 'Select your year'}
              </Text>
              <Text style={styles.pickerArrow}>{showYearPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showYearPicker && (
              <View style={styles.pickerOptions}>
                {YEARS.map((y) => (
                  <TouchableOpacity
                    key={y}
                    style={styles.pickerOption}
                    onPress={() => {
                      setYear(y);
                      setShowYearPicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Bio */}
          <View style={styles.field}>
            <Text style={styles.label}>Bio (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell others a bit about yourself..."
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              maxLength={200}
            />
            <Text style={styles.charCount}>{bio.length}/200</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#F0F0F0',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#A67B5B',
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
  form: {
    padding: 24,
    paddingTop: 8,
    gap: 24,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#999',
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FAFAFA',
  },
  pickerText: {
    fontSize: 16,
    color: '#000',
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#666',
  },
  pickerOptions: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginTop: 4,
    backgroundColor: '#fff',
    maxHeight: 200,
  },
  pickerOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#000',
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
  },
  button: {
    backgroundColor: '#A67B5B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
