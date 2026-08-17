# Chrome Eklentisi API Sözleşmesi

Eklenti API modunda JSON tabanlı üç kaynak kullanır. Bütün uçlar `Authorization: Bearer <access-token>` başlığını kabul etmelidir.

## Aktif Müşteriler

```http
GET /api/customers?active=true&search=atlas
```

Yanıt doğrudan dizi veya `items` alanlı sayfalı nesne olabilir:

```json
{
  "items": [
    {
      "id": 1,
      "name": "Atlas Endüstri A.Ş.",
      "contact": "Mert Yalçın",
      "stage": "Teklif değerlendiriliyor",
      "score": 74
    }
  ]
}
```

Backend yalnızca oturumdaki kullanıcının görüntüleme yetkisi olan aktif müşterileri döndürmelidir.

## Canlı AI Analizi

```http
POST /api/meetings/analyze
Content-Type: application/json
```

## Canlı Transcript Senkronizasyonu

Eklenti aktif toplantı sırasında konuşma parçalarını müşteri kimliğiyle birlikte backend oturumuna gönderir. Web uygulamasındaki Toplantı Girdisi bu oturumu WebSocket/SSE ile izlemeli; yerel mock store aynı sözleşmeyi `upsertLiveMeetingSession` ile simüle eder.

```http
PUT /api/meeting-sessions/{sessionId}/transcript
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{
  "sessionId": "meet-abc-123",
  "customerId": 42,
  "platform": "google-meet",
  "status": "active",
  "segments": [
    { "speaker": "Satış", "role": "sales", "text": "Karar tarihiniz nedir?", "capturedAt": "2026-08-02T10:30:00.000Z" },
    { "speaker": "Müşteri", "role": "participant", "text": "Ay sonuna kadar karar vermek istiyoruz.", "capturedAt": "2026-08-02T10:30:03.000Z" }
  ]
}
```

```json
{
  "customerId": 1,
  "language": "tr",
  "transcriptSegments": [
    {
      "speaker": "Mert Yalçın",
      "text": "Fiyat ve geçiş süresi bizim için önemli.",
      "capturedAt": "2026-08-02T10:30:00.000Z"
    }
  ]
}
```

Beklenen yanıt:

```json
{
  "insights": [
    {
      "id": "price",
      "title": "Fiyat hassasiyeti",
      "question": "Bütçe değerlendirmesinde toplam sahip olma maliyetinin hangi kalemleri önemli?"
    }
  ]
}
```

Bu uç kısa aralıklarla çağrılabileceği için kullanıcı ve toplantı bazlı rate limit, istek birleştirme ve yapılandırılmış çıktı doğrulaması uygulanmalıdır.

## Toplantıyı Kaydetme

```http
POST /api/meetings
Content-Type: application/json
```

```json
{
  "customerId": 1,
  "source": "chrome-extension-google-meet",
  "meetingUrl": "https://meet.google.com/abc-defg-hij",
  "startedAt": "2026-08-02T10:00:00.000Z",
  "endedAt": "2026-08-02T10:45:00.000Z",
  "consentConfirmed": true,
  "summary": "Müşteri geçiş süresi ve bütçe kriterlerini değerlendirdi.",
  "actionItems": ["Teknik geçiş planı paylaşılacak."],
  "discussedTopics": ["Fiyat hassasiyeti", "Teknik uyum"],
  "wordCount": 540,
  "transcript": "Mert Yalçın: ...",
  "transcriptSegments": [],
  "insights": [],
  "qaInteractions": [
    {
      "id": "uuid",
      "question": "Entegrasyon ne kadar sürer?",
      "speaker": "Mert Yalçın",
      "speakerRole": "participant",
      "intent": "integration",
      "answer": "Standart entegrasyonlarda ilk teknik doğrulama...",
      "followUpQuestion": "Hangi sistemleri ve sürümleri kullanıyorsunuz?",
      "source": "knowledge/integrations.md",
      "confidence": "high",
      "feedback": "useful"
    }
  ]
}
```

Backend kayıtta şunları sunucu tarafından üretmelidir:

- `ownerId`: access token kullanıcısı veya yetkili atama
- Güvenilir IP ve user-agent
- Audit action: `meeting.extension_created`
- Aktivite: müşteri son teması
- Benzersiz toplantı kimliği
- Response status ve request correlation ID

Örnek yanıt:

```json
{
  "id": "meeting_01J...",
  "customerId": 1,
  "status": "saved",
  "createdAt": "2026-08-02T10:45:02.000Z"
}
```

## Hata Sözleşmesi

```json
{
  "error": {
    "code": "CUSTOMER_ACCESS_DENIED",
    "message": "Bu müşteri için toplantı kaydı oluşturma yetkiniz yok.",
    "requestId": "req_01J..."
  }
}
```

Önerilen durum kodları: `400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`.

Canlı testte SPA origin ile API origin farklıysa API sunucusu CORS ile SPA adresine izin vermelidir. İstemci kökü `runtime-config.js` → `apiBaseUrl` ve eklenti yan paneli aynı değeri kullanır. [DEPLOY.md](DEPLOY.md).
