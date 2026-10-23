# TIKA - AI Chatbot untuk TenagaAhli.com

TIKA (Tenaga Ahli Intelligence & Knowledge Assistant) adalah asisten virtual AI yang membantu pengguna menemukan tenaga ahli, memahami layanan, dan menggunakan fitur konsultasi di TenagaAhli.com.

## 🚀 Fitur

### Frontend
- **Floating Chat Button** - Tombol mengambang di pojok kanan bawah
- **Responsive Chat Panel** - Panel chat yang responsive untuk desktop dan mobile
- **Real-time Messaging** - Pesan real-time dengan typing indicator
- **Message Persistence** - Riwayat chat tersimpan di localStorage
- **Quick Replies** - Tombol quick reply untuk pertanyaan umum
- **Expert Recommendations** - Tampilkan rekomendasi tenaga ahli dengan tombol "Lihat Profil"
- **Auto-Clear Chat** - Chat otomatis terhapus setelah 3 jam untuk privacy
- **Clear Notifications** - Peringatan 5 menit sebelum auto-clear
- **Countdown Timer** - Timer countdown di header chat panel
- **Rate Limiting** - Pembatasan 10 pesan per menit per user
- **Clear Chat** - Tombol hapus riwayat percakapan manual

### Backend
- **Intent Detection** - Deteksi niat pengguna dari pesan
- **Expert Search** - Pencarian tenaga ahli berdasarkan keyword
- **Multi-scenario Responses** - Respon untuk berbagai skenario (greeting, help, search)
- **Rate Limiting** - 15 request per menit per IP
- **Logging** - Log percakapan untuk analitik
- **Admin Statistics** - Statistik penggunaan untuk admin

## 📁 Struktur File

### Frontend
```
src/
├── components/
│   ├── TikaChatbot.jsx          # Komponen utama chatbot
│   ├── Layout.jsx               # Layout dengan TikaProvider
│   └── DashboardLayout.jsx      # Dashboard layout dengan TikaProvider
└── context/
    └── TikaContext.jsx          # State management untuk TIKA
```

### Backend
```
app/
├── Http/Controllers/Api/
│   ├── TikaController.php       # Controller utama TIKA
│   └── TikaTestController.php   # Controller untuk testing
└── config/
    └── logging.php              # Konfigurasi logging channel 'tika'
```

## 🔧 Instalasi & Setup

### 1. Frontend Setup
Tidak ada instalasi tambahan diperlukan. TIKA sudah terintegrasi dengan komponen `Layout` dan `DashboardLayout`.

### 2. Backend Setup
Pastikan logging channel 'tika' sudah dikonfigurasi di `config/logging.php`:

```php
'tika' => [
    'driver' => 'daily',
    'path' => storage_path('logs/tika.log'),
    'level' => env('LOG_LEVEL', 'debug'),
    'days' => env('LOG_DAILY_DAYS', 14),
    'replace_placeholders' => true,
],
```

### 3. Route Setup
Routes TIKA sudah ditambahkan di `routes/api.php`:
- `POST /api/tika/chat` - Endpoint utama chat
- `GET /api/tika/test` - Testing endpoint
- `GET /api/admin/tika/statistics` - Admin statistics (auth required)

## 🧪 Testing

### 1. Manual Testing
Akses website dan klik tombol chat TIKA di pojok kanan bawah. Coba berbagai pesan:

**Greeting:**
- "Halo TIKA"
- "Hai, selamat pagi"

**Expert Search:**
- "Cari tenaga ahli lingkungan"
- "Butuh ahli AMDAL"
- "Rekomendasi ahli konstruksi"

**Help Requests:**
- "Cara konsultasi"
- "Bagaimana booking?"
- "Tentang TenagaAhli.com"

### 2. API Testing
Test endpoint TIKA melalui:

```bash
# Test endpoint
curl -X GET http://localhost:8000/api/tika/test

# Chat endpoint
curl -X POST http://localhost:8000/api/tika/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Halo TIKA",
    "session_id": "test_session_123",
    "context": {}
  }'
```

### 3. Frontend Testing Scenarios

**Scenario 1: First Time User**
1. Buka website
2. Chat button muncul di pojok kanan bawah
3. Klik button → panel chat terbuka
4. Welcome message dan quick replies tampil

**Scenario 2: Expert Search**
1. Ketik "Cari tenaga ahli lingkungan"
2. TIKA menampilkan expert recommendations
3. Tombol "Lihat Profil" berfungsi
4. Suggestions relevan ditampilkan

**Scenario 3: Rate Limiting**
1. Kirim lebih dari 10 pesan dalam 1 menit
2. TIKA menampilkan pesan rate limit
3. Tunggu hingga reset dan coba lagi

**Scenario 4: Auto-Clear Testing**
1. Mulai chat baru dengan TIKA
2. Lihat welcome message dengan informasi auto-clear
3. Header menampilkan countdown timer (3j 0m)
4. Tunggu atau ubah localStorage timestamp untuk testing
5. Warning muncul 5 menit sebelum clear
6. Chat otomatis terhapus setelah 3 jam

**Scenario 5: Mobile Responsiveness**
1. Buka di perangkat mobile
2. Chat panel responsive
3. Tombol dan teks readable
4. Scroll berfungsi dengan baik

