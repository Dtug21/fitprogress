import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { COLORS } from '../../constants/theme';

type ScreenVariant = 'tab' | 'stack' | 'full';

interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: ScreenVariant;
}

const EDGES = {
  full: [] as const,
  tab: ['top', 'left', 'right'] as const,
  stack: ['top', 'left', 'right', 'bottom'] as const,
};

export function Screen({ children, style, variant = 'tab' }: ScreenProps) {
  return (
    <SafeAreaView style={[styles.root, style]} edges={EDGES[variant]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
});
