const insightCopy = {
  tr: {
    price: { eyebrow: "İTİRAZ", title: "Fiyat hassasiyeti", text: "İndirime geçmeden önce alternatiflerin toplam sahip olma maliyetini ve bütçe sınırını netleştir." },
    integration: { eyebrow: "TEKNİK İHTİYAÇ", title: "Entegrasyon ve geçiş", text: "Mevcut sistemleri, veri sahiplerini ve kabul edilebilir geçiş süresini somutlaştır." },
    "lock-in": { eyebrow: "TERİM YAKALANDI", title: "Vendor lock-in", text: "Çıkış planını, veri taşınabilirliğini ve açık entegrasyon seçeneklerini net biçimde anlat." },
    timing: { eyebrow: "RİSK", title: "Zamanlama baskısı", text: "Kritik tarihi ve gecikmenin iş etkisini öğren; ardından aşamalı devreye alma planı öner." },
    authority: { eyebrow: "ŞİMDİ SOR", title: "Karar sürecini aç", text: "Bu kararı kimler değerlendirecek ve son onay için hangi bilgi eksik?" },
    security: { eyebrow: "ŞİMDİ SOR", title: "Güvenlik kriterini netleştir", text: "Güvenlik değerlendirmesinde geçmeniz gereken zorunlu kontroller ve standartlar neler?" },
    competitor: { eyebrow: "REKABET SİNYALİ", title: "Rakip karşılaştırması", text: "Rakibin adından önce müşterinin hangi üç kriterle karşılaştırma yaptığını netleştir." },
    roi: { eyebrow: "ŞİMDİ SOR", title: "Yatırım geri dönüşünü ölç", text: "Bu yatırımın kendini hangi sürede ve hangi finansal etkiyle karşılaması bekleniyor?" },
    support: { eyebrow: "BEKLENTİ", title: "Destek ve hizmet seviyesi", text: "Beklenen destek saatlerini, yanıt süresini ve eğitim kapsamını yazılı başarı kriterine dönüştür." },
    implementation: { eyebrow: "ŞİMDİ SOR", title: "Uygulama planını somutlaştır", text: "Pilot kapsamı, sorumlular ve ilk canlı kullanım tarihi için ortak bir plan oluşturun." },
    procurement: { eyebrow: "SÜREÇ RİSKİ", title: "Satın alma adımları", text: "Teknik onaydan imzaya kadar kalan satın alma adımlarını ve sahiplerini çıkar." },
    need: { eyebrow: "ŞİMDİ SOR", title: "İş etkisini ölç", text: "Mevcut durumun ekibe aylık zaman veya gelir maliyeti nedir?" },
    success: { eyebrow: "ŞİMDİ SOR", title: "Başarı kriterini belirle", text: "İlk 90 günün sonunda hangi üç sonuç bu yatırımı başarılı gösterecek?" },
    "next-step": { eyebrow: "SONRAKİ ADIM", title: "Taahhüt al", text: "Görüşmeyi tarih, sorumlu kişi ve beklenen çıktısı belli tek bir sonraki adımla kapat." },
    stakeholder: { eyebrow: "SONRAKİ TOPLANTI", title: "Paydaşları tamamla", text: "Bir sonraki görüşmeye teknik, finansal ve nihai karar taraflarından kimlerin katılması gerektiğini belirle." },
    evidence: { eyebrow: "HAZIRLIK", title: "Kanıtla ilerle", text: "Bir sonraki toplantıya müşterinin sektöründen kısa bir başarı örneği ve ölçülebilir sonuç getir." },
  },
  en: {
    price: { eyebrow: "OBJECTION", title: "Price sensitivity", text: "Clarify total cost of ownership and the budget ceiling before offering a discount." },
    integration: { eyebrow: "TECHNICAL NEED", title: "Integration and migration", text: "Make current systems, data owners and an acceptable migration window concrete." },
    "lock-in": { eyebrow: "TERM DETECTED", title: "Vendor lock-in", text: "Explain the exit plan, data portability and open integration options clearly." },
    timing: { eyebrow: "RISK", title: "Timing pressure", text: "Learn the critical date and the business impact of delay, then propose a phased go-live." },
    authority: { eyebrow: "ASK NOW", title: "Open the decision process", text: "Who will evaluate this decision, and what information is still missing for final approval?" },
    security: { eyebrow: "ASK NOW", title: "Clarify security criteria", text: "Which mandatory controls and standards must you pass in the security review?" },
    competitor: { eyebrow: "COMPETITIVE SIGNAL", title: "Competitor comparison", text: "Before naming a competitor, clarify the three criteria the customer is using to compare." },
    roi: { eyebrow: "ASK NOW", title: "Measure return on investment", text: "In what timeframe and with what financial impact is this investment expected to pay back?" },
    support: { eyebrow: "EXPECTATION", title: "Support and service level", text: "Turn expected support hours, response time and training scope into written success criteria." },
    implementation: { eyebrow: "ASK NOW", title: "Make the rollout plan concrete", text: "Agree a shared plan for pilot scope, owners and the first live-use date." },
    procurement: { eyebrow: "PROCESS RISK", title: "Procurement steps", text: "Map the remaining procurement steps and owners from technical approval to signature." },
    need: { eyebrow: "ASK NOW", title: "Measure business impact", text: "What is the monthly time or revenue cost of the current situation for the team?" },
    success: { eyebrow: "ASK NOW", title: "Define success criteria", text: "Which three outcomes after the first 90 days will make this investment a success?" },
    "next-step": { eyebrow: "NEXT STEP", title: "Get a commitment", text: "Close the meeting with one next step that has a date, owner and expected output." },
    stakeholder: { eyebrow: "NEXT MEETING", title: "Complete the stakeholders", text: "Decide who from technical, finance and final-decision sides should join the next meeting." },
    evidence: { eyebrow: "PREP", title: "Lead with proof", text: "Bring a short success story from the customer's industry and a measurable result to the next meeting." },
  },
};

