<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SyncMembershipLevel
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Sync membership level for authenticated user
        if ($user = $request->user()) {
            $this->syncUserMembership($user);
        }

        return $next($request);
    }

    /**
     * Sync user membership package expiry status
     */
    private function syncUserMembership($user): void
    {
        // Check if premium / platinum / ekonomis / eksklusif should be expired
        if (in_array($user->package, ['premium', 'platinum', 'ekonomis', 'eksklusif', 'ekslusif', 'esklusif']) && !$user->isPremium()) {
            $user->update(['package' => 'free']);
        }
    }
}
