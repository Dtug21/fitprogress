import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Home indicator típico en iPhone cuando el PWA no reporta insets. */
const IOS_PWA_BOTTOM_FALLBACK = 34;
const IOS_PWA_TOP_FALLBACK = 47;

function isStandaloneWeb(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    nav.standalone === true
  );
}

/** Insets fiables en Safari / PWA iOS donde a veces llegan en 0. */
export function useAppInsets() {
  const insets = useSafeAreaInsets();
  const standalone = Platform.OS === 'web' && isStandaloneWeb();

  if (!standalone && Platform.OS !== 'web') {
    return insets;
  }

  if (Platform.OS === 'web' && standalone) {
    return {
      top: insets.top > 0 ? insets.top : IOS_PWA_TOP_FALLBACK,
      bottom: insets.bottom > 0 ? insets.bottom : IOS_PWA_BOTTOM_FALLBACK,
      left: insets.left,
      right: insets.right,
    };
  }

  return insets;
}
