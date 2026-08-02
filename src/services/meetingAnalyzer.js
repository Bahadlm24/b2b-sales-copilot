const rules = [
  {
    id: "price",
    type: "objection",
    eyebrow: "İTİRAZ",
    title: "Fiyat hassasiyeti",
    keywords: ["fiyat", "pahalı", "bütçe", "indirim", "maliyet", "rakip"],
    text: "İndirime geçmeden önce alternatiflerin toplam sahip olma maliyetini ve bütçe sınırını netleştir.",
  },
  {
    id: "integration",
    type: "term",
    eyebrow: "TEKNİK İHTİYAÇ",
    title: "Entegrasyon ve geçiş",
    keywords: ["entegrasyon", "geçiş", "api", "sistem", "uyum", "veri aktarımı"],
    text: "Mevcut sistemleri, veri sahiplerini ve kabul edilebilir geçiş süresini somutlaştır.",
  },
  {
    id: "lock-in",
    type: "term",
    eyebrow: "TERİM YAKALANDI",
    title: "Vendor lock-in",
    keywords: ["vendor lock-in", "bağımlı", "bağımlılık", "tedarikçiye bağlı"],
    text: "Çıkış planını, veri taşınabilirliğini ve açık entegrasyon seçeneklerini net biçimde anlat.",
  },
  {
    id: "timing",
    type: "objection",
    eyebrow: "RİSK",
    title: "Zamanlama baskısı",
    keywords: ["acil", "süre", "takvim", "gecikme", "ne zaman", "yetiş"],
    text: "Kritik tarihi ve gecikmenin iş etkisini öğren; ardından aşamalı devreye alma planı öner.",
  },
  {
    id: "authority",
    type: "question",
    eyebrow: "ŞİMDİ SOR",
    title: "Karar sürecini aç",
    keywords: ["yönetim", "onay", "karar", "müdür", "direktör", "komite"],
    text: "Bu kararı kimler değerlendirecek ve son onay için hangi bilgi eksik?",
  },
  {
    id: "security",
    type: "question",
    eyebrow: "ŞİMDİ SOR",
    title: "Güvenlik kriterini netleştir",
    keywords: ["güvenlik", "kvkk", "veri", "yetki", "erişim", "sertifika"],
    text: "Güvenlik değerlendirmesinde geçmeniz gereken zorunlu kontroller ve standartlar neler?",
  },
  {
    id: "competitor",
    type: "objection",
    eyebrow: "REKABET SİNYALİ",
    title: "Rakip karşılaştırması",
    keywords: ["rakip", "alternatif", "diğer firma", "başka ürün", "karşılaştır"],
    text: "Rakibin adından önce müşterinin hangi üç kriterle karşılaştırma yaptığını netleştir.",
  },
  {
    id: "roi",
    type: "question",
    eyebrow: "ŞİMDİ SOR",
    title: "Yatırım geri dönüşünü ölç",
    keywords: ["geri dönüş", "roi", "verim", "kazanç", "tasarruf", "gelir"],
    text: "Bu yatırımın kendini hangi sürede ve hangi finansal etkiyle karşılaması bekleniyor?",
  },
  {
    id: "support",
    type: "term",
    eyebrow: "BEKLENTİ",
    title: "Destek ve hizmet seviyesi",
    keywords: ["destek", "sla", "hizmet", "eğitim", "danışman", "bakım"],
    text: "Beklenen destek saatlerini, yanıt süresini ve eğitim kapsamını yazılı başarı kriterine dönüştür.",
  },
  {
    id: "implementation",
    type: "question",
    eyebrow: "ŞİMDİ SOR",
    title: "Uygulama planını somutlaştır",
    keywords: ["kurulum", "uygulama", "devreye", "proje", "faz", "pilot"],
    text: "Pilot kapsamı, sorumlular ve ilk canlı kullanım tarihi için ortak bir plan oluşturun.",
  },
  {
    id: "procurement",
    type: "objection",
    eyebrow: "SÜREÇ RİSKİ",
    title: "Satın alma adımları",
    keywords: ["satın alma", "sözleşme", "hukuk", "ihale", "tedarik", "prosedür"],
    text: "Teknik onaydan imzaya kadar kalan satın alma adımlarını ve sahiplerini çıkar.",
  },
];

