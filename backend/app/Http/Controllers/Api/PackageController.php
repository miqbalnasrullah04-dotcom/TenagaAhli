<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Package;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PackageController extends Controller
{
    /**
     * GET /api/packages
     * Endpoint publik — hanya kembalikan paket yang relevan untuk role_type user.
     * Paket dengan role_type='all' selalu disertakan.
     * Query param ?role_type=tenaga_ahli|surveyor|all
     */
    public function index(Request $request)
    {
        $roleType = $request->input('role_type');

        // Jika user terautentikasi (via sanctum bearer token atau session)
        $user = $request->user('sanctum') ?? $request->user();
        if ($user) {
            $expert = $user->expert;
            $hasTenagaAhli = $user->role_type === 'tenaga_ahli' ||
                ($expert && (
                    $expert->is_tenaga_ahli ||
                    $expert->kriteria === 'Tenaga Ahli' ||
                    (is_array($expert->kriteria_list) && in_array('Tenaga Ahli', $expert->kriteria_list))
                ));

            if ($hasTenagaAhli) {
                // Sesuai aturan: Tenaga Ahli SELALU mendapatkan paket harga Tenaga Ahli
                $roleType = 'tenaga_ahli';
            } elseif ($user->role_type === 'surveyor' || ($expert && $expert->is_surveyor && !$expert->is_tenaga_teknis)) {
                $roleType = 'surveyor';
            } elseif ($user->role_type === 'tenaga_teknis' || ($expert && $expert->is_tenaga_teknis)) {
                $roleType = 'tenaga_teknis';
            } else {
                $roleType = $user->role_type ?? 'tenaga_ahli';
            }
        }

        if (!$roleType) {
            $roleType = 'all';
        }

        $packages = Package::where('is_active', true)
            ->where(function ($q) use ($roleType) {
                if ($roleType === 'all') {
                    $q->where('role_type', 'all');
                } else {
                    $q->where('role_type', 'all')
                      ->orWhere('role_type', $roleType);
                }
            })
            ->orderBy('order')
            ->get();

        return response()->json($packages);
    }

    // ── ADMIN ──────────────────────────────────────────────────────────────────

    /**
     * GET /api/admin/packages
     * Semua paket, bisa difilter by role_type via ?role_type=
     */
    public function adminIndex(Request $request)
    {
        $query = Package::orderBy('role_type')->orderBy('order');

        if ($request->filled('role_type') && $request->role_type !== 'all') {
            $query->where('role_type', $request->role_type);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'        => ['required', 'string', 'max:255'],
            'price'       => ['required', 'integer', 'min:0'],
            'role_type'   => ['required', 'string', 'in:all,tenaga_ahli,surveyor,tenaga_teknis'],
            'description' => ['nullable', 'string'],
            'benefits'    => ['nullable', 'array'],
            'is_active'   => ['nullable', 'boolean'],
            'order'       => ['nullable', 'integer'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $data = $validator->validated();
        $data['slug'] = Str::slug($request->name . '-' . $request->role_type);

        $package = Package::create($data);

        return response()->json($package, 201);
    }

    public function update(Request $request, $id)
    {
        $package = Package::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name'        => ['required', 'string', 'max:255'],
            'price'       => ['required', 'integer', 'min:0'],
            'role_type'   => ['required', 'string', 'in:all,tenaga_ahli,surveyor,tenaga_teknis'],
            'description' => ['nullable', 'string'],
            'benefits'    => ['nullable', 'array'],
            'is_active'   => ['nullable', 'boolean'],
            'order'       => ['nullable', 'integer'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $data = $validator->validated();
        // Update slug jika nama atau role berubah
        $data['slug'] = Str::slug($data['name'] . '-' . $data['role_type']);

        $package->update($data);

        return response()->json($package);
    }

    public function destroy($id)
    {
        Package::findOrFail($id)->delete();
        return response()->json(['message' => 'Paket berhasil dihapus']);
    }
}
