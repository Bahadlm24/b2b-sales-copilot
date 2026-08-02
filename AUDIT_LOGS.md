# Audit, Mail Log ve Veri Senkronizasyonu

## Audit History

`/audit` sayfası kullanıcı ve sistem işlemlerini kişi bazında gruplandırarak gösterir. Kişi kartı açıldığında hareketler zaman sıralı olarak listelenir.

Her kayıt şu alanları içerir:

```json
{
  "id": "benzersiz-kayit",
  "timestamp": "2026-07-31T10:00:00.000Z",
  "actor": { "id": 1, "name": "Bahadır Perveli" },
  "action": "lead.created",
  "resource": "lead",
  "resourceId": 42,
  "status": "success",
  "ipAddress": "127.0.0.1",
  "userAgent": "Mozilla/5.0 ...",
  "response": {
    "statusCode": 200,
    "message": "İşlem başarılı"
  },
  "details": {}
}
```

Kaydedilen başlıca olaylar:

- Giriş, başarısız giriş, çıkış ve token yenileme
- Şifre hatırlatma isteği ve mail kuyruğu sonucu
- Sayfa/rota istekleri
- Kullanıcı, rol, izin, departman ve takım değişiklikleri
- Lead oluşturma ve durum güncelleme
- Görev ve toplantı işlemleri
- Mail kuyruğu işlemleri
- Entegrasyon zamanlama ve senkronizasyon çalışmaları

Tarayıcı performansını korumak için son 2.000 audit kaydı tutulur. Yönetici kayıtları `audit-history.json` olarak indirebilir.

## IP Adresi

Tarayıcı tabanlı yerel uygulama gerçek public istemci IP adresini güvenilir biçimde tespit edemez. Yerel geliştirmede `127.0.0.1` kaydedilir. Canlı sistemde IP alanı backend tarafından bağlantı adresi ve güvenilir proxy yapılandırması üzerinden doldurulmalıdır. İstemciden gönderilen IP değeri güvenlik kaydı için tek başına güvenilir kabul edilmemelidir.

## Response Bilgisi

Her yeni audit kaydı standart response alanı taşır:

- `statusCode`: 200, 202, 401, 403 veya işlem sonucuna uygun diğer kod
- `message`: kullanıcıdan bağımsız, denetlenebilir sonuç açıklaması

Eski audit kayıtlarında bu alanlar bulunmuyorsa arayüz geriye uyumlu olarak boş sonuç gösterir.

## Mail Log

Mail kuyruğuna eklenen mesajlar Audit ekranının **Mail Log** sekmesinde görüntülenir ve `mail.log.json` olarak indirilebilir.

## Senkronizasyon

`/settings` ekranından otomatik veri güncelleme sıklığı seçilir:

- Saatte bir
- Günde bir

Uygulama dakikada bir yalnızca yerel zaman kontrolü yapar. Zamanı gelmediyse dış servis isteği oluşturmaz. Bu sürümde senkronizasyon mock olarak çalışır, ilgili lead kayıtlarının `lastSyncedAt` alanını günceller ve güncellenen kayıt sayısıyla audit kaydı üretir.

Canlı sistemde zamanlayıcı tarayıcı yerine backend job altyapısında çalışmalı; Meta, Instagram ve reklam mecralarına ait tokenlar sunucu tarafında saklanmalıdır.