const fallbackInsights = [
  {
    id: "need",
    type: "question",
    eyebrow: "ŞİMDİ SOR",
    title: "İş etkisini ölç",
    text: "Mevcut durumun ekibe aylık zaman veya gelir maliyeti nedir?",
  },
  {
    id: "success",
    type: "question",
    eyebrow: "ŞİMDİ SOR",
    title: "Başarı kriterini belirle",
    text: "İlk 90 günün sonunda hangi üç sonuç bu yatırımı başarılı gösterecek?",
  },
  {
    id: "next-step",
    type: "objection",
    eyebrow: "SONRAKİ ADIM",
    title: "Taahhüt al",
    text: "Görüşmeyi tarih, sorumlu kişi ve beklenen çıktısı belli tek bir sonraki adımla kapat.",
  },
  {
    id: "stakeholder",
    type: "question",
    eyebrow: "SONRAKİ TOPLANTI",
    title: "Paydaşları tamamla",
    text: "Bir sonraki görüşmeye teknik, finansal ve nihai karar taraflarından kimlerin katılması gerektiğini belirle.",
  },
  {
    id: "evidence",
    type: "term",
    eyebrow: "HAZIRLIK",
    title: "Kanıtla ilerle",
    text: "Bir sonraki toplantıya müşterinin sektöründen kısa bir başarı örneği ve ölçülebilir sonuç getir.",
  },
];

export function analyzeTranscript(transcript) {
  const normalized = String(transcript ?? "").toLocaleLowerCase("tr-TR");
  const matches = rules
    .map((rule) => ({
      ...rule,
      relevance: rule.keywords.reduce(
        (score, keyword) => score + (normalized.includes(keyword) ? 1 : 0),
        0,
      ),
    }))
    .filter((rule) => rule.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance);

  const targetCount = Math.min(7, Math.max(4, matches.length + 2));
  const insights = [...matches];
  for (const fallback of fallbackInsights) {
    if (insights.length >= targetCount) break;
    if (!insights.some((item) => item.id === fallback.id)) insights.push(fallback);
  }

  return insights.slice(0, 7);
}

export function buildNextMeetingPlan(transcript, insights = analyzeTranscript(transcript)) {
  const ids = new Set(insights.map((item) => item.id));
  const plan = [];
  if (ids.has("price") || ids.has("roi")) plan.push("Fiyat konuşmasına toplam sahip olma maliyeti ve beklenen geri dönüş hesabıyla hazırlan.");
  if (ids.has("integration") || ids.has("implementation") || ids.has("lock-in")) plan.push("Geçiş adımlarını, veri taşınabilirliğini ve ilk 90 günlük planı tek sayfada göster.");
  if (ids.has("authority") || ids.has("procurement")) plan.push("Karar verici ve satın alma sorumlusunu toplantıya dahil et; kalan onay adımlarını netleştir.");
  if (ids.has("competitor")) plan.push("Rakip özellik listesi yerine müşterinin karar kriterlerine göre kısa bir karşılaştırma hazırla.");
  if (ids.has("security")) plan.push("Güvenlik, KVKK ve erişim kontrolleri için teknik doğrulama dokümanını yanında bulundur.");
  if (ids.has("support")) plan.push("Destek kapsamı, SLA ve eğitim planını ölçülebilir taahhütlerle sun.");
  if (ids.has("timing")) plan.push("Kritik tarihten geriye doğru çalışan fazlı bir devreye alma takvimi öner.");
  plan.push("Toplantıyı sorumlusu ve tarihi belli tek bir sonraki adımla kapat.");
  return [...new Set(plan)].slice(0, 5);
}
