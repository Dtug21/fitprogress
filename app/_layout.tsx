import '../global.css';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import 'react-native-reanimated';
import { useUserStore } from '../stores/useUserStore';
import { PwaInstallHint } from '../components/ui/PwaInstallHint';
import { AppSafeAreaProvider } from '../components/ui/AppSafeAreaProvider';
import { COLORS } from '../constants/theme';

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { width } = useWindowDimensions();
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [hydrated, setHydrated] = useState(false);
  const [forceReady, setForceReady] = useState(false);
  const onboardingCompleted = useUserStore((s) => s.profile.onboarding_completed);

  useEffect(() => {
    AsyncStorage.removeItem('fitprogress-workout').catch(() => {});
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    const unsub = useUserStore.persist.onFinishHydration(() => setHydrated(true));
    if (useUserStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
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

  const isDesktop = width > 768;

  return (
    <ThemeProvider value={{
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        background: COLORS.bg,
        card: COLORS.bg,
        border: COLORS.border,
        text: COLORS.textPrimary,
      },
    }}>
      <View style={[styles.shell, isDesktop && styles.shellDesktop]}>
        <View
          style={[
            styles.app,
            isDesktop && styles.appDesktop,
            { maxWidth: isDesktop ? 600 : '100%' },
          ]}
        >
          <AppSafeAreaProvider>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.bg } }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding/index" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="routine/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="exercise/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="profile" options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="routine/new" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
            </Stack>
            <PwaInstallHint />
          </AppSafeAreaProvider>
        </View>
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.bg,
  },
  shellDesktop: {
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  app: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.bg,
    position: 'relative',
  },
  appDesktop: {
    overflow: 'hidden',
    borderColor: COLORS.border,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    boxShadow: '0px 0px 20px rgba(0,0,0,0.5)',
  },
});
