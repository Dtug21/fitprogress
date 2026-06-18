import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

export interface FitProgressBackup {
  version: number;
  exported_at: string;
  user: unknown;
  routines: unknown;
  progress: unknown;
}

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
  const filePath = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('El compartir archivos no está disponible en este dispositivo.');
  }

  await Sharing.shareAsync(filePath, {
    mimeType: 'application/json',
    dialogTitle: 'Exportar datos de FitProgress',
    UTI: 'public.json',
  });
}

export async function importData(): Promise<FitProgressBackup | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const uri = result.assets[0].uri;
  const content = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const parsed = JSON.parse(content) as FitProgressBackup;
  if (parsed.version !== 1) {
    throw new Error('Formato de backup no compatible.');
  }

  return parsed;
}
