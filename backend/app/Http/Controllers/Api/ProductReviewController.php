<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductPurchase;
use App\Models\ProductReview;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProductReviewController extends Controller
{
    /**
     * Get all reviews for a product.
     * GET /products/{id}/reviews
     */
    public function index(Request $request, $productId)
    {
        $product = Product::withCount('reviews')->withAvg('reviews', 'rating')->findOrFail($productId);

        $reviews = $product->reviews()
            ->with('user:id,name,avatar_url,foto')
            ->orderBy('created_at', 'desc')
            ->get();

        $user = $request->user('sanctum');
        $hasPurchased = false;
        $hasReviewed = false;

        if ($user) {
            $hasPurchased = ProductPurchase::where('user_id', $user->id)
                ->where('product_id', $productId)
                ->whereIn('status', ['completed', 'verified', 'settlement', 'capture', 'success'])
                ->exists();

            $hasReviewed = ProductReview::where('user_id', $user->id)
                ->where('product_id', $productId)
                ->exists();
        }

        $count = $reviews->count();
        $avgRating = $count > 0 ? round((float) $reviews->avg('rating'), 1) : 0.0;

        return response()->json([
            'success'       => true,
            'product_id'    => (int) $productId,
            'count'         => $count,
            'avg_rating'    => $avgRating,
            'has_purchased' => $hasPurchased,
            'has_reviewed'  => $hasReviewed,
            'data'          => $reviews->map(function ($review) {
                $userPhoto = null;
                if ($review->user) {
                    $raw = $review->user->avatar_url ?: $review->user->foto;
                    if ($raw) {
                        $userPhoto = filter_var($raw, FILTER_VALIDATE_URL) ? $raw : asset('storage/' . $raw);
                    }
                }

                return [
                    'id'         => $review->id,
                    'user'       => [
                        'id'    => $review->user?->id,
                        'name'  => $review->user?->name ?? 'Pengguna',
                        'photo' => $userPhoto,
                    ],
                    'rating'     => (int) $review->rating,
                    'comment'    => $review->comment,
                    'created_at' => $review->created_at->toIso8601String(),
                ];
            }),
        ]);
    }

    /**
     * Add a review for a product (User must be logged in and must have purchased the product).
     * POST /products/{id}/reviews
     */
    public function store(Request $request, $productId)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Anda harus login untuk memberikan ulasan.'], 401);
        }

        $product = Product::findOrFail($productId);

        // Check if user has purchased the product
        $hasPurchased = ProductPurchase::where('user_id', $user->id)
            ->where('product_id', $productId)
            ->whereIn('status', ['completed', 'verified', 'settlement', 'capture', 'success'])
            ->exists();

        if (!$hasPurchased) {
            return response()->json([
                'message' => 'Anda harus membeli produk ini terlebih dahulu sebelum dapat memberikan ulasan.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'rating'  => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['required', 'string', 'min:10', 'max:1000'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        // Check if user already reviewed this product
        $existing = ProductReview::where('user_id', $user->id)
            ->where('product_id', $productId)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Anda sudah memberikan ulasan untuk produk ini.'], 422);
        }

        try {
            $review = ProductReview::create([
                'user_id'    => $user->id,
                'product_id' => $productId,
                'rating'     => (int) $request->rating,
                'comment'    => $request->comment,
            ]);

            // Sync and update product rating & reviews count
            $newCount = $product->reviews()->count();
            $newAvg = $newCount > 0 ? round((float) $product->reviews()->avg('rating'), 1) : 0.0;

            $product->update([
                'reviews_count' => $newCount,
                'rating'        => $newAvg,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Ulasan berhasil ditambahkan!',
                'review'  => [
                    'id'         => $review->id,
                    'user'       => [
                        'id'   => $user->id,
                        'name' => $user->name,
                    ],
                    'rating'     => (int) $review->rating,
                    'comment'    => $review->comment,
                    'created_at' => $review->created_at->toIso8601String(),
                ],
                'product' => [
                    'rating'        => $newAvg,
                    'reviews_count' => $newCount,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal menambah ulasan: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update a review (Only review owner can update).
     * PUT /reviews/{id}
     */
    public function update(Request $request, $reviewId)
    {
        $user = $request->user();

        $review = ProductReview::findOrFail($reviewId);

        // Check if user owns this review
        if ($review->user_id !== $user->id) {
            return response()->json(['message' => 'Anda tidak bisa mengubah ulasan orang lain.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'rating'  => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['required', 'string', 'min:10', 'max:1000'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        try {
            $review->update([
                'rating'  => (int) $request->rating,
                'comment' => $request->comment,
            ]);

            // Update product rating
            $product = $review->product;
            if ($product) {
                $newCount = $product->reviews()->count();
                $newAvg = $newCount > 0 ? round((float) $product->reviews()->avg('rating'), 1) : 0.0;
                $product->update([
                    'reviews_count' => $newCount,
                    'rating'        => $newAvg,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Ulasan berhasil diperbarui!',
                'review'  => [
                    'id'         => $review->id,
                    'user'       => [
                        'id'   => $user->id,
                        'name' => $user->name,
                    ],
                    'rating'     => (int) $review->rating,
                    'comment'    => $review->comment,
                    'created_at' => $review->created_at->toIso8601String(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal memperbarui ulasan: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete a review (Only review owner can delete).
     * DELETE /reviews/{id}
     */
    public function destroy(Request $request, $reviewId)
    {
        $user = $request->user();

        $review = ProductReview::findOrFail($reviewId);

        // Check if user owns this review
        if ($review->user_id !== $user->id) {
            return response()->json(['message' => 'Anda tidak bisa menghapus ulasan orang lain.'], 403);
        }

        try {
            $product = $review->product;
            $review->delete();

            // Update product rating
            if ($product) {
                $newCount = $product->reviews()->count();
                $newAvg = $newCount > 0 ? round((float) $product->reviews()->avg('rating'), 1) : 0.0;
                $product->update([
                    'reviews_count' => $newCount,
                    'rating'        => $newAvg,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Ulasan berhasil dihapus!',
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal menghapus ulasan: ' . $e->getMessage()], 500);
        }
    }
}
