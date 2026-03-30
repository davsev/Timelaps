'use client';

import { useEffect, useState } from 'react';

interface Stats {
  totalClips: number;
  doneClips: number;
  credits: { total: number; used: number; remaining: number } | null;
}

export default function HeaderStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) setStats(await res.json());
    } catch {
      // silently ignore
    }
  }

  if (!stats) return null;

  const creditPct =
    stats.credits && stats.credits.total > 0
      ? (stats.credits.remaining / stats.credits.total) * 100
      : null;

  const creditColor =
    creditPct === null ? 'text-gray-500'
    : creditPct > 40 ? 'text-emerald-400'
    : creditPct > 15 ? 'text-amber-400'
    : 'text-red-400';

  return (
    <div className="hidden sm:flex items-center gap-3 text-xs">
      {/* Videos generated */}
      <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-1.5">
        <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 10l4.553-2.069A1 1 0 0121 8.876V15a1 1 0 01-1.553.832L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
        </svg>
        <span className="text-gray-400">
          <span className="text-white font-semibold">{stats.doneClips}</span>
          <span className="text-gray-600"> / {stats.totalClips} clips</span>
        </span>
      </div>

      {/* Kling credits */}
      {stats.credits !== null ? (
        <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-1.5">
          <svg className={`w-3.5 h-3.5 ${creditColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className={`font-semibold ${creditColor}`}>
            {stats.credits.remaining.toLocaleString()}
          </span>
          <span className="text-gray-600">credits left</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-1.5">
          <svg className="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-gray-600">credits N/A</span>
        </div>
      )}
    </div>
  );
}
