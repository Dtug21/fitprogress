import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, FONT, WEIGHT, TRACKING } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

const BG: Record<Variant, string> = {
  primary: COLORS.primary,
  secondary: COLORS.cardElevated,
  danger: COLORS.dangerDim,
  ghost: 'transparent',
};

const TEXT_COLOR: Record<Variant, string> = {
  primary: COLORS.accentText,
  secondary: COLORS.textPrimary,
  danger: COLORS.danger,
  ghost: COLORS.primary,
};

const BORDER: Record<Variant, string> = {
  primary: 'transparent',
  secondary: COLORS.border,
  danger: 'transparent',
  ghost: COLORS.border,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
  fullWidth,
  icon,
}: ButtonProps) {
  const color = TEXT_COLOR[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.btn,
        { backgroundColor: BG[variant], borderColor: BORDER[variant] },
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} size="small" />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={18} color={color} />}
          <Text style={[styles.label, { color }]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.4 },
  label: { fontSize: FONT.md, fontWeight: WEIGHT.semibold, letterSpacing: TRACKING.normal },
});
