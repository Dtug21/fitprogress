import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, FONT, WEIGHT } from '../../constants/theme';

interface ModeToggleProps {
  mode: 'home' | 'gym';
  onChange: (mode: 'home' | 'gym') => void;
  compact?: boolean;
}

export function ModeToggle({ mode, onChange, compact }: ModeToggleProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.option, mode === 'home' && styles.active]}
        onPress={() => onChange('home')}
        activeOpacity={0.8}
      >
        <Ionicons
          name="home"
          size={16}
          color={mode === 'home' ? COLORS.accentText : COLORS.textMuted}
        />
        {!compact && (
          <Text style={[styles.label, mode === 'home' && styles.activeLabel]}>Casa</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.option, mode === 'gym' && styles.active]}
        onPress={() => onChange('gym')}
        activeOpacity={0.8}
      >
        <Ionicons
          name="barbell"
          size={16}
          color={mode === 'gym' ? COLORS.accentText : COLORS.textMuted}
        />
        {!compact && (
          <Text style={[styles.label, mode === 'gym' && styles.activeLabel]}>Gym</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 3,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  active: { backgroundColor: COLORS.primary },
  label: { fontSize: FONT.base, fontWeight: WEIGHT.medium, color: COLORS.textSecondary },
  activeLabel: { color: COLORS.accentText, fontWeight: WEIGHT.semibold },
});
