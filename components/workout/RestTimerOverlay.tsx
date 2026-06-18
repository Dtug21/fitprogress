import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { COLORS, FONT, SPACING, RADIUS } from '../../constants/theme';
import { formatDuration } from '../../utils/formatters';

interface RestTimerOverlayProps {
  onSkip: () => void;
}

export function RestTimerOverlay({ onSkip }: RestTimerOverlayProps) {
  const { restSecondsRemaining, tickRest, isResting } = useWorkoutStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const didVibrate = useRef(false);

  useEffect(() => {
    if (!isResting) return;
    didVibrate.current = false;

    intervalRef.current = setInterval(() => {
      tickRest();
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isResting]);

  useEffect(() => {
    if (restSecondsRemaining === 0 && !didVibrate.current && isResting === false) {
      didVibrate.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [restSecondsRemaining, isResting]);

  const totalRest = 90; // default, podría venir de la rutina
  const progress = restSecondsRemaining / totalRest;
  const color =
    restSecondsRemaining > 30 ? COLORS.primary :
    restSecondsRemaining > 10 ? COLORS.warning : COLORS.danger;

  return (
    <View style={styles.overlay}>
      <Text style={styles.label}>Descanso</Text>

      {/* Círculo de progreso simple */}
      <View style={styles.circleContainer}>
        <View style={[styles.circle, { borderColor: color }]}>
          <Text style={[styles.time, { color }]}>
            {formatDuration(restSecondsRemaining)}
          </Text>
          <Text style={styles.timeSub}>restantes</Text>
        </View>
      </View>

      <Text style={styles.nextLabel}>Siguiente serie</Text>

      <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.8}>
        <Text style={styles.skipText}>Saltar descanso →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONT.lg,
    fontWeight: '600',
    marginBottom: SPACING.xl,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  circleContainer: {
    marginBottom: SPACING.xl,
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  time: {
    fontSize: 48,
    fontWeight: '800',
  },
  timeSub: {
    color: COLORS.textMuted,
    fontSize: FONT.sm,
    marginTop: 4,
  },
  nextLabel: {
    color: COLORS.textPrimary,
    fontSize: FONT.md,
    fontWeight: '600',
    marginBottom: SPACING.xl,
  },
  skipBtn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  skipText: {
    color: COLORS.primary,
    fontSize: FONT.md,
    fontWeight: '700',
  },
});
