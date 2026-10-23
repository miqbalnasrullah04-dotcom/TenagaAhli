<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RajaOngkirService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ShippingController extends Controller
{
    protected RajaOngkirService $shippingService;

    public function __construct(RajaOngkirService $shippingService)
    {
        $this->shippingService = $shippingService;
    }

    /**
     * Cari destinasi / kota / kecamatan
     * GET /api/shipping/destinations?search=Jakarta
     */
    public function searchDestinations(Request $request)
    {
        $search = $request->query('search', '');
        if (strlen($search) < 2) {
            return response()->json(['data' => []]);
        }

        $limit = (int) $request->query('limit', 10);
        $results = $this->shippingService->searchDestinations($search, $limit);

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }

    /**
     * Daftar provinsi
     * GET /api/shipping/provinces
     */
    public function getProvinces()
    {
        $results = $this->shippingService->getProvinces();

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }

    /**
     * Hitung ongkos kirim
     * POST /api/shipping/calculate
     */
    public function calculateCost(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'destination_id'  => ['required', 'integer'],
            'origin_id'       => ['nullable', 'integer'],
            'origin_city'     => ['nullable', 'string'],
            'origin_province' => ['nullable', 'string'],
            'origin_label'    => ['nullable', 'string'],
            'weight'          => ['nullable', 'integer', 'min:1'],
            'courier'         => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $originId = (int) ($request->origin_id ?: config('services.rajaongkir.origin_id', 4816));
        $destinationId = (int) $request->destination_id;
        $weight = (int) ($request->weight ?: 1000);
        $courier = $request->courier;

        $customOrigin = null;
        if ($request->filled('origin_city')) {
            $customOrigin = [
                'city_name'     => $request->origin_city,
                'province_name' => $request->origin_province,
                'label'         => $request->origin_label,
            ];
        }

        $originInfo = $this->shippingService->getOriginDetails($originId, $customOrigin);
        $costs = $this->shippingService->calculateCost($originId, $destinationId, $weight, $courier);

        return response()->json([
            'success'      => true,
            'origin'       => $originInfo,
            'weight_grams' => $weight,
            'data'         => $costs,
        ]);
    }
}
