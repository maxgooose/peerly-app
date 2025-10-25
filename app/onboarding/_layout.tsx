import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="basic-info" />
      <Stack.Screen name="subjects" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="availability" />
      <Stack.Screen name="photo" />
    </Stack>
  );
}
