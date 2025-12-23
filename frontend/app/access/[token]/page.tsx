"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

// Define the shape of data we expect from the backend
interface ShareMetaData {
  title: string;
  is_password_protected: boolean;
  expires_at: string;
  is_locked: boolean;
}

interface VaultContent {
  content: string;
  message: string;
}

export default function AccessPage() {
  const params = useParams();
  const token = params.token as string;

  // --- UI STATES ---
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState("");

  // Data States
  const [meta, setMeta] = useState<ShareMetaData | null>(null);
  const [content, setContent] = useState<VaultContent | null>(null);
  const [password, setPassword] = useState("");

  // 1. Fetch Metadata on Load (Safe Info Only)
  useEffect(() => {
    if (!token) return;

    const fetchMetadata = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${baseUrl}/vault/shared/${token}`);

        if (res.status === 404) {
          throw new Error("Link not found");
        }

        const data = await res.json();
        setMeta(data);

        // If it's not password protected and not locked, try to unlock immediately (Optional UX)
        // For strictly "on-click" view, we can skip this.

      } catch (err) {
        setMeta(null); // Triggers 404 view
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [token]);

  // 2. Handle Unlock Attempt
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlocking(true);
    setError("");

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${baseUrl}/vault/shared/${token}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password || null }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 410) {
            // Update local state if backend says it's now locked/expired
            setMeta(prev => prev ? { ...prev, is_locked: true } : null);
            throw new Error(data.detail || "Link is no longer active.");
        }
        throw new Error(data.detail || "Access denied.");
      }

      // Success: Reveal Content
      setContent(data);

    } catch (err: any) {
      setError(err.message);
      // If unauthorized (bad password), clear input
      if (err.message.includes("password")) {
         setPassword("");
      }
    } finally {
      setUnlocking(false);
    }
  };

  // --- RENDER HELPERS ---

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-zinc-800 rounded-full"></div>
          <div className="h-4 w-32 bg-zinc-800 rounded"></div>
        </div>
      </div>
    );
  }

  // State: Link Not Found or Invalid
  if (!meta) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-2xl text-center">
          <div className="w-16 h-16 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Link Not Found</h1>
          <p className="text-zinc-500">
            This secure link does not exist or has been permanently deleted.
          </p>
        </div>
      </div>
    );
  }

  // State: Link Expired or Locked
  if (meta.is_locked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900/50 border border-red-900/30 p-8 rounded-2xl text-center shadow-2xl">
          <div className="w-16 h-16 bg-zinc-800 text-zinc-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h1 className="text-xl font-bold text-zinc-300 mb-2">Access Locked</h1>
          <p className="text-zinc-500 mb-6">
            This secure link has expired or reached its maximum view limit. The content is no longer accessible.
          </p>
          <div className="text-xs text-zinc-600 uppercase tracking-widest font-semibold">
            Status: Inactive
          </div>
        </div>
      </div>
    );
  }

  // State: Content Revealed
  if (content) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
        {/* Success Background */}
        <div className="absolute inset-0 bg-emerald-900/10 pointer-events-none" />

        <div className="max-w-2xl w-full bg-zinc-900 border border-emerald-500/30 p-8 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.1)] relative z-10">
          <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{meta.title}</h1>
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>
                Secure Access Granted
              </span>
            </div>
          </div>

          <div className="bg-black/50 rounded-lg border border-zinc-800 p-6 relative group">
            <pre className="text-zinc-300 font-mono text-sm whitespace-pre-wrap break-all">
              {content.content}
            </pre>
            <button
              onClick={() => navigator.clipboard.writeText(content.content)}
              className="absolute top-4 right-4 text-zinc-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
              title="Copy content"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </button>
          </div>

          <div className="mt-6 text-center">
             <p className="text-zinc-500 text-xs">
               Security Notice: This link may expire or lock after this view.
             </p>
          </div>
        </div>
      </div>
    );
  }

  // State: Access Prompt (Password or Confirm)
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl">

        <div className="text-center mb-8">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Restricted Access</h1>
            <p className="text-zinc-400 text-sm">
                You are trying to access <span className="text-white font-medium">"{meta.title}"</span>.
            </p>
            {/* Expiration warning */}
             <p className="text-zinc-600 text-xs mt-2">
                Expires: {new Date(meta.expires_at).toLocaleString()}
             </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">

            {meta.is_password_protected ? (
                <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2">Required Password</label>
                    <input
                        type="password"
                        required
                        autoFocus
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter access password"
                        className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition-all placeholder:text-zinc-700"
                    />
                </div>
            ) : (
                <div className="p-3 bg-zinc-800/50 rounded-lg text-sm text-zinc-400 text-center border border-zinc-800">
                    This item is public but tracked. Click below to view.
                </div>
            )}

            {error && (
                <div className="text-red-400 text-sm text-center bg-red-900/10 border border-red-900/30 p-2 rounded">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={unlocking}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-lg transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {unlocking ? "Verifying..." : "Unlock Content"}
            </button>
        </form>

      </div>
    </div>
  );
}