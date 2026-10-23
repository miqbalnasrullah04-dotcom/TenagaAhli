<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    /**
     * View or download a file from storage
     *
     * @param Request $request
     * @param string $path - The file path (e.g., "dokumen/filename.pdf")
     * @return \Illuminate\Http\Response
     */
    public function view(Request $request, $path)
    {
        // Reconstruct full path from URL segments and strip any leading 'storage/' or 'public/'
        $fullPath = ltrim($path, '/');
        $fullPath = preg_replace('#^storage/#i', '', $fullPath);
        $fullPath = preg_replace('#^public/#i', '', $fullPath);
        $fullPath = urldecode($fullPath);

        $disk = 'public';

        // Check if file exists in public disk
        if (!Storage::disk('public')->exists($fullPath)) {
            if (Storage::disk('local')->exists($fullPath)) {
                $disk = 'local';
            } elseif (Storage::disk('public')->exists('sertifikat/' . basename($fullPath))) {
                $fullPath = 'sertifikat/' . basename($fullPath);
            } elseif (Storage::disk('public')->exists('dokumen/' . basename($fullPath))) {
                $fullPath = 'dokumen/' . basename($fullPath);
            } elseif (Storage::disk('public')->exists('experts/photos/' . basename($fullPath))) {
                $fullPath = 'experts/photos/' . basename($fullPath);
            } elseif (Storage::disk('public')->exists('experts/covers/' . basename($fullPath))) {
                $fullPath = 'experts/covers/' . basename($fullPath);
            } else {
                // Direct file_exists check in storage/app/public
                $directPath = storage_path('app/public/' . $fullPath);
                if (file_exists($directPath) && !is_dir($directPath)) {
                    $disposition = $request->query('download') === '1' ? 'attachment' : 'inline';
                    return response()->file($directPath, [
                        'Content-Disposition' => $disposition . '; filename="' . basename($directPath) . '"',
                        'Cache-Control' => 'public, max-age=86400',
                    ]);
                }
                return response()->json(['message' => 'File tidak ditemukan'], 404);
            }
        }

        $realPath = Storage::disk($disk)->path($fullPath);
        if (file_exists($realPath) && !is_dir($realPath)) {
            $disposition = $request->query('download') === '1' ? 'attachment' : 'inline';
            return response()->file($realPath, [
                'Content-Disposition' => $disposition . '; filename="' . basename($realPath) . '"',
                'Cache-Control' => 'public, max-age=86400',
            ]);
        }

        // Fallback for cloud/virtual drivers
        $file = Storage::disk($disk)->get($fullPath);
        $mimeType = Storage::disk($disk)->mimeType($fullPath) ?: 'application/octet-stream';
        $fileName = basename($fullPath);
        $disposition = $request->query('download') === '1' ? 'attachment' : 'inline';

        return response($file, 200)
            ->header('Content-Type', $mimeType)
            ->header('Content-Disposition', $disposition . '; filename="' . $fileName . '"')
            ->header('Cache-Control', 'public, max-age=86400');
    }

    /**
     * Upload photo/cover for expert profile
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function uploadProfileImage(Request $request)
    {
        $request->validate([
            'file' => 'required|image|mimes:jpeg,png,jpg|max:5120', // 5MB
            'type' => 'required|in:photo,cover'
        ]);

        $type = $request->input('type');
        $folder = $type === 'photo' ? 'experts/photos' : 'experts/covers';

        $path = $request->file('file')->store($folder, 'public');

        return response()->json([
            'success' => true,
            'path' => $path,
            'url' => url("/api/files/{$path}"),
            'storage_url' => asset('storage/' . $path), // Fallback URL for debugging
            'message' => ucfirst($type) . ' berhasil diupload'
        ]);
    }

    /**
     * Get file info
     *
     * @param Request $request
     * @param string $path
     * @return \Illuminate\Http\JsonResponse
     */
    public function info(Request $request, $path)
    {
        $fullPath = $path;

        if ($request->route()->parameters()) {
            $segments = array_slice($request->route()->parameters(), 1);
            if (!empty($segments)) {
                $fullPath = implode('/', $segments);
            }
        }

        if (!Storage::disk('public')->exists($fullPath)) {
            return response()->json(['message' => 'File tidak ditemukan'], 404);
        }

        $size = Storage::disk('public')->size($fullPath);
        $mimeType = Storage::disk('public')->mimeType($fullPath);
        $lastModified = Storage::disk('public')->lastModified($fullPath);

        return response()->json([
            'path' => $fullPath,
            'name' => basename($fullPath),
            'size' => $size,
            'size_human' => $this->formatBytes($size),
            'mime_type' => $mimeType,
            'last_modified' => date('Y-m-d H:i:s', $lastModified),
            'url' => asset('storage/' . $fullPath),
            'download_url' => route('api.file.view', ['path' => $fullPath]) . '?download=1',
        ]);
    }

    /**
     * Format bytes to human readable size
     *
     * @param int $bytes
     * @param int $precision
     * @return string
     */
    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }
}
