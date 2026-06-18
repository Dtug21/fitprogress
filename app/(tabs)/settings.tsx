import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useUserStore } from '../../stores/useUserStore';
import { useProgressStore } from '../../stores/useProgressStore';
import { useRoutineStore } from '../../stores/useRoutineStore';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { ModeToggle } from '../../components/ui/ModeToggle';
import { Card } from '../../components/ui/Card';
import { COLORS, SPACING, FONT, RADIUS } from '../../constants/theme';
import { Equipment } from '../../types';

const HOME_EQUIPMENT_LIST: { id: Equipment; label: string; icon: string }[] = [
  { id: 'dumbbells', label: 'Mancuernas regulables', icon: '🏋️' },
  { id: 'adjustable_bench', label: 'Banco inclinable', icon: '🪑' },
  { id: 'straight_barbell', label: 'Barra plana', icon: '—' },
  { id: 'ez_bar', label: 'Barra Z (EZ)', icon: 'Z' },
  { id: 'w_bar', label: 'Barra W', icon: 'W' },
  { id: 'long_bands', label: 'Bandas elásticas largas', icon: '🔴' },
  { id: 'short_bands', label: 'Mini bandas', icon: '🟠' },
  { id: 'ab_wheel', label: 'Rueda abdominal', icon: '⭕' },
  { id: 'jump_rope', label: 'Cuerda para saltar', icon: '🪢' },
  { id: 'hand_grippers', label: 'Hand grippers', icon: '✊' },
  { id: 'bodyweight', label: 'Peso corporal', icon: '🧍' },
];

const LEVEL_OPTIONS: { value: 'beginner' | 'intermediate' | 'advanced'; label: string }[] = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
];

const GOAL_OPTIONS: { value: 'fat_loss' | 'strength' | 'mixed'; label: string }[] = [
  { value: 'fat_loss', label: 'Pérdida de grasa' },
  { value: 'strength', label: 'Fuerza' },
  { value: 'mixed', label: 'Mixto' },
];

