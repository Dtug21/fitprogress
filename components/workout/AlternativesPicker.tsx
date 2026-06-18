import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exercise } from '../../types';
import { exercises, getExerciseById } from '../../data/exercises';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { COLORS, SPACING, FONT, RADIUS } from '../../constants/theme';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pecho', back: 'Espalda', shoulders: 'Hombros',
  biceps: 'Bíceps', triceps: 'Tríceps', legs: 'Piernas',
  quads: 'Cuádriceps', hamstrings: 'Isquios', glutes: 'Glúteos',
  calves: 'Gemelos', core: 'Core', cardio: 'Cardio',
};

interface AlternativesPickerProps {
  visible: boolean;
  currentExerciseId: string;
  mode: 'home' | 'gym';
  availableEquipment: string[];
  onSelect: (exerciseId: string) => void;
  onClose: () => void;
}

export function AlternativesPicker({
  visible,
  currentExerciseId,
  mode,
  availableEquipment,
  onSelect,
  onClose,
}: AlternativesPickerProps) {
  const currentEx = getExerciseById(currentExerciseId);
  if (!currentEx) return null;

  // Alternativas: mismo grupo muscular, compatible con el modo y equipamiento
  const alternatives = exercises.filter((ex) => {
    if (ex.id === currentExerciseId) return false;
    if (ex.muscle_group !== currentEx.muscle_group) return false;
    if (ex.mode !== 'both' && ex.mode !== mode) return false;
    if (mode === 'home') {
      return ex.equipment_required.every((eq) => availableEquipment.includes(eq));
    }
    return true;
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Cambiar ejercicio</Text>
            <Text style={styles.subtitle}>
              Alternativas para{' '}
              <Text style={styles.exName}>{currentEx.name}</Text>
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {alternatives.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                No hay alternativas disponibles para este grupo muscular con tu equipo actual.
              </Text>
            </View>
          ) : (
            alternatives.map((ex) => (
              <TouchableOpacity key={ex.id} onPress={() => onSelect(ex.id)} activeOpacity={0.75}>
                <Card padding={SPACING.md} style={styles.card}>
                  <View style={styles.cardRow}>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardName}>{ex.name}</Text>
                      <Text style={styles.cardMeta}>
                        {MUSCLE_LABELS[ex.muscle_group] ?? ex.muscle_group} · Dificultad {ex.difficulty}/5
                      </Text>
                      <Text style={styles.cardInstructions} numberOfLines={2}>
                        {ex.instructions}
                      </Text>
                    </View>
                    <View style={styles.cardRight}>
                      <Badge
                        label={`Dif. ${ex.difficulty}`}
                        variant={ex.difficulty <= 2 ? 'success' : ex.difficulty <= 3 ? 'warning' : 'danger'}
                      />
                      <Ionicons name="swap-horizontal" size={22} color={COLORS.primary} style={{ marginTop: 8 }} />
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { color: COLORS.textPrimary, fontSize: FONT.xl, fontWeight: '800' },
  subtitle: { color: COLORS.textMuted, fontSize: FONT.base, marginTop: 4 },
  exName: { color: COLORS.primary, fontWeight: '700' },
  closeBtn: { padding: 4 },
  list: { padding: SPACING.lg, gap: SPACING.sm },
  card: {},
  cardRow: { flexDirection: 'row', gap: SPACING.sm },
  cardInfo: { flex: 1 },
  cardName: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '700' },
  cardMeta: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },
  cardInstructions: { color: COLORS.textSecondary, fontSize: FONT.sm, marginTop: 6, lineHeight: 18 },
  cardRight: { alignItems: 'flex-end' },
  empty: { padding: SPACING.xl, alignItems: 'center' },
  emptyText: { color: COLORS.textMuted, fontSize: FONT.base, textAlign: 'center' },
});
