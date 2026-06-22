import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import { buildWebInitialMetrics } from '../../lib/safeArea';

function defaultMetrics(): Metrics {
  const built = buildWebInitialMetrics();
  if (built) return built;
  return {
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
    frame: {
      x: 0,
      y: 0,
      width: typeof window !== 'undefined' ? window.innerWidth : 390,
      height: typeof window !== 'undefined' ? window.innerHeight : 844,
    },
  };
}

export function AppSafeAreaProvider({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={defaultMetrics()}>
      <View style={styles.fill}>{children}</View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
