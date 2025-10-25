import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const STUDY_STYLES = [
  {
    id: 'quiet',
    emoji: '🤫',
    title: 'Quiet',
    description: 'I need complete silence to focus',
  },
  {
    id: 'with_music',
    emoji: '🎵',
    title: 'With Music',
    description: 'Background music helps me concentrate',
  },
  {
    id: 'group_discussion',
    emoji: '💬',
    title: 'Group Discussion',
    description: 'I learn best by talking through concepts',
  },
  {
    id: 'teach_each_other',
    emoji: '🎓',
    title: 'Teach Each Other',
    description: 'I want to both learn and teach',
  },
];

const STUDY_GOALS = [
  {
    id: 'ace_exams',
    emoji: '🏆',
    title: 'Ace Exams',
    description: "I'm aiming for A's and high grades",
  },
  {
    id: 'understand_concepts',
    emoji: '🧠',
    title: 'Understand Concepts',
    description: 'I want to truly grasp the material',
  },
  {
    id: 'just_pass',
    emoji: '✅',
    title: 'Just Pass',
    description: "I need to get through this class",
  },
  {
    id: 'make_friends',
    emoji: '🤝',
    title: 'Make Friends',
    description: 'I want to build study friendships',
  },
];

export default function PreferencesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [studyStyle, setStudyStyle] = useState('');
  const [studyGoals, setStudyGoals] = useState('');

  function handleContinue() {
    if (!studyStyle) {
      Alert.alert('Required', 'Please select your study style');
      return;
    }
    if (!studyGoals) {
      Alert.alert('Required', 'Please select your study goals');
      return;
    }

    router.push({
      pathname: '/onboarding/availability',
      params: {
        ...params,
        studyStyle,
        studyGoals,
      },
    });
  }

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: '60%' }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.step}>Step 3 of 5</Text>
          <Text style={styles.title}>Study preferences</Text>
          <Text style={styles.subtitle}>Help us match you with compatible study partners</Text>
        </View>

        {/* Study Style */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How do you study best?</Text>
          <View style={styles.cardsContainer}>
            {STUDY_STYLES.map((style) => (
              <TouchableOpacity
                key={style.id}
                style={[styles.card, studyStyle === style.id && styles.cardSelected]}
                onPress={() => setStudyStyle(style.id)}
              >
                <Text style={styles.cardEmoji}>{style.emoji}</Text>
                <Text
                  style={[styles.cardTitle, studyStyle === style.id && styles.cardTitleSelected]}
                >
                  {style.title}
                </Text>
                <Text style={styles.cardDescription}>{style.description}</Text>
                {studyStyle === style.id && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Study Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What are your study goals?</Text>
          <View style={styles.cardsContainer}>
            {STUDY_GOALS.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[styles.card, studyGoals === goal.id && styles.cardSelected]}
                onPress={() => setStudyGoals(goal.id)}
              >
                <Text style={styles.cardEmoji}>{goal.emoji}</Text>
                <Text
                  style={[styles.cardTitle, studyGoals === goal.id && styles.cardTitleSelected]}
                >
                  {goal.title}
                </Text>
                <Text style={styles.cardDescription}>{goal.description}</Text>
                {studyGoals === goal.id && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.button,
            (!studyStyle || !studyGoals) && styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!studyStyle || !studyGoals}
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
  scrollContent: {
    paddingBottom: 100,
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
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  cardsContainer: {
    gap: 12,
  },
  card: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#FAFAFA',
    position: 'relative',
  },
  cardSelected: {
    borderColor: '#A67B5B',
    backgroundColor: '#FFF9F5',
  },
  cardEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  cardTitleSelected: {
    color: '#A67B5B',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  checkmark: {
    position: 'absolute',
    top: 16,
    right: 16,
    fontSize: 24,
    color: '#A67B5B',
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