const rules = [
  { id: "price", type: "objection", keywords: ["fiyat", "pahalı", "bütçe", "indirim", "maliyet", "rakip", "price", "expensive", "budget", "discount", "cost"] },
  { id: "integration", type: "term", keywords: ["entegrasyon", "geçiş", "api", "sistem", "uyum", "veri aktarımı", "integration", "migration", "system"] },
  { id: "lock-in", type: "term", keywords: ["vendor lock-in", "bağımlı", "bağımlılık", "tedarikçiye bağlı", "lock-in"] },
  { id: "timing", type: "objection", keywords: ["acil", "süre", "takvim", "gecikme", "ne zaman", "yetiş", "deadline", "timeline", "urgent"] },
  { id: "authority", type: "question", keywords: ["yönetim", "onay", "karar", "müdür", "direktör", "komite", "management", "approval", "decision", "director", "committee"] },
  { id: "security", type: "question", keywords: ["güvenlik", "kvkk", "veri", "yetki", "erişim", "sertifika", "security", "gdpr", "access", "certificate"] },
  { id: "competitor", type: "objection", keywords: ["rakip", "alternatif", "diğer firma", "başka ürün", "karşılaştır", "competitor", "alternative", "another vendor"] },
  { id: "roi", type: "question", keywords: ["geri dönüş", "roi", "verim", "kazanç", "tasarruf", "gelir", "return", "payback", "savings"] },
  { id: "support", type: "term", keywords: ["destek", "sla", "hizmet", "eğitim", "danışman", "bakım", "support", "training", "maintenance"] },
  { id: "implementation", type: "question", keywords: ["kurulum", "uygulama", "devreye", "proje", "faz", "pilot", "implementation", "rollout", "go-live"] },
  { id: "procurement", type: "objection", keywords: ["satın alma", "sözleşme", "hukuk", "ihale", "tedarik", "prosedür", "procurement", "contract", "legal"] },
];

const fallbackIds = ["need", "success", "next-step", "stakeholder", "evidence"];

function lang(language) {
  return language === "en" ? "en" : "tr";
}

function localizeInsight(id, type, language) {
  const pack = insightCopy[lang(language)][id] || insightCopy.tr[id];
  return { id, type, ...pack };
}

export function analyzeTranscript(transcript, language = "tr") {
  const normalized = String(transcript ?? "").toLocaleLowerCase("tr-TR");
  const matches = rules
    .map((rule) => ({
      ...localizeInsight(rule.id, rule.type, language),
      relevance: rule.keywords.reduce(
        (score, keyword) => score + (normalized.includes(keyword) ? 1 : 0),
        0,
      ),
    }))
    .filter((rule) => rule.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance);

  const targetCount = Math.min(7, Math.max(4, matches.length + 2));
  const insights = [...matches];
  const fallbacks = fallbackIds.map((id) => localizeInsight(id, id === "next-step" ? "objection" : id === "evidence" ? "term" : "question", language));
  for (const fallback of fallbacks) {
    if (insights.length >= targetCount) break;
    if (!insights.some((item) => item.id === fallback.id)) insights.push(fallback);
  }

  return insights.slice(0, 7);
}

