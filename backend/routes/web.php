<?php

use App\Http\Controllers\Api\FileController;
use Illuminate\Support\Facades\Route;

// Midtrans Webhook Aliases on Web root (in case merchant dashboard URL is configured without /api)
Route::post('/midtrans/notification', [\App\Http\Controllers\Api\OrderController::class, 'notification']);
Route::post('/payment/notification', [\App\Http\Controllers\Api\OrderController::class, 'notification']);
Route::post('/payments/notification', [\App\Http\Controllers\Api\OrderController::class, 'notification']);
Route::get('/payment/check-status/{orderId}', [\App\Http\Controllers\Api\OrderController::class, 'checkPaymentStatus']);

// Serve public storage files as fallback
Route::get('/storage/{path}', [FileController::class, 'view'])->where('path', '.*');

Route::fallback(function () {
    $path = public_path('index.html');
    if (file_exists($path)) {
        return response(file_get_contents($path))->header('Content-Type', 'text/html');
    }
    return response()->json(['message' => 'Not Found'], 404);
});

// Rute admin (jika ditembak dari frontend via /api/admin/..., sesuaikan grouping-nya di admin.php)
require __DIR__.'/admin.php';

