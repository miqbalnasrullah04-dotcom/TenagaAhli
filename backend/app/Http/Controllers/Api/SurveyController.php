<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use Carbon\Carbon;
use Illuminate\Http\Request;

class SurveyController extends Controller
{
    /**
     * Display a listing of the resource for the authenticated user.
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        // Auto seed sample data for new surveyor if empty
        $count = Survey::where('user_id', $userId)->count();
        if ($count === 0) {
            $this->seedInitialSurveys($userId);
        }

        $query = Survey::where('user_id', $userId);

        // Filter by status if provided
        if ($request->filled('status') && $request->status !== 'Semua') {
            $query->where('status', $request->status);
        }

        // Filter by category if provided
        if ($request->filled('category') && $request->category !== 'Semua') {
            $query->where('category', $request->category);
        }

        // Search in title, location, client_name
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%")
                  ->orWhere('client_name', 'like', "%{$search}%");
            });
        }

        $surveys = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $surveys,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'survey_date' => 'nullable|date',
            'status' => 'required|string|in:Belum Mulai,Dalam Proses,Selesai,Dibatalkan',
            'client_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'result_notes' => 'nullable|string',
        ]);

        $survey = Survey::create([
            'user_id' => $request->user()->id,
            'title' => $validated['title'],
            'location' => $validated['location'],
            'category' => $validated['category'] ?? 'AMDAL',
            'survey_date' => $validated['survey_date'] ?? now()->toDateString(),
            'status' => $validated['status'],
            'client_name' => $validated['client_name'] ?? null,
            'description' => $validated['description'] ?? null,
            'result_notes' => $validated['result_notes'] ?? null,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Tugas survei berhasil ditambahkan',
            'data' => $survey,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, $id)
    {
        $survey = Survey::where('user_id', $request->user()->id)->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $survey,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $survey = Survey::where('user_id', $request->user()->id)->findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'survey_date' => 'nullable|date',
            'status' => 'required|string|in:Belum Mulai,Dalam Proses,Selesai,Dibatalkan',
            'client_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'result_notes' => 'nullable|string',
        ]);

        $survey->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Tugas survei berhasil diperbarui',
            'data' => $survey,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, $id)
    {
        $survey = Survey::where('user_id', $request->user()->id)->findOrFail($id);
        $survey->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Tugas survei berhasil dihapus',
        ]);
    }

    /**
     * Get statistics for surveyor dashboard.
     */
    public function stats(Request $request)
    {
        $userId = $request->user()->id;

        $totalSurvei = Survey::where('user_id', $userId)->count();
        $tugasAktif = Survey::where('user_id', $userId)->whereIn('status', ['Dalam Proses', 'Belum Mulai'])->count();
        $selesaiBulanIni = Survey::where('user_id', $userId)
            ->where('status', 'Selesai')
            ->whereMonth('updated_at', Carbon::now()->month)
            ->whereYear('updated_at', Carbon::now()->year)
            ->count();
        $totalSelesai = Survey::where('user_id', $userId)->where('status', 'Selesai')->count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_survei' => $totalSurvei,
                'tugas_aktif' => $tugasAktif,
                'selesai_bulan_ini' => $selesaiBulanIni,
                'total_selesai' => $totalSelesai,
                'rating' => 4.9,
            ],
        ]);
    }

    /**
     * Helper to seed initial sample surveys.
     */
    private function seedInitialSurveys($userId)
    {
        $samples = [
            [
                'user_id' => $userId,
                'title' => 'Survei Lahan Perumahan Hijau Blok C',
                'location' => 'Jakarta Selatan',
                'category' => 'AMDAL',
                'survey_date' => Carbon::now()->subDays(2)->toDateString(),
                'status' => 'Dalam Proses',
                'client_name' => 'PT. Mega Properti Nusantara',
                'description' => 'Pengukuran topografi dan pengambilan sampel tanah di area rencana pembangunan klaster baru.',
                'result_notes' => 'Sampel tanah titik A-D sudah terkumpul, menunggu uji laboratorium lingkungan.',
            ],
            [
                'user_id' => $userId,
                'title' => 'Pemetaan Dampak Lingkungan Kawasan Industri',
                'location' => 'Tangerang, Banten',
                'category' => 'Lingkungan',
                'survey_date' => Carbon::now()->subDays(5)->toDateString(),
                'status' => 'Selesai',
                'client_name' => 'PT. Sinar Industri Abadi',
                'description' => 'Analisis debit air limbah dan kualitas udara sekitar cerobong pabrik.',
                'result_notes' => 'Laporan uji baku mutu air telah diserahkan kepada dinas terkait dengan status memenuhi syarat.',
            ],
            [
                'user_id' => $userId,
                'title' => 'Inspeksi Lapangan Jalur Drainase Perkotaan',
                'location' => 'Bekasi Barat',
                'category' => 'Hidrologi',
                'survey_date' => Carbon::now()->subDays(8)->toDateString(),
                'status' => 'Selesai',
                'client_name' => 'Dinas Bina Marga',
                'description' => 'Pengecekan sedimentasi dan kapasitas tampung saluran air utama.',
                'result_notes' => 'Ditemukan pendangkalan 30cm di segmen 4, rekomendasi pengerukan telah disusun.',
            ],
            [
                'user_id' => $userId,
                'title' => 'Survei Geoteknik Fondasi Jembatan Penghubung',
                'location' => 'Bogor Timur',
                'category' => 'Topografi',
                'survey_date' => Carbon::now()->addDays(2)->toDateString(),
                'status' => 'Belum Mulai',
                'client_name' => 'PT. Karya Utama Konstruksi',
                'description' => 'Uji penetrasi konus (CPT) dan boring dangkal di 4 titik abutmen jembatan.',
                'result_notes' => null,
            ],
            [
                'user_id' => $userId,
                'title' => 'Studi Kelayakan Lingkungan Pembangkit Listrik Minihidro',
                'location' => 'Sukabumi',
                'category' => 'AMDAL',
                'survey_date' => Carbon::now()->addDays(5)->toDateString(),
                'status' => 'Belum Mulai',
                'client_name' => 'PT. Energi Terbarukan Mandiri',
                'description' => 'Survei biodiversitas flora dan fauna di sepanjang aliran sungai Cimandiri.',
                'result_notes' => null,
            ],
        ];

        foreach ($samples as $item) {
            Survey::create($item);
        }
    }
}
