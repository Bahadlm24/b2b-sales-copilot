# Toplantı Takip Merkezi

`/meeting-tracker` sayfası potansiyel müşteri veya aktif müşteriyle yapılan görüşmeleri Excel benzeri dinamik bir tabloda izler.

## Akış

`Lead → Görüşme planlandı → Görüşme sağlandı → Tekrar görüşme planlandı → Karar aşaması → Olumlu / Olumsuz`

- Tekrar görüşme planlandığında görüşme turu otomatik artırılır. Tur sayısında üst sınır yoktur.
- Her değişiklik geçmiş listesine, kişi aktivitesine ve audit geçmişine yazılır.
- Nihai olumlu veya olumsuz kararda sonuç açıklaması zorunludur.
- Lead olumlu sonuçlandığında müşteri kaydına dönüştürülür; görüşme yolculuğu yeni müşteri kimliğine bağlanır ve geçmiş korunur.
- Planlanan görüşmeler için 48 saat kala, tarihi geçen görüşmeler için sonuç girilene kadar bildirim merkezinde uyarı gösterilir.
- Personel, durum ve firma adına göre filtreleme yapılabilir.

## Görüşme Analizi

Toplantı asistanı yalnızca özet çıkarmak yerine görüşmeyi altı satış boyutunda puanlar: ihtiyaç keşfi, bütçe/değer, karar süreci, zamanlama, sonraki adım ve itiraz yönetimi. Görüşme skoru; soru, itiraz, taahhüt, karar verici, bütçe, zamanlama ve takip sinyallerinden üretilir. Konuşmacı rolleri mevcut olduğunda satışçı/müşteri konuşma oranı da hesaplanır. Sonuç; fırsat sağlığı, güçlü noktalar, riskler ve sonraki toplantı planıyla birlikte kaydedilir.

## Satış Sonuç Raporu

`/reports` ekranı lead, müşteri, toplantı yolculuğu, analiz ve teklif store verilerini tek raporda birleştirir. Tarih, personel ve lead kaynağı filtreleri; toplam data, dönüş yapan, aktif/pasif, ilgilenmeyen, müşteriye dönüşen, olumlu/olumsuz görüşme, kazanılan/kaybedilen satış, gelir, pipeline ve görüşme kalite skorlarına birlikte uygulanır. Personel ve kanal tabloları da aynı merkezi hesaplama servisini kullanır.

## Çoklu Firma Modeli

Yerel mock sürüm `organization` alanıyla firma bağlamını taşır. Canlı sürümde bütün iş tablolarında zorunlu bir `tenantId` bulunmalıdır. Kullanıcı tokenındaki tenant kimliği ile istek tenantı sunucuda karşılaştırılmalı; yalnızca arayüz filtresine güvenilmemelidir.

Önerilen ana tablolar:

- `tenants`
- `tenant_users`
- `leads`
- `customers`
- `meeting_journeys`
- `meeting_journey_events`
- `notifications`
- `product_releases`

Her müşteri kendi kullanıcılarını, müşterilerini, toplantılarını ve eklenti tokenlarını yalnızca kendi tenant alanında görür.

## Ürün Güncellemeleri

Mock sürümde yayın notları `productUpdates` koleksiyonunda tutulur ve okunmamış sürümler bildirim merkezine düşer. Canlı dağıtımda:

1. Web uygulaması sürümlü statik paket olarak yayınlanır.
2. `version.json` veya release API son sürümü döndürür.
3. Yeni sürüm algılandığında kullanıcının işlemi kesilmeden “Güncelleme geldi” bildirimi gösterilir.
4. Sayfa güvenli yenilemede yeni paketi otomatik alır.
5. Chrome eklentisi Chrome Web Store üzerinden yayınlanır ve Chrome tarafından otomatik güncellenir.
6. Şema değişiklikleri geriye uyumlu migration ile uygulanır.

Yerel geliştirme sürümü sunucuya bağlı olmadığı için gerçek uzaktan dağıtım yapmaz; bildirim ve sürüm veri modeli canlı entegrasyona hazırdır.
