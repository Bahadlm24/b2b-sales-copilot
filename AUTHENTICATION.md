# Yerel Kimlik Doğrulama

Bu sürüm canlı servis kullanmadan giriş ve şifre hatırlatma akışlarını test etmek için hazırlanmıştır.

## Yönetici Hesabı

```text
Kullanıcı adı: admin
Şifre: 1234
```

Uygulama açıldığında kullanıcı `/login` sayfasına yönlendirilir. Başarılı girişten sonra rolün izin verdiği sayfalar kullanılabilir. Oturum tarayıcı yenilendiğinde bilinçli olarak sonlandırılır; bu davranış yerel test ortamında giriş akışının tekrar denenebilmesini sağlar.

## Şifremi Unuttum

1. Giriş ekranında **Şifremi unuttum** seçilir.
2. Kullanıcının kayıtlı e-posta adresi girilir.
3. Adres kayıtlı ve aktifse bilgilendirme mesajı mock e-posta kuyruğuna eklenir.
4. Sistem Yöneticisi mesajı `/users` sayfasındaki **Mock E-posta Kuyruğu** bölümünde görebilir.

Kullanıcı hesabının varlığını dışarı sızdırmamak için kayıtlı ve kayıtlı olmayan adreslere aynı sonuç mesajı gösterilir.

## Kullanıcı Oluşturma

Sistem Yöneticisi `/users` sayfasından şu alanlarla kullanıcı oluşturabilir:

- Ad soyad
- Benzersiz kullanıcı adı
- Benzersiz e-posta adresi
- Geçici şifre
- Rol

## Güvenlik Sınırı

Şifreler yalnızca mock geliştirme ve canlı **statik** test amacıyla yerel tarayıcı verisinde açık metin tutulur. İnternete açık bir adreste gerçek müşteri verisi kullanılmamalı; erişim VPN veya HTTP basic auth ile sınırlanmalıdır. Ayrıntı: [DEPLOY.md](DEPLOY.md).

Üretime geçerken:

- Kimlik doğrulama backend tarafına taşınmalı,
- Şifreler güçlü bir parola hash algoritmasıyla saklanmalı,
- HTTP-only güvenli oturum çerezi kullanılmalı,
- Şifre sıfırlama için kısa ömürlü tek kullanımlık token üretilmeli,
- Gerçek e-posta servisi yalnızca backend üzerinden çağrılmalıdır.