const nextPlanCopy = {
  tr: {
    price: "Fiyat konuşmasına toplam sahip olma maliyeti ve beklenen geri dönüş hesabıyla hazırlan.",
    integration: "Geçiş adımlarını, veri taşınabilirliğini ve ilk 90 günlük planı tek sayfada göster.",
    authority: "Karar verici ve satın alma sorumlusunu toplantıya dahil et; kalan onay adımlarını netleştir.",
    competitor: "Rakip özellik listesi yerine müşterinin karar kriterlerine göre kısa bir karşılaştırma hazırla.",
    security: "Güvenlik, KVKK ve erişim kontrolleri için teknik doğrulama dokümanını yanında bulundur.",
    support: "Destek kapsamı, SLA ve eğitim planını ölçülebilir taahhütlerle sun.",
    timing: "Kritik tarihten geriye doğru çalışan fazlı bir devreye alma takvimi öner.",
    close: "Toplantıyı sorumlusu ve tarihi belli tek bir sonraki adımla kapat.",
  },
  en: {
    price: "Prepare the price conversation with total cost of ownership and the expected return calculation.",
    integration: "Show migration steps, data portability and the first 90-day plan on a single page.",
    authority: "Bring the decision maker and procurement owner into the meeting; clarify remaining approval steps.",
    competitor: "Prepare a short comparison against the customer's decision criteria instead of a competitor feature list.",
    security: "Bring the technical validation document for security, privacy and access controls.",
    support: "Present support scope, SLA and training as measurable commitments.",
    timing: "Propose a phased go-live calendar working backwards from the critical date.",
    close: "Close the meeting with one next step that has an owner and a date.",
  },
};

export function buildNextMeetingPlan(transcript, insights = analyzeTranscript(transcript), language = "tr") {
  const ids = new Set(insights.map((item) => item.id));
  const copy = nextPlanCopy[lang(language)];
  const plan = [];
  if (ids.has("price") || ids.has("roi")) plan.push(copy.price);
  if (ids.has("integration") || ids.has("implementation") || ids.has("lock-in")) plan.push(copy.integration);
  if (ids.has("authority") || ids.has("procurement")) plan.push(copy.authority);
  if (ids.has("competitor")) plan.push(copy.competitor);
  if (ids.has("security")) plan.push(copy.security);
  if (ids.has("support")) plan.push(copy.support);
  if (ids.has("timing")) plan.push(copy.timing);
  plan.push(copy.close);
  return [...new Set(plan)].slice(0, 5);
}

const scoreSignals = {
  need: ["ihtiyaç", "sorun", "problem", "zorluk", "hedef", "öncelik", "pain", "need"],
  budget: ["bütçe", "fiyat", "maliyet", "indirim", "yatırım", "roi", "budget", "price"],
  authority: ["karar", "onay", "yönetim", "müdür", "direktör", "komite", "yetkili", "decision"],
  timing: ["tarih", "takvim", "ne zaman", "süre", "acil", "canlıya", "deadline", "timeline"],
  nextStep: ["sonraki adım", "tekrar görüş", "toplantı plan", "gönderece", "dönece", "takip", "next step"],
  competition: ["rakip", "alternatif", "başka ürün", "karşılaştır", "competitor"],
};

function countSignals(text, words) {
  return words.reduce((total, word) => total + (text.includes(word) ? 1 : 0), 0);
}

function normalizeSegments(input, language) {
  const speakerFallback = language === "en" ? "Speaker" : "Konuşmacı";
  if (Array.isArray(input)) return input.map((item) => ({ speaker: item.speaker || speakerFallback, role: item.role || "unknown", text: String(item.text || "") })).filter((item) => item.text.trim());
  return String(input || "").split(/\n+/).map((line) => {
    const match = line.match(/^([^:]{1,40}):\s*(.+)$/);
    return match ? { speaker: match[1].trim(), role: /^(siz|satış|sales|temsilci)/i.test(match[1]) ? "sales" : "participant", text: match[2].trim() } : { speaker: speakerFallback, role: "unknown", text: line.trim() };
  }).filter((item) => item.text);
}

