export function changeDetails(before, after) {
  const changedFields = Object.keys(after).filter(
    (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]),
  );
  return { changedFields, before, after };
}
