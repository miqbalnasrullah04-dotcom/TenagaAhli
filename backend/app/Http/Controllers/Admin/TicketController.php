<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\TicketReplyNotification;
use App\Mail\TicketStatusUpdated;
use App\Models\Ticket;
use App\Models\TicketReply;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class TicketController extends Controller
{
    /**
     * Get all tickets (admin can see all)
     */
    public function index(Request $request)
    {
        $query = Ticket::with(['user:id,name,email', 'replies.user:id,name,email'])
            ->orderBy('created_at', 'desc');

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by priority
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        // Search by ticket number, title, or user name
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('ticket_number', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $tickets = $query->get();

        return response()->json($tickets);
    }

    /**
     * Get single ticket detail (admin can see any ticket)
     */
    public function show($id)
    {
        $ticket = Ticket::with([
            'user:id,name,email',
            'replies.user:id,name,email',
            'closedBy:id,name,email'
        ])->findOrFail($id);

        return response()->json($ticket);
    }

    /**
     * Admin add reply to ticket
     */
    public function reply(Request $request, $id)
    {
        $ticket = Ticket::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'message' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $reply = TicketReply::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'is_admin' => true,
            'message' => $request->message,
        ]);

        $reply->load('user:id,name,email');

        // Update ticket status to diproses if it was baru
        if ($ticket->status === 'baru') {
            $ticket->update(['status' => 'diproses']);
        }

        // Kirim email notifikasi ke pengguna yang membuat tiket
        $ticket->loadMissing('user');
        if ($ticket->user && $ticket->user->email) {
            $adminUser = $request->user();
            $frontendUrl = rtrim(config('app.frontend_url', config('app.url')), '/');
            $ticketUrl = $frontendUrl . '/bantuan';

            try {
                Mail::to($ticket->user->email)->send(new TicketReplyNotification($ticket, $reply, $adminUser, 'user', $ticketUrl));
            } catch (\Throwable $e) {
                \Log::warning('Gagal kirim email TicketReplyNotification ke User: ' . $e->getMessage());
            }
        }

        return response()->json($reply, 201);
    }

    /**
     * Update ticket status
     */
    public function updateStatus(Request $request, $id)
    {
        $ticket = Ticket::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'status' => ['required', 'in:baru,diproses,selesai'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $updateData = ['status' => $request->status];

        // If closing the ticket, record who closed it and when
        if ($request->status === 'selesai') {
            $updateData['closed_by'] = $request->user()->id;
            $updateData['closed_at'] = now();
        } else {
            // If reopening, clear closed info
            $updateData['closed_by'] = null;
            $updateData['closed_at'] = null;
        }

        $ticket->update($updateData);

        $ticket->load(['user:id,name,email', 'replies.user:id,name,email', 'closedBy:id,name,email']);

        // Kirim email notifikasi jika status diubah (misal diselesaikan)
        if ($ticket->user && $ticket->user->email) {
            $frontendUrl = rtrim(config('app.frontend_url', config('app.url')), '/');
            $ticketUrl = $frontendUrl . '/bantuan';
            $statusLabels = [
                'baru'     => 'Baru',
                'diproses' => 'Sedang Diproses',
                'selesai'  => 'Selesai (Ditutup)',
            ];
            $label = $statusLabels[$request->status] ?? ucfirst($request->status);

            try {
                Mail::to($ticket->user->email)->send(new TicketStatusUpdated($ticket, $ticket->user, $label, $ticketUrl));
            } catch (\Throwable $e) {
                \Log::warning('Gagal kirim email TicketStatusUpdated: ' . $e->getMessage());
            }
        }

        return response()->json($ticket);
    }

    /**
     * Get ticket statistics for admin dashboard
     */
    public function statistics()
    {
        $stats = [
            'total' => Ticket::count(),
            'baru' => Ticket::where('status', 'baru')->count(),
            'diproses' => Ticket::where('status', 'diproses')->count(),
            'selesai' => Ticket::where('status', 'selesai')->count(),
            'rendah' => Ticket::where('priority', 'rendah')->count(),
            'sedang' => Ticket::where('priority', 'sedang')->count(),
            'tinggi' => Ticket::where('priority', 'tinggi')->count(),
            'recent' => Ticket::with('user:id,name,email')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(),
        ];

        return response()->json($stats);
    }
}
