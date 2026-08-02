# Lead Toplama ve Takip

`/leads` sayfası reklam ve web formu kaynaklı potansiyel müşterileri tek havuzda toplamak için hazırlanmıştır.

## Desteklenen Mock Kaynaklar

- Meta Lead Ads
  - Facebook
  - Instagram
- Google Ads lead formu
- Web sitesi veya landing page formu
- Manuel giriş

Bağlantılar bu sürümde ağ isteği yapmaz. Kaynak ve kampanya alanları gerçek entegrasyondan gelecek veriyi temsil eden mock kayıtlardır.

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