const conversationCopy = {
  tr: {
    discovery: "İhtiyaç keşfi",
    budget: "Bütçe ve değer",
    authority: "Karar süreci",
    timing: "Zamanlama",
    nextStep: "Sonraki adım",
    objections: "İtiraz yönetimi",
    riskAuthority: "Nihai karar verici ve onay süreci netleşmedi.",
    riskBudget: "Bütçe veya yatırım değerlendirme kriteri konuşulmadı.",
    riskTiming: "Karar ve canlıya geçiş tarihi belirlenmedi.",
    riskNext: "Tarihi ve sorumlusu belli sonraki adım alınmadı.",
    riskTalk: (ratio) => `Satışçı konuşma oranı %${ratio}; müşteriye daha fazla alan açılmalı.`,
    strength: (label) => `${label} güçlü işlendi.`,
    commitment: "Müşteriden ilerleme veya aksiyon sinyali alındı.",
    strong: "Güçlü",
    watch: "Takip gerekli",
    risk: "Riskli",
  },
  en: {
    discovery: "Needs discovery",
    budget: "Budget and value",
    authority: "Decision process",
    timing: "Timing",
    nextStep: "Next step",
    objections: "Objection handling",
    riskAuthority: "The final decision maker and approval process are still unclear.",
    riskBudget: "Budget or investment criteria were not discussed.",
    riskTiming: "Decision and go-live dates were not set.",
    riskNext: "No next step with a date and owner was captured.",
    riskTalk: (ratio) => `Rep talk ratio is ${ratio}%; give the customer more room to speak.`,
    strength: (label) => `${label} was handled strongly.`,
    commitment: "A progress or action signal was received from the customer.",
    strong: "Strong",
    watch: "Needs follow-up",
    risk: "At risk",
  },
};

export function analyzeConversation(input, language = "tr") {
  const copy = conversationCopy[lang(language)];
  const segments = normalizeSegments(input, language);
  const transcript = segments.map((item) => item.text).join(" ");
  const normalized = transcript.toLocaleLowerCase("tr-TR");
  const signalCounts = Object.fromEntries(Object.entries(scoreSignals).map(([key, words]) => [key, countSignals(normalized, words)]));
  const questionCount = (transcript.match(/\?/g) || []).length + (normalized.match(/\b(ne|neden|nasıl|hangi|kim|ne zaman|kaç|how|why|what|who|when)\b/g) || []).length;
  const commitmentCount = countSignals(normalized, ["anlaştık", "uygun", "planlayalım", "gönderin", "başlayalım", "onay", "sözleşme", "agreed", "let's plan", "send us"]);
  const objectionCount = countSignals(normalized, ["pahalı", "ama", "endişe", "risk", "istemiyoruz", "uygun değil", "rakip", "sorun", "expensive", "concern", "competitor"]);
  const salesWords = segments.filter((item) => item.role === "sales").reduce((sum, item) => sum + item.text.split(/\s+/).length, 0);
  const participantWords = segments.filter((item) => item.role === "participant").reduce((sum, item) => sum + item.text.split(/\s+/).length, 0);
  const attributedWords = salesWords + participantWords;
  const talkRatio = attributedWords ? Math.round(salesWords / attributedWords * 100) : null;
  const dimensions = [
    { key: "discovery", label: copy.discovery, score: Math.min(100, 25 + signalCounts.need * 22 + Math.min(questionCount, 4) * 8) },
    { key: "budget", label: copy.budget, score: Math.min(100, 20 + signalCounts.budget * 24) },
    { key: "authority", label: copy.authority, score: Math.min(100, 20 + signalCounts.authority * 26) },
    { key: "timing", label: copy.timing, score: Math.min(100, 20 + signalCounts.timing * 26) },
    { key: "nextStep", label: copy.nextStep, score: Math.min(100, 20 + signalCounts.nextStep * 28 + commitmentCount * 10) },
    { key: "objections", label: copy.objections, score: objectionCount ? Math.min(100, 38 + signalCounts.budget * 10 + signalCounts.competition * 12) : 55 },
  ];
  const overallScore = Math.round(dimensions.reduce((sum, item) => sum + item.score, 0) / dimensions.length);
  const risks = [];
  if (!signalCounts.authority) risks.push(copy.riskAuthority);
  if (!signalCounts.budget) risks.push(copy.riskBudget);
  if (!signalCounts.timing) risks.push(copy.riskTiming);
  if (!signalCounts.nextStep) risks.push(copy.riskNext);
  if (talkRatio !== null && talkRatio > 65) risks.push(copy.riskTalk(talkRatio));
  const strengths = dimensions.filter((item) => item.score >= 65).map((item) => copy.strength(item.label));
  if (commitmentCount) strengths.push(copy.commitment);
  const dealHealth = overallScore >= 75 ? copy.strong : overallScore >= 55 ? copy.watch : copy.risk;
  return {
    overallScore, dealHealth, dimensions, talkRatio, salesWords, participantWords,
    questionCount, objectionCount, commitmentCount, risks, strengths,
    summary: `${transcript.split(/[.!?]+/).filter(Boolean).slice(0, 2).join(". ").trim()}${transcript ? "." : ""}`,
  };
}
