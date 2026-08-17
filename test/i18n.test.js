import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { formatStatus, setLocale, t } from "../src/i18n/localeStore.js";
import { analyzeTranscript, buildNextMeetingPlan } from "../src/services/meetingAnalyzer.js";

afterEach(() => setLocale("tr"));

test("varsayılan dil Türkçe kullanıcı metinleri üretir", () => {
  setLocale("tr");
  assert.equal(t("nav.overview"), "Genel Bakış");
  assert.equal(formatStatus("Kazanıldı"), "Kazanıldı");
  assert.equal(t("store.unknownCustomer"), "Bilinmeyen müşteri");
});

test("İngilizce dilinde menü ve durum etiketlerini çevirir", () => {
  setLocale("en");
  assert.equal(t("nav.overview"), "Overview");
  assert.equal(formatStatus("Kazanıldı"), "Won");
  assert.equal(formatStatus("Yeni"), "New");
  assert.equal(t("store.unknownCustomer"), "Unknown customer");
  assert.equal(t("login.submit"), "Sign in");
});

test("toplantı analizi İngilizce kopya üretebilir", () => {
  const insights = analyzeTranscript("The price is expensive and budget is limited. Integration timeline matters.", "en");
  assert.equal(insights[0].id, "price");
  assert.equal(insights[0].title, "Price sensitivity");
  const plan = buildNextMeetingPlan("Price and budget matter. Management approval is required for API integration.", insights, "en");
  assert.ok(plan.some((item) => /total cost of ownership|return/i.test(item)));
});
