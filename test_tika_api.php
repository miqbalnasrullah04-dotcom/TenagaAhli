<?php
/**
 * Simple script to test TIKA API endpoints
 * Run: php test_tika_api.php
 */

// Configuration
$BASE_URL = 'http://localhost:8000/api';
$TEST_MESSAGES = [
    'Halo TIKA',
    'Cari tenaga ahli lingkungan',
    'Bagaimana cara konsultasi?',
    'Cara booking ahli',
    'Tentang TenagaAhli.com',
    'Ahli AMDAL konstruksi',
    'Random message untuk test fallback'
];

echo "🧪 TIKA API Testing Script\n";
echo "========================\n\n";

// Test 1: Test endpoint
echo "1️⃣ Testing GET /api/tika/test\n";
$response = makeRequest('GET', $BASE_URL . '/tika/test');
if ($response) {
    echo "✅ Test endpoint accessible\n";
    $data = json_decode($response, true);
    echo "   Database stats: " . ($data['database_stats']['total_active_experts'] ?? 0) . " active experts\n";
} else {
    echo "❌ Test endpoint failed\n";
}
echo "\n";

// Test 2: Chat endpoint with various messages
echo "2️⃣ Testing POST /api/tika/chat\n";
foreach ($TEST_MESSAGES as $i => $message) {
    echo "   Testing message: \"$message\"\n";
    
    $payload = [
        'message' => $message,
        'session_id' => 'test_session_' . time() . '_' . $i,
        'context' => [
            'timestamp' => date('c'),
            'test_mode' => true
        ]
    ];
    
    $response = makeRequest('POST', $BASE_URL . '/tika/chat', $payload);
    
    if ($response) {
        $data = json_decode($response, true);
        echo "   ✅ Response: " . substr($data['response'] ?? 'No response', 0, 80) . "...\n";
        echo "   📝 Suggestions: " . count($data['suggestions'] ?? []) . " items\n";
        echo "   👨‍💼 Experts: " . count($data['experts'] ?? []) . " found\n";
    } else {
        echo "   ❌ Request failed\n";
    }
    
    // Rate limiting protection
    sleep(1);
}
echo "\n";

// Test 3: Rate limiting
echo "3️⃣ Testing Rate Limiting\n";
echo "   Sending 20 rapid requests...\n";
$rateLimitHit = false;
$sessionId = 'rate_limit_test_' . time();

for ($i = 1; $i <= 20; $i++) {
    $payload = [
        'message' => "Rate limit test message $i",
        'session_id' => $sessionId,
        'context' => []
    ];
    
    $response = makeRequest('POST', $BASE_URL . '/tika/chat', $payload, false);
    $httpCode = getLastHttpCode();
    
    if ($httpCode === 429) {
        echo "   ✅ Rate limit triggered at request $i (HTTP 429)\n";
        $rateLimitHit = true;
        break;
    }
    
    // Small delay to avoid overwhelming the server
    usleep(100000); // 0.1 second
}

if (!$rateLimitHit) {
    echo "   ⚠️ Rate limit not triggered (might need adjustment)\n";
}
echo "\n";

// Test 4: Invalid requests
echo "4️⃣ Testing Invalid Requests\n";

// Empty message
$payload = ['message' => '', 'session_id' => 'test'];
$response = makeRequest('POST', $BASE_URL . '/tika/chat', $payload, false);
$httpCode = getLastHttpCode();
echo "   Empty message: HTTP $httpCode " . ($httpCode === 422 ? '✅' : '❌') . "\n";

// Too long message
$payload = ['message' => str_repeat('a', 501), 'session_id' => 'test'];
$response = makeRequest('POST', $BASE_URL . '/tika/chat', $payload, false);
$httpCode = getLastHttpCode();
echo "   Too long message: HTTP $httpCode " . ($httpCode === 422 ? '✅' : '❌') . "\n";

// Missing session_id
$payload = ['message' => 'test'];
$response = makeRequest('POST', $BASE_URL . '/tika/chat', $payload, false);
$httpCode = getLastHttpCode();
echo "   Missing session_id: HTTP $httpCode " . ($httpCode === 422 ? '✅' : '❌') . "\n";

echo "\n";
echo "🎉 Testing completed!\n";
echo "Check your Laravel logs for TIKA activity.\n";

/**
 * Make HTTP request
 */
function makeRequest($method, $url, $data = null, $showErrors = true) {
    static $httpCode;
    
    $ch = curl_init();
    
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json'
        ]
    ]);
    
    if ($method === 'POST' && $data) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    // Store last HTTP code for testing
    $GLOBALS['last_http_code'] = $httpCode;
    
    if ($error && $showErrors) {
        echo "   ❌ cURL Error: $error\n";
        return false;
    }
    
    if ($httpCode >= 400 && $showErrors) {
        echo "   ❌ HTTP Error $httpCode: $response\n";
        return false;
    }
    
    return $response;
}

/**
 * Get last HTTP code
 */
function getLastHttpCode() {
    return $GLOBALS['last_http_code'] ?? 0;
}