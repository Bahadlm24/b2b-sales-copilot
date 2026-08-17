# İlk Ürün Kapsamı

Bu belge, sunucu ve canlı ortam bağlantısı kurulmadan tamamlanan yerel ilk ürün kapsamını tanımlar.

## Tamamlanan Yerel Akış

```text
Lead
  → Nitelendirme ve sorumlu atama
  → Müşteriye dönüştürme
  → Müşteri kartı ve aktivite geçmişi
  → Görev / toplantı
  → Teklif oluşturma ve revizyon
  → Kazanıldı / Kaybedildi ve sonuç nedeni
```

## Tamamlanan Kontroller

- Telefon numarası normalizasyonu ve mükerrer müşteri kontrolü
- Lead ile oluşturulan müşteri arasında kalıcı ilişki
- Müşteri, lead ve teklif için sorumlu personel
- Müşteriyi silmeden arşivleme ve tekrar aktifleştirme
- Teklif değişikliklerinde alan bazlı revizyon geçmişi
- Kazanıldı/kaybedildi durumunda zorunlu sonuç nedeni
- Görev kartında geciken gün sayısı
- Görev başlığı, tarihi, önceliği ve sorumlusunu düzenleme
- Lead ve müşteri arşivleme; teklif arşivleme ve nedenli iptal
- Uygun olmayan lead için zorunlu kaybetme nedeni
- Toplantı tarihi ve sorumlu personel kaydı
- Aktivite sonrası otomatik müşteri son temas güncellemesi
- Geciken görev, yaklaşan teklif ve uzun süredir temas edilmeyen müşteri bildirimleri
- Kişisel veya tüm ekip dashboard görünümü
- Açık/kazanılmış/kaybedilmiş/iptal teklif ayrımlı doğru pipeline hesabı
- Store verisinden hesaplanan satış ve personel analytics ekranı
- Tüm kritik işlemlerde aktivite ve audit kaydı
- Audit güncellemelerinde eski değer, yeni değer ve değişen alanlar
- `localStorage` ile tarayıcı oturumları arasında mock veri kalıcılığı

## Kullanım

1. Lead detayında **Müşteriye dönüştür** seçilir.
2. Oluşan müşteri kartında sorumlu, iletişim ve satış bilgileri düzenlenir.
3. Teklifler ekranından müşteriyle ilişkili yeni teklif oluşturulur.
4. Teklif her güncellendiğinde revizyon geçmişi oluşur.
5. Teklif kapatılırken kazanma veya kaybetme nedeni girilir.
6. Süresi geçen açık görevler kırmızı kart ve geciken gün sayısıyla gösterilir.
7. Üst menüdeki bildirim merkezi yaklaşan ve geciken aksiyonları bir araya getirir.
8. Dashboard filtresinden yalnızca oturumdaki personele ait veya tüm ekip kayıtları seçilir.

## Yerel Sürüm Sınırları

- Veriler yalnızca kullanılan tarayıcıda saklanır.
- Kullanıcı girişi ve tokenlar mock yapıdadır.
- E-posta, sosyal medya ve reklam bağlantıları gerçek servise istek göndermez.
- Güvenilir IP, değiştirilemez audit, zamanlanmış worker ve merkezi yedekleme backend gerektirir.

## Canlıya Geçiş Öncesi

İlk adım: statik `dist/` yayını ve [DEPLOY.md](DEPLOY.md) kontrol listesi. Bu, arayüzün HTTPS üzerinde açılmasını sağlar; veriler hâlâ tarayıcıdadır.

Ortak canlı kullanım için:

- PostgreSQL veri modeli ve migrationlar
- Backend API ve sunucu taraflı yetki kontrolü
- Güvenli parola hashleme, access/refresh token ve token iptali
- Gerçek e-posta sağlayıcısı
- Meta/Google/Web Form webhookları
- Merkezi loglama, izleme ve yedekleme
- Uçtan uca tarayıcı testleri ve güvenlik kontrolleri
