import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { COLORS, RADIUS, FONT } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

const BG: Record<Variant, string> = {
  primary: COLORS.primary,
  secondary: COLORS.surface,
  danger: COLORS.danger,
  ghost: 'transparent',
};

const TEXT_COLOR: Record<Variant, string> = {
  primary: '#000000',
  secondary: COLORS.textPrimary,
  danger: '#FFFFFF',
  ghost: COLORS.primary,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
  fullWidth,
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.btn,
        { backgroundColor: BG[variant] },
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={TEXT_COLOR[variant]} size="small" />
      ) : (
        <Text style={[styles.label, { color: TEXT_COLOR[variant] }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  label: { fontSize: FONT.md, fontWeight: '700' },
});
