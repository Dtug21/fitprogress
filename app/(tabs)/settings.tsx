import {
  View,
  Text,
  StyleSheet,ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../stores/useUserStore';
import { useProgressStore } from '../../stores/useProgressStore';
import { useRoutineStore } from '../../stores/useRoutineStore';
import { useWorkoutStore } from '../../stores/useWorkoutStore';
import { ModeToggle } from '../../components/ui/ModeToggle';
import { Card } from '../../components/ui/Card';
import { COLORS, SPACING, FONT, RADIUS, WEIGHT, TRACKING, TEXT } from '../../constants/theme';
import { Equipment, Goal } from '../../types';
import { exportData, importData } from '../../lib/backup';
import { exportForDashboard } from '../../lib/dashboardExport';

type IconName = keyof typeof Ionicons.glyphMap;

const HOME_EQUIPMENT_LIST: { id: Equipment; label: string; icon: IconName }[] = [
  { id: 'dumbbells', label: 'Mancuernas regulables', icon: 'barbell-outline' },
  { id: 'adjustable_bench', label: 'Banco inclinable', icon: 'bed-outline' },
  { id: 'straight_barbell', label: 'Barra plana', icon: 'remove-outline' },
  { id: 'ez_bar', label: 'Barra Z (EZ)', icon: 'git-commit-outline' },
  { id: 'w_bar', label: 'Barra W', icon: 'git-commit-outline' },
  { id: 'long_bands', label: 'Bandas elásticas largas', icon: 'pulse-outline' },
  { id: 'short_bands', label: 'Mini bandas', icon: 'ellipse-outline' },
  { id: 'ab_wheel', label: 'Rueda abdominal', icon: 'disc-outline' },
  { id: 'jump_rope', label: 'Cuerda para saltar', icon: 'infinite-outline' },
  { id: 'hand_grippers', label: 'Hand grippers', icon: 'hand-left-outline' },
  { id: 'bodyweight', label: 'Peso corporal', icon: 'body-outline' },
];

const LEVEL_OPTIONS: { value: 'beginner' | 'intermediate' | 'advanced'; label: string }[] = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
];

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: 'fat_loss', label: 'Perder grasa' },
  { value: 'muscle_gain', label: 'Ganar músculo' },
  { value: 'strength', label: 'Fuerza' },
  { value: 'health', label: 'Salud' },
  { value: 'endurance', label: 'Resistencia' },
];

