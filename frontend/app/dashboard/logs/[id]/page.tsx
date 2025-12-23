"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface AccessLog {
  id: number;
  share_link_token: string;
  access_time: string;
  outcome: string;
  ip_address: string;
}

export default function AccessLogsPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id;

  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      const token = localStorage.getItem("vault_token");
      if (!token) {
        router.push("/auth");
        return;
      }

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${baseUrl}/vault/items/${itemId}/logs`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 403) throw new Error("Unauthorized access to these logs.");
        if (!res.ok) throw new Error("Failed to fetch access logs.");

        const data = await res.json();
        setLogs(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [itemId, router]);

  // Helper to format outcome strings into badges
  const getOutcomeStyle = (outcome: string) => {
    if (outcome === "allowed") {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
    if (outcome.includes("denied")) {
      return "bg-red-500/10 text-red-400 border-red-500/20";
    }
    return "bg-zinc-800 text-zinc-400 border-zinc-700";
  };

  const formatOutcomeText = (outcome: string) => {
    // Converts "denied_bad_password" -> "Denied: Bad Password"
    return outcome
      .replace(/_/g, " ")
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace("Denied ", "Denied: ");
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-emerald-500/30">

      {/* Navbar */}
      <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
            &larr; Back to Dashboard
          </Link>
          <div className="h-4 w-px bg-zinc-800"></div>
          <span className="font-bold tracking-tight">Audit Logs</span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6 md:p-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Access History</h1>
          <p className="text-zinc-500">
            Immutable audit trail for Vault Item #{itemId}.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-zinc-900/50 rounded-xl border border-zinc-800" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center border border-red-900/30 rounded-2xl bg-red-900/10 text-red-400">
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-lg font-medium text-white">No activity yet</h3>
            <p className="text-zinc-500 text-sm">This item has not been accessed via any share links.</p>
          </div>
        ) : (
          // LOGS TABLE
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 shadow-2xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900/80 text-zinc-400 uppercase tracking-wider text-xs border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Time (UTC)</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">IP Address</th>
                  <th className="px-6 py-4 font-semibold">Link Token</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-zinc-300 font-mono">
                      {new Date(log.access_time).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getOutcomeStyle(log.outcome)}`}>
                        {formatOutcomeText(log.outcome)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 font-mono text-xs">
                      {log.ip_address}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 font-mono text-xs truncate max-w-[100px]" title={log.share_link_token}>
                      {log.share_link_token.substring(0, 8)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}