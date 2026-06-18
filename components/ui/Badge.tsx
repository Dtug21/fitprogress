import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, FONT } from '../../constants/theme';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const BG: Record<BadgeVariant, string> = {
  primary: COLORS.primaryDim,
  success: COLORS.successDim,
  warning: COLORS.warningDim,
  danger: COLORS.dangerDim,
  neutral: COLORS.border,
};

const COLOR: Record<BadgeVariant, string> = {
  primary: COLORS.primary,
  success: COLORS.success,
  warning: COLORS.warning,
  danger: COLORS.danger,
  neutral: COLORS.textSecondary,
};

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: BG[variant] }]}>
      <Text style={[styles.text, { color: COLOR[variant] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.xl,
    alignSelf: 'flex-start',
  },
  text: { fontSize: FONT.sm, fontWeight: '600' },
});