## 🔐 Privacy & Auto-Clear Feature

TIKA mengimplementasikan sistem auto-clear untuk melindungi privasi pengguna:

### ⏰ Auto-Clear Schedule
- **Durasi**: Chat otomatis terhapus setelah **3 jam** sejak pesan pertama
- **Warning**: Peringatan muncul **5 menit** sebelum auto-clear
- **Countdown**: Timer di header chat panel menunjukkan waktu sisa

### 🔔 Notifikasi System
1. **Welcome Message**: Informasi auto-clear di pesan pembuka
2. **Countdown Timer**: Header chat panel menampilkan waktu sisa
   - Normal: "Chat terhapus otomatis dalam Xj Xm"
   - Warning: "⚠️ Chat akan terhapus dalam Xm" (5 menit terakhir)
3. **Warning Message**: Pesan system 5 menit sebelum clear
4. **Clear Notification**: Pesan konfirmasi setelah chat terhapus

### 💾 Data Storage
- **LocalStorage**: Chat tersimpan dengan timestamp
- **Auto-Validation**: Data expired otomatis dihapus saat reload
- **Manual Clear**: User dapat menghapus chat kapan saja

### 🎯 Benefits
- **Privacy Protection**: Data percakapan tidak tersimpan permanen
- **Fresh Experience**: Setiap sesi baru mulai clean
- **Compliance**: Sesuai dengan best practice data retention
- **User Control**: Transparansi penuh tentang data lifecycle

## 🔍 Intent Detection

TIKA dapat mendeteksi intent berikut:

- **greeting** - Salam dan sapaan
- **expert_search** - Pencarian tenaga ahli
- **consultation_help** - Bantuan konsultasi
- **booking_help** - Bantuan booking
- **about_website** - Tentang TenagaAhli.com
- **expert_field_question** - Pertanyaan bidang keahlian
- **general** - Pertanyaan umum/fallback

## 📊 Response Types

### 1. Text Response
Respon text standar dengan emoji untuk engagement.

### 2. Suggestions
Array suggestion buttons untuk quick replies.

### 3. Expert Recommendations
Array objek expert dengan:
- `id`, `slug`, `name`, `field`
- `location`, `rating`, `verified`
- `photo` (fallback ke logo TIKA)

## 🚨 Error Handling

### Frontend
- Network error → Pesan error user-friendly
- Rate limiting → Informasi tunggu
- Invalid response → Fallback message

### Backend
- Validation error → Status 422
- Rate limiting → Status 429
- Server error → Status 500 dengan logging

## 📝 Logging

TIKA mencatat aktivitas di file log terpisah:
- File: `storage/logs/tika-YYYY-MM-DD.log`
- Format: JSON dengan timestamp, session_id, message, IP, context
- Retention: 14 hari

Sample log entry:
```json
{
  "timestamp": "2024-08-21 10:30:15",
  "session_id": "session_1692609015_abc123",
  "message": "Cari tenaga ahli lingkungan",
  "ip": "192.168.1.1",
  "context": {
    "current_path": "/",
    "user_agent": "Mozilla/5.0..."
  }
}
```

## 🔐 Security Features

1. **Rate Limiting**: 15 request/menit per IP, 10 pesan/menit per user
2. **Input Validation**: Maksimal 500 karakter per pesan
3. **XSS Protection**: Input sanitization
4. **CORS**: Configured sesuai FRONTEND_URL
5. **Admin Only**: Statistics endpoint butuh authentication

## 🎨 UI/UX Features

1. **Brand Consistency**: Menggunakan color palette website (#8B4513, #2E5E3B)
2. **Logo Integration**: Logo "new logo 2.png" di avatar TIKA
3. **Responsive Design**: Adaptif untuk mobile dan desktop
4. **Accessibility**: ARIA labels dan keyboard navigation
5. **Loading States**: Typing indicator dan disabled states

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database permissions for Expert model
- [ ] Log directory writable
- [ ] Frontend build includes TIKA components
- [ ] API routes accessible
- [ ] Rate limiting configured
- [ ] CORS headers configured
- [ ] Logo assets available

## 🔧 Troubleshooting

### Chat Button Tidak Muncul
1. Check TikaProvider di Layout/DashboardLayout
2. Verify TikaChatbot import
3. Check console errors

### API Error 500
1. Check Laravel logs
2. Verify Expert model accessible
3. Check database connection

### Rate Limiting Terlalu Ketat
1. Edit rate limit values di TikaController
2. Clear cache: `php artisan cache:clear`

### Expert Search Tidak Ada Hasil
1. Check database: `Expert::where('profile_status', 'aktif')->count()`
2. Verify expert data dan field mappings

## 📈 Future Enhancements

1. **AI Integration**: Integrasi dengan OpenAI atau AI service lainnya
2. **Voice Support**: Voice input/output
3. **Multilingual**: Support bahasa Inggris
4. **Advanced Analytics**: Detailed conversation analytics
5. **Learning System**: Machine learning dari percakapan
6. **Integration**: Connect dengan sistem booking otomatis

---

**Developed by**: Kiro AI Assistant  
**Version**: 1.0  
**Last Updated**: August 2024