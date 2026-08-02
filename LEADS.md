# Lead Toplama ve Takip

`/leads` sayfası reklam ve web formu kaynaklı potansiyel müşterileri tek havuzda toplamak için hazırlanmıştır.

## Desteklenen Kaynaklar

- Meta Lead Ads
  - Facebook
  - Instagram
- Google Ads lead formu
- Web sitesi veya landing page formu
- Manuel giriş

`/integrations` sayfası her tenant ve kaynak için webhook URL’si üretir. Yerel sürüm ağ isteği dinlemez; sayfadaki test aracı aynı doğrulama, alan normalizasyonu ve mükerrer kontrolünü tarayıcı içinde çalıştırır.

## Gelen Data Adresleri

Canlı temel adres `https://api.firmaniz.com/api` ise örnek uçlar şöyledir:

```text
POST https://api.firmaniz.com/api/v1/inbound/{tenantId}/meta
POST https://api.firmaniz.com/api/v1/inbound/{tenantId}/google-ads
POST https://api.firmaniz.com/api/v1/inbound/{tenantId}/webform
```

Bu adresler kullanıcıların ziyaret edeceği Vue sayfaları değildir. İnternetten erişilebilen backend webhook uçlarıdır. Başarılı istek `202 Accepted`, mükerrer telefon `409 Conflict`, geçersiz imza `401 Unauthorized`, hatalı alan `422 Unprocessable Entity` döndürmelidir.

Ortak örnek payload:

```json
{
  "name": "Ayşe Yılmaz",
  "company": "Örnek A.Ş.",
  "phone": "05305056648",
  "email": "ayse@example.com",
  "campaign": "Q3 Demo Formu",
  "lead_id": "external-123"
}
```

Telefon zorunludur. `name`, `full_name`, `first_name`/`last_name`; `phone`, `phone_number`; `email`, `email_address` alan adları ortak modele çevrilir.

### Meta / Instagram

Meta webhook doğrulama isteğine backend cevap vermeli, teslimatlarda `X-Hub-Signature-256` imzasını uygulama secret ile doğrulamalıdır. Meta çoğunlukla form alanları yerine lead kimliği gönderir; backend bu kimliği Graph API üzerinden okuyup ortak payload’a dönüştürür. App secret tarayıcıya yazılmaz.

### Google Ads

Google Ads Lead Form Asset ayarına Google webhook URL’si ve anahtarı girilir. Backend teslimat anahtarını doğrular, `gclid` ve lead kimliğini saklar.

### Web Form

Web sitesi formu JSON payload’ı `X-Form-Key` başlığıyla gönderir. Public formlarda gizli anahtar HTML içine gömülmemeli; form backend üzerinden proxy edilmeli veya kısa ömürlü form tokenı, CAPTCHA ve rate limit kullanılmalıdır.

## Lead Alanları

| Alan | Açıklama |
|---|---|
| Ad soyad | Potansiyel müşteri |
| Firma | İlgili şirket |
| Telefon | Normalize edilmiş iletişim numarası |
| E-posta | İletişim adresi |
| Kaynak | Facebook, Instagram, Google Ads, Web Form veya Manuel |
| Kampanya | Reklam/form kampanya adı |
| Skor | 0–100 arası ilk nitelik skoru |
| Durum | Yeni, iletişime geçildi, nitelikli, müşteriye dönüştü veya uygun değil |

## Türkiye Telefon Formatı

Aşağıdaki girişler aynı biçimde kaydedilir:

```text
05305056648
530 505 66 48
90 530 505 66 48
0090 530 505 66 48
+90 (530) 505-66-48
```

Kaydedilen değer:

```text
+90 530 505 66 48
```

`+49`, `0044` gibi yabancı ülke kodlarıyla başlayan numaralar kullanıcının gönderdiği biçimde korunur.

## Canlı Entegrasyona Geçiş

Canlı sürümde reklam platformlarının erişim anahtarları tarayıcıya konulmamalıdır. Meta ve Google webhook istekleri backend tarafından alınmalı, imza doğrulaması yapılmalı ve ortak lead modeline dönüştürülmelidir.

## Excel İçe Aktarma

Lead ekranı `.xlsx` dosyasının ilk sayfasını tarayıcı içinde okur. Dosya herhangi bir sunucuya gönderilmez.

Beklenen sütunlar:

```text
ad | soyad | telefon | mail
```

- Yalnızca `telefon` zorunludur.
- Sütun adlarında büyük/küçük harf farkı dikkate alınmaz.
- Mevcut lead havuzundaki telefonlar mükerrer kabul edilir.
- Aynı dosya içinde tekrar eden telefonun ikinci ve sonraki satırları mükerrer kabul edilir.
- Mükerrer ve hatalı satırlar kırmızı gösterilir ve aktarılmaz.
- Diğer geçerli satırlar aktarılmaya devam eder.
