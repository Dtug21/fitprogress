import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useProgressStore } from '../../stores/useProgressStore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { COLORS, SPACING, FONT } from '../../constants/theme';
import { formatDate, formatWeight } from '../../utils/formatters';
import { getExerciseById } from '../../data/exercises';

export default function ProgressScreen() {
  const { sessions, personalRecords, streak, achievements } = useProgressStore();

  const totalVolume = sessions.reduce(
    (total, s) => total + s.sets.reduce((t, set) => t + set.reps * set.weight_kg, 0),
    0
  );

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const prEntries = Object.entries(personalRecords);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <Text style={styles.pageTitle}>Mi Progreso</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Stats generales */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard} padding={SPACING.md}>
            <Text style={styles.statValue}>{sessions.length}</Text>
            <Text style={styles.statLabel}>Sesiones totales</Text>
          </Card>
          <Card style={styles.statCard} padding={SPACING.md}>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Racha actual 🔥</Text>
          </Card>
          <Card style={styles.statCard} padding={SPACING.md}>
            <Text style={styles.statValue}>{prEntries.length}</Text>
            <Text style={styles.statLabel}>PRs logrados</Text>
          </Card>
          <Card style={styles.statCard} padding={SPACING.md}>
            <Text style={styles.statValue}>
              {totalVolume > 0 ? `${Math.round(totalVolume / 1000)}t` : '0'}
            </Text>
            <Text style={styles.statLabel}>Volumen total</Text>
          </Card>
        </View>

        {/* PRs */}
        {prEntries.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Récords personales (PRs)</Text>
            {prEntries.slice(0, 5).map(([exId, pr]) => {
              const ex = getExerciseById(exId);
              return (
                <Card key={exId} padding={SPACING.md}>
                  <View style={styles.prRow}>
                    <View style={styles.prInfo}>
                      <Text style={styles.prExName}>{ex?.name ?? exId}</Text>
                      <Text style={styles.prDate}>{formatDate(pr.date)}</Text>
                    </View>
                    <View style={styles.prValue}>
                      <Text style={styles.prWeight}>{formatWeight(pr.weight_kg)}</Text>
                      <Text style={styles.prReps}>× {pr.reps} reps</Text>
                    </View>
                    <Badge label="PR" variant="success" />
                  </View>
                </Card>
              );
            })}
          </>
        )}

        {/* Historial reciente */}
        {sessions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Historial reciente</Text>
            {[...sessions].reverse().slice(0, 5).map((s) => (
              <Card key={s.id} padding={SPACING.md}>
                <View style={styles.sessionRow}>
                  <View>
                    <Text style={styles.sessionDate}>{formatDate(s.date)}</Text>
                    <Text style={styles.sessionMeta}>
                      {s.sets.length} series · {s.mode === 'home' ? '🏠 Casa' : '🏋️ Gym'}
                    </Text>
                  </View>
                  <View style={styles.sessionRight}>
                    <Text style={styles.sessionVolume}>
                      {formatWeight(s.sets.reduce((t, set) => t + set.reps * set.weight_kg, 0))}
                    </Text>
                    <Text style={styles.sessionVolumeLabel}>volumen</Text>
                  </View>
                </View>
              </Card>
            ))}
          </>
        )}

        {/* Logros */}
        <Text style={styles.sectionTitle}>
          Logros ({unlockedAchievements.length}/{achievements.length})
        </Text>
        <View style={styles.achievementsGrid}>
          {achievements.map((a) => (
            <Card
              key={a.id}
              padding={SPACING.md}
              style={[styles.achievementCard, !a.unlocked && styles.achievementLocked]}
            >
              <Text style={styles.achievementIcon}>{a.unlocked ? '🏆' : '🔒'}</Text>
              <Text style={[styles.achievementTitle, !a.unlocked && styles.lockedText]}>
                {a.title}
              </Text>
              <Text style={styles.achievementDesc}>{a.description}</Text>
            </Card>
          ))}
        </View>

        {sessions.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📈</Text>
            <Text style={styles.emptyTitle}>Sin entrenamientos aún</Text>
            <Text style={styles.emptySub}>
              Completa tu primera sesión para ver tu progreso aquí.
            </Text>
          </View>
        )}

        <Text style={styles.chartNote}>Los gráficos detallados llegarán en la Fase 4.</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, gap: SPACING.sm, paddingTop: SPACING.sm },

  headerBar: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  pageTitle: { color: COLORS.textPrimary, fontSize: FONT.xxl, fontWeight: '800' },
  sectionTitle: { color: COLORS.textSecondary, fontSize: FONT.base, fontWeight: '600', marginTop: SPACING.sm },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  statCard: { width: '47.5%', alignItems: 'center' },
  statValue: { color: COLORS.primary, fontSize: FONT.xxl, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2, textAlign: 'center' },

  prRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  prInfo: { flex: 1 },
  prExName: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '600' },
  prDate: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },
  prValue: { alignItems: 'flex-end' },
  prWeight: { color: COLORS.success, fontSize: FONT.md, fontWeight: '700' },
  prReps: { color: COLORS.textMuted, fontSize: FONT.sm },

  sessionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionDate: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '600' },
  sessionMeta: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },
  sessionRight: { alignItems: 'flex-end' },
  sessionVolume: { color: COLORS.primary, fontSize: FONT.md, fontWeight: '700' },
  sessionVolumeLabel: { color: COLORS.textMuted, fontSize: FONT.sm },

  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  achievementCard: { width: '47.5%', alignItems: 'center' },
  achievementLocked: { opacity: 0.45 },
  achievementIcon: { fontSize: 28, marginBottom: 6 },
  achievementTitle: { color: COLORS.textPrimary, fontSize: FONT.sm, fontWeight: '700', textAlign: 'center' },
  lockedText: { color: COLORS.textMuted },
  achievementDesc: { color: COLORS.textMuted, fontSize: 11, textAlign: 'center', marginTop: 2 },

  empty: { alignItems: 'center', paddingTop: 40 },
  emptyIcon: { fontSize: 56, marginBottom: SPACING.md },
  emptyTitle: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '700', marginBottom: 8 },
  emptySub: { color: COLORS.textMuted, fontSize: FONT.base, textAlign: 'center', paddingHorizontal: SPACING.xl },

  chartNote: { color: COLORS.textMuted, fontSize: FONT.sm, textAlign: 'center', marginTop: SPACING.md },
});
