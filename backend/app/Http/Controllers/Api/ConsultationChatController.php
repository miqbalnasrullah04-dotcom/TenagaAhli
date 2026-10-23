<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use App\Models\ConsultationMessage;
use App\Models\Expert;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ConsultationChatController extends Controller
{
    /**
     * Calculate consultation session window and determine time-gated status.
     * Rules:
     * - Before start time: status is 'waiting', cannot send chat, explanatory message shown.
     * - During session (start to start + duration): status is 'in_progress', can send chat.
     * - After duration ends: status automatically becomes 'completed'/'selesai', locked, cannot send chat, prompt to re-book.
     */
    protected function calculateSessionWindow(Consultation $c): array
    {
        $now = Carbon::now('Asia/Jakarta');
        $dateStr = $c->consultation_date ? $c->consultation_date->format('Y-m-d') : null;
        $timeStr = trim($c->consultation_time ?? '');

        // Default response jika tidak ada tanggal/jam
        if (!$dateStr || !$timeStr) {
            $isDone = in_array($c->status, ['selesai', 'completed', 'dibatalkan', 'ditolak']);
            return [
                'session_status' => $isDone ? 'completed' : 'in_progress',
                'can_send_message' => !$isDone,
                'starts_at' => null,
                'ends_at' => null,
                'seconds_remaining' => 0,
                'explanation' => $isDone ? 'Sesi konsultasi telah selesai.' : 'Sesi aktif.',
            ];
        }

        // Ekstrak waktu mulai (misal '09:00' dari '09:00 WIB' atau '14:00 - 14:30')
        preg_match('/(\d{1,2}:\d{2})/', $timeStr, $matches);
        $startTime = $matches[1] ?? '09:00';

        try {
            $startDateTime = Carbon::createFromFormat('Y-m-d H:i', "{$dateStr} {$startTime}", 'Asia/Jakarta');
        } catch (\Throwable $e) {
            $startDateTime = Carbon::parse("{$dateStr} {$startTime}", 'Asia/Jakarta');
        }

        // Tentukan durasi (dalam menit)
        $duration = (int) $c->duration_minutes;
        if ($duration <= 0) {
            $slotCount = count(array_filter(preg_split('/[,;\n]+/', $timeStr)));
            $baseDuration = ($c->service_type === 'chat') ? 15 : 30;
            $duration = max(1, $slotCount) * $baseDuration;
        }

        $endDateTime = (clone $startDateTime)->addMinutes($duration);
        $formattedSchedule = $startDateTime->translatedFormat('d M Y') . ' pukul ' . $startDateTime->format('H:i') . ' WIB';

        $hasMessages = ConsultationMessage::where('consultation_id', $c->id)->exists();

        // 1. Jika status di DB sudah dibatalkan atau ditolak
        if (in_array($c->status, ['dibatalkan', 'ditolak', 'cancelled', 'rejected'])) {
            return [
                'session_status' => 'cancelled',
                'is_missed' => false,
                'can_send_message' => false,
                'starts_at' => $startDateTime->toIso8601String(),
                'ends_at' => $endDateTime->toIso8601String(),
                'seconds_remaining' => 0,
                'formatted_schedule' => $formattedSchedule,
                'explanation' => 'Sesi konsultasi ini telah dibatalkan atau ditolak.',
            ];
        }

        // 2. Jika status di DB sudah selesai
        if (in_array($c->status, ['selesai', 'completed'])) {
            $isMissed = !$hasMessages;
            return [
                'session_status' => 'completed',
                'is_missed' => $isMissed,
                'can_send_message' => false,
                'starts_at' => $startDateTime->toIso8601String(),
                'ends_at' => $endDateTime->toIso8601String(),
                'seconds_remaining' => 0,
                'formatted_schedule' => $formattedSchedule,
                'explanation' => $isMissed
                    ? 'Jadwal konsultasi ini telah terlewat dan sesi telah selesai otomatis. Untuk berkonsultasi, silakan pesan jadwal konsultasi baru.'
                    : 'Sesi konsultasi ini telah selesai karena durasi waktu telah habis. Untuk berkonsultasi kembali, silakan pesan jadwal konsultasi baru.',
            ];
        }

        // 3. Cek apakah waktu saat ini BELUM masuk jam booking
        if ($now->lt($startDateTime)) {
            $diffSeconds = (int) round($now->diffInSeconds($startDateTime, false));
            return [
                'session_status' => 'waiting',
                'is_missed' => false,
                'can_send_message' => false,
                'starts_at' => $startDateTime->toIso8601String(),
                'ends_at' => $endDateTime->toIso8601String(),
                'seconds_remaining' => max(0, $diffSeconds),
                'formatted_schedule' => $formattedSchedule,
                'explanation' => "Anda dapat mulai mengirim chat ketika sudah masuk jam atau jadwal konsultasi Anda ({$formattedSchedule}).",
            ];
        }

        // 4. Cek apakah waktu saat ini SUDAH MELEBIHI durasi waktu (HABIS / TERLEWAT)
        if ($now->gt($endDateTime)) {
            // Otomatis update status ke selesai di database jika belum
            if ($c->status !== 'selesai') {
                $c->update(['status' => 'selesai']);
            }

            $isMissed = !$hasMessages;
            return [
                'session_status' => 'completed',
                'is_missed' => $isMissed,
                'can_send_message' => false,
                'starts_at' => $startDateTime->toIso8601String(),
                'ends_at' => $endDateTime->toIso8601String(),
                'seconds_remaining' => 0,
                'formatted_schedule' => $formattedSchedule,
                'explanation' => $isMissed
                    ? 'Jadwal konsultasi ini telah terlewat dan sesi telah selesai otomatis. Untuk berkonsultasi, silakan pesan jadwal konsultasi baru.'
                    : 'Sesi konsultasi ini telah selesai karena durasi waktu telah habis. Untuk berkonsultasi kembali, silakan pesan jadwal konsultasi baru.',
            ];
        }

        // 5. Waktu saat ini berada di dalam sesi (in_progress)
        $remainingSeconds = (int) round(max(0, $now->diffInSeconds($endDateTime, false)));
        return [
            'session_status' => 'in_progress',
            'is_missed' => false,
            'can_send_message' => true,
            'starts_at' => $startDateTime->toIso8601String(),
            'ends_at' => $endDateTime->toIso8601String(),
            'seconds_remaining' => $remainingSeconds,
            'formatted_schedule' => $formattedSchedule,
            'explanation' => 'Sesi konsultasi sedang berlangsung.',
        ];
    }

    /**
     * Get list of consultation chat rooms for the authenticated user/expert.
     * GET /api/my/chat-rooms
     */
    public function getChatRooms(Request $request): JsonResponse
    {
        $user = $request->user();
        $expert = Expert::where('user_id', $user->id)->first();

        // 1. Ambil konsultasi di mana user adalah expert atau klien
        $query = Consultation::with([
            'expert.user:id,name,avatar_url',
            'user:id,name,avatar_url,email',
        ]);

        if ($expert) {
            $query->where(function ($q) use ($expert, $user) {
                $q->where('expert_id', $expert->id)
                  ->orWhere('user_id', $user->id)
                  ->orWhere('client_email', $user->email);
            });
        } else {
            $query->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhere('client_email', $user->email);
            });
        }

        $consultations = $query->orderBy('updated_at', 'desc')->get();

        $rooms = $consultations->map(function ($c) use ($user, $expert) {
            $isExpert = $expert && ($c->expert_id === $expert->id);

            $partnerName = $isExpert
                ? ($c->client_name ?: $c->user?->name ?: 'Klien')
                : ($c->expert?->name ?: 'Tenaga Ahli');

            $partnerPhoto = $isExpert
                ? ($c->user?->avatar_url ? asset('storage/' . $c->user->avatar_url) : null)
                : ($c->expert?->photo ? (filter_var($c->expert->photo, FILTER_VALIDATE_URL) ? $c->expert->photo : asset('storage/' . $c->expert->photo)) : null);

            $lastMessageObj = ConsultationMessage::where('consultation_id', $c->id)
                ->latest()
                ->first();

            $unreadCount = ConsultationMessage::where('consultation_id', $c->id)
                ->where('sender_id', '!=', $user->id)
                ->where('is_read', false)
                ->count();

            $window = $this->calculateSessionWindow($c);

            return [
                'id' => $c->id,
                'consultation_id' => $c->id,
                'ref' => 'CONS-' . str_pad($c->id, 4, '0', STR_PAD_LEFT),
                'partner_name' => $partnerName,
                'partner_photo' => $partnerPhoto,
                'client_name' => $c->client_name ?: $c->user?->name,
                'expert_id' => $c->expert_id,
                'expert_name' => $c->expert?->name,
                'expert_slug' => $c->expert?->slug,
                'topic' => $c->topic,
                'consultation_date' => $c->consultation_date ? $c->consultation_date->format('Y-m-d') : null,
                'consultation_time' => $c->consultation_time,
                'status' => $c->status,
                'service_type' => $c->service_type,
                'zoom_link' => $c->zoom_link,
                'zoom_meeting_id' => $c->zoom_meeting_id,
                'zoom_passcode' => $c->zoom_passcode,
                'is_expert' => $isExpert,
                'last_msg' => $lastMessageObj ? $lastMessageObj->message : ($c->topic ? "Topik: {$c->topic}" : 'Sesi konsultasi dibuat'),
                'last_time' => $lastMessageObj ? $lastMessageObj->created_at->toIso8601String() : $c->created_at->toIso8601String(),
                'unread' => $unreadCount,
                'session_status' => $window['session_status'],
                'is_missed' => $window['is_missed'] ?? false,
                'can_send_message' => $user->role === 'admin' ? true : $window['can_send_message'],
                'starts_at' => $window['starts_at'],
                'ends_at' => $window['ends_at'],
                'seconds_remaining' => $window['seconds_remaining'],
                'formatted_schedule' => $window['formatted_schedule'] ?? null,
                'explanation' => $window['explanation'],
            ];
        });

        return response()->json([
            'success' => true,
            'count' => $rooms->count(),
            'data' => $rooms
        ]);
    }

    /**
     * Get messages for a specific consultation session.
     * GET /api/consultations/{id}/messages
     */
    public function getMessages(Request $request, $consultationId): JsonResponse
    {
        $user = $request->user();
        $expert = Expert::where('user_id', $user->id)->first();

        $consultation = Consultation::with(['expert', 'user'])->findOrFail($consultationId);

        // Security check
        $isAuthorized = ($admin = $user->role === 'admin')
            || ($consultation->user_id === $user->id)
            || ($consultation->client_email === $user->email)
            || ($expert && $consultation->expert_id === $expert->id);

        if (!$isAuthorized) {
            return response()->json(['message' => 'Unauthorized access to this consultation room.'], 403);
        }

        // Mark unread messages as read
        ConsultationMessage::where('consultation_id', $consultationId)
            ->where('sender_id', '!=', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        $messages = ConsultationMessage::where('consultation_id', $consultationId)
            ->with('sender:id,name,avatar_url')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($m) use ($user) {
                return [
                    'id' => $m->id,
                    'sender_id' => $m->sender_id,
                    'sender_name' => $m->sender?->name ?? 'User',
                    'sender_avatar' => $m->sender?->avatar_url ? asset('storage/' . $m->sender->avatar_url) : null,
                    'sender_type' => $m->sender_type,
                    'is_me' => $m->sender_id === $user->id,
                    'message' => $m->message,
                    'attachment_url' => $m->attachment_url ? asset('storage/' . $m->attachment_url) : null,
                    'attachment_name' => $m->attachment_name,
                    'is_read' => (bool) $m->is_read,
                    'created_at' => $m->created_at->format('Y-m-d H:i:s'),
                    'time_formatted' => $m->created_at->format('H:i'),
                ];
            });

        $window = $this->calculateSessionWindow($consultation);

        return response()->json([
            'success' => true,
            'consultation' => [
                'id' => $consultation->id,
                'ref' => 'CONS-' . str_pad($consultation->id, 4, '0', STR_PAD_LEFT),
                'client_name' => $consultation->client_name ?: $consultation->user?->name,
                'client_email' => $consultation->client_email ?: $consultation->user?->email,
                'client_phone' => $consultation->client_phone,
                'expert_id' => $consultation->expert_id,
                'expert_name' => $consultation->expert?->name,
                'expert_slug' => $consultation->expert?->slug,
                'expert_phone' => $consultation->expert?->whatsapp ?: $consultation->expert?->phone,
                'topic' => $consultation->topic,
                'service_type' => $consultation->service_type,
                'zoom_link' => $consultation->zoom_link,
                'zoom_meeting_id' => $consultation->zoom_meeting_id,
                'zoom_passcode' => $consultation->zoom_passcode,
                'status' => $consultation->status,
                'consultation_date' => $consultation->consultation_date ? $consultation->consultation_date->format('d M Y') : null,
                'consultation_time' => $consultation->consultation_time,
                'session_status' => $window['session_status'],
                'is_missed' => $window['is_missed'] ?? false,
                'can_send_message' => $user->role === 'admin' ? true : $window['can_send_message'],
                'starts_at' => $window['starts_at'],
                'ends_at' => $window['ends_at'],
                'seconds_remaining' => $window['seconds_remaining'],
                'formatted_schedule' => $window['formatted_schedule'] ?? null,
                'explanation' => $window['explanation'],
            ],
            'messages' => $messages
        ]);
    }

    /**
     * Send message in consultation chat room.
     * POST /api/consultations/{id}/messages
     */
    public function sendMessage(Request $request, $consultationId): JsonResponse
    {
        $user = $request->user();
        $expert = Expert::where('user_id', $user->id)->first();

        $consultation = Consultation::findOrFail($consultationId);

        $isAuthorized = ($user->role === 'admin')
            || ($consultation->user_id === $user->id)
            || ($consultation->client_email === $user->email)
            || ($expert && $consultation->expert_id === $expert->id);

        if (!$isAuthorized) {
            return response()->json(['message' => 'Unauthorized to send message in this room.'], 403);
        }

        // Time-Gating Check
        $window = $this->calculateSessionWindow($consultation);
        if ($user->role !== 'admin' && !$window['can_send_message']) {
            return response()->json([
                'success' => false,
                'message' => $window['explanation'],
                'session_status' => $window['session_status'],
                'can_send_message' => false,
                'starts_at' => $window['starts_at'],
                'ends_at' => $window['ends_at'],
                'seconds_remaining' => $window['seconds_remaining'],
                'formatted_schedule' => $window['formatted_schedule'] ?? null,
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'message' => ['nullable', 'string', 'max:2000'],
            'attachment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf,doc,docx,zip', 'max:15360'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        if (!$request->filled('message') && !$request->hasFile('attachment')) {
            return response()->json(['message' => 'Pesan atau lampiran berkas wajib diisi.'], 422);
        }

        $senderType = ($expert && $consultation->expert_id === $expert->id) ? 'expert' : 'client';
        if ($user->role === 'admin') {
            $senderType = 'admin';
        }

        $attachmentPath = null;
        $attachmentName = null;
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachmentName = $file->getClientOriginalName();
            $attachmentPath = $file->storeAs('consultations/chat_files', 'chat_' . $consultationId . '_' . time() . '_' . $attachmentName, 'public');
        }

        $msg = ConsultationMessage::create([
            'consultation_id' => $consultationId,
            'sender_id' => $user->id,
            'sender_type' => $senderType,
            'message' => $request->input('message', $attachmentName ? "Mengirim berkas: {$attachmentName}" : ''),
            'attachment_url' => $attachmentPath,
            'attachment_name' => $attachmentName,
            'is_read' => false,
        ]);

        $consultation->touch(); // Update updated_at on consultation for sorting

        return response()->json([
            'success' => true,
            'message' => [
                'id' => $msg->id,
                'sender_id' => $msg->sender_id,
                'sender_name' => $user->name,
                'sender_avatar' => $user->avatar_url ? asset('storage/' . $user->avatar_url) : null,
                'sender_type' => $msg->sender_type,
                'is_me' => true,
                'message' => $msg->message,
                'attachment_url' => $msg->attachment_url ? asset('storage/' . $msg->attachment_url) : null,
                'attachment_name' => $msg->attachment_name,
                'is_read' => false,
                'created_at' => $msg->created_at->format('Y-m-d H:i:s'),
                'time_formatted' => $msg->created_at->format('H:i'),
            ]
        ], 201);
    }
}
