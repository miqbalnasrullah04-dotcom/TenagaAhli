<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ProductPurchasedBuyer;
use App\Mail\ProductPurchasedSeller;
use App\Models\Expert;
use App\Models\Product;
use App\Models\ProductPurchase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    /**
     * Kategori produk Buku Fisik (tidak dapat diubah dari form).
     */
    public const BOOK_CATEGORY = 'physical_book';

    /**
     * Ketentuan foto Buku Fisik — mengikuti katalog UPRESS (https://upress.latihan.co.id/).
     * Kartu katalog UPRESS menampilkan sampul dengan `aspect-[4/5]` + object-cover dan
     * gambar acuan 500x625 px, sehingga foto wajib berasio 4:5 (potret) minimal 500x625 px.
     */
    public const BOOK_COVER_RATIO_W = 4;
    public const BOOK_COVER_RATIO_H = 5;
    public const BOOK_COVER_RATIO_TOLERANCE = 0.02; // toleransi selisih rasio 2%
    public const BOOK_COVER_MIN_WIDTH = 500;
    public const BOOK_COVER_MIN_HEIGHT = 625;
    public const BOOK_COVER_MAX_KB = 5120;

    /**
     * Get products belonging to the authenticated expert/surveyor
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $expert = Expert::where('user_id', $user->id)->first();

        if (!$expert) {
            $products = Product::where('user_id', $user->id)
                ->latest()
                ->get();
            return response()->json($products);
        }

        $products = Product::where('expert_id', $expert->id)
            ->orWhere('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json($products);
    }

    /**
     * Get user product quota and membership details
     */
    public function getUserProductQuota($user, $expert = null): array
    {
        if (!$expert) {
            $expert = Expert::with('package')->where('user_id', $user->id)->first();
        } else {
            $expert->loadMissing('package');
        }

        $package = null;
        $isExpired = false;

        if ($expert && $expert->package_id) {
            if ($expert->package_expires_at && now()->greaterThan($expert->package_expires_at)) {
                $isExpired = true;
            } else {
                $package = $expert->package;
            }
        }

        if (!$package && !$isExpired) {
            if (in_array($user->package, ['premium', 'platinum', 'ekonomis', 'eksklusif', 'ekslusif', 'esklusif'])) {
                if ($user->premium_expires_at && now()->greaterThan($user->premium_expires_at)) {
                    $isExpired = true;
                }
            }
        }

        $packageName = 'Free';
        $tier = 'free';
        $limit = 0;

        if ($user->role === 'admin') {
            $tier = 'admin';
            $packageName = 'Admin';
            $limit = 9999;
        } elseif ($package && !$isExpired) {
            $nameLower = strtolower($package->name);
            $slugLower = strtolower($package->slug ?? '');

            if (str_contains($nameLower, 'platinum') || str_contains($slugLower, 'platinum') || str_contains($nameLower, 'eksklusif') || str_contains($slugLower, 'eksklusif') || str_contains($nameLower, 'esklusif') || str_contains($slugLower, 'esklusif') || str_contains($nameLower, 'ekslusif') || str_contains($slugLower, 'ekslusif')) {
                $tier = 'ekslusif';
                $packageName = $package->name;
                $limit = 20;
            } elseif (str_contains($nameLower, 'premium') || str_contains($slugLower, 'premium') || str_contains($nameLower, 'ekonomis') || str_contains($slugLower, 'ekonomis')) {
                $tier = 'ekonomis';
                $packageName = $package->name;
                $limit = 10;
            } else {
                $tier = 'free';
                $packageName = $package->name;
                $limit = 0;
            }
        } elseif (in_array($user->package, ['premium', 'platinum', 'ekonomis', 'eksklusif', 'ekslusif', 'esklusif']) && !$isExpired) {
            if (in_array($user->package, ['platinum', 'eksklusif', 'ekslusif', 'esklusif'])) {
                $tier = 'ekslusif';
                $packageName = 'Paket Eksklusif';
                $limit = 20;
            } else {
                $tier = 'ekonomis';
                $packageName = 'Paket Ekonomis';
                $limit = 10;
            }
        }

        // Count current products
        $used = Product::where(function ($q) use ($expert, $user) {
            if ($expert) {
                $q->where('expert_id', $expert->id)->orWhere('user_id', $user->id);
            } else {
                $q->where('user_id', $user->id);
            }
        })->count();

        $remaining = max(0, $limit - $used);
        $canAdd = ($limit > 0) && ($used < $limit);

        return [
            'tier'         => $tier,
            'package_name' => $packageName,
            'limit'        => $limit,
            'used'         => $used,
            'remaining'    => $remaining,
            'can_add'      => $canAdd,
            'is_expired'   => $isExpired,
        ];
    }

    /**
     * API endpoint to get current product quota for authenticated user
     */
    public function quota(Request $request)
    {
        $user = $request->user();
        $expert = Expert::where('user_id', $user->id)->first();
        $quota = $this->getUserProductQuota($user, $expert);

        return response()->json($quota);
    }

    /**
     * Store a newly created product
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $expert = Expert::where('user_id', $user->id)->first();
        if (!$expert) {
            $expert = Expert::create([
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'slug' => Str::slug($user->name) . '-' . Str::random(5),
                'kriteria' => ($user->role_type === 'surveyor' ? 'Surveyor' : ($user->role_type === 'tenaga_teknis' ? 'Tenaga Teknis' : 'Tenaga Ahli')),
                'profile_status' => 'draft',
            ]);
        }

        // Check product quota limit
        $quota = $this->getUserProductQuota($user, $expert);
        if (!$quota['can_add']) {
            if ($quota['limit'] === 0) {
                return response()->json([
                    'message' => 'Anda harus berlangganan Paket Ekonomis (maks. 10 produk) atau Paket Eksklusif (maks. 20 produk) untuk dapat memasang produk.',
                    'quota'   => $quota,
                ], 403);
            }

            return response()->json([
                'message' => "Batas maksimal produk untuk {$quota['package_name']} ({$quota['limit']} produk) telah tercapai. Silakan upgrade paket Anda untuk memasang lebih banyak produk.",
                'quota'   => $quota,
            ], 422);
        }

        if ($request->input('category') === self::BOOK_CATEGORY) {
            return $this->storePhysicalBook($request, $user, $expert);
        }

        $validator = Validator::make($request->all(), [
            'title'              => ['required', 'string', 'max:255'],
            'author'             => ['nullable', 'string', 'max:255'],
            'publisher'          => ['nullable', 'string', 'max:255'],
            'publication_year'   => ['nullable', 'string', 'max:10'],
            'isbn'               => ['nullable', 'string', 'max:100'],
            'language'           => ['nullable', 'string', 'max:100'],
            'pages'              => ['nullable', 'string', 'max:100'],
            'cover_type'         => ['nullable', 'string', 'max:50'],
            'dimensions'         => ['nullable', 'string', 'max:50'],
            'condition'          => ['nullable', 'string', 'max:50'],
            'specifications'     => ['nullable'],
            'category'           => ['required', 'string', 'max:50'],
            'price'              => ['required', 'numeric', 'min:0'],
            'discount_price'     => ['nullable', 'numeric', 'min:0'],
            'is_digital'         => ['nullable'],
            'stock'              => ['nullable'],
            'weight'             => ['nullable', 'numeric', 'min:0'],
            'origin_id'          => ['nullable', 'numeric'],
            'origin_city'        => ['nullable', 'string', 'max:100'],
            'origin_province'    => ['nullable', 'string', 'max:100'],
            'origin_subdistrict' => ['nullable', 'string', 'max:100'],
            'origin_label'       => ['nullable', 'string', 'max:255'],
            'origin_address'     => ['nullable', 'string'],
            'file_format'        => ['nullable', 'string', 'max:50'],
            'file_size'          => ['nullable', 'string', 'max:50'],
            'download_url'       => ['nullable', 'string', 'max:1000'],
            'description'        => ['required', 'string'],
            'terms_of_use'       => ['nullable', 'string'],
            'image'              => ['nullable'],
            'status'             => ['nullable', 'in:active,draft,paused,sold_out'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();
        $data['expert_id'] = $expert->id;
        $data['user_id'] = $user->id;
        $data['author'] = $expert?->name ?? $user->name;
        $data['terms_of_use'] = $request->input('terms_of_use');
        $data['publisher'] = $request->input('publisher', $expert->institution ?? 'TenagaAhli.com');
        $data['publication_year'] = $request->input('publication_year', date('Y'));
        $data['language'] = $request->input('language', 'Indonesia');
        $data['cover_type'] = $request->input('cover_type', 'Soft Cover');
        $data['dimensions'] = $request->input('dimensions');
        $data['condition'] = $request->input('condition', 'Baru');
        // Seluruh produk di platform TenagaAhli kini berformat Digital
        $data['is_digital'] = true;
        $data['status'] = $request->input('status', 'active');
        $data['sold_count'] = 0;
        $data['rating'] = 0.0;
        $data['reviews_count'] = 0;
        $data['is_featured'] = false;
        $data['download_url'] = $request->input('download_url');
        $data['file_format'] = $request->input('file_format');
        $data['file_size'] = $request->input('file_size');
        $data['weight'] = 0;
        $data['origin_id'] = null;
        $data['origin_city'] = null;
        $data['origin_province'] = null;
        $data['origin_subdistrict'] = null;
        $data['origin_label'] = null;
        $data['origin_address'] = null;
        $data['stock'] = $request->input('stock') !== '' && $request->input('stock') !== null ? (int)$request->input('stock') : null;

        if ($request->has('specifications') && is_string($request->input('specifications'))) {
            try {
                $data['specifications'] = json_decode($request->input('specifications'), true);
            } catch (\Exception $e) {}
        }

        // Handle image upload
        if ($request->hasFile('image')) {
            $request->validate([
                'image' => 'image|mimes:jpeg,png,jpg,webp|max:5120',
            ]);
            $path = $request->file('image')->store('products', 'public');
            $data['image'] = $path;
        } elseif (is_string($request->input('image')) && !empty($request->input('image'))) {
            $data['image'] = $request->input('image');
        }

        // Handle digital file upload
        if ($request->hasFile('digital_file')) {
            $request->validate([
                'digital_file' => 'file|max:102400|mimes:pdf,zip,rar,doc,docx,ppt,pptx,epub,txt,xls,xlsx,csv,7z',
            ]);
            $file = $request->file('digital_file');
            $filePath = $file->store('products_files', 'public');
            $data['file_path'] = $filePath;
            if (!$data['file_format']) {
                $data['file_format'] = strtoupper($file->getClientOriginalExtension());
            }
            if (!$data['file_size']) {
                $bytes = $file->getSize();
                $data['file_size'] = $bytes >= 1048576 ? round($bytes / 1048576, 1) . ' MB' : round($bytes / 1024, 1) . ' KB';
            }
        } elseif ($request->hasFile('file')) {
            $request->validate([
                'file' => 'file|max:102400|mimes:pdf,zip,rar,doc,docx,ppt,pptx,epub,txt,xls,xlsx,csv,7z',
            ]);
            $file = $request->file('file');
            $filePath = $file->store('products_files', 'public');
            $data['file_path'] = $filePath;
            if (!$data['file_format']) {
                $data['file_format'] = strtoupper($file->getClientOriginalExtension());
            }
            if (!$data['file_size']) {
                $bytes = $file->getSize();
                $data['file_size'] = $bytes >= 1048576 ? round($bytes / 1048576, 1) . ' MB' : round($bytes / 1024, 1) . ' KB';
            }
        }

        $product = Product::create($data);

        return response()->json($product, 201);
    }

    /**
     * Update an existing product
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $expert = Expert::where('user_id', $user->id)->first();
        $product = Product::where(function ($q) use ($expert, $user) {
            if ($expert) {
                $q->where('expert_id', $expert->id)->orWhere('user_id', $user->id);
            } else {
                $q->where('user_id', $user->id);
            }
        })->findOrFail($id);

        if ($product->category === self::BOOK_CATEGORY || $request->input('category') === self::BOOK_CATEGORY) {
            return $this->updatePhysicalBook($request, $product);
        }

        $validator = Validator::make($request->all(), [
            'title'              => ['sometimes', 'required', 'string', 'max:255'],
            'author'             => ['nullable', 'string', 'max:255'],
            'publisher'          => ['nullable', 'string', 'max:255'],
            'publication_year'   => ['nullable', 'string', 'max:10'],
            'isbn'               => ['nullable', 'string', 'max:100'],
            'language'           => ['nullable', 'string', 'max:100'],
            'pages'              => ['nullable', 'string', 'max:100'],
            'cover_type'         => ['nullable', 'string', 'max:50'],
            'dimensions'         => ['nullable', 'string', 'max:50'],
            'condition'          => ['nullable', 'string', 'max:50'],
            'specifications'     => ['nullable'],
            'category'           => ['sometimes', 'required', 'string', 'max:50'],
            'price'              => ['sometimes', 'required', 'numeric', 'min:0'],
            'discount_price'     => ['nullable', 'numeric', 'min:0'],
            'is_digital'         => ['nullable'],
            'stock'              => ['nullable'],
            'weight'             => ['nullable', 'numeric', 'min:0'],
            'origin_id'          => ['nullable', 'numeric'],
            'origin_city'        => ['nullable', 'string', 'max:100'],
            'origin_province'    => ['nullable', 'string', 'max:100'],
            'origin_subdistrict' => ['nullable', 'string', 'max:100'],
            'origin_label'       => ['nullable', 'string', 'max:255'],
            'origin_address'     => ['nullable', 'string'],
            'file_format'        => ['nullable', 'string', 'max:50'],
            'file_size'          => ['nullable', 'string', 'max:50'],
            'download_url'       => ['nullable', 'string', 'max:1000'],
            'description'        => ['sometimes', 'required', 'string'],
            'terms_of_use'       => ['nullable', 'string'],
            'status'             => ['nullable', 'in:active,draft,paused,sold_out'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        $fields = $validator->validated();

        if ($request->has('specifications') && is_string($request->input('specifications'))) {
            try {
                $fields['specifications'] = json_decode($request->input('specifications'), true);
            } catch (\Exception $e) {}
        }

        $fields['is_digital'] = true;
        $fields['weight'] = 0;
        $fields['origin_id'] = null;
        $fields['origin_city'] = null;
        $fields['origin_province'] = null;
        $fields['origin_subdistrict'] = null;
        $fields['origin_label'] = null;
        $fields['origin_address'] = null;
        if ($request->has('terms_of_use')) $fields['terms_of_use'] = $request->input('terms_of_use');
        if ($expert?->name) $fields['author'] = $expert->name;
        if ($request->has('condition')) $fields['condition'] = $request->input('condition');
        if ($request->has('cover_type')) $fields['cover_type'] = $request->input('cover_type');
        if ($request->has('publication_year')) $fields['publication_year'] = $request->input('publication_year');
        if ($request->has('dimensions')) $fields['dimensions'] = $request->input('dimensions');
        if ($request->has('file_format')) $fields['file_format'] = $request->input('file_format');
        if ($request->has('file_size')) $fields['file_size'] = $request->input('file_size');

        if ($request->has('download_url')) {
            $fields['download_url'] = $request->input('download_url');
        }

        if ($request->has('stock')) {
            $fields['stock'] = $request->input('stock') !== '' && $request->input('stock') !== null
                ? (int)$request->input('stock')
                : null;
        }

        if ($request->has('discount_price')) {
            $fields['discount_price'] = $request->input('discount_price') !== '' && $request->input('discount_price') !== null
                ? (int)$request->input('discount_price')
                : null;
        }

        // Handle image update if a file was uploaded
        if ($request->hasFile('image')) {
            $request->validate([
                'image' => 'image|mimes:jpeg,png,jpg,webp|max:5120',
            ]);
            // Remove previous storage file if it exists and is local
            if ($product->image && !filter_var($product->image, FILTER_VALIDATE_URL)) {
                Storage::disk('public')->delete($product->image);
            }
            $path = $request->file('image')->store('products', 'public');
            $fields['image'] = $path;
        }

        // Handle digital file update if a file was uploaded
        if ($request->hasFile('digital_file') || $request->hasFile('file')) {
            $uploadedFile = $request->file('digital_file') ?: $request->file('file');
            $request->validate([
                'digital_file' => 'nullable|file|max:102400|mimes:pdf,zip,rar,doc,docx,ppt,pptx,epub,txt,xls,xlsx,csv,7z',
                'file' => 'nullable|file|max:102400|mimes:pdf,zip,rar,doc,docx,ppt,pptx,epub,txt,xls,xlsx,csv,7z',
            ]);
            // Remove previous digital file if exists
            if ($product->file_path && !filter_var($product->file_path, FILTER_VALIDATE_URL)) {
                Storage::disk('public')->delete($product->file_path);
            }
            $filePath = $uploadedFile->store('products_files', 'public');
            $fields['file_path'] = $filePath;
            if (!$request->input('file_format')) {
                $fields['file_format'] = strtoupper($uploadedFile->getClientOriginalExtension());
            }
            if (!$request->input('file_size')) {
                $bytes = $uploadedFile->getSize();
                $fields['file_size'] = $bytes >= 1048576 ? round($bytes / 1048576, 1) . ' MB' : round($bytes / 1024, 1) . ' KB';
            }
        }

        $product->update($fields);

        return response()->json($product);
    }

    // ── Buku Fisik ─────────────────────────────────────────────────────────────

    /**
     * Aturan validasi form Tambah/Edit Produk Buku Fisik.
     */
    private function physicalBookRules(bool $imageRequired): array
    {
        return [
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'author'      => ['nullable', 'string', 'max:255'],
            'publisher'   => ['nullable', 'string', 'max:255'],
            'isbn'        => ['nullable', 'string', 'max:20', 'regex:/^[0-9Xx\-\s]+$/'],
            'price'       => ['required', 'integer', 'min:0'],
            'upress_url'  => ['nullable', 'url', 'max:1000', function ($attribute, $value, $fail) {
                $host = strtolower((string) parse_url($value, PHP_URL_HOST));
                if ($host !== 'upress.latihan.co.id') {
                    $fail('Link Produk UPRESS harus mengarah ke halaman buku di https://upress.latihan.co.id/.');
                }
            }],
            'image'       => [
                $imageRequired ? 'required' : 'nullable',
                'file',
                'mimes:jpg,jpeg,png',
                'max:' . self::BOOK_COVER_MAX_KB,
                function ($attribute, $file, $fail) {
                    $size = @getimagesize($file->getRealPath());
                    if (!$size || empty($size[0]) || empty($size[1])) {
                        $fail('File foto buku tidak dapat dibaca sebagai gambar.');
                        return;
                    }
                    [$w, $h] = $size;
                    $target = self::BOOK_COVER_RATIO_W / self::BOOK_COVER_RATIO_H;
                    $ratio  = $w / $h;
                    $ratioLabel = self::BOOK_COVER_RATIO_W . ':' . self::BOOK_COVER_RATIO_H;

                    if (abs($ratio - $target) / $target > self::BOOK_COVER_RATIO_TOLERANCE) {
                        $fail("Rasio foto buku harus {$ratioLabel} (potret) sesuai katalog UPRESS, misalnya "
                            . self::BOOK_COVER_MIN_WIDTH . 'x' . self::BOOK_COVER_MIN_HEIGHT . " px atau 1000x1250 px. "
                            . "Foto Anda {$w}x{$h} px (rasio " . number_format($ratio, 2) . ').');
                        return;
                    }
                    if ($w < self::BOOK_COVER_MIN_WIDTH || $h < self::BOOK_COVER_MIN_HEIGHT) {
                        $fail('Resolusi foto buku minimal ' . self::BOOK_COVER_MIN_WIDTH . 'x' . self::BOOK_COVER_MIN_HEIGHT
                            . " px. Foto Anda {$w}x{$h} px.");
                    }
                },
            ],
        ];
    }

    private function physicalBookMessages(): array
    {
        return [
            'title.required' => 'Nama Buku wajib diisi.',
            'price.required' => 'Harga Buku wajib diisi.',
            'price.integer'  => 'Harga Buku harus berupa angka (Rupiah).',
            'price.min'      => 'Harga Buku minimal Rp 0.',
            'isbn.regex'     => 'ISBN hanya boleh berisi angka, huruf X, tanda hubung, atau spasi.',
            'upress_url.url' => 'Link Produk UPRESS harus berupa URL yang valid.',
            'image.required' => 'Foto Buku wajib diunggah.',
            'image.mimes'    => 'Format Foto Buku harus JPG, JPEG, atau PNG.',
            'image.max'      => 'Ukuran Foto Buku maksimal 5 MB.',
        ];
    }

    private function physicalBookValidationError($validator)
    {
        return response()->json([
            'message' => $validator->errors()->first() ?: 'Validasi gagal',
            'errors'  => $validator->errors(),
        ], 422);
    }

    /**
     * Simpan produk Buku Fisik baru. Foto disimpan ke disk `public` (storage aplikasi).
     */
    private function storePhysicalBook(Request $request, $user, Expert $expert)
    {
        $validator = Validator::make($request->all(), $this->physicalBookRules(true), $this->physicalBookMessages());
        if ($validator->fails()) {
            return $this->physicalBookValidationError($validator);
        }

        $data = collect($validator->validated())->except('image')->all();
        $data['image'] = $request->file('image')->store('products', 'public');

        $product = Product::create(array_merge($data, [
            'expert_id'     => $expert->id,
            'user_id'       => $user->id,
            'category'      => self::BOOK_CATEGORY,
            'is_digital'    => false,
            'condition'     => 'Baru',
            'language'      => 'Indonesia',
            'status'        => 'active',
            'sold_count'    => 0,
            'rating'        => 0.0,
            'reviews_count' => 0,
            'is_featured'   => false,
        ]));

        return response()->json($product->fresh(), 201);
    }

    /**
     * Perbarui produk Buku Fisik. Kategori tetap "Buku Fisik".
     */
    private function updatePhysicalBook(Request $request, Product $product)
    {
        $validator = Validator::make($request->all(), $this->physicalBookRules(empty($product->image)), $this->physicalBookMessages());
        if ($validator->fails()) {
            return $this->physicalBookValidationError($validator);
        }

        $fields = collect($validator->validated())->except('image')->all();
        $fields['category'] = self::BOOK_CATEGORY;
        $fields['is_digital'] = false;

        if ($request->hasFile('image')) {
            if ($product->image && !filter_var($product->image, FILTER_VALIDATE_URL)) {
                Storage::disk('public')->delete($product->image);
            }
            $fields['image'] = $request->file('image')->store('products', 'public');
        }

        $product->update($fields);

        return response()->json($product->fresh());
    }

    /**
     * Delete a product
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $expert = Expert::where('user_id', $user->id)->first();
        $product = Product::where(function ($q) use ($expert, $user) {
            if ($expert) {
                $q->where('expert_id', $expert->id)->orWhere('user_id', $user->id);
            } else {
                $q->where('user_id', $user->id);
            }
        })->findOrFail($id);

        // Delete image file if exists in storage
        if ($product->image && !filter_var($product->image, FILTER_VALIDATE_URL)) {
            Storage::disk('public')->delete($product->image);
        }

        // Delete digital file if exists in storage
        if ($product->file_path && !filter_var($product->file_path, FILTER_VALIDATE_URL)) {
            Storage::disk('public')->delete($product->file_path);
        }

        $product->delete();

        return response()->json(['message' => 'Produk berhasil dihapus']);
    }

    /**
     * Toggle product status (active <-> paused)
     */
    public function toggleStatus(Request $request, $id)
    {
        $user = $request->user();
        $expert = Expert::where('user_id', $user->id)->first();
        $product = Product::where(function ($q) use ($expert, $user) {
            if ($expert) {
                $q->where('expert_id', $expert->id)->orWhere('user_id', $user->id);
            } else {
                $q->where('user_id', $user->id);
            }
        })->findOrFail($id);

        $newStatus = $product->status === 'active' ? 'paused' : 'active';
        if ($request->has('status')) {
            $newStatus = $request->input('status');
        }

        $product->update(['status' => $newStatus]);

        return response()->json($product);
    }

    /**
     * Get a single product publicly by ID
     */
    public function showPublic(Request $request, $id)
    {
        $product = Product::with(['expert.user', 'user.expert'])->withCount('reviews')->withAvg('reviews', 'rating')->findOrFail($id);

        $imageUrl = null;
        if ($product->image) {
            $imageUrl = filter_var($product->image, FILTER_VALIDATE_URL) ? $product->image : asset('storage/' . $product->image);
        }

        $expert = $product->expert ?? $product->user?->expert;
        $user = $product->user ?? $expert?->user;

        $expertPhoto = null;
        if ($expert && $expert->photo) {
            $expertPhoto = filter_var($expert->photo, FILTER_VALIDATE_URL) ? $expert->photo : asset('storage/' . $expert->photo);
        } elseif ($user && $user->avatar_url) {
            $expertPhoto = filter_var($user->avatar_url, FILTER_VALIDATE_URL) ? $user->avatar_url : asset('storage/' . $user->avatar_url);
        } elseif ($user && $user->foto) {
            $expertPhoto = filter_var($user->foto, FILTER_VALIDATE_URL) ? $user->foto : asset('storage/' . $user->foto);
        }

        $revCount = (int) ($product->reviews_count ?? 0);
        $avgRating = $product->reviews_avg_rating !== null
            ? round((float) $product->reviews_avg_rating, 1)
            : ($product->rating > 0 ? (float) $product->rating : 0.0);

        // Check if requesting user has purchased this digital product
        $currentUser = $request->user('sanctum');
        $hasPurchased = false;
        $downloadUrl = null;

        if ($currentUser) {
            $isOwner = $currentUser->id === $product->user_id || ($expert && $currentUser->id === $expert->user_id);
            $isAdmin = $currentUser->role === 'admin';
            $purchase = ProductPurchase::where('user_id', $currentUser->id)
                ->where('product_id', $product->id)
                ->where('status', 'completed')
                ->first();

            if ($purchase || $isOwner || $isAdmin) {
                $hasPurchased = true;
                $downloadUrl = $product->file_url;
            }
        }

        return response()->json([
            'id'                 => $product->id,
            'title'              => $product->title,
            'author'             => $product->author ?: optional($expert)->name ?: optional($user)->name,
            'publisher'          => $product->publisher ?: (optional($expert)->institution ?? 'Penerbit Mandiri'),
            'publication_year'   => $product->publication_year,
            'isbn'               => $product->isbn,
            'language'           => $product->language ?: 'Indonesia',
            'pages'              => $product->pages,
            'cover_type'         => $product->cover_type,
            'dimensions'         => $product->dimensions,
            'condition'          => $product->condition ?: 'Baru',
            'specifications'     => $product->specifications,
            'category'           => $product->category,
            'price'              => (int) $product->price,
            'discount_price'     => $product->discount_price ? (int) $product->discount_price : null,
            'is_digital'         => (bool) $product->is_digital,
            'file_format'        => $product->file_format,
            'file_size'          => $product->file_size,
            'has_file'           => !empty($product->file_path) || !empty($product->download_url),
            'has_purchased'      => $hasPurchased,
            'download_url'       => $downloadUrl,
            'upress_url'         => $product->upress_url,
            'stock'              => $product->stock,
            'weight'             => (int) ($product->weight ?? 1000),
            'origin_id'          => $product->origin_id ? (int) $product->origin_id : 4816,
            'origin_city'        => $product->origin_city ?: 'Bandung',
            'origin_province'    => $product->origin_province ?: 'Jawa Barat',
            'origin_subdistrict' => $product->origin_subdistrict,
            'origin_label'       => $product->origin_label ?: ($product->origin_city ? "{$product->origin_city}, {$product->origin_province}" : 'Kota Bandung, Jawa Barat'),
            'origin_address'     => $product->origin_address,
            'description'        => $product->description,
            'image'              => $imageUrl,
            'image_url'          => $imageUrl,
            'status'             => $product->status,
            'sold_count'         => (int) ($product->sold_count ?? 0),
            'rating'             => $avgRating,
            'reviews_count'      => $revCount,
            'is_featured'        => (bool) $product->is_featured,
            'expert'             => $expert ? [
                'id'          => $expert->id,
                'name'        => $expert->name,
                'slug'        => $expert->slug,
                'institution' => $expert->institution,
                'field'       => $expert->field,
                'kriteria'    => $expert->kriteria,
                'photo'       => $expertPhoto,
                'photo_url'   => $expertPhoto,
                'verified'    => (bool) $expert->verified,
            ] : ($user ? [
                'id'          => $user->id,
                'name'        => $user->name,
                'slug'        => Str::slug($user->name),
                'institution' => null,
                'field'       => $user->role_type === 'surveyor' ? 'Surveyor' : ($user->role_type === 'tenaga_teknis' ? 'Tenaga Teknis' : 'Tenaga Ahli'),
                'kriteria'    => $user->role_type === 'surveyor' ? 'Surveyor' : ($user->role_type === 'tenaga_teknis' ? 'Tenaga Teknis' : 'Tenaga Ahli'),
                'photo'       => $expertPhoto,
                'photo_url'   => $expertPhoto,
                'verified'    => false,
            ] : null),
        ]);
    }

    /**
     * Download digital product file
     */
    public function downloadDigitalProduct(Request $request, $id)
    {
        $user = $request->user();
        $product = Product::findOrFail($id);

        if (!$product->is_digital) {
            return response()->json(['message' => 'Produk ini bukan produk digital.'], 400);
        }

        $expert = $product->expert;
        $isOwner = ($user && $user->id === $product->user_id) || ($expert && $user && $user->id === $expert->user_id);
        $isAdmin = ($user && $user->role === 'admin');

        $hasCompletedPurchase = false;
        if ($user) {
            $hasCompletedPurchase = ProductPurchase::where('user_id', $user->id)
                ->where('product_id', $product->id)
                ->where('status', 'completed')
                ->exists();
        }

        // Support download token if passed in query
        if (!$hasCompletedPurchase && $request->has('token')) {
            $hasCompletedPurchase = ProductPurchase::where('download_token', $request->input('token'))
                ->where('product_id', $product->id)
                ->where('status', 'completed')
                ->exists();
        }

        if (!$isOwner && !$isAdmin && !$hasCompletedPurchase) {
            return response()->json([
                'message' => 'Akses ditolak. Anda harus membeli produk digital ini terlebih dahulu untuk mengunduh.'
            ], 403);
        }

        if ($product->file_path && Storage::disk('public')->exists($product->file_path)) {
            $ext = pathinfo($product->file_path, PATHINFO_EXTENSION);
            $downloadName = Str::slug($product->title) . ($ext ? '.' . $ext : '');
            return Storage::disk('public')->download($product->file_path, $downloadName);
        }

        if ($product->download_url) {
            return response()->json([
                'success' => true,
                'download_url' => $product->download_url,
                'message' => 'Silakan akses materi digital melalui link berikut.',
            ]);
        }

        return response()->json([
            'message' => 'File produk digital belum diunggah atau tidak tersedia.'
        ], 404);
    }


    /**
     * Buy a product with points
     */
    public function buyWithPoints(Request $request, $id)
    {
        $user = $request->user();
        $product = Product::findOrFail($id);

        // Check if product is available
        if ($product->status !== 'active') {
            return response()->json(['message' => 'Produk tidak tersedia'], 422);
        }

        $quantity = max(1, (int) $request->input('quantity', 1));

        // Check stock availability
        if ($product->stock !== null) {
            if ($product->stock <= 0) {
                return response()->json(['message' => 'Stok produk telah habis.'], 422);
            }
            if ($quantity > $product->stock) {
                return response()->json([
                    'message' => "Jumlah pembelian ({$quantity}) melebihi stok yang tersedia ({$product->stock} stok tersisa)."
                ], 422);
            }
        }

        // Calculate points needed (convert IDR price to points)
        $unitPrice = (int) ($product->discount_price ?? $product->price);
        $totalProductPrice = $unitPrice * $quantity;
        $shippingCost = (int) ($request->shipping_cost ?? 0);
        $pointsNeeded = (int) ceil(($totalProductPrice + $shippingCost) / 1000);

        // Check user's point balance
        if ($user->point_balance < $pointsNeeded) {
            return response()->json([
                'message' => "Point tidak mencukupi. Diperlukan {$pointsNeeded} Point, saldo Anda {$user->point_balance} Point.",
                'required_points' => $pointsNeeded,
                'current_balance' => $user->point_balance,
            ], 422);
        }

        try {
            // Deduct points and create transaction
            $user->deductPoints(
                $pointsNeeded,
                'product_purchase',
                "Pembelian Produk" . ($quantity > 1 ? " ({$quantity}x)" : "") . ": {$product->title}",
                [
                    'product_id' => $product->id,
                    'expert_id' => $product->expert_id,
                ]
            );

            // Create ProductPurchase record with shipping details if physical product
            $purchase = \App\Models\ProductPurchase::create([
                'user_id'           => $user->id,
                'product_id'        => $product->id,
                'expert_id'         => $product->expert_id,
                'points_spent'      => $pointsNeeded,
                'amount_idr'        => (int) ($totalProductPrice + $shippingCost),
                'product_title'     => ($quantity > 1 ? "({$quantity}x) " : "") . $product->title,
                'payment_method'    => 'points',
                'recipient_name'    => $request->recipient_name ?: $user->name,
                'recipient_phone'   => $request->recipient_phone ?: $user->phone,
                'destination_id'    => $request->destination_id,
                'destination_label' => $request->destination_label,
                'shipping_address'  => $request->shipping_address,
                'courier_name'      => $request->courier_name,
                'courier_service'   => $request->courier_service,
                'shipping_cost'     => $shippingCost,
                'status'            => 'completed',
                'download_token'    => \Illuminate\Support\Str::random(64),
                'notes'             => ($product->is_digital ? 'Produk Digital (Akses Langsung)' : 'Produk Fisik (Dikirim)') . ($quantity > 1 ? " | Qty: {$quantity}" : ''),
            ]);

            // Increment product sold_count & decrement stock
            $product->increment('sold_count', $quantity);
            if ($product->stock !== null) {
                $product->decrement('stock', min($product->stock, $quantity));
                if ($product->fresh()->stock <= 0 && !$product->is_digital) {
                    $product->update(['status' => 'sold_out']);
                }
            }

            // Add points to expert (penjual)
            $expert = $product->expert;
            if ($expert && $expert->user) {
                $expert->user->increment('point_balance', $pointsNeeded);

                // Create point transaction for expert
                \App\Models\PointTransaction::create([
                    'user_id'      => $expert->user->id,
                    'type'         => \App\Models\PointTransaction::TYPE_PRODUCT_SALE,
                    'points'       => $pointsNeeded,
                    'amount_idr'   => ($product->discount_price ?? $product->price),
                    'status'       => \App\Models\PointTransaction::STATUS_SUCCESS,
                    'description'  => "Hasil Penjualan Produk: {$product->title} kepada {$user->name}",
                    'notes'        => "Penjualan Produk Digital via Point ({$product->title})",
                    'related_type' => \App\Models\ProductPurchase::class,
                    'related_id'   => $purchase->id,
                ]);
            }

            // Kirim notifikasi email ke Penjual & Pembeli
            $frontendUrl = rtrim(config('app.frontend_url', config('app.url')), '/');
            $salesUrl = $frontendUrl . '/kelola-produk';
            $myPurchasesUrl = $frontendUrl . '/profil';

            // 1. Email ke Penjual (Tenaga Ahli)
            if ($expert) {
                $sellerEmail = $expert->user?->email ?? $expert->email;
                if ($sellerEmail) {
                    try {
                        Mail::to($sellerEmail)->send(new ProductPurchasedSeller($purchase, $product, $expert, $user, $salesUrl, 'points'));
                    } catch (\Throwable $e) {
                        \Log::warning('Gagal kirim email ProductPurchasedSeller: ' . $e->getMessage());
                    }
                }
            }

            // 2. Email ke Pembeli
            if ($user && $user->email) {
                try {
                    Mail::to($user->email)->send(new ProductPurchasedBuyer($purchase, $product, $expert, $user, $myPurchasesUrl));
                } catch (\Throwable $e) {
                    \Log::warning('Gagal kirim email ProductPurchasedBuyer: ' . $e->getMessage());
                }
            }

            return response()->json([
                'message' => 'Produk berhasil dibeli',
                'purchase' => $purchase,
                'download_token' => $purchase->download_token,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal membeli produk: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get user's purchased products
     */
    public function myPurchases(Request $request)
    {
        $user = $request->user();
        $purchases = ProductPurchase::where('user_id', $user->id)
            ->with(['product.expert', 'expert'])
            ->latest()
            ->get()
            ->map(function ($purchase) {
                $product = $purchase->product;
                return [
                    'id'             => $purchase->id,
                    'reference_code' => $purchase->reference_code,
                    'product_id'     => $purchase->product_id,
                    'product_title'  => $purchase->product_title,
                    'points_spent'   => $purchase->points_spent,
                    'amount_idr'     => $purchase->amount_idr,
                    'payment_method' => $purchase->payment_method,
                    'status'         => $purchase->status,
                    'download_token' => $purchase->download_token,
                    'purchased_at'   => $purchase->created_at->toISOString(),
                    'product'        => $product ? [
                        'id'           => $product->id,
                        'title'        => $product->title,
                        'is_digital'   => (bool) $product->is_digital,
                        'image_url'    => $product->image_url,
                        'file_url'     => $purchase->status === 'completed' ? $product->file_url : null,
                        'download_url' => $purchase->status === 'completed' ? $product->download_url : null,
                        'has_file'     => !empty($product->file_path) || !empty($product->download_url),
                    ] : null,
                ];
            });

        return response()->json($purchases);
    }
}
