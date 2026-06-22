import '../global.css';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useUserStore } from '../stores/useUserStore';
import { PwaInstallHint } from '../components/ui/PwaInstallHint';
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
    <ThemeProvider value={{
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        background: COLORS.bg,
        card: COLORS.bg,
        border: COLORS.border,
        text: COLORS.textPrimary,
      }
    }}>
      <View style={styles.webContainer}>
        <View style={[styles.appWrapper, { 
          maxWidth: Platform.OS === 'web' && width > 768 ? 600 : '100%',
          boxShadow: Platform.OS === 'web' && width > 768 ? '0px 0px 20px rgba(0,0,0,0.5)' : undefined,
          borderLeftWidth: Platform.OS === 'web' && width > 768 ? 1 : 0,
          borderRightWidth: Platform.OS === 'web' && width > 768 ? 1 : 0,
        }]}>
          <SafeAreaProvider>
            <StatusBar style="light" backgroundColor={COLORS.bg} />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.bg } }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding/index" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="routine/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="exercise/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="profile" options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="routine/new" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
            </Stack>
            <PwaInstallHint />
          </SafeAreaProvider>
        </View>
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: '#000000', // Dark outer background for desktop
    alignItems: 'center',
  },
  appWrapper: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.bg,
    overflow: 'hidden',
    borderColor: COLORS.border,
  }
});

