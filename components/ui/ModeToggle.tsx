import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, RADIUS, FONT, SPACING } from '../../constants/theme';

interface ModeToggleProps {
  mode: 'home' | 'gym';
  onChange: (mode: 'home' | 'gym') => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.option, mode === 'home' && styles.active]}
        onPress={() => onChange('home')}
        activeOpacity={0.8}
      >
        <Text style={styles.icon}>🏠</Text>
        <Text style={[styles.label, mode === 'home' && styles.activeLabel]}>Casa</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.option, mode === 'gym' && styles.active]}
        onPress={() => onChange('gym')}
        activeOpacity={0.8}
      >
        <Text style={styles.icon}>🏋️</Text>
        <Text style={[styles.label, mode === 'gym' && styles.activeLabel]}>Gym</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 4,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  active: { backgroundColor: COLORS.primary },
  icon: { fontSize: 16 },
  label: { fontSize: FONT.base, fontWeight: '600', color: COLORS.textSecondary },
  activeLabel: { color: '#000000' },
});
