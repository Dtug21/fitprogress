import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useAppInsets } from '../../lib/safeArea';
import { COLORS } from '../../constants/theme';

type ScreenVariant = 'tab' | 'stack' | 'full';

interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: ScreenVariant;
}

export function Screen({ children, style, variant = 'tab' }: ScreenProps) {
  const insets = useAppInsets();

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
