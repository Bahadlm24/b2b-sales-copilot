# Chrome Eklentisi — Toplantı Asistanı

`extension/` dizini; Google Meet, Microsoft Teams ve Zoom web görüşmelerini Sales Copilot müşteri bağlamıyla takip eden Manifest V3 Chrome eklentisini içerir.

## Yetenekler

- Toplantı başlamadan aktif müşteri arama ve seçme
- Müşterinin yetkili, satış aşaması ve skor bilgisini gösterme
- Tek seferlik katılımcı bilgilendirme onayından sonra Meet, Teams ve Zoom toplantılarında otomatik başlama
- Toplantı sayfasındaki sabit kontrolden otomatik yakalamayı durdurma veya yeniden başlatma
- Konuşmadaki fiyat, ihtiyaç, karar, zamanlama, entegrasyon ve rekabet sinyallerine göre canlı sorular üretme
- Türkçe ve İngilizce konuşmayı otomatik algılama veya dil önceliğini elle seçme
- Bilgi talebi, müşteri isteği veya satış sinyali yakalandığında Meet üzerinde sağ üst koç bildirimi gösterme
- Markdown ürün bilgi tabanından kaynaklı cevap taslağı, takip sorusu ve güven seviyesi üretme
- Popup kuyruğu ile sabitleme, kopyalama ve faydalı/yanlış geri bildirimi toplama
- Yan panel kapanıp yeniden açıldığında aktif toplantı oturumunu ve transcript'i kurtarma
- Popup etkinliği, görünme süresi ve yalnız katılımcı filtresini ayarlama
- Soru-cevap geçmişini panelde izleme ve tamamlanan toplantıyı JSON dışa aktarma
- API modunda transcript parçalarını AI analiz servisine gönderme
- Toplantı sonunda özet, konular, aksiyonlar ve transcript üretme
- Sonucu Sales Copilot toplantı servisine kaydetme
- Backend olmadan `chrome.storage.local` üzerinde mock çalışma

Eklenti gizli ses kaydı yapmaz; toplantı uygulamasında kullanıcı tarafından açılmış canlı altyazı metnini okur. Meet'te **Altyazılar**, Teams'te **Canlı açıklamalı alt yazılar**, Zoom'da **Show Captions / Live Transcript** açık olmalıdır.

Türkçe altyazı yakalama katmanı kısa cümleleri yaklaşık 450 ms duraklamadan sonra gönderir; uzun ve kesintisiz konuşmalarda en fazla 1,6 saniye bekleyerek güncel metni aktarır. Aynı konuşmacının devam eden cümle parçaları notlarda tek kayıt olarak birleştirilir. Yerel öneriler hemen üretilir; API analizi 450 ms debounce ve 4 saniye zaman aşımıyla çalışır, eski API yanıtları güncel önerilerin üzerine yazamaz.

## Yerel Kurulum

1. Chrome'da `chrome://extensions` adresini açın.
2. Sağ üstten **Geliştirici modu** seçeneğini etkinleştirin.
3. **Paketlenmemiş öğe yükle** seçeneğine basın.
4. Projedeki `extension` klasörünü seçin.
5. Bir Google Meet, Microsoft Teams veya Zoom web toplantısı açın ve canlı altyazıları etkinleştirin.
6. İlk kullanımda toplantı sayfasının sağ üstündeki **Sales Copilot kapalı · Başlat** kontrolüne basıp katılımcı bilgilendirme onayını verin.
7. Sonraki toplantılarda eklenti otomatik başlar. Aynı kontrolden durdurulduğunda otomatik başlatma da kapanır; yeniden başlatmak tekrar etkinleştirir.
8. Müşteri seçmek, geçmişi görmek veya toplantıyı CRM'e kaydetmek için istenirse araç çubuğundan yan panel açılabilir; canlı yakalama ve yerel popup önerileri bunun için yan panelin açık olmasını gerektirmez.

Chrome güvenlik politikası yan panelin kullanıcı hareketi olmadan açılmasına izin vermez. Bu nedenle otomatik mod yan panel açmak yerine içerik yakalamayı ve toplantı üzerindeki popup bildirimlerini doğrudan etkinleştirir.

### Desteklenen web adresleri

- Google Meet: `https://meet.google.com/*`
- Microsoft Teams: `https://teams.microsoft.com/*`, `https://teams.live.com/*`, `https://teams.cloud.microsoft/*`
- Zoom Web Client: `https://*.zoom.us/*`

Masaüstü Teams ve Zoom uygulamalarının pencereleri Chrome uzantısı tarafından okunamaz; ilgili toplantı web istemcisinde açılmalıdır. Platformlar altyazı DOM yapısını değiştirdiğinde seçicilerin güncellenmesi gerekebilir.

### Altyazı ve Toplantı Dili

Eklenti ayarlarında üç seçenek vardır:

- `Otomatik (TR / EN)`: Konuşma metnini analiz ederek Türkçe veya İngilizce öneri üretir.
- `Türkçe öncelikli`: Karışık konuşmada önerileri Türkçe verir.
- `English priority`: Suggestions are generated in English.

