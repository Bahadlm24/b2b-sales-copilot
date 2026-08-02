export const customers = [
  { id: 1, name: "Atlas Endüstri A.Ş.", initials: "AE", contact: "Mert Yalçın", role: "Satın Alma Direktörü", stage: "Teklif değerlendiriliyor", score: 74, lastContact: "28 Temmuz 2026", lastContactDate: "2026-07-28", sector: "Üretim", city: "İstanbul", phone: "+90 212 555 14 20", email: "mert@atlasendustri.com", revenue: "₺1.525.000" },
  { id: 2, name: "Nova Lojistik", initials: "NL", contact: "Selin Acar", role: "Operasyon Müdürü", stage: "İlk görüşme", score: 52, lastContact: "27 Temmuz 2026", lastContactDate: "2026-07-27", sector: "Lojistik", city: "Kocaeli", phone: "+90 262 555 18 44", email: "selin@novalojistik.com", revenue: "₺640.000" },
  { id: 3, name: "Marmara Teknoloji", initials: "MT", contact: "Can Erdem", role: "Genel Müdür", stage: "Karar aşaması", score: 88, lastContact: "25 Temmuz 2026", lastContactDate: "2026-07-25", sector: "Teknoloji", city: "İstanbul", phone: "+90 216 555 77 10", email: "can@marmarateknoloji.com", revenue: "₺2.180.000" },
  { id: 4, name: "Vega Yapı Sistemleri", initials: "VY", contact: "Buse Kaya", role: "Finans Direktörü", stage: "İhtiyaç analizi", score: 61, lastContact: "22 Temmuz 2026", lastContactDate: "2026-07-22", sector: "İnşaat", city: "Ankara", phone: "+90 312 555 10 90", email: "buse@vegayapi.com", revenue: "₺920.000" },
  { id: 5, name: "Pera Gıda", initials: "PG", contact: "Emre Aksoy", role: "Ticari Direktör", stage: "Teklif değerlendiriliyor", score: 69, lastContact: "20 Temmuz 2026", lastContactDate: "2026-07-20", sector: "Gıda", city: "Bursa", phone: "+90 224 555 63 28", email: "emre@peragida.com", revenue: "₺780.000" },
];

export const customer = customers[0];

export const offers = [
  { id: 1, customerId: 1, customer: "Atlas Endüstri A.Ş.", no: "TKL-2026-0148", title: "Kurumsal Dönüşüm Paketi", amount: "₺1.240.000", numericAmount: 1240000, status: "Beklemede", validUntil: "12 Ağustos", probability: 74 },
  { id: 2, customerId: 1, customer: "Atlas Endüstri A.Ş.", no: "TKL-2026-0112", title: "Entegrasyon ve Eğitim", amount: "₺285.000", numericAmount: 285000, status: "Revize", validUntil: "5 Ağustos", probability: 66 },
  { id: 3, customerId: 3, customer: "Marmara Teknoloji", no: "TKL-2026-0151", title: "Yıllık Kurumsal Lisans", amount: "₺2.180.000", numericAmount: 2180000, status: "Karar", validUntil: "18 Ağustos", probability: 88 },
  { id: 4, customerId: 4, customer: "Vega Yapı Sistemleri", no: "TKL-2026-0139", title: "Finans Süreçleri Paketi", amount: "₺920.000", numericAmount: 920000, status: "Hazırlanıyor", validUntil: "9 Ağustos", probability: 61 },
  { id: 5, customerId: 5, customer: "Pera Gıda", no: "TKL-2026-0127", title: "Satış Otomasyonu", amount: "₺780.000", numericAmount: 780000, status: "Beklemede", validUntil: "7 Ağustos", probability: 69 },
];

export const initialTranscript = "Mevcut sistemimize bağımlı kalmak istemiyoruz. Özellikle vendor lock-in ve geçiş süresi bizim için önemli. Fiyatınız rakibin biraz üzerinde ancak entegrasyon tarafınız daha güçlü görünüyor.";

export const analysis = {
  term: { eyebrow: "TERİM YAKALANDI", title: "Vendor lock-in", text: "Bir müşterinin kullandığı teknoloji veya tedarikçiye geçiş maliyetleri nedeniyle bağımlı kalması." },
  objection: { eyebrow: "İTİRAZ", title: "Fiyat karşılaştırması", text: "Fiyatı savunmak yerine entegrasyon hızının toplam maliyete etkisini netleştir." },
  question: { eyebrow: "ŞİMDİ SOR", title: "Karar kriterini aç", text: "Geçişin ilk 90 gününde başarıyı hangi üç metrikle ölçeceksiniz?" },
};

export const objectionStats = [
  { label: "Fiyat / bütçe", value: 38, color: "#f3b64c" },
  { label: "Entegrasyon süresi", value: 26, color: "#5f9c83" },
  { label: "Rakip karşılaştırması", value: 21, color: "#6897b6" },
  { label: "Karar yetkisi", value: 15, color: "#a08cbe" },
];

export const personnelPerformance = [
  { name: "Elif Demir", initials: "ED", salesAmount: 3850000, closedDeals: 9, leads: 28, responses: 23 },
  { name: "Kerem Aydın", initials: "KA", salesAmount: 2720000, closedDeals: 7, leads: 31, responses: 22 },
  { name: "Derya Koç", initials: "DK", salesAmount: 2180000, closedDeals: 5, leads: 24, responses: 19 },
  { name: "Mert Çelik", initials: "MÇ", salesAmount: 1640000, closedDeals: 4, leads: 26, responses: 16 },
];
