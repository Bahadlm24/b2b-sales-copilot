# Sunucu Yayını ve Canlı Test

Bu belge, `dist/` dosyalarını sunucuya atıp canlı teste başlamak için **hangi ayarın nereye yazılacağını** ve **hangi bağlantıların gerekli olduğunu** tarif eder.

Şu anki paket bir Vue SPA’dır. Backend yoksa canlı test **statik hosting + tarayıcı localStorage** ile yürür. Ekip üyeleri aynı veriyi paylaşmaz; her tarayıcı kendi kopyasını tutar. Ortak veri için API ve veritabanı gerekir.

## 1. Ne üretilir, ne atılır

Yerel makinede:

```bash
npm install
npm test
npm run build
```

Sunucunun web köküne **yalnızca `dist/` içeriği** atılır (`index.html`, `assets/`, `runtime-config.js`, `version.json`, `.htaccess`).

| Yerel dosya | Sunucuda nereye | Kim düzenler |
|---|---|---|
| `dist/index.html` | web kökü | Build üretir; elle dokunulmaz |
| `dist/assets/*` | web kökü `/assets/` | Build üretir; elle dokunulmaz |
| `dist/runtime-config.js` | web kökü | **Canlı adresi buraya yazın** |
| `dist/version.json` | web kökü | Sürüm bilgisi |
| `dist/.htaccess` | Apache kullanılıyorsa web kökü | SPA yönlendirmesi |
| `deploy/nginx.conf.example` | `/etc/nginx/sites-available/` | Nginx örneği; kopyalanıp düzenlenir |
| `.env` | yalnızca build makinesi | Sunucuya atılmaz |
| `extension/` | Chrome’a paketlenmemiş yüklenir | Canlı API adresi panelden girilir |

Kaynak kod, `node_modules` ve `.env` sunucunun public klasörüne konmaz.

## 2. Ayarlar: nerede ne yazılır

### A) Build öncesi (isteğe bağlı) — `.env`

`.env.example` dosyasını `.env` olarak kopyalayın. Bu değerler **build anında** pakete gömülür.

| Değişken | Nereye | Ne işe yarar |
|---|---|---|
| `VITE_APP_BASE` | `.env` | Alt klasöre kurulum, örn. `/copilot/` |
| `VITE_APP_MODE` | `.env` | `local`, `live-static` veya `live` |
| `VITE_API_BASE_URL` | `.env` | Backend kökü, örn. `https://crm.example.com/api` |
| `VITE_APP_PUBLIC_URL` | `.env` | Kullanıcının açtığı adres |
| `VITE_PERSIST_MODE` | `.env` | Şimdilik `local` |

`.env` git’e girmez. Sunucuya dosya attıktan sonra adresi değiştirmek için yeniden build şart değildir; aşağıdaki dosyayı kullanın.

### B) Sunucuda (asıl canlı ayar) — `runtime-config.js`

Build sonrası `dist/runtime-config.js` web köküne gider. Sunucuda bu dosyayı açıp değerleri yazın; **yeniden derleme gerekmez**.

```js
window.__SALES_COPILOT_CONFIG__ = {
  mode: "live-static",
  apiBaseUrl: "https://crm.example.com/api",
  appPublicUrl: "https://crm.example.com",
  persistMode: "local"
};
```

| Alan | Ne zaman doldurulur |
|---|---|
| `mode` | `live-static`: sadece arayüz testi. `live`: API de var. |
| `apiBaseUrl` | Backend yoksa `""` bırakın. Varsa `/api` ile biten kök. |
| `appPublicUrl` | HTTPS uygulama adresi. |
| `persistMode` | Backend bağlanana kadar `local`. |

Bu dosya `src/config/appConfig.js` tarafından okunur. Entegrasyonlar ekranındaki varsayılan webhook kökü boş `localStorage` ile ilk açılışta `apiBaseUrl` (yoksa `http://localhost:3000/api`) olur. Tarayıcıda eski kayıt varsa Ayarlar / Entegrasyonlar ekranından adresi güncelleyin veya site verisini temizleyin.

### C) Chrome eklentisi — yan panel ayarları

