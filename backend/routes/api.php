<?php

use App\Http\Controllers\Api\AkademikController;
use App\Http\Controllers\Api\ArticleApiController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryApiController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\EducationController;
use App\Http\Controllers\Api\ExperienceController;
use App\Http\Controllers\Api\ExpertController;
use App\Http\Controllers\Api\FileController;
use App\Http\Controllers\Api\HealthCheckController;
use App\Http\Controllers\Api\MembershipController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PackageController;
use App\Http\Controllers\Api\PamfletApiController;
use App\Http\Controllers\Api\PartnerApiController;
use App\Http\Controllers\Api\PointController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SubmissionController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Middleware\EnsureIsAdmin;
use Illuminate\Support\Facades\Route;

// Health Check Endpoint
Route::get('/health-check', [HealthCheckController::class, 'index']);

// File viewing and download (public access for viewing uploaded files)
Route::get('/files/{path}', [FileController::class, 'view'])->where('path', '.*')->name('api.file.view');
Route::get('/files/{path}/info', [FileController::class, 'info'])->where('path', '.*')->name('api.file.info');

Route::post('/register', [AuthController::class, 'register']);
Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/resend-otp', [AuthController::class, 'resendOTP']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/register/status', [AuthController::class, 'registrationStatus']);

// Password Reset (Lupa Password)
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/verify-reset-token', [AuthController::class, 'verifyResetToken']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Midtrans Webhook (no auth required, verified by Midtrans signature)
Route::post('/midtrans/notification', [OrderController::class, 'notification']);

// Membership payment callback (no auth required, verified by payment gateway)
Route::post('/membership/payment-callback', [MembershipController::class, 'paymentCallback']);

Route::get('/experts', [ExpertController::class, 'index']);
Route::get('/experts/{slug}', [ExpertController::class, 'show']);

// Ulasan publik — siapapun bisa lihat & kirim ulasan
Route::get('/experts/{slug}/reviews', [ReviewController::class, 'index']);
Route::post('/experts/{slug}/reviews', [ReviewController::class, 'store']);

