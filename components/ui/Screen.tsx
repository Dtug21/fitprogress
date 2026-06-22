import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';

type ScreenVariant = 'tab' | 'stack' | 'full';

interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** tab: notch arriba, tab bar abajo | stack: pantalla completa con home indicator | full: sin insets */
  variant?: ScreenVariant;
}

export function Screen({ children, style, variant = 'tab' }: ScreenProps) {
  const insets = useSafeAreaInsets();

  const insetStyle: ViewStyle =
    variant === 'full'
      ? {}
      : variant === 'tab'
        ? {
            paddingTop: insets.top,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          }
        : {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          };

  return (
    <View style={[styles.root, insetStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
});
