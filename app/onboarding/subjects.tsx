import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const POPULAR_SUBJECTS = [
  'Calculus I',
  'Calculus II',
  'Linear Algebra',
  'Statistics',
  'Data Structures',
  'Algorithms',
  'Physics I',
  'Physics II',
  'Chemistry',
  'Organic Chemistry',
  'Biology',
  'Microbi',
  'English Composition',
  'Psychology 101',
  'Economics',
  'Accounting',
];

const ALL_SUBJECTS = [
  ...POPULAR_SUBJECTS,
  'Calculus III',
  'Differential Equations',
  'Discrete Math',
  'Abstract Algebra',
  'Real Analysis',
  'Computer Architecture',
  'Operating Systems',
  'Database Systems',
  'Machine Learning',
  'Artificial Intelligence',
  'Web Development',
  'Mobile Development',
  'Physics III',
  'Electromagnetism',
  'Quantum Mechanics',
  'Thermodynamics',
  'Biochemistry',
  'Genetics',
  'Cell Biology',
  'Molecular Biology',
  'Anatomy',
  'Physiology',
  'Literature',
  'Creative Writing',
  'Philosophy',
  'Ethics',
  'Political Science',
  'Sociology',
  'Anthropology',
  'Art History',
  'Music Theory',
  'Finance',
  'Marketing',
  'Management',
].sort();

export default function SubjectsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  function toggleSubject(subject: string) {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subject));
    } else {
      if (selectedSubjects.length >= 10) {
        Alert.alert('Maximum Reached', 'You can select up to 10 subjects');
        return;
      }
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  }

  function handleContinue() {
    if (selectedSubjects.length === 0) {
      Alert.alert('Required', 'Please select at least one subject');
      return;
    }

    router.push({
      pathname: '/onboarding/preferences',
      params: {
        ...params,
        subjects: JSON.stringify(selectedSubjects),
      },
    });
  }

  const filteredSubjects = searchQuery
    ? ALL_SUBJECTS.filter((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
    : POPULAR_SUBJECTS;

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: '40%' }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.step}>Step 2 of 5</Text>
        <Text style={styles.title}>What are you studying?</Text>
        <Text style={styles.subtitle}>Select the subjects you need help with</Text>
      </View>

      {/* Selected Count */}
      <View style={styles.selectedContainer}>
        <Text style={styles.selectedText}>
          {selectedSubjects.length} selected {selectedSubjects.length > 0 && '✓'}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search subjects..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      {/* Subject Chips */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.chipsContainer}>
          {filteredSubjects.map((subject) => {
            const isSelected = selectedSubjects.includes(subject);
            return (
              <TouchableOpacity
                key={subject}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => toggleSubject(subject)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {subject}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {searchQuery && filteredSubjects.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No subjects found</Text>
            <Text style={styles.emptySubtext}>Try a different search term</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, selectedSubjects.length === 0 && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={selectedSubjects.length === 0}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
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
  selectedContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  selectedText: {
    fontSize: 16,
    color: '#A67B5B',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  chipSelected: {
    backgroundColor: '#A67B5B',
    borderColor: '#A67B5B',
  },
  chipText: {
    fontSize: 15,
    color: '#333',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
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
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