Route::get('/partners', [PartnerApiController::class, 'index']);
Route::get('/articles', [ArticleApiController::class, 'index']);
Route::get('/articles/{slug}', [ArticleApiController::class, 'show']);
Route::get('/categories', [CategoryApiController::class, 'index']);
Route::get('/packages', [PackageController::class, 'index']);
Route::get('/pamflets', [PamfletApiController::class, 'index']);
Route::get('/pamflets/{id}', [PamfletApiController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user/change-password', [AuthController::class, 'changePassword']);

    // Dashboard user - profil sendiri
    Route::get('/my/profile', [ExpertController::class, 'myProfile']);
    Route::post('/my/profile', [ExpertController::class, 'saveProfile']);
    Route::patch('/my/profile', [ExpertController::class, 'saveProfile']);

    Route::post('/my/profile/submit', [ExpertController::class, 'submitForVerification']);

    Route::get('/my/educations', [EducationController::class, 'index']);
    Route::post('/my/educations', [EducationController::class, 'store']);
    Route::put('/my/educations/{id}', [EducationController::class, 'update']);
    Route::delete('/my/educations/{id}', [EducationController::class, 'destroy']);

    Route::get('/my/experiences', [ExperienceController::class, 'index']);
    Route::post('/my/experiences', [ExperienceController::class, 'store']);
    Route::put('/my/experiences/{id}', [ExperienceController::class, 'update']);
    Route::delete('/my/experiences/{id}', [ExperienceController::class, 'destroy']);

    Route::get('/my/certificates', [CertificateController::class, 'index']);
    Route::post('/my/certificates', [CertificateController::class, 'store']);
    Route::delete('/my/certificates/{id}', [CertificateController::class, 'destroy']);

    Route::get('/my/documents', [DocumentController::class, 'index']);
    Route::post('/my/documents', [DocumentController::class, 'store']);
    Route::delete('/my/documents/{id}', [DocumentController::class, 'destroy']);

    // Academic data - publikasi, organisasi, reviewer jurnal, instruktur
    Route::get('/my/publikasi', [AkademikController::class, 'indexPublikasi']);
    Route::post('/my/publikasi', [AkademikController::class, 'storePublikasi']);
    Route::delete('/my/publikasi/{id}', [AkademikController::class, 'destroyPublikasi']);

    Route::get('/my/organisasi', [AkademikController::class, 'indexOrganisasi']);
    Route::post('/my/organisasi', [AkademikController::class, 'storeOrganisasi']);
    Route::delete('/my/organisasi/{id}', [AkademikController::class, 'destroyOrganisasi']);

    Route::get('/my/reviewer-jurnal', [AkademikController::class, 'indexReviewerJurnal']);
    Route::post('/my/reviewer-jurnal', [AkademikController::class, 'storeReviewerJurnal']);
    Route::delete('/my/reviewer-jurnal/{id}', [AkademikController::class, 'destroyReviewerJurnal']);

    Route::get('/my/instruktur', [AkademikController::class, 'indexInstruktur']);
    Route::post('/my/instruktur', [AkademikController::class, 'storeInstruktur']);
    Route::delete('/my/instruktur/{id}', [AkademikController::class, 'destroyInstruktur']);

    // File upload endpoint for profile images
    Route::post('/upload/profile-image', [FileController::class, 'uploadProfileImage']);

    // Paket & pembayaran (user)
    Route::post('/my/choose-package', [OrderController::class, 'choosePackage']);
    Route::get('/orders/mine', [OrderController::class, 'myOrder']);
    Route::post('/orders/{id}/upload-proof', [OrderController::class, 'uploadProof']);
    Route::get('/orders/history', [OrderController::class, 'myOrders']);

    // Points & Level (user)
    Route::get('/my/points', [PointController::class, 'myHistory']);
    Route::get('/leaderboard', [PointController::class, 'leaderboard']);

    // Ulasan (tenaga ahli) — hanya bisa diakses setelah login
    Route::get('/my/reviews', [ReviewController::class, 'myReviews']);
    Route::post('/my/reviews/{id}/reply', [ReviewController::class, 'reply']);
    Route::delete('/my/reviews/{id}/reply', [ReviewController::class, 'deleteReply']);

    // Pengajuan (user)
    Route::post('/submissions', [SubmissionController::class, 'store']);
    Route::get('/submissions/mine', [SubmissionController::class, 'mine']);
    Route::get('/submissions/{id}', [SubmissionController::class, 'show']);

    // Tickets (user)
    Route::get('/tickets', [TicketController::class, 'index']);
    Route::post('/tickets', [TicketController::class, 'store']);
    Route::get('/tickets/{id}', [TicketController::class, 'show']);
    Route::post('/tickets/{id}/reply', [TicketController::class, 'reply']);

    // Membership (user) - with sync middleware
    Route::middleware([\App\Http\Middleware\SyncMembershipLevel::class])->group(function () {
        Route::get('/membership/status', [MembershipController::class, 'status']);
        Route::get('/membership/pricing', [MembershipController::class, 'pricing']);
        Route::post('/membership/upgrade', [MembershipController::class, 'upgrade']);
        Route::post('/membership/renew', [MembershipController::class, 'renew']);
        Route::get('/membership/point-history', [MembershipController::class, 'pointHistory']);
        Route::get('/membership/membership-history', [MembershipController::class, 'membershipHistory']);
        Route::post('/membership/transactions/{id}/cancel', [MembershipController::class, 'cancelTransaction']);
    });

    Route::middleware([EnsureIsAdmin::class])->group(function () {
        // Pengajuan (admin)
        Route::get('/admin/submissions', [SubmissionController::class, 'adminIndex']);
        Route::post('/admin/submissions/{id}/status', [SubmissionController::class, 'updateStatus']);

        // Endpoint khusus admin: data mentah
        Route::get('/admin/experts', [ExpertController::class, 'adminIndex']);
        Route::post('/admin/experts/{id}/verify-profile', [ExpertController::class, 'verifyProfile']);
        Route::post('/admin/experts/{id}/reject-profile', [ExpertController::class, 'rejectProfile']);

        Route::get('/admin/articles', [ArticleApiController::class, 'adminIndex']);
        Route::get('/admin/categories', [CategoryApiController::class, 'adminIndex']);
        Route::get('/admin/partners', [PartnerApiController::class, 'adminIndex']);
        Route::get('/admin/orders', [OrderController::class, 'adminIndex']);
        Route::post('/admin/orders/{id}/verify', [OrderController::class, 'verify']);
        Route::post('/admin/orders/{id}/reject', [OrderController::class, 'reject']);

        Route::get('/admin/packages', [PackageController::class, 'adminIndex']);
        Route::post('/admin/packages', [PackageController::class, 'store']);
        Route::put('/admin/packages/{id}', [PackageController::class, 'update']);
        Route::delete('/admin/packages/{id}', [PackageController::class, 'destroy']);

        // Points stats (admin)
        Route::get('/admin/points/stats', [PointController::class, 'stats']);

        // Admin - dashboard stats, deactivate, change password
        Route::get('/admin/dashboard-stats', [ExpertController::class, 'dashboardStats']);
        Route::post('/admin/experts/{id}/deactivate', [ExpertController::class, 'deactivateProfile']);
        Route::put('/admin/change-password', [AuthController::class, 'changePassword']);

        // CRUD Admin - Experts (manual, oleh admin sendiri)
        Route::post('/experts', [ExpertController::class, 'store']);
        Route::put('/experts/{id}', [ExpertController::class, 'update']);
        Route::delete('/experts/{id}', [ExpertController::class, 'destroy']);

        Route::post('/articles', [ArticleApiController::class, 'store']);
        Route::put('/articles/{id}', [ArticleApiController::class, 'update']);
        Route::delete('/articles/{id}', [ArticleApiController::class, 'destroy']);

        Route::post('/categories', [CategoryApiController::class, 'store']);
        Route::put('/categories/{id}', [CategoryApiController::class, 'update']);
        Route::delete('/categories/{id}', [CategoryApiController::class, 'destroy']);

        Route::post('/partners', [PartnerApiController::class, 'store']);
        Route::put('/partners/{id}', [PartnerApiController::class, 'update']);
        Route::delete('/partners/{id}', [PartnerApiController::class, 'destroy']);

        // Tickets (admin)
        Route::get('/admin/tickets', [\App\Http\Controllers\Admin\TicketController::class, 'index']);
        Route::get('/admin/tickets/statistics', [\App\Http\Controllers\Admin\TicketController::class, 'statistics']);
        Route::get('/admin/tickets/{id}', [\App\Http\Controllers\Admin\TicketController::class, 'show']);
        Route::post('/admin/tickets/{id}/reply', [\App\Http\Controllers\Admin\TicketController::class, 'reply']);
        Route::patch('/admin/tickets/{id}/status', [\App\Http\Controllers\Admin\TicketController::class, 'updateStatus']);

        // Membership (admin)
        Route::get('/admin/membership/statistics', [\App\Http\Controllers\Admin\MembershipController::class, 'statistics']);
        Route::get('/admin/membership/users', [\App\Http\Controllers\Admin\MembershipController::class, 'users']);
        Route::get('/admin/membership/users/{id}', [\App\Http\Controllers\Admin\MembershipController::class, 'userDetail']);
        Route::get('/admin/membership/point-transactions', [\App\Http\Controllers\Admin\MembershipController::class, 'pointTransactions']);
        Route::get('/admin/membership/membership-transactions', [\App\Http\Controllers\Admin\MembershipController::class, 'membershipTransactions']);
        Route::post('/admin/membership/process-expired', [\App\Http\Controllers\Admin\MembershipController::class, 'processExpired']);
    });
});
