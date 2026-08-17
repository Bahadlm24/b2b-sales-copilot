export const STORAGE_KEY = "sales-copilot-state-v1";

const PERSISTED_KEYS = [
  "tasks",
  "customers",
  "meetings",
  "users",
  "currentUserId",
  "mailOutbox",
  "leads",
  "departments",
  "teams",
  "roleDefinitions",
  "auditLogs",
  "syncSettings",
  "activities",
  "offers",
  "meetingJourneys",
  "organization",
  "productUpdates",
  "readProductUpdates",
  "inboundSettings",
  "liveMeetingSessions",
];

export function loadPersistedState() {
  if (typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export function savePersistedState(state) {
  if (typeof localStorage === "undefined") return;
  const snapshot = {};
  for (const key of PERSISTED_KEYS) snapshot[key] = state[key];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}
