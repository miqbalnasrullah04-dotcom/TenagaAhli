<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Education;
use App\Models\Expert;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class EducationController extends Controller
{
    public function index(Request $request)
    {
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        return response()->json($expert->educations);
    }

    public function store(Request $request)
    {
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();

        $validator = Validator::make($request->all(), [
            'jenjang' => ['required', 'string', 'max:255'],
            'institusi' => ['required', 'string', 'max:255'],
            'jurusan' => ['nullable', 'string', 'max:255'],
            'tahun_lulus' => ['nullable', 'numeric', 'min:1950', 'max:'.(date('Y') + 10)],
            'ijazah' => ['required_without:file', 'file', 'mimes:jpg,jpeg,png,webp,pdf,doc,docx', 'max:5120'],
            'file' => ['required_without:ijazah', 'file', 'mimes:jpg,jpeg,png,webp,pdf,doc,docx', 'max:5120'],
        ], [
            'ijazah.required_without' => 'Berkas scan sertifikat ijazah wajib diunggah.',
            'file.required_without' => 'Berkas scan sertifikat ijazah wajib diunggah.',
            'ijazah.mimes' => 'Format file ijazah harus berupa PDF, JPG, PNG, atau DOC/DOCX.',
            'file.mimes' => 'Format file ijazah harus berupa PDF, JPG, PNG, atau DOC/DOCX.',
            'ijazah.max' => 'Ukuran file ijazah maksimal 5MB.',
            'file.max' => 'Ukuran file ijazah maksimal 5MB.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->safe()->except(['ijazah', 'file']);
        $data['expert_id'] = $expert->id;

        $uploadedFile = $request->file('ijazah') ?? $request->file('file');
        if ($uploadedFile) {
            $data['ijazah_path'] = $uploadedFile->store('ijazah', 'public');
        }

        $education = Education::create($data);

        return response()->json($education, 201);
    }

    public function update(Request $request, $id)
    {
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $education = Education::where('expert_id', $expert->id)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'jenjang' => ['required', 'string', 'max:255'],
            'institusi' => ['required', 'string', 'max:255'],
            'jurusan' => ['nullable', 'string', 'max:255'],
            'tahun_lulus' => ['nullable', 'numeric', 'min:1950', 'max:'.(date('Y') + 10)],
            'ijazah' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf,doc,docx', 'max:5120'],
            'file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf,doc,docx', 'max:5120'],
        ], [
            'ijazah.mimes' => 'Format file ijazah harus berupa PDF, JPG, PNG, atau DOC/DOCX.',
            'file.mimes' => 'Format file ijazah harus berupa PDF, JPG, PNG, atau DOC/DOCX.',
            'ijazah.max' => 'Ukuran file ijazah maksimal 5MB.',
            'file.max' => 'Ukuran file ijazah maksimal 5MB.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        // Ijazah bersifat wajib: jika data belum ada file ijazah dan tidak mengunggah file baru
        if (!$education->ijazah_path && !$request->hasFile('ijazah') && !$request->hasFile('file')) {
            return response()->json([
                'message' => 'Berkas scan sertifikat ijazah wajib diunggah.',
                'errors' => ['ijazah' => ['Berkas scan sertifikat ijazah wajib diunggah.']]
            ], 422);
        }

        // Tidak boleh menghapus ijazah tanpa menggantinya karena ijazah wajib
        if ($request->boolean('delete_ijazah') && !$request->hasFile('ijazah') && !$request->hasFile('file')) {
            return response()->json([
                'message' => 'Berkas scan sertifikat ijazah wajib ada dan tidak boleh dihapus.',
                'errors' => ['ijazah' => ['Berkas scan sertifikat ijazah wajib ada.']]
            ], 422);
        }

        $data = $validator->safe()->except(['ijazah', 'file']);

        $uploadedFile = $request->file('ijazah') ?? $request->file('file');
        if ($uploadedFile) {
            if ($education->ijazah_path && Storage::disk('public')->exists($education->ijazah_path)) {
                Storage::disk('public')->delete($education->ijazah_path);
            }
            $data['ijazah_path'] = $uploadedFile->store('ijazah', 'public');
        }

        $education->update($data);

        return response()->json($education);
    }

    public function destroy(Request $request, $id)
    {
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $education = Education::where('expert_id', $expert->id)->findOrFail($id);

        if ($education->ijazah_path && Storage::disk('public')->exists($education->ijazah_path)) {
            Storage::disk('public')->delete($education->ijazah_path);
        }

        $education->delete();

        return response()->json(['message' => 'Pendidikan berhasil dihapus']);
    }
}
