<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Expert;
use App\Services\PointService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CertificateController extends Controller
{
    public function index(Request $request)
    {
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        return response()->json($expert->certificates);
    }

    public function store(Request $request)
    {
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();

        $validator = Validator::make($request->all(), [
            'nama_sertifikat' => ['required', 'string', 'max:255'],
            'penerbit' => ['nullable', 'string', 'max:255'],
            'tahun' => ['nullable', 'numeric', 'min:1950', 'max:'.(date('Y') + 10)],
            'file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $data = $validator->safe()->except('file');
        $data['expert_id'] = $expert->id;

        if ($request->hasFile('file')) {
            $data['file_path'] = $request->file('file')->store('sertifikat', 'public');
        }

        $certificate = Certificate::create($data);

        // Award 15 poin untuk setiap sertifikat
        $pointService = new PointService();
        $pointService->awardPoints($expert->user_id, 'upload_certificate', 'Mengunggah sertifikat: ' . $data['nama_sertifikat']);

        return response()->json($certificate, 201);
    }

    public function update(Request $request, $id)
    {
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $certificate = Certificate::where('expert_id', $expert->id)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'nama_sertifikat' => ['required', 'string', 'max:255'],
            'penerbit' => ['nullable', 'string', 'max:255'],
            'tahun' => ['nullable', 'numeric', 'min:1950', 'max:'.(date('Y') + 10)],
            'file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $data = $validator->safe()->except('file');

        if ($request->hasFile('file')) {
            if ($certificate->file_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($certificate->file_path)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($certificate->file_path);
            }
            $data['file_path'] = $request->file('file')->store('sertifikat', 'public');
        }

        $certificate->update($data);

        return response()->json($certificate);
    }

    public function destroy(Request $request, $id)
    {
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $certificate = Certificate::where('expert_id', $expert->id)->findOrFail($id);
        
        if ($certificate->file_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($certificate->file_path)) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($certificate->file_path);
        }
        
        $certificate->delete();

        return response()->json(['message' => 'Sertifikat berhasil dihapus']);
    }

    public function setPrimary(Request $request, $id)
    {
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $certificate = Certificate::where('expert_id', $expert->id)->findOrFail($id);

        $newStatus = !$certificate->is_primary;

        // Reset semua sertifikat ahli ini menjadi is_primary = false
        Certificate::where('expert_id', $expert->id)->update(['is_primary' => false]);

        if ($newStatus) {
            $certificate->update(['is_primary' => true]);
        }

        return response()->json([
            'message' => $newStatus ? 'Sertifikat berhasil dijadikan utama untuk ditampilkan pada card.' : 'Status sertifikat utama dibatalkan.',
            'certificate' => $certificate->fresh(),
            'certificates' => $expert->certificates()->get(),
        ]);
    }
}
