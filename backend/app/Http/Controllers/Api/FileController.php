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
        // Reconstruct full path from URL segments
        $fullPath = $path;

        // Get additional segments if nested path
        if ($request->route()->parameters()) {
            $segments = array_slice($request->route()->parameters(), 1);
            if (!empty($segments)) {
                $fullPath = implode('/', $segments);
            }
        }

        // Check if file exists in public disk
        if (!Storage::disk('public')->exists($fullPath)) {
            return response()->json(['message' => 'File tidak ditemukan'], 404);
        }

        // Get file contents
        $file = Storage::disk('public')->get($fullPath);
        $mimeType = Storage::disk('public')->mimeType($fullPath);
        $fileName = basename($fullPath);

        // Determine if should display inline or force download
        $disposition = $request->query('download') === '1' ? 'attachment' : 'inline';

        return response($file, 200)
            ->header('Content-Type', $mimeType)
            ->header('Content-Disposition', $disposition . '; filename="' . $fileName . '"');
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
