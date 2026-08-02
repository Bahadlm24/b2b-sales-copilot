# İlişkili Aktivite Geçmişi

Aktivite modeli müşteri ve potansiyel müşteri kayıtlarının etrafındaki işlemleri tek bir zaman çizelgesinde toplar.

## Aktivite Alanları

```json
{
  "entityType": "customer",
  "entityId": 1,
  "actorId": 2,
  "actorName": "Elif Demir",
  "type": "meeting",
  "title": "Toplantı analizi kaydedildi",
  "description": "42 kelime ve 3 içgörü",
  "createdAt": "2026-07-31T10:00:00.000Z"
}
```

`entityType` ve `entityId` birlikte aktivitenin hangi müşteri veya lead kaydına ait olduğunu belirler. `actorId` ve `actorName` işlemi yapan personeli gösterir.

## Otomatik Aktiviteler

- Lead oluşturma
- Lead durum değişikliği
- Müşteriye takip görevi oluşturma, tamamlama, yeniden açma veya silme
- Müşteri toplantı analizini kaydetme

## Manuel Not

Müşteri detayındaki veya lead kartının altındaki aktivite alanından başlık ve isteğe bağlı açıklama girilebilir. Not, giriş yapan personelin adıyla kaydedilir.

## Görüntüleme

- Müşteri: `/customers/:id` detay sayfasındaki **İşlem geçmişi**
- Lead: `/leads` listesindeki **Aktiviteler** butonu

Audit History sistem genelindeki denetim kaydıdır. Aktivite geçmişi ise ilgili müşteri veya lead özelindeki operasyonel ilişki zaman çizelgesidir.
