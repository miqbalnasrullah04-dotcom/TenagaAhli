<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // MATIKAN PENGECEKAN CSRF UNTUK SEMUA RUTE API & WEBHOOK
        $middleware->validateCsrfTokens(except: [
            'api/*',
            'midtrans/*',
            'payment/*',
            'payments/*',
        ]);

        // Matikan redirect web untuk tamu tidak terautentikasi (selalu return JSON 401 untuk API)
        $middleware->redirectGuestsTo(fn () => null);

        // Apply custom CORS middleware to all routes
        $middleware->prepend(\App\Http\Middleware\HandleCors::class);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
