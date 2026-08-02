export const SYNC_INTERVALS = {
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
};

export function nextSyncTime(frequency, from = Date.now()) {
  return from + (SYNC_INTERVALS[frequency] || SYNC_INTERVALS.hourly);
}

export function isSyncDue(nextSyncAt, now = Date.now()) {
  return !nextSyncAt || Number(nextSyncAt) <= now;
}
