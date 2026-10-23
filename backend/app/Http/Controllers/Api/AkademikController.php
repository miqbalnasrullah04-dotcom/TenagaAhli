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
            'kategori'   => 'nullable|string|max:100',
            'jenis'      => 'nullable|string|max:100',
            'judul'      => 'required|string|max:500',
            'penerbit'   => 'nullable|string|max:255',
            'tahun'      => 'nullable|string|max:10',
            'link'       => 'nullable|string|max:500',
            'deskripsi'  => 'nullable|string|max:1000',
            'is_terbaik' => 'nullable|boolean',
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
            'nama'       => 'required|string|max:255',
            'jabatan'    => 'nullable|string|max:255',
            'periode'    => 'nullable|string|max:100',
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
            'nama'      => 'required|string|max:255',
            'institusi' => 'nullable|string|max:255',
            'bidang'    => 'nullable|string|max:255',
            'periode'   => 'nullable|string|max:100',
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
     * Update publikasi by UUID
     */
    public function updatePublikasi(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'kategori'   => 'nullable|string|max:100',
            'jenis'      => 'nullable|string|max:100',
            'judul'      => 'required|string|max:500',
            'penerbit'   => 'nullable|string|max:255',
            'tahun'      => 'nullable|string|max:10',
            'link'       => 'nullable|string|max:500',
            'deskripsi'  => 'nullable|string|max:1000',
            'is_terbaik' => 'nullable|boolean',
        ]);
        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $list = $expert->publikasi ?? [];
        $found = false;
        foreach ($list as &$item) {
            if ($item['id'] === $id) {
                $item = array_merge($item, $validator->validated());
                $found = true;
                break;
            }
        }
        unset($item);
        if (!$found) return response()->json(['message' => 'Publikasi tidak ditemukan'], 404);
        $expert->update(['publikasi' => $list]);
        return response()->json(['message' => 'Publikasi diperbarui']);
    }

    /**
     * Update organisasi by UUID
     */
    public function updateOrganisasi(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nama'       => 'required|string|max:255',
            'jabatan'    => 'nullable|string|max:255',
            'periode'    => 'nullable|string|max:100',
            'kontribusi' => 'nullable|string|max:500',
        ]);
        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $list = $expert->organisasi ?? [];
        $found = false;
        foreach ($list as &$item) {
            if ($item['id'] === $id) {
                $item = array_merge($item, $validator->validated());
                $found = true;
                break;
            }
        }
        unset($item);
        if (!$found) return response()->json(['message' => 'Data organisasi tidak ditemukan'], 404);
        $expert->update(['organisasi' => $list]);
        return response()->json(['message' => 'Organisasi diperbarui']);
    }

    /**
     * Update reviewer jurnal by UUID
     */
    public function updateReviewerJurnal(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nama'      => 'required|string|max:255',
            'institusi' => 'nullable|string|max:255',
            'bidang'    => 'nullable|string|max:255',
            'periode'   => 'nullable|string|max:100',
        ]);
        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $list = $expert->reviewer_jurnal ?? [];
        $found = false;
        foreach ($list as &$item) {
            if ($item['id'] === $id) {
                $item = array_merge($item, $validator->validated());
                $found = true;
                break;
            }
        }
        unset($item);
        if (!$found) return response()->json(['message' => 'Data reviewer tidak ditemukan'], 404);
        $expert->update(['reviewer_jurnal' => $list]);
        return response()->json(['message' => 'Reviewer jurnal diperbarui']);
    }

    /**
     * Update instruktur by UUID
     */
    public function updateInstruktur(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nama'          => 'required|string|max:255',
            'materi'        => 'nullable|string|max:255',
            'penyelenggara' => 'nullable|string|max:255',
            'peran'         => 'nullable|string|max:100',
            'tahun'         => 'nullable|string|max:10',
        ]);
        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $list = $expert->instruktur ?? [];
        $found = false;
        foreach ($list as &$item) {
            if ($item['id'] === $id) {
                $item = array_merge($item, $validator->validated());
                $found = true;
                break;
            }
        }
        unset($item);
        if (!$found) return response()->json(['message' => 'Data instruktur tidak ditemukan'], 404);
        $expert->update(['instruktur' => $list]);
        return response()->json(['message' => 'Instruktur diperbarui']);
    }

    /**
     * Update narasumber by UUID
     */
    public function updateNarasumber(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'title'         => 'required|string|max:500',
            'penyelenggara' => 'nullable|string|max:255',
            'tempat'        => 'nullable|string|max:255',
            'tanggal'       => 'nullable|string|max:100',
        ]);
        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $list = $expert->narasumber_riwayat ?? [];
        $found = false;
        foreach ($list as &$item) {
            if ($item['id'] === $id) {
                $item = array_merge($item, $validator->validated());
                $found = true;
                break;
            }
        }
        unset($item);
        if (!$found) return response()->json(['message' => 'Data narasumber tidak ditemukan'], 404);
        $expert->update(['narasumber_riwayat' => $list]);
        return response()->json(['message' => 'Narasumber diperbarui']);
    }

    /**
     * Get all narasumber riwayat
     */
    public function indexNarasumber(Request $request)
    {
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        return response()->json($expert->narasumber_riwayat ?? []);
    }

    /**
     * Store narasumber riwayat
     */
    public function storeNarasumber(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title'         => 'required|string|max:500',
            'penyelenggara' => 'nullable|string|max:255',
            'tempat'        => 'nullable|string|max:255',
            'tanggal'       => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $narasumber = $expert->narasumber_riwayat ?? [];

        $newItem = array_merge($validator->validated(), [
            'id'         => Str::uuid()->toString(),
            'created_at' => now()->toISOString(),
        ]);

        $narasumber[] = $newItem;
        $expert->update(['narasumber_riwayat' => $narasumber]);

        // Award points
        $pointService = new PointService();
        $pointService->awardPoints($expert->user_id, 'add_speaker', 'Menambahkan riwayat narasumber: ' . $newItem['title']);

        return response()->json($newItem, 201);
    }

    /**
     * Delete narasumber riwayat
     */
    public function destroyNarasumber(Request $request, $id)
    {
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $narasumber = $expert->narasumber_riwayat ?? [];

        $filtered = array_filter($narasumber, function ($item) use ($id) {
            return $item['id'] !== $id;
        });

        if (count($filtered) === count($narasumber)) {
            return response()->json(['message' => 'Data narasumber tidak ditemukan'], 404);
        }

        $expert->update(['narasumber_riwayat' => array_values($filtered)]);

        return response()->json(['message' => 'Data narasumber berhasil dihapus']);
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
            'nama'          => 'required|string|max:255',
            'materi'        => 'nullable|string|max:255',
            'penyelenggara' => 'nullable|string|max:255',
            'peran'         => 'nullable|string|max:100',
            'tahun'         => 'nullable|string|max:10',
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

    /**
     * Get all pengalaman proyek
     */
    public function indexProyek(Request $request)
    {
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        return response()->json($expert->pengalaman_proyek ?? $expert->kajian_riwayat ?? []);
    }

    /**
     * Store pengalaman proyek
     */
    public function storeProyek(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama'      => 'required|string|max:500',
            'peran'     => 'nullable|string|max:255',
            'tahun'     => 'nullable|string|max:50',
            'lokasi'    => 'nullable|string|max:255',
            'deskripsi' => 'nullable|string',
            'klien'     => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $proyekList = $expert->pengalaman_proyek ?? $expert->kajian_riwayat ?? [];

        if (count($proyekList) >= 10) {
            return response()->json(['message' => 'Maksimal 10 pengalaman proyek yang dapat ditambahkan.'], 422);
        }

        $newProyek = array_merge($validator->validated(), [
            'id'         => Str::uuid()->toString(),
            'created_at' => now()->toISOString(),
        ]);

        $proyekList[] = $newProyek;
        $expert->update(['pengalaman_proyek' => $proyekList]);

        // Award points
        $pointService = new PointService();
        $pointService->awardPoints($expert->user_id, 'add_project', 'Menambahkan pengalaman proyek: ' . $newProyek['nama']);

        return response()->json($newProyek, 201);
    }

    /**
     * Update pengalaman proyek by UUID
     */
    public function updateProyek(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nama'      => 'required|string|max:500',
            'peran'     => 'nullable|string|max:255',
            'tahun'     => 'nullable|string|max:50',
            'lokasi'    => 'nullable|string|max:255',
            'deskripsi' => 'nullable|string',
            'klien'     => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $list = $expert->pengalaman_proyek ?? $expert->kajian_riwayat ?? [];
        $found = false;

        foreach ($list as &$item) {
            if (($item['id'] ?? null) === $id) {
                $item = array_merge($item, $validator->validated());
                $found = true;
                break;
            }
        }
        unset($item);

        if (!$found) {
            return response()->json(['message' => 'Data proyek tidak ditemukan'], 404);
        }

        $expert->update(['pengalaman_proyek' => $list]);

        return response()->json(['message' => 'Pengalaman proyek berhasil diperbarui']);
    }

    /**
     * Delete pengalaman proyek
     */
    public function destroyProyek(Request $request, $id)
    {
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $list = $expert->pengalaman_proyek ?? $expert->kajian_riwayat ?? [];

        $filtered = array_filter($list, function ($item) use ($id) {
            return ($item['id'] ?? null) !== $id;
        });

        if (count($filtered) === count($list)) {
            return response()->json(['message' => 'Data pengalaman proyek tidak ditemukan'], 404);
        }

        $expert->update(['pengalaman_proyek' => array_values($filtered)]);

        return response()->json(['message' => 'Pengalaman proyek berhasil dihapus']);
    }

    /**
     * Get all pengalaman penelitian
     */
    public function indexPenelitian(Request $request)
    {
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        return response()->json($expert->pengalaman_penelitian ?? []);
    }

    /**
     * Store pengalaman penelitian
     */
    public function storePenelitian(Request $request)
    {
        // Support both 'judul' and 'nama'
        if (!$request->has('judul') && $request->has('nama')) {
            $request->merge(['judul' => $request->input('nama')]);
        }
        if (!$request->has('nama') && $request->has('judul')) {
            $request->merge(['nama' => $request->input('judul')]);
        }

        $validator = Validator::make($request->all(), [
            'judul'     => 'required|string|max:500',
            'nama'      => 'nullable|string|max:500',
            'peran'     => 'nullable|string|max:255',
            'tahun'     => 'nullable|string|max:50',
            'lokasi'    => 'nullable|string|max:255',
            'institusi' => 'nullable|string|max:255',
            'bidang'    => 'nullable|string|max:255',
            'deskripsi' => 'nullable|string',
            'link'      => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $list = $expert->pengalaman_penelitian ?? [];

        $data = $validator->validated();
        if (empty($data['nama']) && !empty($data['judul'])) {
            $data['nama'] = $data['judul'];
        }
        if (empty($data['judul']) && !empty($data['nama'])) {
            $data['judul'] = $data['nama'];
        }

        $newPenelitian = array_merge($data, [
            'id'         => Str::uuid()->toString(),
            'created_at' => now()->toISOString(),
        ]);

        $list[] = $newPenelitian;
        $expert->update(['pengalaman_penelitian' => $list]);

        // Award points
        try {
            $pointService = new PointService();
            $pointService->awardPoints($expert->user_id, 'add_experience', 'Menambahkan pengalaman penelitian: ' . ($newPenelitian['judul'] ?? $newPenelitian['nama']));
        } catch (\Throwable $e) {
            // Silently ignore point award failure
        }

        return response()->json($newPenelitian, 201);
    }

    /**
     * Update pengalaman penelitian
     */
    public function updatePenelitian(Request $request, $id)
    {
        if (!$request->has('judul') && $request->has('nama')) {
            $request->merge(['judul' => $request->input('nama')]);
        }
        if (!$request->has('nama') && $request->has('judul')) {
            $request->merge(['nama' => $request->input('judul')]);
        }

        $validator = Validator::make($request->all(), [
            'judul'     => 'required|string|max:500',
            'nama'      => 'nullable|string|max:500',
            'peran'     => 'nullable|string|max:255',
            'tahun'     => 'nullable|string|max:50',
            'lokasi'    => 'nullable|string|max:255',
            'institusi' => 'nullable|string|max:255',
            'bidang'    => 'nullable|string|max:255',
            'deskripsi' => 'nullable|string',
            'link'      => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $list = $expert->pengalaman_penelitian ?? [];
        $found = false;

        $validatedData = $validator->validated();
        if (empty($validatedData['nama']) && !empty($validatedData['judul'])) {
            $validatedData['nama'] = $validatedData['judul'];
        }
        if (empty($validatedData['judul']) && !empty($validatedData['nama'])) {
            $validatedData['judul'] = $validatedData['nama'];
        }

        foreach ($list as &$item) {
            if (($item['id'] ?? null) === $id) {
                $item = array_merge($item, $validatedData);
                $found = true;
                break;
            }
        }
        unset($item);

        if (!$found) {
            return response()->json(['message' => 'Data pengalaman penelitian tidak ditemukan'], 404);
        }

        $expert->update(['pengalaman_penelitian' => $list]);

        return response()->json(['message' => 'Pengalaman penelitian berhasil diperbarui']);
    }

    /**
     * Delete pengalaman penelitian
     */
    public function destroyPenelitian(Request $request, $id)
    {
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $list = $expert->pengalaman_penelitian ?? [];

        $filtered = array_filter($list, function ($item) use ($id) {
            return ($item['id'] ?? null) !== $id;
        });

        if (count($filtered) === count($list)) {
            return response()->json(['message' => 'Data pengalaman penelitian tidak ditemukan'], 404);
        }

        $expert->update(['pengalaman_penelitian' => array_values($filtered)]);

        return response()->json(['message' => 'Pengalaman penelitian berhasil dihapus']);
    }
}