function SettingRow({
  icon,
  label,
  value,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.settingIcon}>{icon}</Text>
      <Text style={[styles.settingLabel, danger && { color: COLORS.danger }]}>{label}</Text>
      <View style={styles.settingRight}>
        {value ? <Text style={styles.settingValue}>{value}</Text> : null}
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { profile, setMode, setEquipment, updateProfile } = useUserStore();
  const { sessions, personalRecords } = useProgressStore();
  const { routines } = useRoutineStore();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);

  function toggleEquipment(equip: Equipment) {
    const current = profile.home_equipment;
    const updated = current.includes(equip)
      ? current.filter((e) => e !== equip)
      : [...current, equip];
    setEquipment(updated);
  }

  function saveName() {
    updateProfile({ name: nameInput.trim() });
    setEditingName(false);
  }

  function handleResetData() {
    Alert.alert(
      'Resetear todos los datos',
      'Esto eliminará todo tu historial, rutinas y PRs. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetear',
          style: 'destructive',
          onPress: () => {
            Alert.alert('En desarrollo', 'Esta función estará disponible en la Fase 5.');
          },
        },
      ]
    );
  }

  function handleExport() {
    Alert.alert('En desarrollo', 'Exportar datos estará disponible en la Fase 5.');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <Text style={styles.pageTitle}>Configuración</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Perfil */}
        <Text style={styles.sectionTitle}>Perfil</Text>
        <Card padding={0}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.name ? profile.name[0].toUpperCase() : '?'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              {editingName ? (
                <View style={styles.nameEditRow}>
                  <TextInput
                    style={styles.nameInput}
                    value={nameInput}
                    onChangeText={setNameInput}
                    autoFocus
                    maxLength={30}
                    onSubmitEditing={saveName}
                    returnKeyType="done"
                    placeholder="Tu nombre"
                    placeholderTextColor={COLORS.textMuted}
                  />
                  <TouchableOpacity onPress={saveName} style={styles.saveNameBtn}>
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setEditingName(true)} style={styles.nameRow}>
                  <Text style={styles.profileName}>
                    {profile.name || 'Sin nombre'}
                  </Text>
                  <Ionicons name="pencil-outline" size={14} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
              <Text style={styles.profileStats}>
                {sessions.length} sesiones · {routines.length} rutinas
              </Text>
            </View>
          </View>
        </Card>

        {/* Modo */}
        <Text style={styles.sectionTitle}>Modo de entrenamiento</Text>
        <ModeToggle mode={profile.mode} onChange={setMode} />

        {/* Nivel y objetivo */}
        <Text style={styles.sectionTitle}>Nivel de experiencia</Text>
        <Card padding={SPACING.sm}>
          <View style={styles.optionsRow}>
            {LEVEL_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.optionBtn,
                  profile.experience_level === opt.value && styles.optionBtnActive,
                ]}
                onPress={() => updateProfile({ experience_level: opt.value })}
              >
                <Text style={[
                  styles.optionText,
                  profile.experience_level === opt.value && styles.optionTextActive,
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Objetivo</Text>
        <Card padding={SPACING.sm}>
          <View style={styles.optionsRow}>
            {GOAL_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.optionBtn,
                  profile.goal === opt.value && styles.optionBtnActive,
                ]}
                onPress={() => updateProfile({ goal: opt.value })}
              >
                <Text style={[
                  styles.optionText,
                  profile.goal === opt.value && styles.optionTextActive,
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Equipamiento en casa */}
        <Text style={styles.sectionTitle}>Equipamiento en casa</Text>
        <Text style={styles.sectionSub}>Activa el equipo que tienes disponible para filtrar ejercicios.</Text>
        <Card padding={0}>
          {HOME_EQUIPMENT_LIST.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.equipRow,
                idx < HOME_EQUIPMENT_LIST.length - 1 && styles.equipBorder,
              ]}
              onPress={() => toggleEquipment(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.equipIcon}>{item.icon}</Text>
              <Text style={styles.equipLabel}>{item.label}</Text>
              <Switch
                value={profile.home_equipment.includes(item.id)}
                onValueChange={() => toggleEquipment(item.id)}
                trackColor={{ false: COLORS.border, true: COLORS.primaryDim }}
                thumbColor={
                  profile.home_equipment.includes(item.id)
                    ? COLORS.primary
                    : COLORS.textMuted
                }
              />
            </TouchableOpacity>
          ))}
        </Card>

        {/* Datos */}
        <Text style={styles.sectionTitle}>Datos</Text>
        <Card padding={0}>
          <SettingRow icon="📤" label="Exportar mis datos" onPress={handleExport} />
          <View style={styles.divider} />
          <SettingRow icon="🗑️" label="Resetear todos los datos" onPress={handleResetData} danger />
        </Card>

        {/* Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>FitProgress</Text>
          <Text style={styles.appVersion}>v1.0 — Fase 2</Text>
        </View>

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
  sectionSub: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: -6 },

  profileRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.primary, fontSize: FONT.xl, fontWeight: '800' },
  profileInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profileName: { color: COLORS.textPrimary, fontSize: FONT.md, fontWeight: '700' },
  profileStats: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT.md,
    fontWeight: '700',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingVertical: 2,
  },
  saveNameBtn: { padding: 4 },

  optionsRow: { flexDirection: 'row', gap: 6 },
  optionBtn: {
    flex: 1,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBtnActive: { backgroundColor: COLORS.primaryDim },
  optionText: { color: COLORS.textMuted, fontSize: FONT.sm, fontWeight: '600' },
  optionTextActive: { color: COLORS.primary },

  equipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    gap: SPACING.sm,
  },
  equipBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  equipIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  equipLabel: { flex: 1, color: COLORS.textPrimary, fontSize: FONT.base },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 16,
    gap: SPACING.sm,
  },
  settingIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  settingLabel: { flex: 1, color: COLORS.textPrimary, fontSize: FONT.base },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue: { color: COLORS.textMuted, fontSize: FONT.base },
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.md },

  appInfo: { alignItems: 'center', paddingTop: SPACING.md },
  appName: { color: COLORS.textMuted, fontSize: FONT.base, fontWeight: '700' },
  appVersion: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },
});
