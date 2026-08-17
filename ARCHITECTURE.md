# Mimari

Toplantı satış yolculuğu ve çoklu firma dağıtım modeli için [MEETING_TRACKING.md](MEETING_TRACKING.md) belgesine bakın.

## Katmanlar

```text
Vue görünümleri
    ↓
salesStore (domain dilimleri) / meetingAnalyzer
    ↓
appConfig + persistence (localStorage veya ileride API)
    ↓
seed / mockData
```

### Yapılandırma

`src/config/appConfig.js` build anındaki `.env` değerlerini ve sunucudaki `runtime-config.js` dosyasını birleştirir. Kalıcılık `src/stores/persistence.js` üzerinden gider; backend eklendiğinde görünümler değil bu katman değişir. Sunucuya dosya atma adımları [DEPLOY.md](DEPLOY.md) belgesindedir.

### Durum Katmanı

`src/stores/salesStore.js` dilimleri birleştiren yüzdür. Auth, lead, müşteri, teklif, görev, toplantı, dizin ve entegrasyon mantığı `src/stores/slices/` altındadır. Durum Vue `reactive` ve `computed` API'leriyle tutulur.

### Görünüm Katmanı

`src/views` rota bazlı ekranları içerir. `AppLayout.vue` ortak navigasyon ve sayfa başlığını sağlar.

### İş Mantığı

`src/services/meetingAnalyzer.js`, toplantı metnini satış sinyallerine dönüştürür. Bu katman Vue'dan bağımsızdır ve doğrudan test edilebilir.
Analiz, eşleşen ihtiyaç ve itiraz sayısına göre 4-7 içgörü üretir; aynı sinyaller bir sonraki toplantı için en fazla beş maddelik hazırlık planına dönüştürülür.

`src/services/authorization.js`, rollerin izinlerini tanımlar. Router rota meta bilgisindeki izni kontrol eder; navigasyon da aynı izin kaynağını kullanır.

`src/services/phoneFormatter.js`, Türkiye numaralarını tek biçime getirir ve yabancı ülke kodlu numaraları korur.

`src/services/leadImporter.js`, Excel satırlarını ortak lead alanlarına eşler ve telefon bazlı mükerrer kontrolünü görünümden bağımsız yürütür. `.xlsx` dosyası tarayıcıda `read-excel-file` paketiyle okunur.

Yerel giriş işlemleri `salesStore` üzerinden yürütülür. Router önce oturum durumunu, ardından rol iznini denetler. Şifre hatırlatma mesajları aynı store içindeki mock e-posta kuyruğuna yazılır.

Rol tanımları, kullanıcı izinleri, departmanlar ve takımlar `salesStore` içinde dinamik veri olarak tutulur. Kod içindeki rol değerleri yalnızca ilk kurulum seed verisidir. `tokenService.js` 60 dakikalık erişim tokenı üretir, doğrular ve refresh token ile yeniler.

Aktiviteler `entityType + entityId` birleşik ilişkisiyle müşteri veya lead kaydına bağlanır. `ActivityTimeline.vue` aynı ilişkisel veriyi farklı kişi kartlarında yeniden kullanır.

Audit kayıtları aktör, zaman, IP, user-agent, response ve işlem detaylarını taşır. Yerel IP mock olarak istemciden ayarlanır; canlı güvenilir IP ve response bilgisi backend request middleware katmanında üretilmelidir.

### Tema ve Tasarım Sistemi

`src/stores/themeStore.js` açık/koyu tema tercihini yönetir ve `localStorage` içinde saklar. Tasarım tokenları `src/styles/tokens.css`, kabuk `src/styles/shell.css`, bileşen stilleri `src/styles/components.css` dosyalarındadır; `src/style.css` bunları içe aktarır.

### Veri Katmanı

- Referans müşteri ve teklifler: `src/data/mockData.js` ve `src/data/seed.js`
- Kullanıcı işlemleri: tarayıcı `localStorage` (`src/stores/persistence.js`)
- Canlı adresler: `public/runtime-config.js` (sunucuda düzenlenir)
- Kalıcı anahtar: `sales-copilot-state-v1`

### Chrome Eklentisi

`extension/` bağımsız Manifest V3 modülüdür. Google Meet content script'i yalnızca kullanıcı başlattığında açık altyazıları side panel'e gönderir. Side panel müşteri bağlamını yükler, yerel analizle anlık öneri verir ve API modunda `/meetings/analyze` ile `/meetings` uçlarını kullanır. Backend bulunmadığında kayıtlar uzantının `chrome.storage.local` alanında saklanır; web uygulamasının `localStorage` alanıyla doğrudan paylaşılmaz.

## Rotalar

| Yol | Görünüm |
|---|---|
| `/login` | Giriş ve şifre hatırlatma |
| `/leads` | Reklam ve web formu lead havuzu |
| `/leads/:id` | Lead detayı ve güncelleme |
| `/` | Genel bakış |
| `/meeting` | Toplantı asistanı |
| `/meetings` | Toplantı geçmişi |
| `/tasks` | Takip görevleri |
| `/customers` | Müşteri listesi |
| `/customers/:id` | Müşteri detayı |
| `/offers` | Teklifler |
| `/offers/:id` | Teklif detayı ve güncelleme |
| `/analytics` | Analizler |
| `/reports` | Satış sonuç raporu |
| `/users` | Kullanıcı ve rol yönetimi |
| `/settings` | Dinamik izin, departman, takım ve token ayarları |
| `/integrations` | Gelen data / webhook ayarları |
| `/meeting-tracker` | Toplantı takip tablosu |
| `/audit` | Audit history ve mail log |
| `/access-denied` | Yetkisiz erişim |

## Backend Geçişi

Backend eklendiğinde görünümler doğrudan değiştirilmemelidir. `salesStore` içindeki veri işlemleri bir API istemcisine yönlendirilmeli ve aşağıdaki kaynaklar tanımlanmalıdır:

```text
GET/POST/PATCH /customers
GET/POST/PATCH /offers
GET/POST/PATCH/DELETE /tasks
GET/POST /meetings
POST /meetings/analyze
```

API yanıtları için yükleniyor, boş, hata ve yetkisiz durumları ortak bir sözleşmeyle ele alınmalıdır. İstemci kök adresi `runtime-config.js` içindeki `apiBaseUrl` alanından okunur.

## Test Stratejisi

- Birim test: analiz motoru ve store hesapları
- Bileşen test: formlar, filtreler ve boş durumlar
- Uçtan uca test: müşteri seçme → toplantı analiz etme → geçmişte görüntüleme
- Üretim kontrolü: `npm run build`
