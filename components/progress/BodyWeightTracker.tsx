import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { LineChart } from 'react-native-chart-kit';
import { useProgressStore, BodyWeightEntry } from '../../stores/useProgressStore';
import { COLORS, FONT, SPACING, RADIUS } from '../../constants/theme';
import { Card } from '../ui/Card';

const SCREEN_W = Dimensions.get('window').width;

export function BodyWeightTracker() {
  const { bodyWeight, addBodyWeight } = useProgressStore();
  const [inputValue, setInputValue] = useState('');

  function handleAdd() {
    const weight = parseFloat(inputValue.replace(',', '.'));
    if (isNaN(weight) || weight < 20 || weight > 300) {
      Alert.alert('Peso inválido', 'Ingresa un peso entre 20 y 300 kg.');
      return;
    }
    addBodyWeight({
      date: new Date().toISOString().split('T')[0],
      weight_kg: weight,
    });
    setInputValue('');
  }

  const last10 = bodyWeight.slice(-10);
  const chartWidth = Math.min(SCREEN_W - SPACING.lg * 2 - SPACING.md * 2, 560);
  const latest = bodyWeight[bodyWeight.length - 1];
  const prev = bodyWeight[bodyWeight.length - 2];
  const diff = latest && prev ? latest.weight_kg - prev.weight_kg : null;

  return (
    <Card padding={SPACING.md}>
      <View style={styles.header}>
        <Text style={styles.title}>Peso corporal</Text>
        {latest && (
          <View style={styles.latestRow}>
            <Text style={styles.latestWeight}>{latest.weight_kg} kg</Text>
            {diff !== null && (
              <Text style={[styles.diff, { color: diff < 0 ? COLORS.success : diff > 0 ? COLORS.danger : COLORS.textMuted }]}>
                {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
              </Text>
            )}
          </View>
        )}
      </View>

      {last10.length >= 2 ? (
        <LineChart
          data={{
            labels: last10.map((e) => {
              const d = new Date(e.date);
              return `${d.getDate()}/${d.getMonth() + 1}`;
            }),
            datasets: [{ data: last10.map((e) => e.weight_kg), strokeWidth: 2 }],
          }}
          width={chartWidth}
          height={140}
          yAxisSuffix="kg"
          chartConfig={{
            backgroundColor: COLORS.card,
            backgroundGradientFrom: COLORS.card,
            backgroundGradientTo: COLORS.card,
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
            labelColor: () => COLORS.textMuted,
            propsForDots: { r: '3', stroke: COLORS.success },
            propsForLabels: { fontSize: 9 },
          }}
          bezier
          style={{ borderRadius: 8, marginVertical: SPACING.sm }}
          withInnerLines={false}
          withOuterLines={false}
        />
      ) : (
        <Text style={styles.hint}>Agrega al menos 2 registros para ver el gráfico</Text>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="Ej: 78.5"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="decimal-pad"
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />
        <Text style={styles.inputSuffix}>kg</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>Registrar</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  title: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '700' },
  latestRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  latestWeight: { color: COLORS.success, fontSize: FONT.lg, fontWeight: '800' },
  diff: { fontSize: FONT.sm, fontWeight: '600' },
  hint: { color: COLORS.textMuted, fontSize: FONT.sm, textAlign: 'center', paddingVertical: SPACING.md },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md,
    fontSize: FONT.md,
  },
  inputSuffix: { color: COLORS.textMuted, fontSize: FONT.base },
  addBtn: {
    height: 44,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#000', fontSize: FONT.base, fontWeight: '700' },
});
