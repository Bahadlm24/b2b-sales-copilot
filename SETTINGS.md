# Dinamik Yetki ve Organizasyon Ayarları

`/settings` sayfası Sistem Yöneticisinin kod değişikliği yapmadan kullanıcı erişimlerini ve organizasyon yapısını yönetmesini sağlar.

## Kişi Bazlı Yetkiler

Yönetici kullanıcıyı seçer ve aşağıdaki sayfa izinlerini ayrı ayrı açıp kapatır:

- Genel Bakış
- Lead Havuzu
- Toplantı Asistanı
- Toplantı Geçmişi
- Takipler
- Müşteriler
- Teklifler
- Analizler
- Kullanıcı Yönetimi
- Ayarlar

Değişiklikler `localStorage` içinde saklanır. Menü görünürlüğü ve doğrudan URL erişimi aynı izin listesini kullanır.

Rol değiştirildiğinde kullanıcı izinleri seçilen rolün başlangıç izinlerine döner. Sonrasında Ayarlar ekranından kişiye özel düzenleme yapılabilir.

## Dinamik Roller

- Yeni rol adı girilerek rol oluşturulabilir.
- Yeni roller güvenli başlangıç olarak yalnızca Genel Bakış izniyle açılır.
- Rolün başlangıç sayfa izinleri checkbox matrisiyle düzenlenir.
- Kullanıcı oluşturma ve rol değiştirme alanları bu dinamik rol listesini kullanır.
- Kullanıcıya atanmış bir rol silinemez; önce ilgili kullanıcı başka role geçirilmelidir.
- Rol silindiğinde kod veya uygulama yeniden başlatması gerekmez.

## Departman ve Takımlar

- Departman eklenebilir ve silinebilir.
- Her takım bir departmana bağlıdır.
- Kullanıcı Yönetimi ekranından kullanıcıya departman ve takım atanır.
- Atanmış kullanıcısı veya takımı bulunan departman silinemez.
- Atanmış kullanıcısı bulunan takım silinemez.

## Token Politikası

- Girişte erişim ve refresh token oluşturulur.
- Erişim tokenı 60 dakika geçerlidir.
- Rota geçişinde ve uygulama açıkken dakikada bir geçerlilik kontrol edilir.
- 60 dakika dolduğunda refresh token kullanılarak erişim tokenı yenilenir.
- Çıkışta iki token da yerel oturumdan temizlenir.
- Token değerinin tamamı arayüzde gösterilmez.

Bu yapı yerel mock test içindir. Canlı sistemde token üretimi ve doğrulaması backend kimlik servisi tarafından yapılmalı; refresh token HTTP-only güvenli çerezde tutulmalıdır.
