import test from "node:test";
import assert from "node:assert/strict";
import { SYNC_INTERVALS, isSyncDue, nextSyncTime } from "../src/services/syncScheduler.js";

test("saatlik ve günlük sonraki çalışma zamanını hesaplar", () => {
  const now = 1_000;
  assert.equal(nextSyncTime("hourly", now), now + SYNC_INTERVALS.hourly);
  assert.equal(nextSyncTime("daily", now), now + SYNC_INTERVALS.daily);
});

test("zamanı gelen senkronizasyonu tespit eder", () => {
  assert.equal(isSyncDue(999, 1_000), true);
  assert.equal(isSyncDue(1_001, 1_000), false);
  assert.equal(isSyncDue(null, 1_000), true);
});
