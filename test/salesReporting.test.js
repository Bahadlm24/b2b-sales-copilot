import test from "node:test";
import assert from "node:assert/strict";
import { buildSalesReport } from "../src/services/salesReporting.js";

const state = {
  leads: [
    { id: 1, ownerId: 1, source: "Meta", status: "Müşteriye dönüştü", convertedCustomerId: 10, createdAt: "2026-08-01" },
    { id: 2, ownerId: 1, source: "Meta", status: "Uygun değil", createdAt: "2026-08-02" },
    { id: 3, ownerId: 2, source: "Web Form", status: "Yeni", archived: true, createdAt: "2026-08-03" },
  ],
  customers: [{ id: 10, ownerId: 1, convertedAt: "2026-08-04", archived: false }],
  meetings: [{ id: 1, ownerId: 1, meetingDate: "2026-08-04", conversationAnalysis: { overallScore: 80 } }],
  meetingJourneys: [{ id: 1, entityType: "lead", entityId: 1, ownerId: 1, status: "Olumlu", updatedAt: "2026-08-04" }],
  offers: [{ id: 1, ownerId: 1, status: "Kazanıldı", numericAmount: 100000, closedAt: "2026-08-05" }, { id: 2, ownerId: 1, status: "Beklemede", numericAmount: 50000, createdAt: "2026-08-05" }],
  users: [{ id: 1, name: "Ada", active: true }, { id: 2, name: "Can", active: true }],
};

test("satış raporu dönüşüm, data durumu ve kazancı tek kaynaktan hesaplar", () => {
  const report = buildSalesReport(state);
  assert.equal(report.totals.leads, 3);
  assert.equal(report.totals.converted, 1);
  assert.equal(report.totals.uninterested, 1);
  assert.equal(report.totals.passive, 1);
  assert.equal(report.totals.revenue, 100000);
  assert.equal(report.totals.pipeline, 50000);
  assert.equal(report.totals.averageMeetingScore, 80);
});

test("satış raporu personel, kaynak ve tarih filtresini birlikte uygular", () => {
  const report = buildSalesReport(state, { ownerId: 1, source: "Meta", from: "2026-08-01", to: "2026-08-31" });
  assert.equal(report.totals.leads, 2);
  assert.equal(report.personnel.length, 1);
  assert.equal(report.sourcePerformance[0].source, "Meta");
  assert.equal(report.totals.wonDeals, 1);
});
