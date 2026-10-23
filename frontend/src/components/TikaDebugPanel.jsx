import { useState } from 'react';
import { useTika } from '../context/TikaContext.jsx';

/**
 * Debug panel untuk testing TIKA - hanya muncul di development
 * Akses via: http://localhost:5173?debug=tika
 */
export default function TikaDebugPanel() {
  const { messages, sendMessage, clearChat, sessionId, isLoading } = useTika();
  const [testMessage, setTestMessage] = useState('');
  
  // Only show in development with debug parameter
  if (import.meta.env.PROD || !window.location.search.includes('debug=tika')) {
    return null;
  }

  const testQueries = [
    'Halo TIKA',
    'Cari tenaga ahli lingkungan',
    'Bagaimana cara konsultasi?',
    'Cara booking ahli',
    'Tentang TenagaAhli.com',
    'Ahli AMDAL konstruksi',
    'Pertanyaan random untuk test fallback'
  ];

  const runTest = async (query) => {
    console.log(`🧪 Testing query: "${query}"`);
    await sendMessage(query);
  };

  const runAllTests = async () => {
    console.log('🧪 Running all TIKA tests...');
    for (const query of testQueries) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between tests
      await runTest(query);
    }
    console.log('✅ All tests completed');
  };

  return (
    <div className="fixed top-4 left-4 z-50 bg-white border-2 border-blue-500 rounded-lg p-4 shadow-xl max-w-sm">
      <h3 className="font-bold text-blue-600 mb-3">🧪 TIKA Debug Panel</h3>
      
      {/* Session Info */}
      <div className="mb-3 text-xs">
        <p><strong>Session:</strong> {sessionId}</p>
        <p><strong>Messages:</strong> {messages.length}</p>
        <p><strong>Loading:</strong> {isLoading ? '⏳' : '✅'}</p>
      </div>

      {/* Quick Tests */}
      <div className="mb-3">
        <p className="text-xs font-semibold mb-2">Quick Tests:</p>
        <div className="grid grid-cols-1 gap-1">
          {testQueries.slice(0, 4).map((query, i) => (
            <button
              key={i}
              onClick={() => runTest(query)}
              disabled={isLoading}
              className="text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded text-left disabled:opacity-50"
            >
              {query}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Test */}
      <div className="mb-3">
        <input
          type="text"
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          placeholder="Custom test message"
          className="w-full text-xs border rounded px-2 py-1"
        />
        <button
          onClick={() => runTest(testMessage)}
          disabled={!testMessage.trim() || isLoading}
          className="mt-1 text-xs bg-green-100 hover:bg-green-200 px-2 py-1 rounded disabled:opacity-50"
        >
          Test Custom
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1">
        <div className="flex gap-1">
          <button
            onClick={runAllTests}
            disabled={isLoading}
            className="text-xs bg-purple-100 hover:bg-purple-200 px-2 py-1 rounded disabled:opacity-50"
          >
            Run All Tests
          </button>
          <button
            onClick={clearChat}
            className="text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded"
          >
            Clear Chat
          </button>
        </div>
        
        {/* Auto-clear testing */}
        <div className="flex gap-1">
          <button
            onClick={() => {
              // Simulate near-expiry by modifying localStorage timestamp
              const saved = localStorage.getItem('tika_chat_data');
              if (saved) {
                const data = JSON.parse(saved);
                data.timestamp = Date.now() - (3 * 60 * 60 * 1000) + (6 * 60 * 1000); // 6 minutes left
                localStorage.setItem('tika_chat_data', JSON.stringify(data));
                window.location.reload();
              }
            }}
            className="text-xs bg-yellow-100 hover:bg-yellow-200 px-2 py-1 rounded"
          >
            Test Warning (6m)
          </button>
          <button
            onClick={() => {
              // Simulate expiry
              const saved = localStorage.getItem('tika_chat_data');
              if (saved) {
                const data = JSON.parse(saved);
                data.timestamp = Date.now() - (3 * 60 * 60 * 1000) - 1000; // Expired
                localStorage.setItem('tika_chat_data', JSON.stringify(data));
                window.location.reload();
              }
            }}
            className="text-xs bg-orange-100 hover:bg-orange-200 px-2 py-1 rounded"
          >
            Test Auto-Clear
          </button>
        </div>
      </div>

      {/* Console Tip */}
      <p className="text-xs text-gray-500 mt-2">
        💡 Check browser console for test logs
      </p>
    </div>
  );
}