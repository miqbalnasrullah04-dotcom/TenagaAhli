<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expert;
use Illuminate\Http\Request;

class TikaTestController extends Controller
{
    /**
     * Test TIKA endpoint dengan beberapa sample query
     */
    public function test(Request $request)
    {
        $testCases = [
            [
                'message' => 'Halo TIKA',
                'expected_intent' => 'greeting'
            ],
            [
                'message' => 'Cari tenaga ahli lingkungan',
                'expected_intent' => 'expert_search'
            ],
            [
                'message' => 'Bagaimana cara konsultasi?',
                'expected_intent' => 'consultation_help'
            ],
            [
                'message' => 'Cara booking ahli',
                'expected_intent' => 'booking_help'
            ],
            [
                'message' => 'Tentang TenagaAhli.com',
                'expected_intent' => 'about_website'
            ]
        ];

        $results = [];

        foreach ($testCases as $testCase) {
            try {
                // Simulate API call to TIKA
                $mockRequest = new Request([
                    'message' => $testCase['message'],
                    'session_id' => 'test_session_' . time(),
                    'context' => []
                ]);

                $tikaController = new TikaController();
                $response = $tikaController->chat($mockRequest);
                $responseData = $response->getData(true);

                $results[] = [
                    'input' => $testCase['message'],
                    'expected_intent' => $testCase['expected_intent'],
                    'response' => $responseData['response'] ?? 'No response',
                    'suggestions' => $responseData['suggestions'] ?? [],
                    'experts_found' => count($responseData['experts'] ?? []),
                    'status' => $response->getStatusCode()
                ];

            } catch (\Exception $e) {
                $results[] = [
                    'input' => $testCase['message'],
                    'expected_intent' => $testCase['expected_intent'],
                    'error' => $e->getMessage(),
                    'status' => 'error'
                ];
            }
        }

        // Quick stats
        $expertCount = Expert::where('profile_status', 'aktif')->count();
        $verifiedExpertCount = Expert::where('profile_status', 'aktif')->where('verified', true)->count();

        return response()->json([
            'tika_test_results' => $results,
            'database_stats' => [
                'total_active_experts' => $expertCount,
                'verified_experts' => $verifiedExpertCount
            ],
            'test_completed_at' => now()->toISOString()
        ]);
    }
}