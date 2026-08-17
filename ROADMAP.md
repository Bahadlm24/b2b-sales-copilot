# Yol Haritası

Bu belge mevcut kod tabanına göre hazırlanmıştır. Yerel satış döngüsü, toplantı eklentisi ve statik yayın ayarı tamamdır. Sıradaki iş yeni ekran eklemek değil; ortak veri, gerçek kimlik ve gerçek analize geçmektir.

Tamamlanma ölçütü: boş / yükleniyor / hata durumları, otomatik test, mobil kontrol ve ilgili doküman güncellemesi.

## Bugün — v0.1 Yerel ilk ürün

Teslim edildi.

| Alan | Durum |
|---|---|
| Lead → müşteri → görev → toplantı → teklif → kazan/kaybet | Tamam |
| Dashboard, analitik, satış raporu, bildirim merkezi | Tamam |
| Rol, kişi bazlı izin, departman, takım, audit | Tamam (mock) |
| Chrome eklentisi (Meet / Teams / Zoom altyazı) | Tamam (MVP) |
| Store dilimleri + `runtime-config.js` + `dist/` yayını | Tamam |
| Türkçe / İngilizce arayüz (TR-EN, kayıtlı durumlar aynı) | Tamam |

Sınır: veri tarayıcıda, şifre açık metin, analiz kural tabanlı, reklam/e-posta bağlantıları sahte.

---

## Faz 0 — Canlı statik test (1–2 hafta)

Amaç: arayüzü HTTPS’te göstermek; henüz ekip paylaşımı yok.

- [ ] `dist/` dosyalarını sunucuya at, [DEPLOY.md](DEPLOY.md) kontrol listesini uygula
- [ ] `runtime-config.js` içinde `appPublicUrl` ve `mode: "live-static"`
- [ ] VPN veya HTTP basic auth ile erişimi kısıtla
- [ ] Demo hesabı dışında gerçek müşteri verisi koyma
- [ ] Eklentiyi aynı ortamda Meet/Teams/Zoom ile dene

Çıkış: paydaşların tarayıcıdan gezdiği kısıtlı demo.

---

## Faz 1 — Ortak çekirdek (4–8 hafta)

Amaç: birden fazla satışçının aynı kayıtları görmesi.

- [ ] API sözleşmesini kilitle (`/customers`, `/offers`, `/tasks`, `/meetings`, `/leads`)
- [ ] PostgreSQL + `tenantId` zorunlu tablolar
- [ ] `persistence.js` yerine API istemcisi (görünümler değişmez)
- [ ] Sunucu kimliği: hash’li parola, access/refresh, token iptali
- [ ] Router ve eklenti aynı Bearer tokenı kullanır
- [ ] CORS, ortam değişkenleri, yedekleme
- [ ] API hata / yetkisiz / boş durum sözleşmesi

Çıkış: ekip içi ortak CRM; localStorage yalnızca tema için kalır.

---

## Faz 2 — Gerçek kopilot (4–6 hafta)

Amaç: toplantı asistanının kural motorundan dil modeline geçmesi.

- [ ] `POST /api/meetings/analyze` sunucu servisi
- [ ] Yapılandırılmış çıktı doğrulama (itiraz, ihtiyaç, karar, sonraki adım)
- [ ] Müşteri geçmişini bağlama alanına ekleme
- [ ] Eklenti geri bildirimiyle kalite ölçümü
- [ ] Rate limit ve eski yanıtların üzerine yazmama (mevcut eklenti davranışı korunur)

Çıkış: canlı görüşmede bağlamsal öneri; kaynaklı cevap bilgi tabanıyla birlikte.

---

## Faz 3 — Kanallar (6–8 hafta)

Amaç: mock entegrasyonların gerçek teslimata dönmesi.

- [ ] Meta / Instagram, Google Ads, web formu webhook’ları
- [ ] SMTP ile şifre sıfırlama ve geciken görev hatırlatması
- [ ] Takvim (planlanan görüşme)
- [ ] İsteğe bağlı CRM senkronu (dışarı aktarma önce)
- [ ] Bildirim: e-posta, sonra push

Çıkış: lead havuzu dışarıdan dolar; takip maili gider.

---

## Faz 4 — Ölçek ve kalite (sürekli)

- [ ] Bileşen ve uçtan uca tarayıcı testleri
- [ ] İzleme, hata raporlama, değiştirilemez audit
- [ ] Erişilebilirlik ve performans bütçesi
- [ ] Chrome Web Store yayını
- [ ] Çoklu dil (eklenti TR/EN altyapısı var; SPA Türkçe)

---

## Öncelik sırası

1. Faz 0 — demo güvenli açılır
2. Faz 1 — ortak veri olmadan satılmaz
3. Faz 2 — ürünü kopilot yapan fark
4. Faz 3 — operasyonel bağ
5. Faz 4 — sürdürülebilirlik

Yeni yönetim ekranı eklenmez. Eksik olan sunucu, kimlik ve gerçek kanal bağlantısıdır.

Tanıtım özeti: [docs/Sales-Copilot-Tanitim.pdf](docs/Sales-Copilot-Tanitim.pdf). Kaynak sayfa: [docs/tanitim.html](docs/tanitim.html).

## Bağımlılıklar

```text
Faz 0 (statik HTTPS)
  → Faz 1 (API + DB + auth)
      → Faz 2 (analiz servisi, eklenti API modu)
      → Faz 3 (webhook, SMTP; Faz 1 token’ına bağlı)
          → Faz 4 (izleme, mağaza, E2E)
```
