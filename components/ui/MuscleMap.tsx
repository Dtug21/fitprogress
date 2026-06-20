import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Body from 'react-native-body-highlighter';
import { MuscleGroup } from '../../types';
import { COLORS, FONT, SPACING, RADIUS } from '../../constants/theme';

type BodySlug =
  | 'trapezius' | 'triceps' | 'forearm' | 'adductors' | 'calves' | 'neck'
  | 'deltoids' | 'chest' | 'biceps' | 'abs' | 'quadriceps' | 'obliques'
  | 'tibialis' | 'upper-back' | 'lower-back' | 'hamstring' | 'gluteal';

const BODY_BASE_WIDTH = 200;
const BODY_BASE_HEIGHT = 400;
const COLUMN_GAP = 6;

export const MUSCLE_MAP_PRIMARY = '#CC1100';
export const MUSCLE_MAP_SECONDARY = '#D97000';

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

function computeScale(containerWidth: number): number {
  if (containerWidth <= 0) return 0.65;
  const columnWidth = (containerWidth - COLUMN_GAP) / 2;
  const scale = columnWidth / BODY_BASE_WIDTH;
  return Math.min(0.78, Math.max(0.42, scale * 0.98));
}

interface MuscleMapProps {
  primary: MuscleGroup;
  secondary?: MuscleGroup[];
  primaryLabel?: string;
  secondaryLabel?: string;
}

export function MuscleMap({
  primary,
  secondary = [],
  primaryLabel,
  secondaryLabel,
}: MuscleMapProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(0);

  const effectiveWidth = containerWidth || Math.max(screenWidth - 64, 280);

  const scale = useMemo(
    () => computeScale(effectiveWidth),
    [effectiveWidth],
  );

  const bodyWidth = BODY_BASE_WIDTH * scale;
  const bodyHeight = BODY_BASE_HEIGHT * scale;

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
    color: intensity === 2 ? MUSCLE_MAP_PRIMARY : MUSCLE_MAP_SECONDARY,
  }));

  const commonProps = {
    data,
    scale,
    colors: [MUSCLE_MAP_SECONDARY, MUSCLE_MAP_PRIMARY],
    border: '#2A3A4A',
    defaultFill: '#1C2B3A',
  };

  const BodyPanel = ({ side, label }: { side: 'front' | 'back'; label: string }) => (
    <View style={[styles.column, { maxWidth: (effectiveWidth - COLUMN_GAP) / 2 }]}>
      <View style={[styles.svgBox, { width: bodyWidth, height: bodyHeight }]}>
        <Body {...commonProps} side={side} />
      </View>
      <Text style={styles.sideLabel}>{label}</Text>
    </View>
  );

  return (
    <View
      style={styles.wrap}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {(primaryLabel || secondaryLabel) ? (
        <View style={styles.nameLegend}>
          {primaryLabel ? (
            <View style={styles.nameChip}>
              <View style={[styles.dot, { backgroundColor: MUSCLE_MAP_PRIMARY }]} />
              <Text style={styles.namePrimary} numberOfLines={1}>{primaryLabel}</Text>
            </View>
          ) : null}
          {secondaryLabel ? (
            <View style={styles.nameChip}>
              <View style={[styles.dot, { backgroundColor: MUSCLE_MAP_SECONDARY }]} />
              <Text style={styles.nameSecondary} numberOfLines={2}>{secondaryLabel}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.bodiesRow}>
        <BodyPanel side="front" label="FRONTAL" />
        <BodyPanel side="back" label="POSTERIOR" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    overflow: 'hidden',
    gap: SPACING.sm,
  },
  nameLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  nameChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    maxWidth: '100%',
  },
  namePrimary: {
    color: COLORS.textPrimary,
    fontSize: FONT.sm,
    fontWeight: '700',
    flexShrink: 1,
  },
  nameSecondary: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    flexShrink: 1,
  },
  bodiesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    overflow: 'hidden',
    gap: COLUMN_GAP,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    overflow: 'hidden',
  },
  svgBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A1520',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#2A3A4A',
    overflow: 'hidden',
  },
  sideLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
});
