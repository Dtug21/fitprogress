import { Platform } from 'react-native';

export interface FitProgressBackup {
  version: number;
  exported_at: string;
  user: unknown;
  routines: unknown;
  progress: unknown;
}

// ─── Helpers web ──────────────────────────────────────────────────────────────

function downloadJsonWeb(json: string, fileName: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function pickJsonFileWeb(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) { resolve(null); return; }
      const text = await file.text();
      resolve(text);
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

// ─── Export ───────────────────────────────────────────────────────────────────

export async function exportData(
  user: unknown,
  routines: unknown,
  progress: unknown
): Promise<void> {
  const backup: FitProgressBackup = {
    version: 1,
    exported_at: new Date().toISOString(),
    user,
    routines,
    progress,
  };

  const json = JSON.stringify(backup, null, 2);
  const date = new Date().toISOString().split('T')[0];
  const fileName = `fitprogress_backup_${date}.json`;

  if (Platform.OS === 'web') {
    downloadJsonWeb(json, fileName);
    return;
  }

  const FileSystem = await import('expo-file-system');
  const Sharing = await import('expo-sharing');

  const filePath = `${FileSystem.documentDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(filePath, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('El compartir archivos no está disponible en este dispositivo.');

  await Sharing.shareAsync(filePath, {
    mimeType: 'application/json',
    dialogTitle: 'Exportar datos de FitProgress',
    UTI: 'public.json',
  });
}

// ─── Import ───────────────────────────────────────────────────────────────────

export async function importData(): Promise<FitProgressBackup | null> {
  let content: string | null = null;

  if (Platform.OS === 'web') {
    content = await pickJsonFileWeb();
  } else {
    const DocumentPicker = await import('expo-document-picker');
    const FileSystem = await import('expo-file-system');

    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) return null;

    content = await FileSystem.readAsStringAsync(result.assets[0].uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  }

  if (!content) return null;

  const parsed = JSON.parse(content) as FitProgressBackup;
  if (parsed.version !== 1) throw new Error('Formato de backup no compatible.');

  return parsed;
}
