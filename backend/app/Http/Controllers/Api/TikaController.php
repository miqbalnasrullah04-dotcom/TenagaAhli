<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expert;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class TikaController extends Controller
{
    /**
     * Handle TIKA chat requests
     */
    public function chat(Request $request)
    {
        // Validate request
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:500',
            'session_id' => 'required|string|max:100',
            'context' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'response' => 'Maaf, format pesan tidak valid. Silakan coba lagi.',
                'suggestions' => ['Cari Tenaga Ahli', 'Cara Daftar', 'Cara Penggunaan', 'Hubungi CS'],
                'experts' => []
            ], 422);
        }

        $message = trim($request->message);
        $sessionId = $request->session_id;
        $userIp = $request->ip();

        // Rate limiting - 20 requests per minute per IP
        $rateLimitKey = 'tika_chat:' . $userIp;
        if (RateLimiter::tooManyAttempts($rateLimitKey, 20)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);
            return response()->json([
                'response' => "Terlalu banyak permintaan dalam waktu singkat. Silakan tunggu {$seconds} detik lagi.",
                'suggestions' => [],
                'experts' => []
            ], 429);
        }

        RateLimiter::hit($rateLimitKey, 60);

        try {
            // Log chat for analytics & monitoring
            Log::channel('tika')->info('TIKA Chat', [
                'session_id' => $sessionId,
                'message' => $message,
                'ip' => $userIp,
                'context' => $request->context ?? [],
            ]);

            // Process message and generate response
            $response = $this->processMessage($message, $sessionId, $request);

            return response()->json($response);

        } catch (\Exception $e) {
            Log::error('TIKA Error', [
                'message' => $e->getMessage(),
                'session_id' => $sessionId,
                'user_message' => $message
            ]);

            return response()->json([
                'response' => 'Maaf, saya mengalami kendala teknis saat memproses pesan Anda. Silakan coba beberapa saat lagi atau hubungi Customer Service kami.',
                'suggestions' => ['Hubungi Customer Service', 'Cari Tenaga Ahli', 'Cara Daftar'],
                'experts' => []
            ], 500);
        }
    }

    /**
     * Process user message with strict domain scoping & safety guardrails
     */
    private function processMessage(string $rawMessage, string $sessionId, Request $request): array
    {
        $message = strtolower(trim($rawMessage));

        // ── 1. STRICT SECURITY & PRIVACY GUARDRAILS (Highest Priority) ──
        if ($this->isSecurityViolation($message)) {
            $res = $this->handleSecurityViolation();
            $res['response'] = str_replace(['**', '*'], '', $res['response']);
            return $res;
        }

        // ── 2. INTENT DETECTION ─────────────────────────────────────────
        $intent = $this->detectIntent($message);

        switch ($intent) {
            case 'payment_help':
                $res = $this->handlePaymentHelp();
                break;

            case 'greeting':
                $res = $this->handleGreeting();
                break;

            case 'register_help':
                $res = $this->handleRegisterHelp($message);
                break;

            case 'usage_help':
                $res = $this->handleUsageHelp($message);
                break;

            case 'consultation_help':
                $res = $this->handleConsultationHelp($message);
                break;

            case 'booking_help':
                $res = $this->handleBookingHelp($message);
                break;

            case 'marketplace_help':
                $res = $this->handleMarketplaceHelp();
                break;

            case 'customer_service':
                $res = $this->handleCustomerService();
                break;

            case 'about_website':
                $res = $this->handleAboutWebsite();
                break;

            case 'expert_search':
                $res = $this->handleExpertSearch($message);
                break;

            case 'out_of_context':
            default:
                $res = $this->handleOutOfContext($message);
                break;
        }

        if (isset($res['response'])) {
            $res['response'] = str_replace(['**', '*'], '', $res['response']);
        }

        return $res;
    }

    /**
     * Check if the user message attempts to probe sensitive/private data
     */
    private function isSecurityViolation(string $message): bool
    {
        // Don't flag official payment queries
        $isPaymentQuery = str_contains($message, 'cara bayar') ||
                          str_contains($message, 'cara pembayaran') ||
                          str_contains($message, 'metode pembayaran') ||
                          str_contains($message, 'transfer manual') ||
                          str_contains($message, 'midtrans') ||
                          str_contains($message, 'rekening resmi') ||
                          str_contains($message, 'rekening pembayaran');

        if ($isPaymentQuery) {
            return false;
        }

        $sensitivePatterns = [
            'password', 'kata sandi', 'sandi', 'passcode', 'pin', 'token rahasia', 'credential',
            'rekening pribadi', 'rekening ahli', 'no rek ahli', 'no rekening ahli', 'rekening admin',
            'no wa pribadi', 'nomor wa pribadi', 'wa pribadi', 'whatsapp pribadi', 'nomor telepon pribadi', 'no hp ahli', 'kontak wa ahli',
            'database', 'db password', 'hack', 'exploit', 'sql injection', 'dump table', 'admin secret',
            'curi data', 'minta sandi', 'bocorkan', 'api key', 'secret key'
        ];

        foreach ($sensitivePatterns as $pattern) {
            if (str_contains($message, $pattern)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Guardrail Response for sensitive/private data requests
     */
    private function handleSecurityViolation(): array
    {
        return [
            'response' => "Peringatan Privasi & Keamanan\n\n" .
                          "Demi menjaga keamanan dan privasi data seluruh pengguna, saya tidak dapat memberikan informasi sensitif seperti kata sandi (password), data pribadi tenaga ahli, maupun data rahasia sistem.\n\n" .
                          "TIKA adalah asisten virtual yang diperuntukkan untuk tanya-jawab informasi umum, panduan pendaftaran, cara pembayaran, dan rekomendasi tenaga ahli resmi di TenagaAhli.com.\n\n" .
                          "Seluruh proses komunikasi dan transaksi konsultasi wajib dilakukan secara aman melalui platform resmi kami.",
            'suggestions' => ['Cara Pembayaran', 'Cari Tenaga Ahli', 'Cara Konsultasi', 'Hubungi Customer Service'],
            'experts' => []
        ];
    }

    /**
     * Detect user intent based on keywords and patterns
     */
    private function detectIntent(string $message): string
    {
        // 0. Cara Pembayaran / Payment Guide (High Priority)
        $paymentPatterns = [
            'cara bayar', 'cara pembayaran', 'bagaimana bayar', 'bayar bagaimana',
            'metode pembayaran', 'sistem pembayaran', 'cara transfer', 'transfer manual',
            'midtrans', 'bayar manual', 'pembayaran manual', 'no rekening pembayaran',
            'nomor rekening pembayaran', 'rekening transfer', 'rekening resmi',
            'cara bayar paket', 'pembayaran paket', 'bayar konsultasi', 'biaya bayar',
            'unggah bukti transfer', 'upload bukti', 'bukti pembayaran', 'konfirmasi pembayaran',
            'bayar membership', 'bayar lewat apa'
        ];
        foreach ($paymentPatterns as $pattern) {
            if (str_contains($message, $pattern)) {
                return 'payment_help';
            }
        }

        // 1. Customer Service / Human Help
        $csPatterns = [
            'customer service', 'cs', 'admin', 'bantuan cs', 'hubungi admin',
            'hubungi cs', 'chat cs', 'whatsapp cs', 'wa cs', 'operator',
            'manusia', 'bicara dengan orang', 'kontak admin', 'bantuan langsung',
            'call center', 'helpdesk', 'support'
        ];
        foreach ($csPatterns as $pattern) {
            if (str_contains($message, $pattern)) {
                return 'customer_service';
            }
        }

        // 2. Greetings
        $greetingPatterns = ['halo', 'hai', 'hello', 'hi', 'selamat pagi', 'selamat siang', 'selamat sore', 'selamat malam', 'assalamualaikum', 'permisi', 'pagi', 'siang', 'sore', 'malam'];
        foreach ($greetingPatterns as $pattern) {
            if ($message === $pattern || str_starts_with($message, $pattern . ' ') || str_ends_with($message, ' ' . $pattern)) {
                return 'greeting';
            }
        }

        // 3. Cara Pendaftaran (Registration Guide)
        $registerPatterns = [
            'cara daftar', 'bagaimana daftar', 'cara mendaftar', 'bagaimana mendaftar',
            'daftar akun', 'registrasi', 'buat akun', 'bikin akun', 'daftar jadi ahli',
            'gabung jadi ahli', 'mendaftar tenaga ahli', 'syarat daftar', 'syarat menjadi ahli',
            'daftar surveyor', 'cara registrasi', 'langkah pendaftaran', 'buat profil ahli'
        ];
        foreach ($registerPatterns as $pattern) {
            if (str_contains($message, $pattern)) {
                return 'register_help';
            }
        }

        // 4. Cara Penggunaan Website (Usage Guide)
        $usagePatterns = [
            'cara penggunaan', 'cara pakai', 'panduan penggunaan', 'cara kerja website',
            'bagaimana menggunakan', 'cara menggunakan', 'panduan website', 'tutorial',
            'fitur apa saja', 'fitur website', 'cara cari ahli di peta', 'peta ahli',
            'menu apa saja', 'fungsi website'
        ];
        foreach ($usagePatterns as $pattern) {
            if (str_contains($message, $pattern)) {
                return 'usage_help';
            }
        }

        // 5. Cara Konsultasi (Consultation Help)
        $consultationPatterns = [
            'cara konsultasi', 'bagaimana konsultasi', 'konsultasi bagaimana',
            'proses konsultasi', 'konsultasi online', 'konsultasi chat', 'konsultasi zoom',
            'konsultasi video', 'konsultasi email', 'jenis konsultasi', 'alur konsultasi'
        ];
        foreach ($consultationPatterns as $pattern) {
            if (str_contains($message, $pattern)) {
                return 'consultation_help';
            }
        }

        // 6. Cara Booking / Pesan Konsultasi (Booking & Order Help)
        $bookingPatterns = [
            'cara booking', 'bagaimana booking', 'cara pesan', 'cara order',
            'booking bagaimana', 'proses booking', 'jadwal konsultasi',
            'biaya konsultasi', 'tarif konsultasi', 'harga konsultasi'
        ];
        foreach ($bookingPatterns as $pattern) {
            if (str_contains($message, $pattern)) {
                return 'booking_help';
            }
        }

        // 7. Marketplace & Produk Digital
        $marketplacePatterns = [
            'marketplace', 'produk', 'beli kajian', 'beli buku', 'jual dokumen',
            'produk digital', 'template amdal', 'laporan kajian'
        ];
        foreach ($marketplacePatterns as $pattern) {
            if (str_contains($message, $pattern)) {
                return 'marketplace_help';
            }
        }

        // 8. Tentang TenagaAhli.com (About Website)
        $aboutPatterns = [
            'tentang tenagaahli', 'apa itu tenagaahli', 'tenagaahli.com apa',
            'website ini tentang apa', 'profil perusahaan', 'legalitas'
        ];
        foreach ($aboutPatterns as $pattern) {
            if (str_contains($message, $pattern)) {
                return 'about_website';
            }
        }

        // 9. Expert Search / Recommendation (Explicit or Field Mention)
        $searchTriggers = [
            'cari', 'butuh', 'rekomendasi', 'ahli', 'tenaga ahli', 'surveyor', 'narasumber',
            'dosen', 'peneliti', 'instruktur', 'reviewer', 'lingkungan', 'amdal', 'klhs',
            'sipil', 'konstruksi', 'struktur', 'pertanian', 'kehutanan', 'geologi', 'hidrologi',
            'tata ruang', 'planologi', 'gis', 'pemetaan', 'drone', 'hukum', 'arsitek',
            'tambang', 'energi', 'ekonomi', 'teknik', 'jakarta', 'bandung', 'surabaya',
            'semarang', 'yogyakarta', 'bogor', 'medan', 'makassar', 'denpasar'
        ];
        foreach ($searchTriggers as $trigger) {
            if (str_contains($message, $trigger)) {
                return 'expert_search';
            }
        }

        // 10. Check for General In-Scope Terms
        $inScopeTerms = [
            'sertifikat', 'skripsi', 'jurnal', 'artikel', 'poin', 'membership',
            'paket', 'free', 'premium', 'platinum', 'verifikasi', 'pengajuan', 'proyek'
        ];
        foreach ($inScopeTerms as $term) {
            if (str_contains($message, $term)) {
                return 'usage_help';
            }
        }

        // 11. Everything else is Out of Context
        return 'out_of_context';
    }

    /**
     * Handle payment guide & payment methods request
     */
    private function handlePaymentHelp(): array
    {
        return [
            'response' => "Berikut panduan dan cara pembayaran resmi di TenagaAhli.com:\n\n" .
                          "Kami menyediakan 2 metode pembayaran yang bisa Anda pilih:\n\n" .
                          "1. Pembayaran Transfer Bank Manual & QRIS (Direkomendasikan)\n" .
                          "Transfer langsung ke rekening resmi a.n. Triwala Mitra Bestari:\n" .
                          "• Bank Mandiri: 133-0011-409-331\n" .
                          "• Bank BCA: 0954152045\n" .
                          "• Bank BNI: 0973607008\n" .
                          "• QRIS Gopay Merchant: TRIWALA DIGITAL, DIGITAL & KREATIF (NMID: ID1026596867808)\n\n" .
                          "Setelah melakukan transfer, masuk ke menu Pembayaran / Pesanan, unggah struk atau bukti transfer Anda, lalu kirimkan. Tim Admin kami akan memverifikasi dalam 1x24 jam kerja.\n\n" .
                          "2. Pembayaran Otomatis Midtrans (Opsi Kedua)\n" .
                          "Pembayaran online 24 jam dengan verifikasi otomatis via Virtual Account (Mandiri, BCA, BNI), GoPay, ShopeePay, dan Kartu Kredit.\n\n" .
                          "Langkah-langkah Pembayaran:\n" .
                          "1. Buka menu Pembayaran pada dashboard atau klik tombol Bayar Sekarang pada invoice/paket yang dipilih.\n" .
                          "2. Pada halaman pembayaran, tombol Transfer Manual berada di urutan atas (pertama) dan tombol Midtrans berada di bawahnya.\n" .
                          "3. Pilih metode yang diinginkan sesuai kenyamanan Anda.\n" .
                          "4. Ikuti instruksi pada layar sampai status pembayaran selesai.",
            'suggestions' => ['Hubungi Customer Service', 'Cara Konsultasi', 'Paket Keanggotaan'],
            'experts' => []
        ];
    }

    /**
     * Handle greeting messages
     */
    private function handleGreeting(): array
    {
        return [
            'response' => "Halo! Saya TIKA, asisten virtual resmi TenagaAhli.com. 😊\n\n" .
                          "Saya siap membantu Anda seputar:\n" .
                          "• Rekomendasi Tenaga Ahli bersertifikasi dan berpengalaman\n" .
                          "• Cara Pembayaran (Transfer Bank Manual & Midtrans)\n" .
                          "• Panduan Pendaftaran (Klien maupun Tenaga Ahli/Surveyor)\n" .
                          "• Cara Penggunaan Website & Panduan Booking Konsultasi\n" .
                          "• Informasi Layanan & Fitur Platform\n\n" .
                          "Ada yang bisa saya bantu untuk Anda hari ini?",
            'suggestions' => ['Cari Tenaga Ahli', 'Cara Pembayaran', 'Cara Daftar', 'Cara Konsultasi'],
            'experts' => []
        ];
    }

    /**
     * Handle registration guide requests
     */
    private function handleRegisterHelp(string $message): array
    {
        return [
            'response' => "Berikut panduan pendaftaran di TenagaAhli.com:\n\n" .
                          "1. Daftar Sebagai Pengguna / Klien (Pencari Ahli):\n" .
                          "• Klik tombol Daftar di pojok kanan atas website.\n" .
                          "• Pilih role Pengguna / Klien.\n" .
                          "• Isi data diri (Nama, Email, dan Kata Sandi baru).\n" .
                          "• Akun Anda langsung aktif dan siap digunakan untuk mencari serta berkonsultasi dengan ahli.\n\n" .
                          "2. Daftar Sebagai Tenaga Ahli / Surveyor:\n" .
                          "• Klik tombol Daftar Sebagai Ahli atau pilih role Tenaga Ahli.\n" .
                          "• Lengkapi profil biodata, bidang keahlian utama, spesialisasi, dan pengalaman kerja.\n" .
                          "• Unggah berkas pendukung (Ijazah, CV/Portofolio, Sertifikat Keahlian).\n" .
                          "• Pilih paket keanggotaan (Free, Ekonomis, atau Eksklusif).\n" .
                          "• Tim verifikator admin akan meninjau berkas Anda (1x24 jam). Setelah diverifikasi, profil Anda akan tayang secara publik di platform.\n\n" .
                          "Ingin mendaftar sebagai Klien atau Tenaga Ahli?",
            'suggestions' => ['Cari Tenaga Ahli', 'Cara Pembayaran', 'Cara Konsultasi', 'Hubungi CS'],
            'experts' => []
        ];
    }

    /**
     * Handle website usage guide requests
     */
    private function handleUsageHelp(string $message): array
    {
        return [
            'response' => "Berikut panduan cara penggunaan platform TenagaAhli.com:\n\n" .
                          "1. Mencari Tenaga Ahli:\n" .
                          "• Gunakan menu Tenaga Ahli untuk filter berdasarkan bidang keahlian, kriteria, atau kota.\n" .
                          "• Gunakan menu Peta Ahli untuk melihat sebaran lokasi para ahli secara interaktif di peta.\n\n" .
                          "2. Berkonsultasi:\n" .
                          "• Buka halaman profil ahli yang sesuai.\n" .
                          "• Klik tombol Konsultasi dan pilih metode yang diinginkan (Chat, Email, atau Video Call).\n" .
                          "• Tentukan jadwal sesi dan lakukan pembayaran resmi via sistem platform.\n\n" .
                          "3. Metode Pembayaran:\n" .
                          "• Tersedia 2 opsi: Transfer Bank Manual & QRIS (Mandiri, BCA, BNI, QRIS TRIWALA DIGITAL) serta Pembayaran Otomatis Midtrans.\n\n" .
                          "4. Marketplace Produk:\n" .
                          "• Anda dapat membeli dokumen kajian, template, buku, atau karya ilmiah para ahli di menu Marketplace.\n\n" .
                          "5. Pengajuan Studi & Proyek:\n" .
                          "• Instansi atau perusahaan dapat mengajukan kebutuhan studi khusus melalui menu Pengajuan.",
            'suggestions' => ['Cari Tenaga Ahli', 'Cara Pembayaran', 'Cara Booking', 'Hubungi Customer Service'],
            'experts' => []
        ];
    }

    /**
     * Handle consultation help requests
     */
    private function handleConsultationHelp(string $message): array
    {
        return [
            'response' => "TenagaAhli.com menyediakan 3 media konsultasi resmi yang aman dan fleksibel:\n\n" .
                          "• Chat Teks — Diskusi interaktif langsung via ruang chat platform kami.\n" .
                          "• Email — Konsultasi mendalam dengan format telaah dokumen & korespondensi tertulis.\n" .
                          "• Video Call — Tatap muka online (Zoom/Google Meet) untuk presentasi dan pembahasan komprehensif.\n\n" .
                          "Keunggulan Konsultasi di TenagaAhli.com:\n" .
                          "✓ Seluruh tenaga ahli telah diverifikasi keaslian ijazah & sertifikatnya.\n" .
                          "✓ Pembayaran dijamin aman melalui rekening resmi platform (Transfer Manual atau Midtrans).\n" .
                          "✓ Anda dapat memberikan rating & ulasan setelah sesi selesai.",
            'suggestions' => ['Cara Pembayaran', 'Cari Tenaga Ahli', 'Cara Booking Konsultasi', 'Hubungi CS'],
            'experts' => []
        ];
    }

    /**
     * Handle booking help requests
     */
    private function handleBookingHelp(string $message): array
    {
        return [
            'response' => "Berikut langkah-langkah booking sesi konsultasi:\n\n" .
                          "Langkah-langkah:\n" .
                          "1. Buka halaman Profil Tenaga Ahli yang Anda tuju.\n" .
                          "2. Klik tombol Konsultasi pada profil ahli.\n" .
                          "3. Pilih jenis layanan (Chat / Email / Video Call).\n" .
                          "4. Isi deskripsi ringkas topik kebutuhan Anda dan pilih jadwal yang tersedia.\n" .
                          "5. Lakukan pembayaran resmi melalui Transfer Bank Manual atau Pembayaran Otomatis Midtrans.\n" .
                          "6. Setelah terkonfirmasi, Anda akan menerima tautan/ruang konsultasi sesuai jadwal.",
            'suggestions' => ['Cara Pembayaran', 'Cari Tenaga Ahli', 'Cara Konsultasi', 'Hubungi Customer Service'],
            'experts' => []
        ];
    }

    /**
     * Handle marketplace help requests
     */
    private function handleMarketplaceHelp(): array
    {
        return [
            'response' => "Di menu Marketplace TenagaAhli.com, Anda dapat:\n\n" .
                          "• Membeli Dokumen Kajian, Template Laporan, E-Book, dan Buku Ilmiah resmi karya para tenaga ahli.\n" .
                          "• Tenaga Ahli juga dapat menjual produk digital atau fisik hasil penelitian mereka kepada publik.\n" .
                          "• Seluruh proses transaksi dan unduhan file dijamin aman melalui sistem platform kami.",
            'suggestions' => ['Cari Tenaga Ahli', 'Cara Pembayaran', 'Cara Penggunaan', 'Hubungi CS'],
            'experts' => []
        ];
    }

    /**
     * Handle about website requests
     */
    private function handleAboutWebsite(): array
    {
        return [
            'response' => "TenagaAhli.com adalah platform direktori profesional dan konsultasi terdepan di Indonesia yang menghubungkan individu, perusahaan, dan instansi pemerintah dengan para Tenaga Ahli, Peneliti, Narasumber, dan Surveyor bersertifikasi.\n\n" .
                          "Layanan Utama Kami:\n" .
                          "• Pencarian Ahli Cerdas: Direktori lengkap berbasis spesialisasi, rating, dan peta lokasi.\n" .
                          "• Konsultasi Online: Chat, Email, dan Video Call terintegrasi.\n" .
                          "• Marketplace Pengetahuan: Produk digital & kajian dari para pakar.\n" .
                          "• Verifikasi Ketat: Menjamin kompetensi dan legalitas sertifikasi setiap ahli.",
            'suggestions' => ['Cari Tenaga Ahli', 'Cara Pembayaran', 'Cara Daftar', 'Hubungi Customer Service'],
            'experts' => []
        ];
    }

    /**
     * Handle Customer Service assistance requests
     */
    private function handleCustomerService(): array
    {
        return [
            'response' => "Untuk bantuan langsung dari tim Customer Service resmi TenagaAhli.com, Anda dapat:\n\n" .
                          "• Beralih ke tab Customer Service di bagian atas panel chat ini.\n" .
                          "• Menghubungi WhatsApp resmi kami di nomor: 0811-1520-900\n\n" .
                          "Tim kami siap membantu kendala teknis, verifikasi akun, pembayaran, maupun kerja sama korporat pada jam operasional.",
            'suggestions' => ['Buka Customer Service', 'Chat WhatsApp CS', 'Cara Pembayaran', 'Cari Tenaga Ahli'],
            'experts' => []
        ];
    }

    /**
     * Handle expert search and dynamic database recommendations
     */
    private function handleExpertSearch(string $message): array
    {
        // Extract search keywords from message
        $stopwords = [
            'saya', 'mau', 'cari', 'carikan', 'butuh', 'tolong', 'rekomendasi', 'rekomendasikan',
            'ahli', 'tenaga ahli', 'ada', 'yang', 'bisa', 'di', 'untuk', 'dengan', 'dong', 'tentang',
            'minta', 'info', 'daftar', 'apakah', 'siapa', 'saja', 'terbaik', 'profesional', 'halo', 'tika'
        ];

        $cleanedMessage = $message;
        foreach ($stopwords as $word) {
            $cleanedMessage = preg_replace('/\b' . preg_quote($word, '/') . '\b/i', ' ', $cleanedMessage);
        }
        $cleanedMessage = trim(preg_replace('/\s+/', ' ', $cleanedMessage));

        $expertsQuery = Expert::where('profile_status', 'aktif')
            ->where('verified', true)
            ->orderByDesc('rating')
            ->limit(3);

        $matchedField = null;

        if (!empty($cleanedMessage) && strlen($cleanedMessage) >= 2) {
            $matchedField = $cleanedMessage;
            $terms = explode(' ', $cleanedMessage);

            $expertsQuery->where(function ($q) use ($terms, $cleanedMessage) {
                $q->where('field', 'like', "%{$cleanedMessage}%")
                  ->orWhere('name', 'like', "%{$cleanedMessage}%")
                  ->orWhere('kriteria', 'like', "%{$cleanedMessage}%")
                  ->orWhere('location', 'like', "%{$cleanedMessage}%")
                  ->orWhere('alamat_kota', 'like', "%{$cleanedMessage}%")
                  ->orWhere('alamat_provinsi', 'like', "%{$cleanedMessage}%")
                  ->orWhere('bidang_utama', 'like', "%{$cleanedMessage}%")
                  ->orWhere('spesialisasi', 'like', "%{$cleanedMessage}%")
                  ->orWhere('kompetensi', 'like', "%{$cleanedMessage}%")
                  ->orWhere('keahlian', 'like', "%{$cleanedMessage}%");

                foreach ($terms as $term) {
                    if (strlen($term) >= 3) {
                        $q->orWhere('field', 'like', "%{$term}%")
                          ->orWhere('kriteria', 'like', "%{$term}%")
                          ->orWhere('name', 'like', "%{$term}%")
                          ->orWhere('location', 'like', "%{$term}%");
                    }
                }
            });
        }

        $experts = $expertsQuery->with(['package', 'user'])->get();

        // Fallback: If no exact verified matches, try all active experts or top featured
        if ($experts->isEmpty() && !empty($cleanedMessage)) {
            $fallbackQuery = Expert::where('profile_status', 'aktif')
                ->where(function ($q) use ($cleanedMessage) {
                    $q->where('field', 'like', "%{$cleanedMessage}%")
                      ->orWhere('name', 'like', "%{$cleanedMessage}%")
                      ->orWhere('kriteria', 'like', "%{$cleanedMessage}%");
                })
                ->with(['package', 'user'])
                ->orderBy('id', 'asc')
                ->limit(3);
            $experts = $fallbackQuery->get();
        }

        // Final fallback: If still empty or query was generic
        if ($experts->isEmpty()) {
            $experts = Expert::where('profile_status', 'aktif')
                ->where('verified', true)
                ->with(['package', 'user'])
                ->orderBy('id', 'asc')
                ->limit(3)
                ->get();
        }

        // Sort: Eksklusif -> Ekonomis -> Free, lalu yang daftar paling pertama (id ASC)
        $experts = $experts->sort(function ($a, $b) {
            $pkgA = strtolower(optional($a->package)->name ?? optional($a->package)->slug ?? optional($a->user)->package ?? '');
            $pkgB = strtolower(optional($b->package)->name ?? optional($b->package)->slug ?? optional($b->user)->package ?? '');
            $isPlatA = str_contains($pkgA, 'platinum') || str_contains($pkgA, 'eksklusif') || str_contains($pkgA, 'esklusif') || str_contains($pkgA, 'ekslusif');
            $isPlatB = str_contains($pkgB, 'platinum') || str_contains($pkgB, 'eksklusif') || str_contains($pkgB, 'esklusif') || str_contains($pkgB, 'ekslusif');
            $weightA = $isPlatA ? 2 : ((optional($a->package)->price > 0 || $a->featured || str_contains($pkgA, 'premium') || str_contains($pkgA, 'ekonomis')) ? 1 : 0);
            $weightB = $isPlatB ? 2 : ((optional($b->package)->price > 0 || $b->featured || str_contains($pkgB, 'premium') || str_contains($pkgB, 'ekonomis')) ? 1 : 0);

            if ($weightA !== $weightB) {
                return $weightB <=> $weightA;
            }
            return $a->id <=> $b->id;
        })->values();

        $expertList = $experts->map(function ($expert) {
            return [
                'id' => $expert->id,
                'slug' => $expert->slug,
                'name' => $expert->name,
                'field' => $expert->field ?: 'Tenaga Ahli Profesional',
                'location' => $expert->location ?: ($expert->alamat_kota ?: 'Indonesia'),
                'rating' => round($expert->rating ?: 5.0, 1),
                'verified' => (bool) $expert->verified,
                'photo' => $expert->photo ? (filter_var($expert->photo, FILTER_VALIDATE_URL) 
                    ? $expert->photo 
                    : asset('storage/' . $expert->photo)) 
                    : null,
            ];
        });

        if ($matchedField && $expertList->isNotEmpty()) {
            $response = "Berikut beberapa rekomendasi tenaga ahli terbaik yang sesuai dengan pencarian Anda ({$matchedField}):";
        } elseif ($expertList->isNotEmpty()) {
            $response = "Berikut beberapa rekomendasi tenaga ahli unggulan dan terverifikasi di TenagaAhli.com:";
        } else {
            $response = "Saat ini belum ditemukan tenaga ahli yang sesuai dengan kata kunci tersebut. Anda dapat menjelajahi menu Tenaga Ahli atau Peta Ahli untuk melihat seluruh direktori ahli kami.";
        }

        return [
            'response' => $response,
            'suggestions' => ['Cari bidang lain', 'Cara Pembayaran', 'Cara Konsultasi', 'Lihat Peta Ahli'],
            'experts' => $expertList->toArray()
        ];
    }

    /**
     * Handle out of context messages (Strict rejection)
     */
    private function handleOutOfContext(string $message): array
    {
        return [
            'response' => "Maaf, pertanyaan Anda berada di luar konteks layanan kami.\n\n" .
                          "Saya adalah TIKA, asisten virtual khusus platform TenagaAhli.com. Saya hanya dapat membantu menjawab pertanyaan seputar:\n" .
                          "• Rekomendasi & Pencarian Tenaga Ahli (AMDAL, Lingkungan, Sipil, Pertanian, Geologi, Surveyor, dll.)\n" .
                          "• Panduan Pendaftaran (Klien / Tenaga Ahli / Surveyor)\n" .
                          "• Cara Pembayaran (Transfer Bank Manual & Midtrans)\n" .
                          "• Cara Penggunaan Website & Panduan Booking Konsultasi\n" .
                          "• Informasi Fitur & Layanan Platform TenagaAhli.com\n\n" .
                          "Silakan ajukan pertanyaan yang berkaitan dengan tenaga ahli atau layanan kami ya!",
            'suggestions' => ['Cari Tenaga Ahli', 'Cara Pembayaran', 'Cara Daftar', 'Cara Konsultasi'],
            'experts' => []
        ];
    }

    /**
     * Get TIKA statistics (for admin)
     */
    public function statistics(Request $request)
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $stats = Cache::remember('tika_stats', 3600, function () {
                return [
                    'total_conversations' => 0,
                    'total_messages' => 0,
                    'active_sessions_today' => 0,
                    'top_intents' => [],
                    'expert_search_queries' => 0,
                ];
            });

            return response()->json($stats);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to get statistics'], 500);
        }
    }
}