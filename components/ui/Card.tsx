import { View, StyleSheet, ViewProps } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: number;
  elevated?: boolean;
}

export function Card({ children, style, padding = SPACING.md, elevated, ...props }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        { padding, backgroundColor: elevated ? COLORS.cardElevated : COLORS.card },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
