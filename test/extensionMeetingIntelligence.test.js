import test from "node:test";
import assert from "node:assert/strict";
import { analyzeTranscript, buildLiveAlert, detectLanguage, summarizeMeeting } from "../extension/meeting-intelligence.js";

test("eklenti konuşmaya göre dinamik satış soruları üretir", () => {
  const insights = analyzeTranscript([
    { speaker: "Müşteri", text: "Fiyat ve bütçe önemli, yönetim onayı da gerekiyor." },
    { speaker: "Satış", text: "Entegrasyon ve geçiş takvimini konuşalım." },
  ]);

  assert.ok(insights.some((item) => item.id === "price"));
  assert.ok(insights.some((item) => item.id === "authority"));
  assert.ok(insights.some((item) => item.id === "integration"));
});

test("eklenti Türkçe ve İngilizce toplantı dilini algılar", () => {
  assert.equal(detectLanguage([{ text: "Fiyat ve bütçe bizim için önemli." }]), "tr");
  assert.equal(detectLanguage([{ text: "The price and timeline are important for our team." }]), "en");
  assert.equal(analyzeTranscript([{ text: "We need an integration timeline and budget." }])[0].language, "en");
  assert.equal(analyzeTranscript([{ text: "We need a price proposal." }], "tr")[0].language, "tr");
});

test("anahtar satış sinyali olmayan son konuşma için bağlamsal öneri verir", () => {
  const insights = analyzeTranscript([{ speaker: "Müşteri", text: "Ayarları kaydettik ve buna başladık." }], "tr");
  assert.equal(insights[0].id, "context");
  assert.match(insights[0].question, /Ayarları kaydettik/);
});

test("bilgi ve müşteri talebini Meet popup bildirimi için sınıflandırır", () => {
  const caption = { speaker: "Müşteri", role: "participant", text: "Entegrasyonun nasıl çalıştığı hakkında bilgi istiyorum." };
  const alert = buildLiveAlert(caption, analyzeTranscript([caption], "tr"), "tr");
  assert.equal(alert.kind, "question");
  assert.equal(alert.title, "Bilgi talebi yakalandı");
  assert.ok(alert.message.length > 10);
});

test("eklenti toplantı özeti, aksiyonlar ve transcript oluşturur", () => {
  const segments = [
    { speaker: "Müşteri", text: "Geçiş planını gelecek hafta paylaşmanızı istiyoruz." },
    { speaker: "Satış", text: "Teknik dokümanı hazırlayıp salı günü göndereceğiz." },
  ];
  const result = summarizeMeeting(segments, analyzeTranscript(segments));

  assert.match(result.transcript, /Müşteri:/);
  assert.ok(result.actionItems.length > 0);
  assert.ok(result.wordCount > 0);
});
