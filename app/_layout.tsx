import '../global.css';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { useUserStore } from '../stores/useUserStore';
import { PwaInstallHint } from '../components/ui/PwaInstallHint';

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [hydrated, setHydrated] = useState(false);
  const [forceReady, setForceReady] = useState(false);
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
    // Red de seguridad: si fuentes o hidratación se cuelgan (común en web),
    // forzar el render igual después de 2s para no quedar en pantalla negra.
    const t = setTimeout(() => setForceReady(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const ready = (loaded && hydrated) || forceReady;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  useEffect(() => {
    if (!ready) return;

    const inOnboarding = segments[0] === 'onboarding';

    if (!onboardingCompleted && !inOnboarding) {
      router.replace('/onboarding');
      return;
    }

    if (onboardingCompleted && inOnboarding) {
      router.replace('/');
    }
  }, [ready, onboardingCompleted, segments, router]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/index" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="routine/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="exercise/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="profile" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="routine/new" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
      </Stack>
      <PwaInstallHint />
    </SafeAreaProvider>
  );
}
