<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\TicketCreatedAdmin;
use App\Mail\TicketCreatedUser;
use App\Mail\TicketReplyNotification;
use App\Models\Ticket;
use App\Models\TicketReply;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class TicketController extends Controller
{
    /**
     * Get all tickets for authenticated user
     */
    public function index(Request $request)
    {
        $tickets = Ticket::where('user_id', $request->user()->id)
            ->with(['user:id,name,email', 'replies.user:id,name,email'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($tickets);
    }

    /**
     * Create new ticket
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'priority' => ['required', 'in:rendah,sedang,tinggi'],
            'message' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $ticket = Ticket::create([
            'user_id' => $request->user()->id,
            'ticket_number' => Ticket::generateTicketNumber(),
            'title' => $request->title,
            'category' => $request->category,
            'priority' => $request->priority,
            'status' => 'baru',
            'message' => $request->message,
        ]);

        $ticket->load(['user:id,name,email', 'replies']);

        $user = $request->user();
        $frontendUrl = rtrim(config('app.frontend_url', config('app.url')), '/');
        $ticketUrl = $frontendUrl . '/bantuan';
        $adminTicketUrl = $frontendUrl . '/admin/tickets';

        // 1. Email konfirmasi ke Pengguna
        if ($user && $user->email) {
            try {
                Mail::to($user->email)->send(new TicketCreatedUser($ticket, $user, $ticketUrl));
            } catch (\Throwable $e) {
                \Log::warning('Gagal kirim email TicketCreatedUser: ' . $e->getMessage());
            }
        }

        // 2. Email notifikasi ke Admin / Support Team
        $adminEmail = config('mail.from.address', 'admin@tenagaahli.com');
        try {
            Mail::to($adminEmail)->send(new TicketCreatedAdmin($ticket, $user, $adminTicketUrl));
        } catch (\Throwable $e) {
            \Log::warning('Gagal kirim email TicketCreatedAdmin: ' . $e->getMessage());
        }

        return response()->json($ticket, 201);
    }

    /**
     * Get single ticket detail
     */
    public function show(Request $request, $id)
    {
        $ticket = Ticket::where('user_id', $request->user()->id)
            ->with(['user:id,name,email', 'replies.user:id,name,email', 'closedBy:id,name,email'])
            ->findOrFail($id);

        return response()->json($ticket);
    }

    /**
     * Add reply to ticket
     */
    public function reply(Request $request, $id)
    {
        $ticket = Ticket::where('user_id', $request->user()->id)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'message' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $reply = TicketReply::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'is_admin' => false,
            'message' => $request->message,
        ]);

        $reply->load('user:id,name,email');

        // Update ticket status to diproses if it was baru
        if ($ticket->status === 'baru') {
            $ticket->update(['status' => 'diproses']);
        }

        // Notifikasi email balasan pengguna ke Admin
        $user = $request->user();
        $frontendUrl = rtrim(config('app.frontend_url', config('app.url')), '/');
        $adminTicketUrl = $frontendUrl . '/admin/tickets';
        $adminEmail = config('mail.from.address', 'admin@tenagaahli.com');

        try {
            Mail::to($adminEmail)->send(new TicketReplyNotification($ticket, $reply, $user, 'admin', $adminTicketUrl));
        } catch (\Throwable $e) {
            \Log::warning('Gagal kirim email TicketReplyNotification ke Admin: ' . $e->getMessage());
        }

        return response()->json($reply, 201);
    }
}
