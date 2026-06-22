import { downloadJson, pickJsonFile } from './pwa';

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
  progress: unknown,
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
  downloadJson(json, `fitprogress_backup_${date}.json`);
}

export async function importData(): Promise<FitProgressBackup | null> {
  const content = await pickJsonFile();
  if (!content) return null;
  return JSON.parse(content) as FitProgressBackup;
}
