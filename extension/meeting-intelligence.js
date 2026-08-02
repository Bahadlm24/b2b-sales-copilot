const rules = [
  {
    id: "need",
    words: ["ihtiyaç", "sorun", "problem", "zorlan", "need", "challenge", "pain", "issue"],
    tr: { title: "İş etkisini aç", question: "Bu problemin ekibe zaman, maliyet veya gelir etkisi nedir?" },
    en: { title: "Explore business impact", question: "What is the impact of this problem on time, cost, or revenue?" }
  },
  {
    id: "price",
    words: ["fiyat", "bütçe", "pahalı", "indirim", "maliyet", "price", "budget", "expensive", "discount", "cost"],
    tr: { title: "Fiyat hassasiyeti", question: "Bütçeyi değerlendirirken toplam sahip olma maliyetinde hangi kalemler önemli?" },
    en: { title: "Price sensitivity", question: "Which total-cost-of-ownership factors matter most in your budget evaluation?" }
  },
  {
    id: "authority",
    words: ["karar", "onay", "yönetim", "müdür", "komite", "decision", "approval", "management", "manager", "committee"],
    tr: { title: "Karar süreci", question: "Son karar kimde ve onay için hangi bilgi eksik?" },
    en: { title: "Decision process", question: "Who owns the final decision, and what information is still needed for approval?" }
  },
  {
    id: "timing",
    words: ["takvim", "süre", "acil", "ne zaman", "gecik", "timeline", "deadline", "urgent", "when", "delay"],
    tr: { title: "Zamanlama", question: "Canlıya geçiş için kritik tarih ve gecikmenin etkisi nedir?" },
    en: { title: "Timeline", question: "What is the critical go-live date, and what is the impact of a delay?" }
  },
  {
    id: "integration",
    words: ["entegrasyon", "api", "veri", "geçiş", "sistem", "integration", "data", "migration", "system"],
    tr: { title: "Teknik uyum", question: "Bağlanması gereken sistemler, veri sahipleri ve kabul kriterleri neler?" },
    en: { title: "Technical fit", question: "Which systems must connect, who owns the data, and what are the acceptance criteria?" }
  },
  {
    id: "competitor",
    words: ["rakip", "alternatif", "başka firma", "karşılaştır", "competitor", "alternative", "other vendor", "compare"],
    tr: { title: "Rekabet", question: "Alternatifleri değerlendirirken en önemli üç karar kriteriniz nedir?" },
    en: { title: "Competition", question: "What are your three most important criteria when comparing alternatives?" }
  },
  {
    id: "next",
    words: ["sonraki", "tekrar", "görüşelim", "toplantı", "aksiyon", "next", "follow up", "meeting", "action"],
    tr: { title: "Sonraki adım", question: "Bir sonraki adımın sorumlusu, tarihi ve beklenen çıktısı ne olsun?" },
    en: { title: "Next step", question: "Who owns the next step, when is it due, and what outcome is expected?" }
  }
];

const englishSignals = new Set(["the", "and", "is", "are", "we", "you", "our", "your", "this", "that", "with", "for", "need", "price"]);
const turkishSignals = new Set(["ve", "bir", "bu", "için", "biz", "siz", "bizim", "sizin", "ile", "de", "da", "fiyat", "ihtiyaç"]);

export function detectLanguage(segments, preference = "auto") {
  if (preference === "tr" || preference === "en") return preference;
  const words = segments.flatMap((item) => item.text.toLocaleLowerCase("tr-TR").match(/[\p{L}]+/gu) || []);
  let tr = 0;
  let en = 0;
  for (const word of words) {
    if (turkishSignals.has(word) || /[çğıöşü]/i.test(word)) tr += 1;
    if (englishSignals.has(word)) en += 1;
  }
  return en > tr ? "en" : "tr";
}

export function analyzeTranscript(segments, preference = "auto") {
  const language = detectLanguage(segments, preference);
  const text = segments.map((item) => item.text).join(" ").toLocaleLowerCase("tr-TR");
  const matches = rules.map((rule) => ({ ...rule, score: rule.words.filter((word) => text.includes(word)).length }))
    .filter((rule) => rule.score > 0)
    .sort((a, b) => b.score - a.score);
  const suggestions = matches.length ? matches : [rules[0], rules[2], rules[6]];
  const result = suggestions.slice(0, 5).map((rule) => ({ id: rule.id, language, ...rule[language] }));
  if (segments.length && !matches.length) {
    const latest = segments.at(-1).text.replace(/\s+/g, " ").trim().slice(0, 90);
    result.unshift(language === "en"
      ? { id: "context", language, title: "Clarify the latest statement", question: `What business expectation or concern is behind “${latest}”?` }
      : { id: "context", language, title: "Son ifadeyi netleştir", question: `“${latest}” ifadesinin arkasındaki iş beklentisi veya endişe nedir?` });
  }
  return result.slice(0, 5);
}

export function summarizeMeeting(segments, suggestions, preference = "auto") {
  const language = detectLanguage(segments, preference);
  const transcript = segments.map((item) => `${item.speaker}: ${item.text}`).join("\n");
  const sentences = segments.map((item) => item.text).filter((text) => text.length > 20);
  const actionWords = /gönder|paylaş|hazırla|planla|dönüş|toplantı|aksiyon|send|share|prepare|schedule|follow up|meeting|action/i;
  const actions = [...new Set(sentences.filter((text) => actionWords.test(text)))].slice(-5);
  const highlights = [...new Set(sentences)].slice(-6);
  return {
    language,
    summary: highlights.length ? highlights.join(" ") : language === "en" ? "There is not enough transcript content to create a summary." : "Toplantı metni özet oluşturmak için yeterli değil.",
    actionItems: actions,
    discussedTopics: suggestions.map((item) => item.title),
    transcript,
    wordCount: transcript.trim() ? transcript.trim().split(/\s+/).length : 0
  };
}

export function buildLiveAlert(caption, suggestions, preference = "auto") {
  const language = detectLanguage([caption], preference);
  const text = caption.text || "";
  const asksForInformation = /\b(nedir|nasıl|neden|ne zaman|kim|bilmiyorum|açıklar|bilgi|what|how|why|when|who|don't know|explain|information)\b/i.test(text);
  const makesRequest = /\b(istiyorum|isteriz|gerekli|lazım|gönder|paylaş|hazırla|talep|want|need|please|send|share|prepare|request)\b/i.test(text);
  const suggestion = suggestions[0];
  if (!suggestion) return null;
  const title = caption.role === "sales"
    ? language === "en" ? "Sales rehearsal" : "Satış provası"
    : language === "en"
    ? asksForInformation ? "Information request detected" : makesRequest ? "Customer request detected" : "Live sales insight"
    : asksForInformation ? "Bilgi talebi yakalandı" : makesRequest ? "Müşteri talebi yakalandı" : "Canlı satış içgörüsü";
  return {
    language,
    title,
    message: suggestion.question,
    speaker: caption.speaker,
    speakerRole: caption.role || "unknown",
    sourceText: text.slice(0, 140),
    kind: caption.role === "sales" ? "rehearsal" : asksForInformation ? "question" : makesRequest ? "request" : "insight"
  };
}
