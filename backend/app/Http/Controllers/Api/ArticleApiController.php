<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ArticleApiController extends Controller
{
    /**
     * Auto-clean expired articles from database and storage
     */
    protected function cleanupExpiredArticles()
    {
        try {
            $expiredArticles = Article::with('user')
                ->whereNotNull('expires_at')
                ->where('expires_at', '<', now())
                ->get();

            foreach ($expiredArticles as $expArt) {
                // Jika artikel/informasi proyek dipasang oleh admin, jangan dihapus otomatis
                if ($expArt->user && $expArt->user->role === 'admin') {
                    $expArt->update(['expires_at' => null]);
                    continue;
                }

                if ($expArt->thumbnail && !str_starts_with($expArt->thumbnail, 'http')) {
                    Storage::disk('public')->delete($expArt->thumbnail);
                }
                if ($expArt->payment_proof && !str_starts_with($expArt->payment_proof, 'http')) {
                    Storage::disk('public')->delete($expArt->payment_proof);
                }
                $expArt->delete();
            }
        } catch (\Throwable $e) {
            \Log::warning('Gagal membersihkan artikel kedaluwarsa: ' . $e->getMessage());
        }
    }

    /**
     * Public: Get published articles (strictly newest first, no top-news priority)
     */
    public function index(Request $request)
    {
        $this->cleanupExpiredArticles();

        $query = Article::query()
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->where(function ($q) {
                $q->whereNull('status')
                  ->orWhere('status', 'published')
                  ->orWhere('status', 'aktif');
            })
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>=', now());
            })
            ->orderByDesc('published_at');

        if ($request->filled('category') || $request->filled('categories')) {
            $rawCat = $request->input('categories', $request->input('category'));
            $cats = is_array($rawCat)
                ? array_map('trim', array_map('strtoupper', $rawCat))
                : array_map('trim', explode(',', strtoupper((string) $rawCat)));

            $cats = array_values(array_filter($cats));

            if (!empty($cats)) {
                $query->where(function ($q) use ($cats) {
                    $q->whereIn(\DB::raw('UPPER(category)'), $cats);
                    if (in_array('BERITA', $cats)) {
                        $q->orWhereNull('category')
                          ->orWhere('category', '');
                    }
                });
            }
        }

        if ($request->filled('q') || $request->filled('keyword')) {
            $kw = $request->input('q', $request->input('keyword'));
            $query->where(function ($q) use ($kw) {
                $q->where('title', 'like', "%{$kw}%")
                  ->orWhere('excerpt', 'like', "%{$kw}%")
                  ->orWhere('category', 'like', "%{$kw}%")
                  ->orWhere('author_name', 'like', "%{$kw}%");
            });
        }

        if ($request->filled('limit')) {
            $query->limit((int) $request->limit);
        }

        $articles = $query->get()->map(fn (Article $a) => [
            'id'           => $a->id,
            'user_id'      => $a->user_id,
            'author_name'  => $a->author_name,
            'slug'         => $a->slug,
            'title'        => $a->title,
            'category'     => $a->category ?? 'BERITA',
            'source'       => $a->source,
            'is_top_news'  => false, // Top news removed, all newest first
            'excerpt'      => $a->excerpt,
            'content'      => $a->content,
            'thumbnail'    => $a->thumbnail_url,
            'published_at' => optional($a->published_at)->format('Y-m-d'),
            'expires_at'   => optional($a->expires_at)->format('Y-m-d H:i'),
            'created_at'   => optional($a->created_at)->format('Y-m-d H:i'),
        ]);

        return response()->json($articles);
    }

    /**
     * Public: Show single article by slug or id
     */
    public function show(string $slug)
    {
        $this->cleanupExpiredArticles();

        $article = Article::where(function ($q) use ($slug) {
                $q->where('slug', $slug)->orWhere('id', $slug);
            })
            ->where(function ($q) {
                $q->whereNull('status')
                  ->orWhere('status', 'published')
                  ->orWhere('status', 'aktif');
            })
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>=', now());
            })
            ->firstOrFail();

        return response()->json([
            'id'           => $article->id,
            'user_id'      => $article->user_id,
            'author_name'  => $article->author_name,
            'slug'         => $article->slug,
            'title'        => $article->title,
            'category'     => $article->category ?? 'BERITA',
            'source'       => $article->source,
            'is_top_news'  => false,
            'excerpt'      => $article->excerpt,
            'content'      => $article->content,
            'thumbnail'    => $article->thumbnail_url,
            'published_at' => optional($article->published_at)->format('Y-m-d'),
            'expires_at'   => optional($article->expires_at)->format('Y-m-d H:i'),
            'created_at'   => optional($article->created_at)->format('Y-m-d H:i'),
        ]);
    }

    /**
     * Authenticated User (Klien / Tenaga Ahli / Surveyor): Get their own articles
     */
    public function myArticles(Request $request)
    {
        $this->cleanupExpiredArticles();
        $user = $request->user();

        $articles = Article::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Article $a) => [
                'id'                 => $a->id,
                'reference_code'     => $a->reference_code,
                'slug'               => $a->slug,
                'title'              => $a->title,
                'category'           => $a->category ?? 'BERITA',
                'source'             => $a->source,
                'status'             => $a->status ?? 'menunggu_verifikasi',
                'price'              => $a->price ?? 10000,
                'snap_token'         => $a->snap_token,
                'payment_proof'      => $a->payment_proof,
                'payment_proof_url'  => $a->payment_proof_url,
                'payment_status'     => $a->payment_status ?? 'pending',
                'rejection_reason'   => $a->rejection_reason,
                'excerpt'            => $a->excerpt,
                'content'            => $a->content,
                'thumbnail'          => $a->thumbnail_url,
                'author_name'        => $a->author_name ?? $user->name,
                'published_at'       => optional($a->published_at)->format('Y-m-d H:i'),
                'expires_at'         => optional($a->expires_at)->format('Y-m-d H:i'),
                'is_expired'         => $a->is_expired,
                'created_at'         => optional($a->created_at)->format('Y-m-d H:i'),
            ]);

        return response()->json([
            'success' => true,
            'count'   => $articles->count(),
            'data'    => $articles,
        ]);
    }

    /**
     * Authenticated User: Get their single article detail
     */
    public function myArticleDetail(Request $request, $id)
    {
        $this->cleanupExpiredArticles();
        $user = $request->user();

        $article = Article::where('user_id', $user->id)
            ->where(function ($q) use ($id) {
                $q->where('id', $id)->orWhere('slug', $id)->orWhere('reference_code', $id);
            })
            ->firstOrFail();

        return response()->json([
            'id'                 => $article->id,
            'reference_code'     => $article->reference_code,
            'slug'               => $article->slug,
            'title'              => $article->title,
            'category'           => $article->category ?? 'BERITA',
            'source'             => $article->source,
            'status'             => $article->status ?? 'menunggu_verifikasi',
            'price'              => $article->price ?? 10000,
            'snap_token'         => $article->snap_token,
            'payment_proof'      => $article->payment_proof,
            'payment_proof_url'  => $article->payment_proof_url,
            'payment_status'     => $article->payment_status ?? 'pending',
            'rejection_reason'   => $article->rejection_reason,
            'excerpt'            => $article->excerpt,
            'content'            => $article->content,
            'thumbnail'          => $article->thumbnail_url,
            'author_name'        => $article->author_name ?? $user->name,
            'published_at'       => optional($article->published_at)->format('Y-m-d H:i'),
            'expires_at'         => optional($article->expires_at)->format('Y-m-d H:i'),
            'is_expired'         => $article->is_expired,
            'created_at'         => optional($article->created_at)->format('Y-m-d H:i'),
        ]);
    }

    /**
     * Get / Refresh Midtrans Snap Token for Article
     */
    public function getSnapToken(Request $request, $id)
    {
        $user = $request->user();
        $article = Article::where(function ($q) use ($id) {
            $q->where('id', $id)->orWhere('slug', $id)->orWhere('reference_code', $id);
        })->firstOrFail();

        if ($article->payment_status === 'verified') {
            return response()->json(['message' => 'Berita ini sudah dibayar dan aktif.'], 400);
        }

        if (empty($article->reference_code)) {
            $refCode = 'ART-' . now()->format('Ymd') . '-' . strtoupper(\Illuminate\Support\Str::random(6));
            $article->update(['reference_code' => $refCode]);
        }

        $serverKey = config('services.midtrans.server_key');
        \Midtrans\Config::$serverKey = $serverKey;
        \Midtrans\Config::$isProduction = config('services.midtrans.is_production', false);
        \Midtrans\Config::$isSanitized = config('services.midtrans.is_sanitized', true);
        \Midtrans\Config::$is3ds = config('services.midtrans.is_3ds', true);

        $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');

        $params = [
            'transaction_details' => [
                'order_id' => $article->reference_code,
                'gross_amount' => 10000,
            ],
            'customer_details' => [
                'first_name' => $user?->name ?? 'Klien TenagaAhli',
                'email' => $user?->email ?? 'klien@tenagaahli.com',
                'phone' => $user?->phone ?? '',
            ],
            'item_details' => [
                [
                    'id' => 'ART-10K-1W',
                    'price' => 10000,
                    'quantity' => 1,
                    'name' => 'Pasang Berita / Proyek (1 Minggu)',
                ]
            ],
            'callbacks' => [
                'finish' => "{$frontendUrl}/kelola-berita?ref={$article->reference_code}&status=success",
                'error' => "{$frontendUrl}/kelola-berita?ref={$article->reference_code}&status=error",
                'pending' => "{$frontendUrl}/kelola-berita?ref={$article->reference_code}&status=pending",
            ],
        ];

        $snapToken = \Midtrans\Snap::getSnapToken($params);
        $article->update(['snap_token' => $snapToken]);

        return response()->json([
            'snap_token'     => $snapToken,
            'reference_code' => $article->reference_code,
        ]);
    }

    /**
     * User: Upload bukti transfer manual untuk artikel/berita
     */
    public function uploadPaymentProof(Request $request, $id)
    {
        $user = $request->user();
        $isAdmin = ($user && $user->role === 'admin');
        if (!$isAdmin && $user) {
            $article = Article::where(function ($q) use ($id) {
                $q->where('id', $id)->orWhere('slug', $id)->orWhere('reference_code', $id);
            })
            ->where('user_id', $user->id)
            ->firstOrFail();
        } else {
            $article = Article::where(function ($q) use ($id) {
                $q->where('id', $id)->orWhere('slug', $id)->orWhere('reference_code', $id);
            })
            ->firstOrFail();
        }

        $validator = Validator::make($request->all(), [
            'proof'         => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'payment_proof' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ], [
            'proof.mimes'         => 'Format file bukti harus JPG, JPEG, PNG, WEBP, atau PDF.',
            'proof.max'           => 'Ukuran file bukti maksimal 5 MB.',
            'payment_proof.mimes' => 'Format file bukti harus JPG, JPEG, PNG, WEBP, atau PDF.',
            'payment_proof.max'   => 'Ukuran file bukti maksimal 5 MB.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first(),
                'errors'  => $validator->errors(),
            ], 422);
        }

        $file = $request->file('proof') ?: $request->file('payment_proof');
        if (!$file) {
            return response()->json([
                'message' => 'File bukti transfer wajib diunggah.',
            ], 422);
        }

        if ($article->payment_proof && !str_starts_with($article->payment_proof, 'http')) {
            Storage::disk('public')->delete($article->payment_proof);
        }

        $path = $file->store('articles/payments', 'public');
        $article->update([
            'payment_proof'    => $path,
            'payment_status'   => 'menunggu_verifikasi',
            'status'           => 'menunggu_verifikasi',
            'rejection_reason' => null,
        ]);

        return response()->json([
            'message' => 'Bukti pembayaran berhasil diunggah. Menunggu verifikasi admin.',
            'data'    => [
                'id'                 => $article->id,
                'reference_code'     => $article->reference_code,
                'payment_status'     => $article->payment_status,
                'status'             => $article->status,
                'payment_proof_url'  => $article->payment_proof_url,
            ],
        ]);
    }

    /**
     * Admin: Get all articles (with filter keyword & category)
     */
    public function adminIndex(Request $request)
    {
        $this->cleanupExpiredArticles();

        $query = Article::with(['user:id,name,email,phone,avatar_url'])
            ->orderByDesc('created_at');

        if ($request->filled('keyword')) {
            $kw = $request->keyword;
            $query->where(function ($q) use ($kw) {
                $q->where('title', 'like', "%{$kw}%")
                  ->orWhere('category', 'like', "%{$kw}%")
                  ->orWhere('excerpt', 'like', "%{$kw}%")
                  ->orWhere('author_name', 'like', "%{$kw}%")
                  ->orWhereHas('user', function ($uq) use ($kw) {
                      $uq->where('name', 'like', "%{$kw}%")->orWhere('email', 'like', "%{$kw}%");
                  });
            });
        }

        if ($request->filled('status') && $request->status !== 'SEMUA') {
            $query->where('status', $request->status);
        }

        if ($request->filled('category')) {
            $cat = strtoupper(trim($request->category));
            if ($cat !== 'SEMUA') {
                if ($cat === 'BERITA') {
                    $query->where(function ($q) {
                        $q->where('category', 'BERITA')
                          ->orWhereNull('category')
                          ->orWhere('category', '');
                    });
                } else {
                    $query->where('category', $cat);
                }
            }
        }

        $articles = $query->get()->map(function (Article $a) {
            return [
                'id'                 => $a->id,
                'user_id'            => $a->user_id,
                'user'               => $a->user,
                'author_name'        => $a->author_name ?: optional($a->user)->name,
                'slug'               => $a->slug,
                'title'              => $a->title,
                'category'           => $a->category ?? 'BERITA',
                'source'             => $a->source,
                'is_top_news'        => false,
                'status'             => $a->status ?? 'menunggu_verifikasi',
                'price'              => $a->price ?? 10000,
                'payment_proof'      => $a->payment_proof,
                'payment_proof_url'  => $a->payment_proof_url,
                'payment_status'     => $a->payment_status ?? 'pending',
                'rejection_reason'   => $a->rejection_reason,
                'excerpt'            => $a->excerpt,
                'content'            => $a->content,
                'thumbnail'          => $a->thumbnail,
                'thumbnail_url'      => $a->thumbnail_url,
                'published_at'       => optional($a->published_at)->format('Y-m-d H:i'),
                'expires_at'         => optional($a->expires_at)->format('Y-m-d H:i'),
                'is_expired'         => $a->is_expired,
                'verified_at'        => optional($a->verified_at)->format('Y-m-d H:i'),
                'created_at'         => optional($a->created_at)->format('Y-m-d H:i'),
            ];
        });

        return response()->json($articles);
    }

    /**
     * Store a newly created article (User/Client: 10k fixed with payment proof -> pending verification; Admin: direct publish)
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $isAdmin = ($user && $user->role === 'admin');

        $rules = [
            'title'         => ['required', 'string', 'max:255'],
            'category'      => ['nullable', 'string', 'max:100'],
            'author_name'   => ['nullable', 'string', 'max:150'],
            'source'        => ['nullable', 'string', 'max:255'],
            'excerpt'       => ['nullable', 'string'],
            'content'       => ['required', 'string'],
            'thumbnail'     => ['nullable'],
            'image'         => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first(),
                'errors'  => $validator->errors(),
            ], 422);
        }

        $rawCat = strtoupper(trim((string) $request->input('category', 'BERITA')));
        $finalCategory = (str_contains($rawCat, 'PROYEK')) ? 'INFORMASI PROYEK' : ($rawCat ?: 'BERITA');

        $status = $isAdmin ? $request->input('status', 'published') : 'menunggu_verifikasi';
        $paymentStatus = $isAdmin ? 'verified' : 'pending';
        $publishedAt = $isAdmin ? now() : null;
        // Jika yang pasang adalah admin: berita/informasi proyek TIDAK hilang dalam seminggu (expires_at = null)
        // Admin dapat menghapus sendiri secara manual kapan saja.
        // Untuk pengguna lain (non-admin), tetap berlaku 1 minggu (7 hari) setelah pembayaran/verifikasi.
        $expiresAt = $isAdmin ? null : null;
        $price = $isAdmin ? 0 : 10000;

        // Generate unique reference_code
        do {
            $refCode = 'ART-' . now()->format('Ymd') . '-' . strtoupper(\Illuminate\Support\Str::random(6));
        } while (Article::where('reference_code', $refCode)->exists());

        $data = [
            'user_id'          => $user?->id,
            'reference_code'   => $refCode,
            'author_name'      => $request->author_name ?: ($user?->name ?? 'Kontributor TenagaAhli'),
            'source'           => $request->source,
            'title'            => $request->title,
            'category'         => $finalCategory,
            'is_top_news'      => false,
            'status'           => $status,
            'price'            => $price,
            'payment_status'   => $paymentStatus,
            'excerpt'          => $request->excerpt,
            'content'          => $request->content,
            'published_at'     => $publishedAt,
            'expires_at'       => $expiresAt,
            'rejection_reason' => null,
        ];

        // Handle uploaded thumbnail
        if ($request->hasFile('image')) {
            $data['thumbnail'] = $request->file('image')->store('articles/images', 'public');
        } elseif ($request->hasFile('thumbnail')) {
            $data['thumbnail'] = $request->file('thumbnail')->store('articles/images', 'public');
        } elseif ($request->filled('thumbnail') && is_string($request->thumbnail)) {
            $data['thumbnail'] = $request->thumbnail;
        }

        // Generate Midtrans Snap Token for non-admin
        $snapToken = null;
        if (!$isAdmin) {
            $serverKey = config('services.midtrans.server_key');
            if ($serverKey && !str_starts_with($serverKey, 'your-')) {
                try {
                    \Midtrans\Config::$serverKey = $serverKey;
                    \Midtrans\Config::$isProduction = config('services.midtrans.is_production', false);
                    \Midtrans\Config::$isSanitized = config('services.midtrans.is_sanitized', true);
                    \Midtrans\Config::$is3ds = config('services.midtrans.is_3ds', true);

                    $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');

                    $params = [
                        'transaction_details' => [
                            'order_id' => $refCode,
                            'gross_amount' => 10000,
                        ],
                        'customer_details' => [
                            'first_name' => $user?->name ?? 'Klien TenagaAhli',
                            'email' => $user?->email ?? 'klien@tenagaahli.com',
                            'phone' => $user?->phone ?? '',
                        ],
                        'item_details' => [
                            [
                                'id' => 'ART-10K-1W',
                                'price' => 10000,
                                'quantity' => 1,
                                'name' => 'Pasang Berita / Proyek (1 Minggu)',
                            ]
                        ],
                        'callbacks' => [
                            'finish' => "{$frontendUrl}/kelola-berita?ref={$refCode}&status=success",
                            'error' => "{$frontendUrl}/kelola-berita?ref={$refCode}&status=error",
                            'pending' => "{$frontendUrl}/kelola-berita?ref={$refCode}&status=pending",
                        ],
                    ];

                    $snapToken = \Midtrans\Snap::getSnapToken($params);
                    $data['snap_token'] = $snapToken;
                } catch (\Throwable $e) {
                    \Log::warning('Gagal generate Midtrans Snap Token untuk Artikel: ' . $e->getMessage());
                }
            }
        }

        $article = Article::create($data);

        $msg = $isAdmin
            ? 'Berita berhasil diterbitkan.'
            : 'Berita berhasil disimpan! Silakan selesaikan pembayaran via Transfer Bank Manual atau Midtrans.';

        return response()->json([
            'message'    => $msg,
            'data'       => $article,
            'snap_token' => $snapToken,
        ], 201);
    }

    /**
     * Update an article (User or Admin)
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $isAdmin = ($user && $user->role === 'admin');

        $query = Article::where(function ($q) use ($id) {
            $q->where('id', $id)->orWhere('slug', $id);
        });

        if (!$isAdmin && $user) {
            $query->where('user_id', $user->id);
        }

        $article = $query->firstOrFail();

        $rules = [
            'title'         => ['required', 'string', 'max:255'],
            'category'      => ['nullable', 'string', 'max:100'],
            'author_name'   => ['nullable', 'string', 'max:150'],
            'source'        => ['nullable', 'string', 'max:255'],
            'excerpt'       => ['nullable', 'string'],
            'content'       => ['required', 'string'],
            'thumbnail'     => ['nullable'],
            'image'         => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'payment_proof' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first(),
                'errors'  => $validator->errors(),
            ], 422);
        }

        $rawCat = strtoupper(trim((string) $request->input('category', $article->category ?? 'BERITA')));
        $finalCategory = (str_contains($rawCat, 'PROYEK')) ? 'INFORMASI PROYEK' : ($rawCat ?: 'BERITA');

        $data = [
            'title'       => $request->title,
            'category'    => $finalCategory,
            'author_name' => $request->author_name ?: ($article->author_name ?: $user?->name),
            'source'      => $request->source,
            'is_top_news' => false,
            'excerpt'     => $request->excerpt,
            'content'     => $request->content,
        ];

        if ($isAdmin && $request->has('status')) {
            $data['status'] = $request->status;
        }

        // If user re-submits a rejected article, set status back to menunggu_verifikasi
        if (!$isAdmin && $article->status === 'ditolak') {
            $data['status'] = 'menunggu_verifikasi';
            $data['payment_status'] = 'pending';
            $data['rejection_reason'] = null;
        }

        // Handle uploaded thumbnail
        if ($request->hasFile('image')) {
            if ($article->thumbnail && !str_starts_with($article->thumbnail, 'http')) {
                Storage::disk('public')->delete($article->thumbnail);
            }
            $data['thumbnail'] = $request->file('image')->store('articles/images', 'public');
        } elseif ($request->hasFile('thumbnail')) {
            if ($article->thumbnail && !str_starts_with($article->thumbnail, 'http')) {
                Storage::disk('public')->delete($article->thumbnail);
            }
            $data['thumbnail'] = $request->file('thumbnail')->store('articles/images', 'public');
        } elseif ($request->filled('thumbnail') && is_string($request->thumbnail)) {
            $data['thumbnail'] = $request->thumbnail;
        }

        // Handle updated payment proof
        if ($request->hasFile('payment_proof')) {
            if ($article->payment_proof && !str_starts_with($article->payment_proof, 'http')) {
                Storage::disk('public')->delete($article->payment_proof);
            }
            $data['payment_proof'] = $request->file('payment_proof')->store('articles/payments', 'public');
            if (!$isAdmin) {
                $data['status'] = 'menunggu_verifikasi';
                $data['payment_status'] = 'pending';
                $data['rejection_reason'] = null;
            }
        }

        // Jika artikel milik admin, pastikan expires_at tetap null
        if ($isAdmin || ($article->user && $article->user->role === 'admin')) {
            $data['expires_at'] = null;
        }

        $article->update($data);

        return response()->json([
            'message' => 'Berita berhasil diperbarui',
            'data'    => $article,
        ]);
    }

    /**
     * Admin: Verify and approve article (Non-admin 7 days, Admin permanent)
     */
    public function verify(Request $request, $id)
    {
        $admin = $request->user();
        if (!$admin || $admin->role !== 'admin') {
            return response()->json(['message' => 'Akses tidak diizinkan.'], 403);
        }

        $article = Article::with('user')->findOrFail($id);
        $isAuthorAdmin = ($article->user && $article->user->role === 'admin');

        $article->update([
            'status'           => 'published',
            'payment_status'   => 'verified',
            'published_at'     => now(),
            'expires_at'       => $isAuthorAdmin ? null : now()->addDays(7), // Non-admin: 1 minggu, Admin: tanpa batas waktu
            'verified_at'      => now(),
            'verified_by'      => $admin->id,
            'rejection_reason' => null,
        ]);

        $durationMsg = $isAuthorAdmin ? 'aktif tanpa batas waktu' : 'aktif tayang selama 7 hari';

        return response()->json([
            'message' => "Berita \"{$article->title}\" berhasil diverifikasi dan {$durationMsg}.",
            'data'    => $article,
        ]);
    }

    /**
     * Admin: Reject article with reason
     */
    public function reject(Request $request, $id)
    {
        $admin = $request->user();
        if (!$admin || $admin->role !== 'admin') {
            return response()->json(['message' => 'Akses tidak diizinkan.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $article = Article::findOrFail($id);

        $article->update([
            'status'           => 'ditolak',
            'payment_status'   => 'rejected',
            'rejection_reason' => $request->input('reason', 'Bukti transfer tidak valid atau informasi konten belum lengkap.'),
        ]);

        return response()->json([
            'message' => "Berita \"{$article->title}\" telah ditolak.",
            'data'    => $article,
        ]);
    }

    /**
     * Delete an article (User or Admin)
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $isAdmin = ($user && $user->role === 'admin');

        $query = Article::where(function ($q) use ($id) {
            $q->where('id', $id)->orWhere('slug', $id);
        });

        if (!$isAdmin && $user) {
            $query->where('user_id', $user->id);
        }

        $article = $query->firstOrFail();

        if ($article->thumbnail && !str_starts_with($article->thumbnail, 'http')) {
            Storage::disk('public')->delete($article->thumbnail);
        }

        if ($article->payment_proof && !str_starts_with($article->payment_proof, 'http')) {
            Storage::disk('public')->delete($article->payment_proof);
        }

        $article->delete();

        return response()->json(['message' => 'Berita berhasil dihapus']);
    }
}
