import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, FONT } from '../constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Esta pantalla no existe.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Volver al inicio</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.bg,
  },
  title: { fontSize: FONT.lg, fontWeight: '600', color: COLORS.textPrimary },
  link: { marginTop: SPACING.md, paddingVertical: SPACING.md },
  linkText: { fontSize: FONT.base, color: COLORS.primary, fontWeight: '600' },
});
