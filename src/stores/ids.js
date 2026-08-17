let lastGeneratedId = Date.now();

export function nextLocalId() {
  lastGeneratedId = Math.max(Date.now(), lastGeneratedId + 1);
  return lastGeneratedId;
}
