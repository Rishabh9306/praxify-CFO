'use client';

import { useState } from 'react';

export default function APITestPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testBackend = async () => {
    setLoading(true);
    setResult('Testing backend...');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(`✅ SUCCESS!\n\nStatus: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`⚠️ Backend responded with status: ${response.status}\n${response.statusText}`);
      }
    } catch (error) {
      setResult(`❌ FAILED TO CONNECT\n\nError: ${error instanceof Error ? error.message : String(error)}\n\nBackend URL: ${process.env.NEXT_PUBLIC_API_URL}`);
    } finally {
      setLoading(false);
    }
  };

  const testCORS = async () => {
    setLoading(true);
    setResult('Testing CORS...');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const corsHeaders = {
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
      };
      
      setResult(`CORS Headers:\n${JSON.stringify(corsHeaders, null, 2)}\n\nIf 'access-control-allow-origin' is null, CORS is NOT configured!`);
    } catch (error) {
      setResult(`❌ CORS ERROR\n\n${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const testFullReport = async () => {
    setLoading(true);
    setResult('Testing full report API...');
    
    try {
      // Create a minimal test file
      const testCSV = 'Transaction Date,Sales Revenue,Operating Costs\n2023-01-31,120500,75300\n2023-02-28,115000,72000';
      const blob = new Blob([testCSV], { type: 'text/csv' });
      const file = new File([blob], 'test.csv', { type: 'text/csv' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('persona', 'finance_guardian');
      formData.append('metric_names', 'Revenue,Expenses');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/full_report`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(`✅ FULL REPORT SUCCESS!\n\nKPIs: ${JSON.stringify(data.kpis, null, 2)}`);
      } else {
        const text = await response.text();
        setResult(`❌ API ERROR (${response.status})\n\n${text}`);
      }
    } catch (error) {
      setResult(`❌ FAILED TO GENERATE REPORT\n\n${error instanceof Error ? error.message : String(error)}\n\nThis is the SAME error you're seeing in the upload page!`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">🔍 API Connection Test</h1>
      
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <p className="mb-2"><strong>Backend URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'NOT SET!'}</p>
        <p className="mb-2"><strong>Current Origin:</strong> {typeof window !== 'undefined' ? window.location.origin : 'Server-side'}</p>
      </div>

      <div className="space-y-4">
        <div>
          <button
            onClick={testBackend}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            1. Test Backend Connection
          </button>
        </div>

        <div>
          <button
            onClick={testCORS}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            2. Test CORS Headers
          </button>
        </div>

        <div>
          <button
            onClick={testFullReport}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            3. Test Full Report API
          </button>
        </div>
      </div>

      {loading && <p className="mt-6 text-yellow-400">Loading...</p>}
      
      {result && (
        <div className="mt-6 bg-gray-900 p-4 rounded-lg">
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}

      <div className="mt-8 bg-red-900 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">🚨 If Tests Fail:</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Check if backend is running: <code className="bg-black px-2 py-1 rounded">docker ps | grep aiml-engine</code></li>
          <li>Check backend logs: <code className="bg-black px-2 py-1 rounded">docker logs praxify-cfo-aiml-engine</code></li>
          <li>Check CORS_ORIGINS: <code className="bg-black px-2 py-1 rounded">docker exec praxify-cfo-aiml-engine printenv CORS_ORIGINS</code></li>
          <li>Open browser console (F12) and check Network tab for actual error details</li>
        </ol>
      </div>
    </div>
  );
}
