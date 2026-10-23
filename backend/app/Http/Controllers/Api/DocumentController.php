<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Expert;
use App\Services\PointService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function index(Request $request)
    {
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $documents = $expert->documents()->latest()->get();

        // Tambahkan file_url ke setiap dokumen
        $documents = $documents->map(function ($doc) {
            return [
                'id' => $doc->id,
                'type' => $doc->type,
                'label' => $doc->label,
                'file_path' => $doc->file_path,
                'file_url' => $doc->file_url,
                'created_at' => $doc->created_at,
                'updated_at' => $doc->updated_at,
            ];
        });

        return response()->json($documents);
    }

    public function store(Request $request)
    {
        $expert = Expert::where('user_id', $request->user()->id)->first();
        if (!$expert) {
            $user = $request->user();
            $expert = Expert::create([
                'user_id' => $user->id,
                'slug' => \Illuminate\Support\Str::slug($user->name ?: 'expert') . '-' . \Illuminate\Support\Str::random(4),
                'name' => $user->name,
                'email' => $user->email,
                'kriteria' => $user->role_type === 'surveyor' ? 'Surveyor' : 'Tenaga Ahli',
                'profile_status' => 'aktif',
            ]);
        }

        $validator = Validator::make($request->all(), [
            'type' => ['required', 'string'],
            'label' => ['nullable', 'string', 'max:255'],
            'file' => ['required', 'file', 'max:5120'], // Max 5MB
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension());
        $allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp', 'zip', 'rar'];
        if (!in_array($ext, $allowedExtensions)) {
            return response()->json(['message' => 'Format file tidak didukung. Harap upload file PDF, DOC, DOCX, JPG, atau PNG.'], 422);
        }

        // Foto profil & KTP cuma boleh 1 -> hapus yang lama kalau upload baru
        if ($request->type === 'foto_profil') {
            $old = Document::where('expert_id', $expert->id)->where('type', 'foto_profil')->first();
            if ($old) {
                $old->delete();
            }
        } elseif ($request->type === 'ktp') {
            $oldKtp = Document::where('expert_id', $expert->id)->where('type', 'ktp')->first();
            if ($oldKtp) {
                if ($oldKtp->file_path && Storage::disk('public')->exists($oldKtp->file_path)) {
                    Storage::disk('public')->delete($oldKtp->file_path);
                }
                $oldKtp->delete();
            }
        }

        $path = $request->file('file')->store('dokumen', 'public');

        $document = Document::create([
            'expert_id' => $expert->id,
            'type' => $request->type,
            'label' => $request->label,
            'file_path' => $path,
        ]);

        $labelLower = strtolower((string) $request->label);
        $typeLower = strtolower((string) $request->type);

        // Kalau ini foto profil, langsung terapkan (tanpa perlu verifikasi admin) dan sinkronkan ke user & expert
        if ($typeLower === 'foto_profil') {
            $user = $request->user();
            if ($user) {
                $user->update([
                    'foto'       => $path,
                    'avatar_url' => $path,
                ]);
            }

            // Hapus file foto lama expert jika berbeda dan ada di storage
            if ($expert->photo && $expert->photo !== $path && Storage::disk('public')->exists($expert->photo)) {
                Storage::disk('public')->delete($expert->photo);
            }

            // Bersihkan draft pending foto jika ada
            $currentPending = is_array($expert->pending_changes) ? $expert->pending_changes : [];
            if (isset($currentPending['photo'])) {
                if ($currentPending['photo'] && $currentPending['photo'] !== $path && Storage::disk('public')->exists($currentPending['photo'])) {
                    Storage::disk('public')->delete($currentPending['photo']);
                }
                unset($currentPending['photo']);
            }

            $expertUpdate = [
                'photo' => $path,
            ];

            if ($expert->profile_status === 'aktif') {
                if (empty($currentPending)) {
                    $expertUpdate['pending_changes'] = null;
                    if ($expert->update_status === 'menunggu_verifikasi') {
                        $expertUpdate['update_status'] = null;
                        $expertUpdate['update_reject_reason'] = null;
                    }
                } else {
                    $expertUpdate['pending_changes'] = $currentPending;
                }
            }

            $expert->update($expertUpdate);
        } elseif ($typeLower === 'ktp' || str_contains($labelLower, 'ktp')) {
            // Jika profil sudah aktif/tayang: KTP masuk ke pembaruan profil (pending_changes) dan harus dikonfirmasi admin
            if ($expert->profile_status === 'aktif') {
                $currentPending = is_array($expert->pending_changes) ? $expert->pending_changes : [];
                if (isset($currentPending['ktp_path']) && $currentPending['ktp_path'] !== $path) {
                    if ($currentPending['ktp_path'] && Storage::disk('public')->exists($currentPending['ktp_path'])) {
                        Storage::disk('public')->delete($currentPending['ktp_path']);
                    }
                }
                $currentPending['ktp_path'] = $path;
                $updateData = [
                    'pending_changes'      => $currentPending,
                    'update_status'        => 'menunggu_verifikasi',
                    'update_reject_reason' => null,
                    'update_submitted_at'  => now(),
                ];
                if (empty($expert->ktp_path)) {
                    $updateData['ktp_path'] = $path;
                }
                $expert->update($updateData);
            } else {
                $expert->update(['ktp_path' => $path]);
            }
        } elseif ($typeLower === 'cv' || str_contains($labelLower, 'cv') || str_contains($labelLower, 'vitae')) {
            $expert->update(['cv_path' => $path]);

            // Award 20 poin untuk upload CV
            try {
                $pointService = new PointService();
                $pointService->awardPoints($expert->user_id, 'upload_cv', 'Mengunggah CV/Resume');
            } catch (\Exception $e) {
                \Log::warning('Failed to award points for CV upload: ' . $e->getMessage());
            }
        } elseif ($typeLower === 'bukti_kompetensi' || str_contains($labelLower, 'bukti') || str_contains($labelLower, 'kompetensi')) {
            $expert->update(['bukti_kompetensi_path' => $path]);
        }

        return response()->json([
            'id' => $document->id,
            'type' => $document->type,
            'label' => $document->label,
            'file_path' => $document->file_path,
            'file_url' => $document->file_url,
            'ktp_path' => $expert->fresh()->ktp_path,
            'cv_path' => $expert->fresh()->cv_path,
            'bukti_kompetensi_path' => $expert->fresh()->bukti_kompetensi_path,
            'message' => 'Dokumen berhasil diunggah',
        ], 201);
    }

    public function destroy(Request $request, $id)
    {
        $expert = Expert::where('user_id', $request->user()->id)->firstOrFail();
        $document = Document::where('expert_id', $expert->id)->findOrFail($id);

        // Hapus file fisik dari storage
        if ($document->file_path && Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();

        return response()->json(['message' => 'Dokumen berhasil dihapus']);
    }
}
