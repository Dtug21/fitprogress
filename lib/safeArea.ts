import { Platform } from 'react-native';
import { useSafeAreaInsets, type Metrics } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

/** Lee insets reales del CSS env() en Safari / PWA iOS. */
export function readWebSafeAreaInsets(): {
  top: number;
  bottom: number;
  left: number;
  right: number;
} {
  if (typeof document === 'undefined') {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  const probe = document.createElement('div');
  probe.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'visibility:hidden',
    'pointer-events:none',
    'padding-top:env(safe-area-inset-top)',
    'padding-bottom:env(safe-area-inset-bottom)',
    'padding-left:env(safe-area-inset-left)',
    'padding-right:env(safe-area-inset-right)',
  ].join(';');
  document.body.appendChild(probe);
  const style = getComputedStyle(probe);
  const top = parseFloat(style.paddingTop) || 0;
  const bottom = parseFloat(style.paddingBottom) || 0;
  const left = parseFloat(style.paddingLeft) || 0;
  const right = parseFloat(style.paddingRight) || 0;
  document.body.removeChild(probe);

  return { top, bottom, left, right };
}

export function isStandaloneWeb(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    nav.standalone === true
  );
}

export function buildWebInitialMetrics(): Metrics | undefined {
  if (typeof window === 'undefined') return undefined;

  const insets = readWebSafeAreaInsets();
  return {
    insets,
    frame: {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    },
  };
}

/** Re-sincroniza insets tras rotación o cambio de modo PWA. */
export function useWebSafeAreaMetrics(): Metrics | undefined {
  const [metrics, setMetrics] = useState<Metrics | undefined>(() =>
    Platform.OS === 'web' ? buildWebInitialMetrics() : undefined,
  );

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const update = () => setMetrics(buildWebInitialMetrics());
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return metrics;
}

export function useAppInsets() {
  const insets = useSafeAreaInsets();
  return insets;
}
