# B2B Sales Copilot

Satış ekiplerinin müşteri, teklif, takip ve toplantı içgörülerini tek çalışma alanında yönetmesi için geliştirilmiş Vue 3 tabanlı MVP.

## Özellikler

- Pipeline ve ağırlıklı gelir tahmini gösterge paneli
- Aranabilir müşteri listesi ve müşteri detayları
- Teklif havuzu ve durum filtreleme
- Konuşmadaki sinyallere göre 4-7 adet dinamik toplantı içgörüsü ve sonraki toplantı planı
- Müşteri bağlamıyla toplantı başlatma
- Kalıcı toplantı geçmişi
- Takip görevi oluşturma, tamamlama ve silme
- Satış performansı ve itiraz analizi
- Mock kullanıcı, rol ve sayfa erişimi yönetimi
- Kullanıcı adı/şifre ile yerel giriş ve mock şifre hatırlatma
- Kişi bazlı dinamik yetki, departman ve takım yönetimi
- 60 dakikalık erişim tokenı ve otomatik yenileme
- Audit history, mail log ve JSON dışa aktarma
- Müşteri ve lead kartlarında personel bazlı aktivite zaman çizelgesi
- Lead, toplantı, görev ve teklif detay/güncelleme akışları
- Lead kaydını ilişkili müşteri kartına dönüştürme
- Müşteri ve tekliflere sorumlu personel atama
- Veri kaybetmeden müşteri arşivleme/aktifleştirme
- Teklif oluşturma, revizyon geçmişi ve kazanma/kaybetme nedeni
- Geciken görevlerin gün bazında görünür takibi
- Google Meet altyazılarından müşteri bağlamlı toplantı notu ve canlı öneri üreten Chrome eklentisi
- Chrome eklentisinde kaynaklı cevap popup'ı, oturum kurtarma, geri bildirim ve JSON dışa aktarma
- Kişi bazında gruplanmış Audit History
- Saatlik veya günlük mock mecra senkronizasyonu
- Personel bazında satış ve müşteri dönüş grafiği
- Meta, Instagram, Google Ads ve web formu için mock lead havuzu
- Türkiye telefon numarası normalizasyonu
- Yerel tarayıcı depolamasıyla oturumlar arası veri koruma
- Ortak tasarım tokenlarıyla kalıcı modern açık/koyu tema
- Son temas tarihi ve takip önceliği görünür müşteri listesi
- Mobil uyumlu arayüz ve 404 sayfası

## Gereksinimler

- Node.js 20 veya üzeri
- npm 10 veya üzeri

## Kurulum

```bash
npm install
npm run dev
```

Windows PowerShell yürütme politikası `npm.ps1` dosyasını engelliyorsa komutları `npm.cmd` ile çalıştırın:

```powershell
npm.cmd run dev
```

Uygulama varsayılan olarak `http://localhost:5173` adresinde açılır.

Yerel yönetici girişi:

```text
Kullanıcı adı: admin
Şifre: 1234
```

## Komutlar

```bash
npm test          # Node testlerini çalıştırır
npm run build     # Üretim paketini oluşturur
npm run preview   # Üretim paketini yerelde sunar
```

## Veri Saklama

Müşteri ve teklifler şu anda `src/data/mockData.js` içindeki örnek verilerden gelir. Kullanıcının oluşturduğu görevler ve toplantı analizleri `sales-copilot-state-v1` anahtarıyla `localStorage` içinde saklanır.

Bu yapı MVP kullanımı içindir. Çok kullanıcılı üretim ortamında API, kimlik doğrulama ve sunucu tarafı veritabanı eklenmelidir.

## Dokümantasyon

- [Proje analizi](PROJECT_ANALYSIS.md)
- [Mimari](ARCHITECTURE.md)
- [Yol haritası](ROADMAP.md)
- [Sayfa erişimleri ve roller](ACCESS_CONTROL.md)
- [Yerel kimlik doğrulama](AUTHENTICATION.md)
- [Lead toplama ve takip](LEADS.md)
- [Dinamik yetki ve organizasyon ayarları](SETTINGS.md)
- [Audit, mail log ve senkronizasyon](AUDIT_LOGS.md)
- [İlişkili aktivite geçmişi](ACTIVITIES.md)
- [Detay ve güncelleme akışları](INTERACTIONS.md)
- [İlk ürün kapsamı ve kontrol listesi](FIRST_PRODUCT.md)
- [Chrome eklentisi kurulumu ve kullanımı](CHROME_EXTENSION.md)
- [Chrome eklentisi API sözleşmesi](EXTENSION_API.md)
