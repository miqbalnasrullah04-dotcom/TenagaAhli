<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expert;
use App\Models\User;
use Illuminate\Http\Request;

class PresenceController extends Controller
{
    /**
     * Heartbeat ping sent periodically by client while browsing the web.
     */
    public function ping(Request $request)
    {
        $user = $request->user('sanctum');

        // If not authenticated via sanctum token, check if user identifier is sent
        if (!$user) {
            if ($request->filled('email')) {
                $user = User::where('email', $request->email)->first();
            } elseif ($request->filled('user_id')) {
                $user = User::find($request->user_id);
            }
        }

        if ($user) {
            $user->update([
                'last_seen_at' => now(),
                'is_online' => true,
            ]);

            // If user has an associated expert profile, update it too
            Expert::where('user_id', $user->id)->update([
                'last_seen_at' => now(),
                'is_online' => true,
            ]);
        } elseif ($request->filled('expert_id') || $request->filled('slug')) {
            $expertQuery = Expert::query();
            if ($request->filled('expert_id')) {
                $expertQuery->where('id', $request->expert_id);
            } else {
                $expertQuery->where('slug', $request->slug);
            }
            $expert = $expertQuery->first();
            if ($expert) {
                $expert->update([
                    'last_seen_at' => now(),
                    'is_online' => true,
                ]);
                if ($expert->user_id) {
                    User::where('id', $expert->user_id)->update([
                        'last_seen_at' => now(),
                        'is_online' => true,
                    ]);
                }
            }
        }

        return response()->json([
            'status' => 'success',
            'is_online' => true,
            'last_seen_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Offline signal sent when user closes the tab / leaves the site / logs out.
     */
    public function offline(Request $request)
    {
        $user = $request->user('sanctum');

        if (!$user) {
            if ($request->filled('email')) {
                $user = User::where('email', $request->email)->first();
            } elseif ($request->filled('user_id')) {
                $user = User::find($request->user_id);
            }
        }

        if ($user) {
            $user->update([
                'is_online' => false,
                'last_seen_at' => now()->subMinutes(5),
            ]);

            Expert::where('user_id', $user->id)->update([
                'is_online' => false,
                'last_seen_at' => now()->subMinutes(5),
            ]);
        } elseif ($request->filled('expert_id') || $request->filled('slug')) {
            $expertQuery = Expert::query();
            if ($request->filled('expert_id')) {
                $expertQuery->where('id', $request->expert_id);
            } else {
                $expertQuery->where('slug', $request->slug);
            }
            $expert = $expertQuery->first();
            if ($expert) {
                $expert->update([
                    'is_online' => false,
                    'last_seen_at' => now()->subMinutes(5),
                ]);
                if ($expert->user_id) {
                    User::where('id', $expert->user_id)->update([
                        'is_online' => false,
                        'last_seen_at' => now()->subMinutes(5),
                    ]);
                }
            }
        }

        return response()->json([
            'status' => 'success',
            'is_online' => false,
        ]);
    }

    /**
     * Check presence status of a specific expert or user
     */
    public function status(Request $request, $identifier)
    {
        $expert = Expert::where('slug', $identifier)
            ->orWhere('id', $identifier)
            ->with('user')
            ->first();

        if ($expert) {
            $isOnline = $expert->isOnline();
            return response()->json([
                'is_online' => $isOnline,
                'status' => $isOnline ? 'tersedia' : 'tidak_tersedia',
                'label' => $isOnline ? 'Online — Sedang aktif di web' : 'Offline — Sedang tidak aktif',
                'last_seen_at' => $expert->user?->last_seen_at ?? $expert->last_seen_at,
            ]);
        }

        $user = User::where('id', $identifier)->orWhere('email', $identifier)->first();
        if ($user) {
            $isOnline = $user->isOnline();
            return response()->json([
                'is_online' => $isOnline,
                'status' => $isOnline ? 'tersedia' : 'tidak_tersedia',
                'label' => $isOnline ? 'Online — Sedang aktif di web' : 'Offline — Sedang tidak aktif',
                'last_seen_at' => $user->last_seen_at,
            ]);
        }

        return response()->json(['message' => 'Not found'], 404);
    }
}

