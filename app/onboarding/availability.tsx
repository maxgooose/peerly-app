import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'none';
type DaySchedule = { [key in 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday']: TimeSlot };

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

const TIME_SLOTS: { value: TimeSlot; label: string; emoji: string }[] = [
  { value: 'morning', label: 'Morning', emoji: '🌅' },
  { value: 'afternoon', label: 'Afternoon', emoji: '☀️' },
  { value: 'evening', label: 'Evening', emoji: '🌙' },
];

export default function AvailabilityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [availability, setAvailability] = useState<DaySchedule>({
    monday: 'none',
    tuesday: 'none',
    wednesday: 'none',
    thursday: 'none',
    friday: 'none',
    saturday: 'none',
    sunday: 'none',
  });

  function toggleTimeSlot(day: keyof DaySchedule, slot: TimeSlot) {
    setAvailability((prev) => ({
      ...prev,
      [day]: prev[day] === slot ? 'none' : slot,
    }));
  }

  function handleSkip() {
    router.push({
      pathname: '/onboarding/photo',
      params,
    });
  }

  function handleContinue() {
    // Convert availability to simplified format
    const availabilityData: any = {};
    Object.entries(availability).forEach(([day, slot]) => {
      if (slot !== 'none') {
        availabilityData[day] = slot;
      }
    });

    router.push({
      pathname: '/onboarding/photo',
      params: {
        ...params,
        availability: JSON.stringify(availabilityData),
      },
    });
  }

  const hasAnyAvailability = Object.values(availability).some((slot) => slot !== 'none');

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: '80%' }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.step}>Step 4 of 5</Text>
          <Text style={styles.title}>When can you study?</Text>
          <Text style={styles.subtitle}>Select your typical available times (optional)</Text>
        </View>

        {/* Days Grid */}
        <View style={styles.grid}>
          {DAYS.map((day) => (
            <View key={day.key} style={styles.dayRow}>
              <Text style={styles.dayLabel}>{day.label}</Text>
              <View style={styles.slotsRow}>
                {TIME_SLOTS.map((slot) => {
                  const isSelected = availability[day.key] === slot.value;
                  return (
                    <TouchableOpacity
                      key={slot.value}
                      style={[styles.slotButton, isSelected && styles.slotButtonSelected]}
                      onPress={() => toggleTimeSlot(day.key, slot.value)}
                    >
                      <Text style={styles.slotEmoji}>{slot.emoji}</Text>
                      <Text
                        style={[styles.slotText, isSelected && styles.slotTextSelected]}
                      >
                        {slot.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.hint}>
          <Text style={styles.hintText}>
            💡 Tip: Adding availability helps us find study partners with matching schedules
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            !hasAnyAvailability && styles.buttonSecondary,
          ]}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>
            {hasAnyAvailability ? 'Continue' : 'Skip'}
          </Text>
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
  grid: {
    paddingHorizontal: 16,
    gap: 16,
  },
  dayRow: {
    gap: 8,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    paddingHorizontal: 8,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  slotButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    gap: 4,
  },
  slotButtonSelected: {
    borderColor: '#A67B5B',
    backgroundColor: '#FFF9F5',
  },
  slotEmoji: {
    fontSize: 20,
  },
  slotText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  slotTextSelected: {
    color: '#A67B5B',
    fontWeight: '600',
  },
  hint: {
    margin: 24,
    padding: 16,
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  hintText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
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
