<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expert;
use App\Services\PointService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AkademikController extends Controller
{
    /**
     * Get all publikasi
     */
    public function indexPublikasi(Request $request)
    {
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        return response()->json($expert->publikasi ?? []);
    }

    /**
     * Store publikasi
     */
    public function storePublikasi(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'jenis' => 'required|string|max:100',
            'judul' => 'required|string|max:500',
            'penerbit' => 'required|string|max:255',
            'tahun' => 'required|string|max:4',
            'link' => 'nullable|url|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $publikasi = $expert->publikasi ?? [];
        
        $newPublication = array_merge($validator->validated(), [
            'id' => Str::uuid()->toString(),
            'created_at' => now()->toISOString(),
        ]);
        
        $publikasi[] = $newPublication;
        $expert->update(['publikasi' => $publikasi]);

        // Award points for adding publication
        $pointService = new PointService();
        $pointService->awardPoints($expert->user_id, 'add_publication', 'Menambahkan publikasi: ' . $newPublication['judul']);

        return response()->json($newPublication, 201);
    }

    /**
     * Delete publikasi
     */
    public function destroyPublikasi(Request $request, $id)
    {
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $publikasi = $expert->publikasi ?? [];
        
        $filtered = array_filter($publikasi, function($item) use ($id) {
            return $item['id'] !== $id;
        });
        
        if (count($filtered) === count($publikasi)) {
            return response()->json(['message' => 'Publikasi tidak ditemukan'], 404);
        }
        
        $expert->update(['publikasi' => array_values($filtered)]);
        
        return response()->json(['message' => 'Publikasi berhasil dihapus']);
    }

    /**
     * Get all organisasi
     */
    public function indexOrganisasi(Request $request)
    {
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        return response()->json($expert->organisasi ?? []);
    }

    /**
     * Store organisasi
     */
    public function storeOrganisasi(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|max:255',
            'jabatan' => 'required|string|max:255',
            'periode' => 'required|string|max:100',
            'kontribusi' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $organisasi = $expert->organisasi ?? [];
        
        $newOrganisasi = array_merge($validator->validated(), [
            'id' => Str::uuid()->toString(),
            'created_at' => now()->toISOString(),
        ]);
        
        $organisasi[] = $newOrganisasi;
        $expert->update(['organisasi' => $organisasi]);

        return response()->json($newOrganisasi, 201);
    }

    /**
     * Delete organisasi
     */
    public function destroyOrganisasi(Request $request, $id)
    {
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $organisasi = $expert->organisasi ?? [];
        
        $filtered = array_filter($organisasi, function($item) use ($id) {
            return $item['id'] !== $id;
        });
        
        if (count($filtered) === count($organisasi)) {
            return response()->json(['message' => 'Data organisasi tidak ditemukan'], 404);
        }
        
        $expert->update(['organisasi' => array_values($filtered)]);
        
        return response()->json(['message' => 'Data organisasi berhasil dihapus']);
    }

    /**
     * Get all reviewer jurnal
     */
    public function indexReviewerJurnal(Request $request)
    {
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        return response()->json($expert->reviewer_jurnal ?? []);
    }

    /**
     * Store reviewer jurnal
     */
    public function storeReviewerJurnal(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|max:255',
            'institusi' => 'required|string|max:255',
            'bidang' => 'required|string|max:255',
            'periode' => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $reviewerJurnal = $expert->reviewer_jurnal ?? [];
        
        $newReviewer = array_merge($validator->validated(), [
            'id' => Str::uuid()->toString(),
            'created_at' => now()->toISOString(),
        ]);
        
        $reviewerJurnal[] = $newReviewer;
        $expert->update(['reviewer_jurnal' => $reviewerJurnal]);

        return response()->json($newReviewer, 201);
    }

    /**
     * Delete reviewer jurnal
     */
    public function destroyReviewerJurnal(Request $request, $id)
    {
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $reviewerJurnal = $expert->reviewer_jurnal ?? [];
        
        $filtered = array_filter($reviewerJurnal, function($item) use ($id) {
            return $item['id'] !== $id;
        });
        
        if (count($filtered) === count($reviewerJurnal)) {
            return response()->json(['message' => 'Data reviewer jurnal tidak ditemukan'], 404);
        }
        
        $expert->update(['reviewer_jurnal' => array_values($filtered)]);
        
        return response()->json(['message' => 'Data reviewer jurnal berhasil dihapus']);
    }

    /**
     * Get all instruktur
     */
    public function indexInstruktur(Request $request)
    {
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        return response()->json($expert->instruktur ?? []);
    }

    /**
     * Store instruktur
     */
    public function storeInstruktur(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|max:255',
            'materi' => 'required|string|max:255',
            'penyelenggara' => 'required|string|max:255',
            'peran' => 'required|string|max:100',
            'tahun' => 'required|string|max:4',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $instruktur = $expert->instruktur ?? [];
        
        $newInstruktur = array_merge($validator->validated(), [
            'id' => Str::uuid()->toString(),
            'created_at' => now()->toISOString(),
        ]);
        
        $instruktur[] = $newInstruktur;
        $expert->update(['instruktur' => $instruktur]);

        return response()->json($newInstruktur, 201);
    }

    /**
     * Delete instruktur
     */
    public function destroyInstruktur(Request $request, $id)
    {
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $instruktur = $expert->instruktur ?? [];
        
        $filtered = array_filter($instruktur, function($item) use ($id) {
            return $item['id'] !== $id;
        });
        
        if (count($filtered) === count($instruktur)) {
            return response()->json(['message' => 'Data instruktur tidak ditemukan'], 404);
        }
        
        $expert->update(['instruktur' => array_values($filtered)]);
        
        return response()->json(['message' => 'Data instruktur berhasil dihapus']);
    }
}