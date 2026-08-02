# Sayfa Erişimleri ve Roller

Uygulama dört başlangıç rolü kullanır. Kullanıcı `/login` ekranından giriş yapar; gerçek erişim listesi kişi bazında `/settings` sayfasından yönetilir. Rota koruması, oturumsuz ziyaretleri giriş ekranına; yetkisiz ziyaretleri `/access-denied` sayfasına yönlendirir.

## Erişim Matrisi

| Sayfa | URL | Sistem Yöneticisi | Satış Yöneticisi | Satış Temsilcisi | Satış Analisti |
|---|---|:---:|:---:|:---:|:---:|
| Giriş | `/login` | Herkese açık | Herkese açık | Herkese açık | Herkese açık |
| Genel Bakış | `/` | ✓ | ✓ | ✓ | ✓ |
| Lead Havuzu | `/leads` | ✓ | ✓ | ✓ | ✓ |
| Toplantı Asistanı | `/meeting` | ✓ | ✓ | ✓ | — |
| Toplantı Geçmişi | `/meetings` | ✓ | ✓ | ✓ | — |
| Takipler | `/tasks` | ✓ | ✓ | ✓ | — |
| Müşteriler | `/customers` | ✓ | ✓ | ✓ | ✓ |
| Müşteri Detayı | `/customers/:id` | ✓ | ✓ | ✓ | ✓ |
| Teklifler | `/offers` | ✓ | ✓ | ✓ | ✓ |
| Analizler | `/analytics` | ✓ | ✓ | — | ✓ |
| Kullanıcılar ve Roller | `/users` | ✓ | — | — | — |
| Yetki ve Organizasyon Ayarları | `/settings` | ✓ | — | — | — |
| Audit ve Mail Geçmişi | `/audit` | ✓ | — | — | — |

Tablodaki değerler başlangıç izinleridir. Sistem Yöneticisi bunları kişi bazında değiştirebilir; yeni roller oluşturup kendi başlangıç izin matrisini tanımlayabilir.

## Rol Açıklamaları

### Sistem Yöneticisi

Tüm sayfalara erişir. Kullanıcı ekleyebilir, silebilir, rol değiştirebilir ve kullanıcıyı pasife alabilir. Aktif oturumdaki kendi hesabı değiştirilemez veya silinemez.

### Satış Yöneticisi

Ekibin operasyonel satış modüllerini ve analizlerini görür. Kullanıcı yönetimine erişemez.

### Satış Temsilcisi

Müşteri, teklif, toplantı ve takip akışlarını kullanır. Ekip analizi ve kullanıcı yönetimine erişemez.

### Satış Analisti

Genel bakış, müşteri, teklif ve analiz ekranlarını görür. Toplantı ve görev operasyonlarına erişemez.

## Mock Güvenlik Notu

Bu erişim kontrolü yerel ürün akışlarını test etmek içindir. Tarayıcı tarafındaki kontroller tek başına üretim güvenliği sağlamaz. Canlı sistemde rol doğrulaması backend/API tarafında da zorunlu olarak uygulanmalıdır.
