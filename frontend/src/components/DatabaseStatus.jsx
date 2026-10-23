import React, { useState, useEffect } from 'react';
import api, { testConnection } from '../api/client';

const DatabaseStatus = () => {
  const [status, setStatus] = useState('checking');
  const [healthData, setHealthData] = useState(null);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const checkHealth = async () => {
    try {
      setStatus('checking');
      setError(null);
      
      const response = await testConnection();
      setHealthData(response);
      setStatus('connected');
      setLastChecked(new Date());
    } catch (err) {
      console.error('Health check failed:', err);
      setError(err.response?.data?.error || err.message || 'Connection failed');
      setStatus('error');
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    checkHealth();
    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'checking': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected': return '✅';
      case 'error': return '❌';
      case 'checking': return '🔄';
      default: return '❓';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Database Status</h3>
        <button
          onClick={checkHealth}
          className="px-3 py-1 text-sm bg-[#8B4513] text-white rounded hover:bg-[#6B3410]"
          disabled={status === 'checking'}
        >
          {status === 'checking' ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
        <span className="mr-2">{getStatusIcon()}</span>
        {status === 'connected' && 'Database Connected'}
        {status === 'error' && 'Connection Failed'}
        {status === 'checking' && 'Checking Connection...'}
      </div>

      {lastChecked && (
        <p className="text-sm text-gray-500 mt-2">
          Last checked: {lastChecked.toLocaleTimeString()}
        </p>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700 text-sm">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {healthData && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Status:</span> {healthData.status}
            </div>
            <div>
              <span className="font-medium">Version:</span> {healthData.version}
            </div>
          </div>

          {healthData.database && (
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="font-medium text-sm mb-2">Database Info:</h4>
              <div className="text-xs space-y-1">
                <div><strong>Connection:</strong> {healthData.database.connection}</div>
                <div><strong>Database:</strong> {healthData.database.database}</div>
                <div><strong>Status:</strong> {healthData.database.status}</div>
                
                {healthData.database.tables && (
                  <div className="mt-2">
                    <strong>Tables:</strong>
                    <ul className="ml-4 mt-1">
                      {Object.entries(healthData.database.tables).map(([table, count]) => (
                        <li key={table}>
                          {table}: {count} records
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {healthData.cache && (
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="font-medium text-sm mb-2">Cache Info:</h4>
              <div className="text-xs">
                <div><strong>Status:</strong> {healthData.cache.status}</div>
                <div><strong>Driver:</strong> {healthData.cache.driver}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatabaseStatus;