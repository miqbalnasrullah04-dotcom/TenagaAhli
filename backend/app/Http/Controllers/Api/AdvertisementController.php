<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Advertisement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class AdvertisementController extends Controller
{
    /**
     * Get advertisements for the authenticated user (client/user)
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Advertisement::where('user_id', $user->id)
            ->latest();

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('placement') && $request->placement !== 'all') {
            $query->where('placement', $request->placement);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $ads = $query->get();

        return response()->json($ads);
    }

    /**
     * Store a new advertisement
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'title'        => ['required', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'description'  => ['nullable', 'string'],
            'target_url'   => ['nullable', 'string', 'max:500'],
            'placement'    => ['nullable', 'string', 'in:beranda_banner,sidebar_berita,footer_banner,popup'],
            'start_date'   => ['nullable', 'date'],
            'end_date'     => ['nullable', 'date', 'after_or_equal:start_date'],
            'status'       => ['nullable', 'in:active,paused,draft'],
            'image'        => ['nullable'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();
        $data['user_id'] = $user->id;
        $data['placement'] = $request->input('placement', 'beranda_banner');
        $data['status'] = $request->input('status', 'active');
        $data['views_count'] = 0;
        $data['clicks_count'] = 0;

        // Handle image upload
        if ($request->hasFile('image')) {
            $request->validate([
                'image' => 'image|mimes:jpeg,png,jpg,webp|max:5120',
            ]);
            $path = $request->file('image')->store('advertisements', 'public');
            $data['image'] = $path;
        } elseif (is_string($request->input('image')) && !empty($request->input('image'))) {
            $data['image'] = $request->input('image');
        }

        $ad = Advertisement::create($data);

        return response()->json($ad, 201);
    }

    /**
     * Show a single advertisement
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();

        $ad = Advertisement::where(function ($q) use ($user) {
            if ($user->role !== 'admin') {
                $q->where('user_id', $user->id);
            }
        })->findOrFail($id);

        return response()->json($ad);
    }

    /**
     * Update an existing advertisement
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();

        $ad = Advertisement::where(function ($q) use ($user) {
            if ($user->role !== 'admin') {
                $q->where('user_id', $user->id);
            }
        })->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title'        => ['sometimes', 'required', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'description'  => ['nullable', 'string'],
            'target_url'   => ['nullable', 'string', 'max:500'],
            'placement'    => ['nullable', 'string', 'in:beranda_banner,sidebar_berita,footer_banner,popup'],
            'start_date'   => ['nullable', 'date'],
            'end_date'     => ['nullable', 'date'],
            'status'       => ['nullable', 'in:active,paused,draft,expired'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        $fields = $validator->validated();

        if ($request->has('placement')) {
            $fields['placement'] = $request->input('placement');
        }

        if ($request->has('status')) {
            $fields['status'] = $request->input('status');
        }

        // Handle image update
        if ($request->hasFile('image')) {
            $request->validate([
                'image' => 'image|mimes:jpeg,png,jpg,webp|max:5120',
            ]);

            if ($ad->image && !filter_var($ad->image, FILTER_VALIDATE_URL)) {
                Storage::disk('public')->delete($ad->image);
            }

            $path = $request->file('image')->store('advertisements', 'public');
            $fields['image'] = $path;
        } elseif ($request->has('image') && is_string($request->input('image'))) {
            $fields['image'] = $request->input('image');
        }

        $ad->update($fields);

        return response()->json($ad);
    }

    /**
     * Delete an advertisement
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        $ad = Advertisement::where(function ($q) use ($user) {
            if ($user->role !== 'admin') {
                $q->where('user_id', $user->id);
            }
        })->findOrFail($id);

        if ($ad->image && !filter_var($ad->image, FILTER_VALIDATE_URL)) {
            Storage::disk('public')->delete($ad->image);
        }

        $ad->delete();

        return response()->json(['message' => 'Iklan berhasil dihapus']);
    }

    /**
     * Toggle status between active and paused
     */
    public function toggleStatus(Request $request, $id)
    {
        $user = $request->user();

        $ad = Advertisement::where(function ($q) use ($user) {
            if ($user->role !== 'admin') {
                $q->where('user_id', $user->id);
            }
        })->findOrFail($id);

        $newStatus = $ad->status === 'active' ? 'paused' : 'active';
        if ($request->has('status')) {
            $newStatus = $request->input('status');
        }

        $ad->update(['status' => $newStatus]);

        return response()->json($ad);
    }

    /**
     * Public endpoint: Get active advertisements (with optional placement filter)
     */
    public function publicAds(Request $request)
    {
        $query = Advertisement::active()->latest();

        if ($request->filled('placement') && $request->placement !== 'all') {
            $query->where('placement', $request->placement);
        }

        $limit = $request->input('limit', 10);
        $ads = $query->limit($limit)->get();

        // Increment views count silently
        foreach ($ads as $ad) {
            $ad->increment('views_count');
        }

        return response()->json($ads);
    }

    /**
     * Public endpoint: Track click on an ad and return target URL
     */
    public function trackClick($id)
    {
        $ad = Advertisement::findOrFail($id);
        $ad->increment('clicks_count');

        return response()->json([
            'target_url'   => $ad->target_url,
            'clicks_count' => $ad->clicks_count,
        ]);
    }
}
