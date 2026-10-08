import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, AlertCircle, RefreshCw, Server, Database, Sparkles, Languages } from 'lucide-react';
import { HealthResponse } from '../types/api';

export const HealthStatus: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    const start = performance.now();
    try {
      // Connects to /api/health directly via Vite proxy or absolute url
      const res = await fetch('/api/health');
      const end = performance.now();
      setLatencyMs(Math.round(end - start));

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data: HealthResponse = await res.json();
      setHealth(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reach backend';
      setError(errorMessage);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 transition-all hover:shadow-md">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-lg">System Communication Status</h3>
            <p className="text-xs text-slate-500">Live communication check between React Frontend and Express Backend</p>
          </div>
        </div>

        <button
          onClick={checkHealth}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {loading && !health && (
        <div className="py-8 flex flex-col items-center justify-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mb-2" />
          <span className="text-sm">Connecting to backend /api/health...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Backend Unreachable:</span> {error}
            <p className="text-xs text-red-600 mt-1">
              Ensure the backend server is running on port 5000 (<code className="bg-red-100 px-1 py-0.5 rounded">npm run dev:backend</code>).
            </p>
          </div>
        </div>
      )}

      {health && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-emerald-50/70 border border-emerald-200/60 rounded-xl">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
                  <span>Backend Connected</span>
                  <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-800 rounded-full font-mono">
                    {health.status}
                  </span>
                </div>
                <div className="text-xs text-emerald-700">
                  {health.service} v{health.version} ({health.environment})
                </div>
              </div>
            </div>
            {latencyMs !== null && (
              <div className="text-xs font-mono font-medium text-emerald-800 bg-white/80 px-2.5 py-1 rounded-md border border-emerald-200">
                Latency: {latencyMs}ms
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-2.5">
              <Server className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-slate-500 font-medium">REST API</div>
                <div className="font-semibold text-slate-800 capitalize">{health.components.server}</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-2.5">
              <Database className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-slate-500 font-medium">Database</div>
                <div className="font-semibold text-slate-800 capitalize">{health.components.database.replace('_', ' ')}</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <div>
                <div className="text-slate-500 font-medium">Gemini AI</div>
                <div className="font-semibold text-slate-800 capitalize">{health.components.aiEngine.replace('_', ' ')}</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-2.5">
              <Languages className="w-4 h-4 text-purple-600" />
              <div>
                <div className="text-slate-500 font-medium">BHASHINI</div>
                <div className="font-semibold text-slate-800 capitalize">{health.components.bhashini.replace('_', ' ')}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
