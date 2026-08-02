import test from "node:test";
import assert from "node:assert/strict";
import { analyzeConversation, analyzeTranscript, buildNextMeetingPlan } from "../src/services/meetingAnalyzer.js";

test("metindeki en ilgili satış sinyallerini önceliklendirir", () => {
  const result = analyzeTranscript("Fiyat rakipten pahalı, bütçe sınırlı. Entegrasyon süresi de önemli.");

  assert.ok(result.length >= 4);
  assert.equal(result[0].id, "price");
  assert.ok(result.some((item) => item.id === "integration"));
});

test("sinyal bulunmadığında yönlendirici varsayılan sorular üretir", () => {
  const result = analyzeTranscript("Bugünkü görüşme için teşekkür ederiz.");

  assert.deepEqual(result.map((item) => item.id), ["need", "success", "next-step", "stakeholder"]);
});

test("konuşma zenginleştikçe daha çok, en fazla yedi içgörü döndürür", () => {
  const result = analyzeTranscript("Fiyat, entegrasyon, vendor lock-in, süre, yönetim onayı, güvenlik, destek, satın alma, pilot ve ROI.");

  assert.ok(result.length > 4);
  assert.ok(result.length <= 7);
});

test("boş veya tanımsız metinde güvenli varsayılanlar döndürür", () => {
  assert.equal(analyzeTranscript(undefined).length, 4);
  assert.equal(analyzeTranscript("").length, 4);
});

test("sonraki toplantı planını konuşmadaki sinyallere göre uyarlar", () => {
  const plan = buildNextMeetingPlan("Bütçe ve fiyat önemli. API entegrasyonu için yönetim onayı gerekiyor.");

  assert.ok(plan.some((item) => item.includes("geri dönüş")));
  assert.ok(plan.some((item) => item.includes("Geçiş")));
  assert.ok(plan.some((item) => item.includes("Karar verici")));
  assert.ok(plan.length <= 5);
});

test("görüşmeyi satış boyutlarına göre skorlar ve eksik riskleri gösterir", () => {
  const analysis = analyzeConversation("Müşteri: Entegrasyon bizim için önemli ama fiyat pahalı.\nSatış: Kararı kim verecek? Ne zaman canlıya geçmek istiyorsunuz?\nMüşteri: Yönetim onayından sonra gelecek hafta tekrar görüşelim.");
  assert.ok(analysis.overallScore > 50);
  assert.equal(analysis.dealHealth, "Takip gerekli");
  assert.ok(analysis.questionCount >= 2);
  assert.ok(analysis.dimensions.some((item) => item.key === "authority" && item.score > 20));
  assert.ok(Array.isArray(analysis.risks));
});

test("konuşmacı etiketlerinden satışçı konuşma oranını hesaplar", () => {
  const analysis = analyzeConversation([
    { speaker: "Temsilci", role: "sales", text: "İhtiyacınızı ve karar sürecinizi konuşalım." },
    { speaker: "Müşteri", role: "participant", text: "Ekibimizin entegrasyon sorunu var ve üç ay içinde canlıya geçmek istiyoruz." },
  ]);
  assert.ok(analysis.talkRatio > 0 && analysis.talkRatio < 100);
  assert.ok(analysis.participantWords > analysis.salesWords);
});
