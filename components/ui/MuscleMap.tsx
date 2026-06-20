import { View, Text, StyleSheet } from 'react-native';
import Body from 'react-native-body-highlighter';
import { MuscleGroup } from '../../types';
import { COLORS, FONT } from '../../constants/theme';

type BodySlug =
  | 'trapezius' | 'triceps' | 'forearm' | 'adductors' | 'calves' | 'neck'
  | 'deltoids' | 'chest' | 'biceps' | 'abs' | 'quadriceps' | 'obliques'
  | 'tibialis' | 'upper-back' | 'lower-back' | 'hamstring' | 'gluteal';

const PRIMARY_SLUGS: Record<MuscleGroup, BodySlug[]> = {
  chest:      ['chest'],
  shoulders:  ['deltoids'],
  biceps:     ['biceps'],
  triceps:    ['triceps'],
  back:       ['upper-back', 'lower-back'],
  quads:      ['quadriceps'],
  hamstrings: ['hamstring'],
  glutes:     ['gluteal'],
  calves:     ['calves'],
  core:       ['abs'],
  legs:       ['quadriceps', 'hamstring', 'gluteal'],
  cardio:     ['quadriceps', 'calves'],
  full_body:  ['chest', 'upper-back', 'quadriceps', 'gluteal'],
};

const SECONDARY_SLUGS: Record<MuscleGroup, BodySlug[]> = {
  chest:      ['deltoids', 'triceps'],
  shoulders:  ['trapezius', 'triceps'],
  biceps:     ['forearm'],
  triceps:    ['deltoids', 'forearm'],
  back:       ['biceps', 'trapezius'],
  quads:      ['tibialis', 'adductors'],
  hamstrings: ['gluteal', 'calves'],
  glutes:     ['hamstring', 'lower-back'],
  calves:     ['tibialis'],
  core:       ['obliques'],
  legs:       ['calves', 'adductors'],
  cardio:     ['hamstring', 'abs'],
  full_body:  ['deltoids', 'biceps', 'hamstring', 'abs'],
};

const PRIMARY_COLOR   = '#CC1100';
const SECONDARY_COLOR = '#D97000';

export function MuscleMap({ primary, secondary = [] }: {
  primary: MuscleGroup;
  secondary?: MuscleGroup[];
}) {
  const partsMap = new Map<BodySlug, 1 | 2>();

  secondary.forEach((m) => {
    (SECONDARY_SLUGS[m] ?? []).forEach((s) => { if (!partsMap.has(s)) partsMap.set(s, 1); });
    (PRIMARY_SLUGS[m] ?? []).forEach((s) => { if (!partsMap.has(s)) partsMap.set(s, 1); });
  });
  (SECONDARY_SLUGS[primary] ?? []).forEach((s) => { if (!partsMap.has(s)) partsMap.set(s, 1); });
  (PRIMARY_SLUGS[primary] ?? []).forEach((s) => { partsMap.set(s, 2); });

  const data = Array.from(partsMap.entries()).map(([slug, intensity]) => ({
    slug,
    intensity,
    color: intensity === 2 ? PRIMARY_COLOR : SECONDARY_COLOR,
  }));

  const commonProps = {
    data,
    scale: 1.4,
    colors: [SECONDARY_COLOR, PRIMARY_COLOR],
    border: '#2A3A4A',
    defaultFill: '#1C2B3A',
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.panel}>
        <Body {...commonProps} side="front" />
        <Text style={styles.label}>FRONTAL</Text>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: PRIMARY_COLOR }]} />
          <Text style={styles.legendText}>Principal</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: SECONDARY_COLOR }]} />
          <Text style={styles.legendText}>Secundario</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <Body {...commonProps} side="back" />
        <Text style={styles.label}>POSTERIOR</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  panel: { alignItems: 'center', gap: 6 },
  label: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
  },
  legend: { gap: 10, paddingHorizontal: 2 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: COLORS.textMuted, fontSize: FONT.sm },
});
