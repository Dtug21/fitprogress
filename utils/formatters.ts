export function formatWeight(kg: number): string {
  return kg % 1 === 0 ? `${kg}kg` : `${kg.toFixed(1)}kg`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getDayName(dayIndex: number): string {
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  return days[dayIndex] ?? '';
}

export function getDayIndex(): number {
  // 0=Lun, 6=Dom (diferente a JS donde 0=Dom)
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}
