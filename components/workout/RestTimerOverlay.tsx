import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { COLORS, FONT, SPACING, RADIUS } from '../../constants/theme';
import { formatDuration } from '../../utils/formatters';

interface RestTimerOverlayProps {
  onSkip: () => void;
  totalSeconds: number;
  onEndEarly?: () => void;
}

// Beep al terminar el descanso. En web usa Web Audio (suena en la PWA);
// en nativo cae a una vibración fuerte.
function playRestDoneSound() {
  if (Platform.OS === 'web') {
    try {
      const Ctx = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext });
      const AudioCtx = Ctx.AudioContext ?? Ctx.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const beep = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.001, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      };
      beep(880, 0, 0.18);
      beep(1175, 0.2, 0.25);
    } catch {
      // sin audio disponible — no pasa nada
    }
  } else {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

export function RestTimerOverlay({ onSkip, totalSeconds, onEndEarly }: RestTimerOverlayProps) {
  const { restSecondsRemaining, restEndsAt, tickRest, addRestSeconds, isResting } = useWorkoutStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const didFinish = useRef(false);

  // Tick cada segundo (recalcula desde el timestamp objetivo).
  useEffect(() => {
    didFinish.current = false;
    intervalRef.current = setInterval(() => tickRest(), 250);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tickRest]);

  // Al volver del bloqueo/segundo plano, recalcular de inmediato.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onVisible = () => { if (document.visibilityState === 'visible') tickRest(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [tickRest]);

  // Sonido cuando llega a cero.
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
    remaining > 30 ? COLORS.primary :
    remaining > 10 ? COLORS.warning : COLORS.danger;

  return (
    <View style={styles.overlay}>
      <Text style={styles.label}>Descanso</Text>

      <View style={styles.circleContainer}>
        <View style={[styles.circle, { borderColor: color }]}>
          <Text style={[styles.time, { color }]}>{formatDuration(remaining)}</Text>
          <Text style={styles.timeSub}>restantes</Text>
        </View>
      </View>

      {/* Ajustar segundos */}
      <View style={styles.adjustRow}>
        <TouchableOpacity style={styles.adjustBtn} onPress={() => { addRestSeconds(-15); Haptics.selectionAsync(); }} activeOpacity={0.8}>
          <Text style={styles.adjustText}>−15s</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.adjustBtn} onPress={() => { addRestSeconds(15); Haptics.selectionAsync(); }} activeOpacity={0.8}>
          <Text style={styles.adjustText}>+15s</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.85}>
        <Text style={styles.skipText}>Saltar descanso →</Text>
      </TouchableOpacity>

      {onEndEarly && (
        <TouchableOpacity style={styles.endEarlyBtn} onPress={onEndEarly} activeOpacity={0.8}>
          <Text style={styles.endEarlyText}>Terminar rutina anticipada</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    zIndex: 100,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONT.lg,
    fontWeight: '600',
    marginBottom: SPACING.xl,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  circleContainer: { marginBottom: SPACING.xl },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  time: { fontSize: 48, fontWeight: '700', fontVariant: ['tabular-nums'] },
  timeSub: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 4 },

  adjustRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  adjustBtn: {
    width: 96, height: 48, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  adjustText: { color: COLORS.textPrimary, fontSize: FONT.md, fontWeight: '600', fontVariant: ['tabular-nums'] },

  skipBtn: {
    paddingHorizontal: SPACING.xl,
    height: 52,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: { color: COLORS.accentText, fontSize: FONT.md, fontWeight: '600' },
  endEarlyBtn: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.warning,
    backgroundColor: COLORS.warningDim,
  },
  endEarlyText: { color: COLORS.warning, fontSize: FONT.sm, fontWeight: '700' },
});
