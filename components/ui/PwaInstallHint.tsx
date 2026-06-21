import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACING, RADIUS } from '../../constants/theme';

const DISMISS_KEY = 'fitprogress-pwa-hint-dismissed';

function isStandaloneWeb(): boolean {
  if (typeof window === 'undefined') return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    nav.standalone === true
  );
}

function isIosSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
}

export function PwaInstallHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (isStandaloneWeb()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      // ignore
    }
    setVisible(true);
  }, []);

  if (!visible) return null;

  const ios = isIosSafari();

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="phone-portrait-outline" size={20} color={COLORS.primary} />
          <Text style={styles.title}>Modo app nativa</Text>
          <TouchableOpacity
            onPress={() => {
              setVisible(false);
              try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
        <Text style={styles.body}>
          {ios
            ? 'Toca Compartir en Safari → "Añadir a pantalla de inicio". Así se ocultan la barra de URL y los botones del navegador.'
            : 'Instala FitProgress en tu pantalla de inicio para usarla a pantalla completa, sin barra del navegador.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 88,
    paddingHorizontal: SPACING.md,
    zIndex: 9999,
  },
  card: {
    backgroundColor: COLORS.cardElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    padding: SPACING.md,
    gap: SPACING.sm,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT.base,
    fontWeight: '700',
  },
  body: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    lineHeight: 20,
  },
});
