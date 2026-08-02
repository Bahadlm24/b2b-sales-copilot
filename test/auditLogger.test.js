import test from "node:test";
import assert from "node:assert/strict";
import { createAuditEntry } from "../src/services/auditLogger.js";

test("audit kaydı aktör, işlem, kaynak ve zaman bilgisini taşır", () => {
  const entry = createAuditEntry({
    actorId: 7,
    actorName: "Test Kullanıcısı",
    action: "lead.created",
    resource: "lead",
    resourceId: 42,
    details: { source: "Meta" },
    ipAddress: "192.0.2.10",
    userAgent: "Test Browser",
    response: { statusCode: 201, message: "Lead oluşturuldu" },
    timestamp: "2026-07-31T10:00:00.000Z",
  });

  assert.equal(entry.actor.id, 7);
  assert.equal(entry.action, "lead.created");
  assert.equal(entry.resourceId, 42);
  assert.equal(entry.timestamp, "2026-07-31T10:00:00.000Z");
  assert.deepEqual(entry.details, { source: "Meta" });
  assert.equal(entry.ipAddress, "192.0.2.10");
  assert.equal(entry.userAgent, "Test Browser");
  assert.deepEqual(entry.response, { statusCode: 201, message: "Lead oluşturuldu" });
});
