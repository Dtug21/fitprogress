import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useEffect, useRef } from 'react';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { COLORS, FONT, SPACING, RADIUS } from '../../constants/theme';
import { formatDuration } from '../../utils/formatters';
import { playRestDoneSound, vibrateTap } from '../../lib/pwa';

interface RestTimerOverlayProps {
  onSkip: () => void;
  totalSeconds: number;
  onEndEarly?: () => void;
}

export function RestTimerOverlay({ onSkip, totalSeconds, onEndEarly }: RestTimerOverlayProps) {
  const { restSecondsRemaining, restEndsAt, tickRest, addRestSeconds, isResting } = useWorkoutStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const didFinish = useRef(false);

  useEffect(() => {
    didFinish.current = false;
    intervalRef.current = setInterval(() => tickRest(), 250);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tickRest]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') tickRest();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [tickRest]);

  useEffect(() => {
    if (restSecondsRemaining <= 0 && !didFinish.current) {
      didFinish.current = true;
      playRestDoneSound();
    }
  }, [restSecondsRemaining]);

  const total = totalSeconds > 0 ? totalSeconds : 90;
  const remaining = restEndsAt
    ? Math.max(0, Math.round((restEndsAt - Date.now()) / 1000))
    : restSecondsRemaining;
  const color =
    remaining <= 10 ? COLORS.danger : remaining <= 30 ? COLORS.warning : COLORS.primary;
  const progress = total > 0 ? remaining / total : 0;

  if (!isResting) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.label}>Descanso</Text>
        <Text style={[styles.timer, { color }]}>{formatDuration(remaining)}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
        </View>
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.adjustBtn}
            onPress={() => { addRestSeconds(-15); vibrateTap(); }}
            activeOpacity={0.8}
          >
            <Text style={styles.adjustText}>-15s</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.8}>
            <Text style={styles.skipText}>Saltar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.adjustBtn}
            onPress={() => { addRestSeconds(15); vibrateTap(); }}
            activeOpacity={0.8}
          >
            <Text style={styles.adjustText}>+15s</Text>
          </TouchableOpacity>
        </View>
        {onEndEarly && remaining <= 5 && (
          <TouchableOpacity onPress={onEndEarly} activeOpacity={0.8}>
            <Text style={styles.endEarly}>Terminar serie</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: SPACING.md,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: FONT.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timer: {
    fontSize: 72,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.pill,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  adjustBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  adjustText: {
    color: COLORS.textPrimary,
    fontSize: FONT.base,
    fontWeight: '600',
  },
  skipBtn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  skipText: {
    color: '#fff',
    fontSize: FONT.base,
    fontWeight: '700',
  },
  endEarly: {
    color: COLORS.textMuted,
    fontSize: FONT.sm,
    textDecorationLine: 'underline',
    marginTop: SPACING.xs,
  },
});
