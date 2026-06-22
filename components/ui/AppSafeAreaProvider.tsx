import { Platform, View, StyleSheet } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics, type Metrics } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import { useWebSafeAreaMetrics } from '../../lib/safeArea';

const EMPTY_METRICS: Metrics = {
  insets: { top: 0, bottom: 0, left: 0, right: 0 },
  frame: { x: 0, y: 0, width: 0, height: 0 },
};

export function AppSafeAreaProvider({ children }: { children: ReactNode }) {
  const webMetrics = useWebSafeAreaMetrics();

  if (Platform.OS === 'web') {
    return (
      <SafeAreaProvider initialMetrics={webMetrics ?? EMPTY_METRICS}>
        <View style={styles.fill}>{children}</View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      {children}
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
