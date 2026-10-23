<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expert;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReviewController extends Controller
{
    /**
     * GET /experts/{slug}/reviews
     * Ambil semua ulasan untuk satu expert (publik, diurutkan terbaru dulu).
     */
    public function index(string $slug)
    {
        $expert = Expert::where('slug', $slug)
            ->where('profile_status', 'aktif')
            ->firstOrFail();

        $reviews = $expert->reviews()
            ->select([
                'id', 'reviewer_name', 'reviewer_email',
                'rating', 'komentar', 'balasan', 'replied_at', 'created_at',
            ])
            ->get()
            ->map(fn ($r) => [
                'id'            => $r->id,
                'nama'          => $r->reviewer_name,
                'rating'        => $r->rating,
                'komentar'      => $r->komentar,
                'balasan'       => $r->balasan,
                'replied_at'    => $r->replied_at?->toISOString(),
                'tanggal'       => $r->created_at->format('d M Y'),
            ]);

        return response()->json([
            'data'         => $reviews,
            'total'        => $reviews->count(),
            'avg_rating'   => $reviews->count() ? round($reviews->avg('rating'), 1) : 0,
        ]);
    }

    /**
     * POST /experts/{slug}/reviews
     * Kirim ulasan baru (siapapun boleh — tamu maupun user terdaftar).
     */
    public function store(Request $request, string $slug)
    {
        $expert = Expert::where('slug', $slug)
            ->where('profile_status', 'aktif')
            ->firstOrFail();

        $validator = Validator::make($request->all(), [
            'nama'     => ['required', 'string', 'max:100'],
            'email'    => ['nullable', 'email', 'max:191'],
            'rating'   => ['required', 'integer', 'min:1', 'max:5'],
            'komentar' => ['required', 'string', 'min:10', 'max:1000'],
        ], [
            'nama.required'     => 'Nama wajib diisi.',
            'rating.required'   => 'Rating wajib dipilih.',
            'komentar.required' => 'Komentar wajib diisi.',
            'komentar.min'      => 'Komentar minimal 10 karakter.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first(),
                'errors'  => $validator->errors(),
            ], 422);
        }

        // Cek apakah user sudah pernah berkonsultasi (status selesai) dengan expert ini
        $user = $request->user();
        $email = $request->email ?: $user?->email;

        $hasConsulted = false;
        if ($user) {
            $hasConsulted = \App\Models\Consultation::where('expert_id', $expert->id)
                ->where('status', 'selesai')
                ->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->orWhere('client_email', $user->email);
                })
                ->exists();
        } elseif ($email) {
            $hasConsulted = \App\Models\Consultation::where('expert_id', $expert->id)
                ->where('status', 'selesai')
                ->where('client_email', $email)
                ->exists();
        }

        if (!$hasConsulted) {
            return response()->json([
                'message' => 'Ulasan hanya dapat diberikan oleh pengguna yang telah melakukan sesi konsultasi dengan Tenaga Ahli / Surveyor ini. Silakan ajukan konsultasi terlebih dahulu.',
                'can_review' => false,
            ], 403);
        }

        $review = Review::create([
            'expert_id'      => $expert->id,
            'user_id'        => $request->user()?->id,
            'reviewer_name'  => $request->nama,
            'reviewer_email' => $request->email,
            'rating'         => $request->rating,
            'komentar'       => $request->komentar,
        ]);

        // Recalculate & persist average rating on expert
        $this->recalcRating($expert);

        return response()->json([
            'message' => 'Ulasan berhasil dikirim. Terima kasih!',
            'data'    => [
                'id'         => $review->id,
                'nama'       => $review->reviewer_name,
                'rating'     => $review->rating,
                'komentar'   => $review->komentar,
                'balasan'    => null,
                'replied_at' => null,
                'tanggal'    => $review->created_at->format('d M Y'),
            ],
        ], 201);
    }

    /**
     * POST /my/reviews/{id}/reply
     * Tenaga ahli membalas ulasan yang ditujukan ke profil miliknya.
     * Harus sudah login dan expert tersebut harus pemilik ulasan.
     */
    public function reply(Request $request, int $id)
    {
        $user   = $request->user();
        $expert = Expert::where('user_id', $user->id)->firstOrFail();

        $review = Review::where('id', $id)
            ->where('expert_id', $expert->id)
            ->firstOrFail();

        $validator = Validator::make($request->all(), [
            'balasan' => ['required', 'string', 'min:5', 'max:1000'],
        ], [
            'balasan.required' => 'Balasan tidak boleh kosong.',
            'balasan.min'      => 'Balasan minimal 5 karakter.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first(),
                'errors'  => $validator->errors(),
            ], 422);
        }

        $review->update([
            'balasan'    => $request->balasan,
            'replied_at' => now(),
        ]);

        return response()->json([
            'message' => 'Balasan berhasil disimpan.',
            'data'    => [
                'id'         => $review->id,
                'balasan'    => $review->balasan,
                'replied_at' => $review->replied_at->toISOString(),
            ],
        ]);
    }

    /**
     * DELETE /my/reviews/{id}/reply
     * Tenaga ahli menghapus balasannya sendiri.
     */
    public function deleteReply(Request $request, int $id)
    {
        $user   = $request->user();
        $expert = Expert::where('user_id', $user->id)->firstOrFail();

        $review = Review::where('id', $id)
            ->where('expert_id', $expert->id)
            ->firstOrFail();

        $review->update([
            'balasan'    => null,
            'replied_at' => null,
        ]);

        return response()->json(['message' => 'Balasan berhasil dihapus.']);
    }

    /**
     * GET /my/reviews
     * Semua ulasan yang masuk ke profil tenaga ahli yang sedang login.
     */
    public function myReviews(Request $request)
    {
        $user   = $request->user();
        $expert = Expert::where('user_id', $user->id)->first();

        if (!$expert) {
            return response()->json(['data' => [], 'total' => 0, 'avg_rating' => 0]);
        }

        $reviews = $expert->reviews()
            ->select([
                'id', 'reviewer_name', 'reviewer_email',
                'rating', 'komentar', 'balasan', 'replied_at', 'created_at',
            ])
            ->get()
            ->map(fn ($r) => [
                'id'            => $r->id,
                'nama'          => $r->reviewer_name,
                'email'         => $r->reviewer_email,
                'rating'        => $r->rating,
                'komentar'      => $r->komentar,
                'balasan'       => $r->balasan,
                'replied_at'    => $r->replied_at?->toISOString(),
                'tanggal'       => $r->created_at->format('d M Y'),
                'tanggal_raw'   => $r->created_at->toISOString(),
            ]);

        return response()->json([
            'data'       => $reviews,
            'total'      => $reviews->count(),
            'avg_rating' => $reviews->count() ? round($reviews->avg('rating'), 1) : 0,
        ]);
    }

    // ── Private helper ────────────────────────────────────────────────────────

    private function recalcRating(Expert $expert): void
    {
        $avg = Review::where('expert_id', $expert->id)->avg('rating');
        $expert->update(['rating' => $avg ? round($avg, 1) : 0]);
    }
}
