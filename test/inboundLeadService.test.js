import test from "node:test";
import assert from "node:assert/strict";
import { buildInboundUrl, normalizeInboundLead } from "../src/services/inboundLeadService.js";

test("tenant ve kaynak için güvenli webhook adresi üretir", () => {
  assert.equal(buildInboundUrl("https://api.example.com/api/", "firma 1", "google_ads"), "https://api.example.com/api/v1/inbound/firma%201/google-ads");
});

test("farklı form alanlarını ortak lead modeline dönüştürür", () => {
  const lead = normalizeInboundLead("meta", { first_name: "Ayşe", last_name: "Yılmaz", phone_number: "05305056648", email_address: "a@example.com", form_name: "Meta Demo", lead_id: "m-1" });
  assert.equal(lead.name, "Ayşe Yılmaz");
  assert.equal(lead.phone, "05305056648");
  assert.equal(lead.source, "Facebook / Instagram");
  assert.equal(lead.externalLeadId, "m-1");
});
