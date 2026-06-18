import '../global.css';
import { useFonts } from 'expo-font';
import { Stack, Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { useUserStore } from '../stores/useUserStore';

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [hydrated, setHydrated] = useState(false);
  const onboardingCompleted = useUserStore((s) => s.profile.onboarding_completed);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    // Esperar a que Zustand termine de hidratar desde AsyncStorage
    const unsub = useUserStore.persist.onFinishHydration(() => setHydrated(true));
    // Si ya estaba hidratado antes de montar (cache caliente)
    if (useUserStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (loaded && hydrated) SplashScreen.hideAsync();
  }, [loaded, hydrated]);

  if (!loaded || !hydrated) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/index" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="routine/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
      {!onboardingCompleted && <Redirect href="/onboarding" />}
    </Stack>
  );
}