function SettingRow({
  icon,
  label,
  value,
  onPress,
  danger }: {
  icon: IconName;
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={19} color={danger ? COLORS.danger : COLORS.textSecondary} style={styles.settingIcon} />
      <Text style={[styles.settingLabel, danger && { color: COLORS.danger }]}>{label}</Text>
      <View style={styles.settingRight}>
        {value ? <Text style={styles.settingValue}>{value}</Text> : null}
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, setMode, setEquipment, updateProfile } = useUserStore();
  const progressStore = useProgressStore();
  const routineStore = useRoutineStore();
  const { sessions, personalRecords } = progressStore;
  const { routines } = routineStore;
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exportingDashboard, setExportingDashboard] = useState(false);

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
      'Esto eliminará todo tu historial, rutinas y PRs. Tu perfil se mantendrá. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetear',
          style: 'destructive',
          onPress: () => {
            useProgressStore.setState({
              sessions: [],
              personalRecords: {},
              achievements: useProgressStore.getState().achievements.map((a) => ({
                ...a, unlocked: false, unlocked_at: undefined })),
              streak: 0,
              bestStreak: 0,
              lastWorkoutDate: null,
              bodyWeight: [] });
            useRoutineStore.setState({ routines: [] });
            Alert.alert('Listo', 'Todos los datos han sido eliminados.');
          } },
      ]
    );
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportData(
        useUserStore.getState().profile,
        useRoutineStore.getState().routines,
        {
          sessions: progressStore.sessions,
          personalRecords: progressStore.personalRecords,
          achievements: progressStore.achievements,
          bodyWeight: progressStore.bodyWeight,
          streak: progressStore.streak,
          bestStreak: progressStore.bestStreak }
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al exportar';
      Alert.alert('Error', msg);
    } finally {
      setExporting(false);
    }
  }

  async function handleExportDashboard() {
    setExportingDashboard(true);
    try {
      await exportForDashboard({
        profile: useUserStore.getState().profile,
        routines: useRoutineStore.getState().routines,
        sessions: progressStore.sessions,
        personalRecords: progressStore.personalRecords,
        achievements: progressStore.achievements,
        bodyWeight: progressStore.bodyWeight,
        streak: progressStore.streak,
        bestStreak: progressStore.bestStreak });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al exportar';
      Alert.alert('Error', msg);
    } finally {
      setExportingDashboard(false);
    }
  }

  async function handleImport() {
    Alert.alert(
      'Importar datos',
      'Esto reemplazará tus rutinas e historial actuales con los del archivo de backup. Tu perfil no se modificará.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Importar',
          onPress: async () => {
            setImporting(true);
            try {
              const backup = await importData();
              if (!backup) return;
              if (Array.isArray(backup.routines)) {
                useRoutineStore.setState({ routines: backup.routines as never });
              }
              if (backup.progress && typeof backup.progress === 'object') {
                const p = backup.progress as Record<string, unknown>;
                useProgressStore.setState({
                  sessions: (p.sessions as never) ?? [],
                  personalRecords: (p.personalRecords as never) ?? {},
                  achievements: (p.achievements as never) ?? useProgressStore.getState().achievements,
                  bodyWeight: (p.bodyWeight as never) ?? [],
                  streak: (p.streak as number) ?? 0,
                  bestStreak: (p.bestStreak as number) ?? 0,
                  lastWorkoutDate: (p.lastWorkoutDate as string | null) ?? null });
              }
              Alert.alert('¡Importado!', 'Los datos se restauraron correctamente.');
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : 'Error al importar';
              Alert.alert('Error', msg);
            } finally {
              setImporting(false);
            }
          } },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <Text style={styles.pageTitle}>Configuración</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Banner "Mis Objetivos" */}
        <TouchableOpacity
          style={styles.profileBanner}
          onPress={() => router.push('/profile')}
          activeOpacity={0.85}
        >
          <View style={styles.profileBannerLeft}>
            <View style={styles.profileBannerIcon}>
              <Ionicons name="locate" size={22} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.profileBannerTitle}>Mi perfil y objetivos</Text>
              <Text style={styles.profileBannerSub}>
                {profile.mode === 'home' ? 'Casa' : 'Gym'} · {
                  profile.goals?.length
                    ? profile.goals.length === 1 ? '1 objetivo' : `${profile.goals.length} objetivos`
                    : 'Sin objetivos configurados'
                }
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
        </TouchableOpacity>

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

        <Text style={styles.sectionTitle}>Objetivos</Text>
        <Text style={styles.sectionSub}>Elige uno o varios. Definen tus series, reps y descansos.</Text>
        <Card padding={SPACING.sm}>
          <View style={styles.goalsWrap}>
            {GOAL_OPTIONS.map((opt) => {
              const selected = (profile.goals ?? []).includes(opt.value);
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.goalChip, selected && styles.optionBtnActive]}
                  onPress={() => {
                    const current = profile.goals ?? [];
                    const next = selected
                      ? current.filter((g) => g !== opt.value)
                      : [...current, opt.value];
                    updateProfile({ goals: next.length > 0 ? next : ['mixed'] });
                  }}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
              <Ionicons name={item.icon} size={19} color={COLORS.textSecondary} style={styles.equipIcon} />
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

        {/* Dashboard */}
        <Text style={styles.sectionTitle}>Dashboard personal</Text>
        <View style={styles.dashboardCard}>
          <View style={styles.dashboardHeader}>
            <View style={styles.dashboardIconChip}>
              <Ionicons name="bar-chart" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.dashboardHeaderText}>
              <Text style={styles.dashboardTitle}>Exportar para Dashboard</Text>
              <Text style={styles.dashboardSub}>JSON listo para conectar a tu dashboard personal</Text>
            </View>
          </View>

          {/* Preview de qué incluye */}
          <View style={styles.dashboardIncludes}>
            {[
              { icon: 'stats-chart-outline' as IconName, label: 'Resumen global (volumen, racha, PRs)' },
              { icon: 'calendar-outline' as IconName, label: 'Últimas 12 semanas semana a semana' },
              { icon: 'body-outline' as IconName, label: 'Desglose por grupo muscular' },
              { icon: 'scale-outline' as IconName, label: 'Historial de peso corporal' },
              { icon: 'trophy-outline' as IconName, label: 'Récords personales con 1RM estimado' },
            ].map((item) => (
              <View key={item.label} style={styles.includeRow}>
                <Ionicons name={item.icon} size={14} color={COLORS.textMuted} />
                <Text style={styles.includeText}>{item.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.dashboardStats}>
            <View style={styles.dashboardStat}>
              <Text style={styles.dashboardStatValue}>{sessions.length}</Text>
              <Text style={styles.dashboardStatLabel}>sesiones</Text>
            </View>
            <View style={styles.dashboardStatDivider} />
            <View style={styles.dashboardStat}>
              <Text style={styles.dashboardStatValue}>{Object.keys(progressStore.personalRecords).length}</Text>
              <Text style={styles.dashboardStatLabel}>PRs</Text>
            </View>
            <View style={styles.dashboardStatDivider} />
            <View style={styles.dashboardStat}>
              <Text style={styles.dashboardStatValue}>{progressStore.bodyWeight.length}</Text>
              <Text style={styles.dashboardStatLabel}>pesos</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.dashboardBtn, exportingDashboard && { opacity: 0.6 }]}
            onPress={handleExportDashboard}
            disabled={exportingDashboard}
            activeOpacity={0.85}
          >
            {exportingDashboard ? (
              <ActivityIndicator size="small" color={COLORS.accentText} />
            ) : (
              <Ionicons name="share-outline" size={18} color={COLORS.accentText} />
            )}
            <Text style={styles.dashboardBtnText}>
              {exportingDashboard ? 'Generando…' : 'Exportar dashboard_export.json'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.dashboardNote}>
            schema_version 1.0 · incluye sesiones completas para re-importar
          </Text>
        </View>

        {/* Datos */}
        <Text style={styles.sectionTitle}>Datos</Text>
        <Card padding={0}>
          <TouchableOpacity style={styles.settingRow} onPress={handleExport} activeOpacity={0.7} disabled={exporting}>
            <Ionicons name="share-outline" size={19} color={COLORS.textSecondary} style={styles.settingIcon} />
            <Text style={styles.settingLabel}>Exportar mis datos</Text>
            {exporting ? <ActivityIndicator size="small" color={COLORS.primary} /> : (
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            )}
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRow} onPress={handleImport} activeOpacity={0.7} disabled={importing}>
            <Ionicons name="download-outline" size={19} color={COLORS.textSecondary} style={styles.settingIcon} />
            <Text style={styles.settingLabel}>Importar backup</Text>
            {importing ? <ActivityIndicator size="small" color={COLORS.primary} /> : (
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            )}
          </TouchableOpacity>
          <View style={styles.divider} />
          <SettingRow icon="trash-outline" label="Resetear todos los datos" onPress={handleResetData} danger />
        </Card>

        {/* Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>FitProgress</Text>
          <Text style={styles.appVersion}>v1.0 — Fase 5</Text>
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
  pageTitle: { color: COLORS.textPrimary, fontSize: FONT.xxl, fontWeight: WEIGHT.semibold, letterSpacing: TRACKING.tight },

  sectionTitle: { ...TEXT.overline, marginTop: SPACING.md, marginBottom: 2 },
  sectionSub: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: -2 },

  profileRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryDim,
    alignItems: 'center',
    justifyContent: 'center' },
  avatarText: { color: COLORS.primary, fontSize: FONT.xl, fontWeight: WEIGHT.semibold },
  profileInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profileName: { color: COLORS.textPrimary, fontSize: FONT.md, fontWeight: WEIGHT.semibold },
  profileStats: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT.md,
    fontWeight: WEIGHT.semibold,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingVertical: 2 },
  saveNameBtn: { padding: 4 },

  optionsRow: { flexDirection: 'row', gap: 6 },
  goalsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  goalChip: {
    paddingHorizontal: 14,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center' },
  optionBtn: {
    flex: 1,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center' },
  optionBtnActive: { backgroundColor: COLORS.primaryDim, borderWidth: 1, borderColor: COLORS.primary },
  optionText: { color: COLORS.textMuted, fontSize: FONT.sm, fontWeight: WEIGHT.medium },
  optionTextActive: { color: COLORS.primary, fontWeight: WEIGHT.semibold },

  equipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    gap: SPACING.sm },
  equipBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  equipIcon: { width: 28, textAlign: 'center' },
  equipLabel: { flex: 1, color: COLORS.textPrimary, fontSize: FONT.base },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 16,
    gap: SPACING.sm },
  settingIcon: { width: 28, textAlign: 'center' },
  settingLabel: { flex: 1, color: COLORS.textPrimary, fontSize: FONT.base },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue: { color: COLORS.textMuted, fontSize: FONT.base },
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.md },

  dashboardCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: SPACING.md,
    gap: SPACING.sm },
  dashboardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  dashboardIconChip: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryDim, alignItems: 'center', justifyContent: 'center' },
  dashboardHeaderText: { flex: 1 },
  dashboardTitle: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: WEIGHT.semibold },
  dashboardSub: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },

  dashboardIncludes: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    padding: SPACING.sm, gap: 8 },
  includeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  includeText: { color: COLORS.textSecondary, fontSize: FONT.sm, flex: 1 },

  dashboardStats: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md, paddingVertical: SPACING.sm },
  dashboardStat: { flex: 1, alignItems: 'center' },
  dashboardStatValue: {
    color: COLORS.primary, fontSize: FONT.xl, fontWeight: WEIGHT.semibold,
    fontVariant: ['tabular-nums'] },
  dashboardStatLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  dashboardStatDivider: { width: 1, height: 32, backgroundColor: COLORS.border },

  dashboardBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14 },
  dashboardBtnText: { color: COLORS.accentText, fontSize: FONT.base, fontWeight: WEIGHT.semibold },
  dashboardNote: {
    color: COLORS.textMuted, fontSize: 11, textAlign: 'center',
    fontVariant: ['tabular-nums'] },

  appInfo: { alignItems: 'center', paddingTop: SPACING.md },
  appName: { color: COLORS.textMuted, fontSize: FONT.base, fontWeight: WEIGHT.semibold },
  appVersion: { color: COLORS.textMuted, fontSize: FONT.sm, marginTop: 2 },

  profileBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.xs },
  profileBannerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  profileBannerIcon: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryDim,
    alignItems: 'center', justifyContent: 'center' },
  profileBannerTitle: { color: COLORS.textPrimary, fontSize: FONT.md, fontWeight: WEIGHT.semibold },
  profileBannerSub: { color: COLORS.textSecondary, fontSize: FONT.sm, marginTop: 2 } });
