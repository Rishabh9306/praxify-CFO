'use client';

import { useEffect, useState } from 'react';

export default function DiagnosticPage() {
  const [results, setResults] = useState<any>({});

  useEffect(() => {
    async function runDiagnostics() {
      const diag: any = {};

      // Check 1: Environment variable
      diag.envVar = process.env.NEXT_PUBLIC_API_URL || 'UNDEFINED!';

      // Check 2: Backend health
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/`);
        diag.backendHealth = response.ok ? 'WORKING ✅' : `Error: ${response.status}`;
        diag.backendData = await response.json();
      } catch (error) {
        diag.backendHealth = `FAILED ❌: ${error}`;
      }

      // Check 3: CORS test
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/full_report`, {
          method: 'OPTIONS',
        });
        diag.corsTest = response.ok ? 'CORS OK ✅' : `CORS Issue: ${response.status}`;
      } catch (error) {
        diag.corsTest = `CORS FAILED ❌: ${error}`;
      }

      setResults(diag);
    }

    runDiagnostics();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">🔍 API Diagnostic Page</h1>
      
      <div className="space-y-4">
        <div className="bg-white/10 p-4 rounded">
          <h2 className="text-xl font-bold mb-2">Environment Variable</h2>
          <p className="font-mono text-sm">
            NEXT_PUBLIC_API_URL = <span className={results.envVar === 'UNDEFINED!' ? 'text-red-500' : 'text-green-500'}>
              {results.envVar}
            </span>
          </p>
        </div>

        <div className="bg-white/10 p-4 rounded">
          <h2 className="text-xl font-bold mb-2">Backend Health Check</h2>
          <p className="font-mono text-sm">{results.backendHealth}</p>
          {results.backendData && (
            <pre className="mt-2 text-xs bg-black/50 p-2 rounded overflow-auto">
              {JSON.stringify(results.backendData, null, 2)}
            </pre>
          )}
        </div>

        <div className="bg-white/10 p-4 rounded">
          <h2 className="text-xl font-bold mb-2">CORS Test</h2>
          <p className="font-mono text-sm">{results.corsTest}</p>
        </div>

        <div className="bg-white/10 p-4 rounded">
          <h2 className="text-xl font-bold mb-2">Current Location</h2>
          <p className="font-mono text-sm">{typeof window !== 'undefined' ? window.location.href : 'Server Side'}</p>
        </div>

        <div className="bg-yellow-500/20 border border-yellow-500 p-4 rounded">
          <h2 className="text-xl font-bold mb-2">🔧 Fix Instructions</h2>
          <div className="text-sm space-y-2">
            <p><strong>If NEXT_PUBLIC_API_URL is UNDEFINED:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Make sure <code className="bg-black/50 px-1">.env.local</code> exists in <code className="bg-black/50 px-1">praxifi-frontend/</code></li>
              <li>It should contain: <code className="bg-black/50 px-1">NEXT_PUBLIC_API_URL=http://localhost:8000</code></li>
              <li><strong>Restart the dev server</strong> (Ctrl+C and run <code className="bg-black/50 px-1">pnpm run dev</code> again)</li>
              <li>Refresh this page</li>
            </ol>
            
            <p className="mt-4"><strong>If Backend Health Check FAILS:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Check if backend Docker container is running</li>
              <li>Run: <code className="bg-black/50 px-1">docker ps | grep aiml-engine</code></li>
              <li>If not running: <code className="bg-black/50 px-1">docker-compose up -d</code></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
