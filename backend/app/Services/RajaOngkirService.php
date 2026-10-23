<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RajaOngkirService
{
    protected string $apiKey;
    protected string $baseUrl;
    protected int $defaultOriginId;

    public function __construct()
    {
        $this->apiKey = config('services.rajaongkir.api_key', 'fXSokXZA827d17be18f9124fbDIM8j5q');
        $this->baseUrl = rtrim(config('services.rajaongkir.base_url', 'https://rajaongkir.komerce.id/api/v1'), '/');
        $this->defaultOriginId = (int) config('services.rajaongkir.origin_id', 4816);
    }

    /**
     * Cari destinasi domestik berdasarkan nama kelurahan/kecamatan/kota
     */
    public function searchDestinations(string $search, int $limit = 10): array
    {
        $searchClean = trim($search);
        if (strlen($searchClean) < 2) {
            return [];
        }

        try {
            $response = Http::timeout(8)->withHeaders([
                'key' => $this->apiKey,
                'Accept' => 'application/json',
            ])->get("{$this->baseUrl}/destination/domestic-destination", [
                'search' => $searchClean,
                'limit' => $limit,
            ]);

            if ($response->successful()) {
                $data = $response->json('data') ?? [];
                if (!empty($data) && is_array($data)) {
                    return $data;
                }
            }

            Log::warning('RajaOngkir searchDestinations returned empty or non-200', [
                'status' => $response->status(),
            ]);
        } catch (\Exception $e) {
            Log::warning('RajaOngkir searchDestinations exception: ' . $e->getMessage());
        }

        // Fallback local search if external API is unreachable or returns empty
        return $this->fallbackDestinations($searchClean, $limit);
    }

    /**
     * Ambil daftar provinsi
     */
    public function getProvinces(): array
    {
        try {
            $response = Http::timeout(8)->withHeaders([
                'key' => $this->apiKey,
                'Accept' => 'application/json',
            ])->get("{$this->baseUrl}/destination/province");

            if ($response->successful()) {
                $data = $response->json('data') ?? [];
                if (!empty($data)) {
                    return $data;
                }
            }
        } catch (\Exception $e) {
            Log::warning('RajaOngkir getProvinces exception: ' . $e->getMessage());
        }

        return $this->fallbackProvinces();
    }

    /**
     * Detail lokasi asal (pengirim)
     */
    public function getOriginDetails(int $originId = 0, ?array $customOrigin = null): array
    {
        if (!empty($customOrigin) && !empty($customOrigin['city_name'])) {
            return [
                'id'            => $originId ?: $this->defaultOriginId,
                'city_name'     => $customOrigin['city_name'],
                'district_name' => $customOrigin['district_name'] ?? $customOrigin['subdistrict_name'] ?? $customOrigin['city_name'],
                'province_name' => $customOrigin['province_name'] ?? '',
                'label'         => $customOrigin['label'] ?? "{$customOrigin['city_name']}, " . ($customOrigin['province_name'] ?? ''),
            ];
        }

        $id = $originId > 0 ? $originId : $this->defaultOriginId;
        $fallback = $this->fallbackDestinations('', 100);
        $found = collect($fallback)->firstWhere('id', $id);

        if ($found) {
            return [
                'id'            => $found['id'],
                'city_name'     => $found['city_name'] ?? 'Bandung',
                'district_name' => $found['district_name'] ?? 'Bandung',
                'province_name' => $found['province_name'] ?? 'Jawa Barat',
                'label'         => $found['label'] ?? 'Kota Bandung, Jawa Barat',
            ];
        }

        return [
            'id'            => $id,
            'city_name'     => 'Bandung',
            'district_name' => 'Bandung Kidul',
            'province_name' => 'Jawa Barat',
            'label'         => 'Kota Bandung, Jawa Barat (Gudang Pengirim)',
        ];
    }

    /**
     * Hitung ongkir domestik
     */
    public function calculateCost(int $originId, int $destinationId, int $weight = 1000, ?string $courier = null): array
    {
        $origin = $originId > 0 ? $originId : $this->defaultOriginId;
        $weight = max(100, $weight);

        $couriersToQuery = $courier ? [strtolower($courier)] : ['jne', 'sicepat', 'jnt', 'pos', 'tiki'];
        $allResults = [];

        foreach ($couriersToQuery as $c) {
            try {
                $payload = [
                    'origin' => $origin,
                    'destination' => $destinationId,
                    'weight' => $weight,
                    'courier' => $c,
                ];

                $response = Http::timeout(8)->asForm()->withHeaders([
                    'key' => $this->apiKey,
                    'Accept' => 'application/json',
                ])->post("{$this->baseUrl}/calculate/domestic-cost", $payload);

                if ($response->successful()) {
                    $services = $response->json('data') ?? [];
                    if (is_array($services)) {
                        foreach ($services as $srv) {
                            $cost = (int) ($srv['cost'] ?? 0);
                            if ($cost <= 0) continue;

                            $srvCode = strtoupper($srv['service'] ?? '');
                            $srvDesc = strtoupper($srv['description'] ?? '');

                            // Filter out unrealistic heavy-freight sub-brackets and charter codes (e.g. JTR<130, JTR>130, JTR>200, SPS)
                            if (
                                str_contains($srvCode, '<') ||
                                str_contains($srvCode, '>') ||
                                str_contains($srvCode, 'JTR<') ||
                                str_contains($srvCode, 'JTR>') ||
                                str_contains($srvCode, 'JTR150') ||
                                str_contains($srvCode, 'JTR250') ||
                                str_contains($srvDesc, '<130') ||
                                str_contains($srvDesc, '>130') ||
                                str_contains($srvDesc, '>200')
                            ) {
                                continue;
                            }

                            // If weight is relatively small (< 5kg), filter out super charter / excessive SPS services
                            if ($weight <= 5000 && ($srvCode === 'SPS' || str_contains($srvDesc, 'SUPER SPEED') || $cost > 200000)) {
                                continue;
                            }

                            // Format ETD properly (e.g. "1-2 hari", "1 hari", "Hari ini")
                            $rawEtd = $srv['etd'] ?? null;
                            $srv['etd'] = $this->formatEtd($rawEtd);

                            $allResults[] = $srv;
                        }
                    }
                }
            } catch (\Exception $e) {
                Log::warning("RajaOngkir calculateCost for courier {$c} failed: " . $e->getMessage());
            }
        }

        // If no results from external API, provide calculated standard fallback
        if (empty($allResults)) {
            $allResults = $this->fallbackCourierRates($weight);
        }

        // Sort by cost ascending so the buyer sees the most economical options first
        usort($allResults, function ($a, $b) {
            return ($a['cost'] ?? 0) <=> ($b['cost'] ?? 0);
        });

        return $allResults;
    }

    /**
     * Format estimasi hari pengiriman (ETD) sesuai RajaOngkir
     */
    protected function formatEtd(?string $etd): ?string
    {
        if (!$etd) {
            return null;
        }

        $trimmed = trim($etd);
        if ($trimmed === '') {
            return null;
        }

        // If already has 'day' or 'hari', keep RajaOngkir's format
        if (stripos($trimmed, 'day') !== false || stripos($trimmed, 'hari') !== false) {
            return $trimmed;
        }

        // If numeric or range (e.g. "1", "1-2", "2-3"), append "day"
        return $trimmed . ' day';
    }

    /**
     * Fallback standard courier rates
     */
    protected function fallbackCourierRates(int $weight): array
    {
        $kg = (int) max(1, ceil($weight / 1000));

        return [
            [
                'name'        => 'Jalur Nugraha Ekakurir (JNE)',
                'code'        => 'jne',
                'service'     => 'REG',
                'description' => 'Layanan Reguler',
                'cost'        => 12000 * $kg,
                'etd'         => '2-3 hari',
            ],
            [
                'name'        => 'Jalur Nugraha Ekakurir (JNE)',
                'code'        => 'jne',
                'service'     => 'YES',
                'description' => 'Yakin Esok Sampai',
                'cost'        => 22000 * $kg,
                'etd'         => '1 hari',
            ],
            [
                'name'        => 'J&T Express (J&T)',
                'code'        => 'jnt',
                'service'     => 'EZ',
                'description' => 'Layanan Reguler Express',
                'cost'        => 13000 * $kg,
                'etd'         => '2-3 hari',
            ],
            [
                'name'        => 'SiCepat Express',
                'code'        => 'sicepat',
                'service'     => 'REG',
                'description' => 'SiCepat Regular Package',
                'cost'        => 12500 * $kg,
                'etd'         => '2-3 hari',
            ],
            [
                'name'        => 'POS Indonesia (POS)',
                'code'        => 'pos',
                'service'     => 'Pos Reguler',
                'description' => 'Layanan Pos Kilat Khusus',
                'cost'        => 11000 * $kg,
                'etd'         => '2-4 hari',
            ],
        ];
    }

    /**
     * Fallback destinations dictionary for Indonesian major cities
     */
    protected function fallbackDestinations(string $search, int $limit): array
    {
        $all = [
            ['id' => 4816, 'label' => 'BANDUNG, JAWA BARAT', 'city_name' => 'BANDUNG', 'district_name' => 'BANDUNG', 'province_name' => 'JAWA BARAT', 'zip_code' => '40111'],
            ['id' => 4866, 'label' => 'BATUNUNGGAL, BANDUNG KIDUL, BANDUNG, JAWA BARAT', 'city_name' => 'BANDUNG', 'district_name' => 'BANDUNG KIDUL', 'province_name' => 'JAWA BARAT', 'zip_code' => '40266'],
            ['id' => 4867, 'label' => 'KUJANGSARI, BANDUNG KIDUL, BANDUNG, JAWA BARAT', 'city_name' => 'BANDUNG', 'district_name' => 'BANDUNG KIDUL', 'province_name' => 'JAWA BARAT', 'zip_code' => '40287'],
            ['id' => 151,  'label' => 'JAKARTA PUSAT, DKI JAKARTA', 'city_name' => 'JAKARTA PUSAT', 'district_name' => 'GAMBIR', 'province_name' => 'DKI JAKARTA', 'zip_code' => '10110'],
            ['id' => 152,  'label' => 'JAKARTA SELATAN, DKI JAKARTA', 'city_name' => 'JAKARTA SELATAN', 'district_name' => 'KEBAYORAN BARU', 'province_name' => 'DKI JAKARTA', 'zip_code' => '12110'],
            ['id' => 153,  'label' => 'JAKARTA BARAT, DKI JAKARTA', 'city_name' => 'JAKARTA BARAT', 'district_name' => 'GROGOL PETAMBURAN', 'province_name' => 'DKI JAKARTA', 'zip_code' => '11450'],
            ['id' => 154,  'label' => 'JAKARTA TIMUR, DKI JAKARTA', 'city_name' => 'JAKARTA TIMUR', 'district_name' => 'JATINEGARA', 'province_name' => 'DKI JAKARTA', 'zip_code' => '13310'],
            ['id' => 155,  'label' => 'JAKARTA UTARA, DKI JAKARTA', 'city_name' => 'JAKARTA UTARA', 'district_name' => 'KELAPA GADING', 'province_name' => 'DKI JAKARTA', 'zip_code' => '14240'],
            ['id' => 78,   'label' => 'BOGOR, JAWA BARAT', 'city_name' => 'BOGOR', 'district_name' => 'BOGOR TENGAH', 'province_name' => 'JAWA BARAT', 'zip_code' => '16121'],
            ['id' => 115,  'label' => 'DEPOK, JAWA BARAT', 'city_name' => 'DEPOK', 'district_name' => 'PANCORAN MAS', 'province_name' => 'JAWA BARAT', 'zip_code' => '16436'],
            ['id' => 455,  'label' => 'TANGERANG, BANTEN', 'city_name' => 'TANGERANG', 'district_name' => 'TANGERANG', 'province_name' => 'BANTEN', 'zip_code' => '15111'],
            ['id' => 456,  'label' => 'TANGERANG SELATAN, BANTEN', 'city_name' => 'TANGERANG SELATAN', 'district_name' => 'SERPONG', 'province_name' => 'BANTEN', 'zip_code' => '15310'],
            ['id' => 54,   'label' => 'BEKASI, JAWA BARAT', 'city_name' => 'BEKASI', 'district_name' => 'BEKASI TIMUR', 'province_name' => 'JAWA BARAT', 'zip_code' => '17111'],
            ['id' => 444,  'label' => 'SURABAYA, JAWA TIMUR', 'city_name' => 'SURABAYA', 'district_name' => 'GUBENG', 'province_name' => 'JAWA TIMUR', 'zip_code' => '60281'],
            ['id' => 399,  'label' => 'SEMARANG, JAWA TENGAH', 'city_name' => 'SEMARANG', 'district_name' => 'SEMARANG TENGAH', 'province_name' => 'JAWA TENGAH', 'zip_code' => '50131'],
            ['id' => 501,  'label' => 'YOGYAKARTA, DI YOGYAKARTA', 'city_name' => 'YOGYAKARTA', 'district_name' => 'DANUREJAN', 'province_name' => 'DI YOGYAKARTA', 'zip_code' => '55211'],
            ['id' => 256,  'label' => 'MALANG, JAWA TIMUR', 'city_name' => 'MALANG', 'district_name' => 'KLOJEN', 'province_name' => 'JAWA TIMUR', 'zip_code' => '65111'],
            ['id' => 445,  'label' => 'SURAKARTA (SOLO), JAWA TENGAH', 'city_name' => 'SURAKARTA', 'district_name' => 'BANJARSARI', 'province_name' => 'JAWA TENGAH', 'zip_code' => '57131'],
            ['id' => 278,  'label' => 'MEDAN, SUMATERA UTARA', 'city_name' => 'MEDAN', 'district_name' => 'MEDAN KOTA', 'province_name' => 'SUMATERA UTARA', 'zip_code' => '20211'],
            ['id' => 327,  'label' => 'PALEMBANG, SUMATERA SELATAN', 'city_name' => 'PALEMBANG', 'district_name' => 'ILIR TIMUR I', 'province_name' => 'SUMATERA SELATAN', 'zip_code' => '30111'],
            ['id' => 318,  'label' => 'PADANG, SUMATERA BARAT', 'city_name' => 'PADANG', 'district_name' => 'PADANG BARAT', 'province_name' => 'SUMATERA BARAT', 'zip_code' => '25111'],
            ['id' => 338,  'label' => 'PEKANBARU, RIAU', 'city_name' => 'PEKANBARU', 'district_name' => 'PEKANBARU KOTA', 'province_name' => 'RIAU', 'zip_code' => '28111'],
            ['id' => 255,  'label' => 'MAKASSAR, SULAWESI SELATAN', 'city_name' => 'MAKASSAR', 'district_name' => 'MAKASSAR', 'province_name' => 'SULAWESI SELATAN', 'zip_code' => '90141'],
            ['id' => 114,  'label' => 'DENPASAR, BALI', 'city_name' => 'DENPASAR', 'district_name' => 'DENPASAR BARAT', 'province_name' => 'BALI', 'zip_code' => '80111'],
            ['id' => 18,   'label' => 'BALIKPAPAN, KALIMANTAN TIMUR', 'city_name' => 'BALIKPAPAN', 'district_name' => 'BALIKPAPAN KOTA', 'province_name' => 'KALIMANTAN TIMUR', 'zip_code' => '76111'],
            ['id' => 387,  'label' => 'SAMARINDA, KALIMANTAN TIMUR', 'city_name' => 'SAMARINDA', 'district_name' => 'SAMARINDA KOTA', 'province_name' => 'KALIMANTAN TIMUR', 'zip_code' => '75111'],
            ['id' => 22,   'label' => 'BANJARMASIN, KALIMANTAN SELATAN', 'city_name' => 'BANJARMASIN', 'district_name' => 'BANJARMASIN TENGAH', 'province_name' => 'KALIMANTAN SELATAN', 'zip_code' => '70111'],
            ['id' => 258,  'label' => 'MANADO, SULAWESI UTARA', 'city_name' => 'MANADO', 'district_name' => 'WENANG', 'province_name' => 'SULAWESI UTARA', 'zip_code' => '95111'],
            ['id' => 24,   'label' => 'BANDAR LAMPUNG, LAMPUNG', 'city_name' => 'BANDAR LAMPUNG', 'district_name' => 'TANJUNG KARANG PUSAT', 'province_name' => 'LAMPUNG', 'zip_code' => '35111'],
        ];

        $q = strtolower($search);
        $filtered = array_filter($all, function ($item) use ($q) {
            return str_contains(strtolower($item['label']), $q) ||
                   str_contains(strtolower($item['city_name']), $q) ||
                   str_contains(strtolower($item['province_name']), $q);
        });

        return array_slice(array_values($filtered), 0, $limit);
    }

    /**
     * Fallback provinces
     */
    protected function fallbackProvinces(): array
    {
        return [
            ['id' => 1, 'name' => 'Bali'],
            ['id' => 2, 'name' => 'Bangka Belitung'],
            ['id' => 3, 'name' => 'Banten'],
            ['id' => 4, 'name' => 'Bengkulu'],
            ['id' => 5, 'name' => 'DI Yogyakarta'],
            ['id' => 6, 'name' => 'DKI Jakarta'],
            ['id' => 7, 'name' => 'Gorontalo'],
            ['id' => 8, 'name' => 'Jambi'],
            ['id' => 9, 'name' => 'Jawa Barat'],
            ['id' => 10, 'name' => 'Jawa Tengah'],
            ['id' => 11, 'name' => 'Jawa Timur'],
            ['id' => 12, 'name' => 'Kalimantan Barat'],
            ['id' => 13, 'name' => 'Kalimantan Selatan'],
            ['id' => 14, 'name' => 'Kalimantan Tengah'],
            ['id' => 15, 'name' => 'Kalimantan Timur'],
            ['id' => 16, 'name' => 'Kalimantan Utara'],
            ['id' => 17, 'name' => 'Kepulauan Riau'],
            ['id' => 18, 'name' => 'Lampung'],
            ['id' => 19, 'name' => 'Maluku'],
            ['id' => 20, 'name' => 'Maluku Utara'],
            ['id' => 21, 'name' => 'Nanggroe Aceh Darussalam (NAD)'],
            ['id' => 22, 'name' => 'Nusa Tenggara Barat (NTB)'],
            ['id' => 23, 'name' => 'Nusa Tenggara Timur (NTT)'],
            ['id' => 24, 'name' => 'Papua'],
            ['id' => 25, 'name' => 'Papua Barat'],
            ['id' => 26, 'name' => 'Riau'],
            ['id' => 27, 'name' => 'Sulawesi Barat'],
            ['id' => 28, 'name' => 'Sulawesi Selatan'],
            ['id' => 29, 'name' => 'Sulawesi Tengah'],
            ['id' => 30, 'name' => 'Sulawesi Tenggara'],
            ['id' => 31, 'name' => 'Sulawesi Utara'],
            ['id' => 32, 'name' => 'Sumatera Barat'],
            ['id' => 33, 'name' => 'Sumatera Selatan'],
            ['id' => 34, 'name' => 'Sumatera Utara'],
        ];
    }
}
