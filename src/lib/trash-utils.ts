export function daysUntilPurge(deletedAt: string | null) {
  if (!deletedAt) return 0;
  const deleted = new Date(deletedAt).getTime();
  const expires = deleted + 30 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((expires - Date.now()) / (24 * 60 * 60 * 1000)));
}
