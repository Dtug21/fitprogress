import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function RoutinesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.emoji}>📋</Text>
        <Text style={styles.title}>Rutinas</Text>
        <Text style={styles.sub}>Mis rutinas — Fase 2</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '700', marginBottom: 8 },
  sub: { color: '#6B7280', fontSize: 14 },
});