Eklenti Vue `localStorage`’ına yazamaz. Canlı testte yan panelde:

| Alan | Değer |
|---|---|
| Çalışma modu | Backend yoksa `mock`, API varsa `API` |
| API adresi | `https://crm.example.com/api` |
| Access token | Backend oturum tokenı; mock’ta boş |

`extension/manifest.json` içinde Meet / Teams / Zoom izinleri vardır. Canlı CRM origin’i için yan panel ilk API çağrısında çalışma zamanı izni ister (`optional_host_permissions`).

### D) Web sunucusu — Nginx veya Apache

- Nginx: `deploy/nginx.conf.example` dosyasını kopyalayıp `server_name`, `root`, SSL yollarını doldurun. `try_files ... /index.html` SPA için zorunludur; yoksa `/customers/1` yenilemesi 404 verir.
- Apache: `dist/.htaccess` web kökünde durmalıdır; `mod_rewrite` açık olsun.
- `runtime-config.js` için cache kapatın (`no-store`); aksi halde ayar değişimi tarayıcıda görünmez.

## 3. Sunucu için gerekli bağlantılar

Canlı **statik** test (şimdiki paket):

| Bağlantı | Zorunlu mu | Açıklama |
|---|---|---|
| HTTPS + alan adı | Evet | Let’s Encrypt veya kurumsal sertifika |
| Statik dosya sunucusu | Evet | Nginx, Apache veya eşdeğeri |
| SPA fallback | Evet | Tüm yollar `index.html` |
| Node.js sunucuda | Hayır | Build yerel veya CI’de yapılır |
| Veritabanı | Hayır | Veri tarayıcıda kalır |

İleride **ortak canlı** test (API + ekip paylaşımı):

| Bağlantı | Nereye yazılır | Ne için |
|---|---|---|
| PostgreSQL | backend `.env` | Müşteri, lead, teklif, görev, toplantı |
| API `https://.../api` | `runtime-config.js` → `apiBaseUrl` | SPA ve eklenti |
| CORS | API sunucusu | SPA origin’ine izin |
| SMTP / e-posta | backend `.env` | Şifre sıfırlama, görev hatırlatma |
| Meta App secret | yalnızca backend | Lead Ads webhook |
| Google Ads webhook key | yalnızca backend | Ads lead formu |
| Web form imza anahtarı | yalnızca backend | Landing form |
| LLM / analiz servisi | backend `.env` | `POST /api/meetings/analyze` |

Tarayıcıya veritabanı şifresi, SMTP, Meta app secret veya yönetici tokenı yazılmaz.

## 4. Canlı statik test kontrol listesi

1. `.env.example` → `.env` (gerekirse `VITE_APP_PUBLIC_URL` doldurun).
2. `npm run build`
3. `dist/` içeriğini sunucu web köküne atın.
4. `runtime-config.js` içinde `mode: "live-static"` ve `appPublicUrl` doldurun. Backend yoksa `apiBaseUrl: ""`.
5. Nginx/Apache SPA kuralı ve HTTPS açık olsun.
6. `https://alanadiniz.com/login` açın. Demo: `admin` / `1234`.
7. Sayfa yenilemede `/customers` gibi alt yollar çalışsın.
8. Eklenti: `chrome://extensions` → paketlenmemiş `extension/` klasörü. Mock ile Meet/Teams/Zoom altyazı testi yapılabilir.
9. API bağlanacaksa eklentide mod `API`, adres `https://alanadiniz.com/api`, CORS API tarafında açık olsun.

Yerelde canlı paketi denemek için:

```bash
npm run build
npm run preview
```

Önizleme varsayılanı `http://localhost:4173`.

## 5. Güvenlik uyarısı (canlı test)

Statik yayında giriş mock’tur; şifreler tarayıcıda açık metindir. İnternete açmadan önce:

- Yalnızca test hesabı kullanın; gerçek müşteri verisi koymayın.
- Temel HTTP auth veya VPN ile erişimi kısıtlayın.
- Ortak CRM için backend, hash’li parola ve sunucu yetkisi olmadan devam etmeyin.