Eklenti transcript'i Meet'in ürettiği özgün metinle saklar; otomatik çeviri yaparak toplantı kaydını değiştirmez.

Canlı koç bildirimi Meet ekranının sağ üstünde görünür ve yaklaşık üç saniye sonra kendiliğinden kapanır. Aynı öneri sekiz saniye içinde tekrar gösterilmez; konuşma notu ise toplantı kaydında kalıcıdır.

Popup içinde **Sabitle**, **Kopyala**, **İşe yaradı**, **Yanlıştı** ve **Kapat** kontrolleri bulunur. Gösterilen soru, cevap taslağı, takip sorusu, kaynak, güven seviyesi ve kullanıcı geri bildirimi toplantı kaydının `qaInteractions` alanında saklanır.

Bağlantı ayarlarından popup tamamen kapatılabilir, 3/5/7 saniye görünme süresi seçilebilir veya yalnızca `participant` rolündeki konuşmacılar için gösterilebilir. Yan panel toplantı sırasında kapanırsa service worker transcript parçalarını `chrome.storage.session` alanında tutar ve panel yeniden açıldığında oturum kurtarılır.

Toplantı tamamlandığında sonuç alanı kaydın mock depoya mı yoksa API'ye mi yazıldığını gösterir. **JSON dışa aktar** düğmesi özet, transcript, içgörüler ve soru-cevap etkileşimlerini indirir.

Yerel bilgi kaynakları `extension/knowledge/` dizinindedir. İçerik yayınlanmadan önce ürün, hukuk, güvenlik ve satış ekipleri tarafından doğrulanmalıdır.

Google Meet altyazı dili Meet üzerinden ayarlanır: **Diğer seçenekler (⋮) → Ayarlar → Altyazılar → Altyazı dili**. Buradan `Türkçe` veya `English` seçilmelidir. Eklenti bu Meet hesap ayarını güvenlik ve arayüz değişkenliği nedeniyle otomatik değiştirmez.

## Mock Mod

Eklenti ilk kurulumda mock modda açılır. Örnek müşteriler `chrome.storage.local` içinde tutulur. Tamamlanan toplantılar `mockMeetings` anahtarına yazılır.

Mock mod gerçek Vue uygulamasının `localStorage` alanına doğrudan erişmez. Chrome uzantısı ve web uygulaması farklı güvenlik alanlarında çalışır. Ortak veri paylaşımı canlı API veya ileride eklenecek yerel bridge servisiyle yapılmalıdır.

## API Modu

Yan panelde ayarlar açılarak:

- Çalışma modu: `API`
- API adresi: örneğin `https://crm.example.com/api`
- Access token: oturum servisi tarafından üretilen token

girilir. Chrome yalnızca seçilen API origin'i için kullanıcıdan çalışma zamanı izni ister.

Token eklentinin yerel deposunda tutulur. Canlı sürümde kısa ömürlü access token ve refresh/token exchange akışı kullanılmalıdır; kalıcı yönetici tokenı girilmemelidir.

Sunucu yayını sonrası SPA adresi `https://crm.example.com` ise eklenti API kökü `https://crm.example.com/api` olur. Bu değer `runtime-config.js` ile aynı tutulmalıdır. Chrome, API origin için çalışma zamanı izni ister. Adım adım: [DEPLOY.md](DEPLOY.md).

## Google Meet Uyumluluğu

Google Meet DOM yapısı Google tarafından değiştirilebilir. `content-script.js` birden fazla bilinen altyazı seçicisini destekler. Meet arayüzü değiştiğinde yalnızca altyazı adaptörü güncellenmelidir.

Kontrol listesi:

- Meet altyazıları açık mı?
- Eklenti toplantı sekmesi açıldıktan sonra yüklenmiş mi?
- Panelde “Toplantı notları toplanıyor” mesajı var mı?
- Altyazı dili ve konuşmacı metni Meet ekranında görünüyor mu?

## Gizlilik ve Güvenlik

- Toplama işlemi açık kullanıcı aksiyonu gerektirir.
- Katılımcıların bilgilendirildiğine dair onay olmadan başlatılamaz.
- Parola ve refresh token transcript veya toplantı kaydına eklenmez.
- Ekrana yazılan API ve altyazı değerleri HTML kaçışından geçirilir.
- Canlı API, kullanıcı ve müşteri erişimini backend yetkileriyle tekrar kontrol etmelidir.
- KVKK kapsamında aydınlatma, açık rıza gereksinimi, saklama süresi ve silme prosedürü kurum tarafından belirlenmelidir.

## Dosyalar

| Dosya | Görev |
|---|---|
| `manifest.json` | Manifest V3 izinleri ve eklenti girişleri |
| `service-worker.js` | Side panel davranışı ve Meet mesaj yönlendirme |
| `content-script.js` | Google Meet altyazı adaptörü |
| `sidepanel.html/js/css` | Müşteri, canlı öneri, transcript ve sonuç arayüzü |
| `meeting-intelligence.js` | Yerel sinyal analizi ve özet fallback'i |
| `api-client.js` | Mock/API müşteri, analiz ve toplantı kayıt istemcisi |
