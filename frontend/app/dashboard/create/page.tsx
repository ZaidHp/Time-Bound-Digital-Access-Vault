"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {Lock} from "lucide-react";

export default function CreateVaultItem() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  // Check Authentication on Mount
  useEffect(() => {
    const token = localStorage.getItem("vault_token");
    if (!token) {
      router.push("/auth");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem("vault_token");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      const res = await fetch(`${baseUrl}/vault/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Pass the JWT
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth"); // Handle session expiry [cite: 89]
          throw new Error("Session expired. Please login again.");
        }
        throw new Error("Failed to secure item.");
      }

      const data = await res.json();
      setSuccess(true);

      // Optional: Redirect to dashboard after short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-emerald-500/30 flex flex-col">

      {/* Navbar (Simple) */}
      <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
              <a href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30">
                    <Lock className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <div className="font-bold tracking-tight text-lg">TimeVault</div>
                    <div className="text-[10px] text-zinc-500 font-medium">SECURE STORAGE</div>
                </div>
              </a>
          </div>
        <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
          &larr; Back to Dashboard
        </Link>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">

        {/* Background Gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-900/20 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-[128px] pointer-events-none" />

        <div className="w-full max-w-2xl relative z-10">

            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-white mb-2">Secure New Item</h1>
                <p className="text-zinc-500">
                    Content stored here is encrypted and can only be accessed via generated links.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-6">

                {/* Status Messages */}
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                    </div>
                )}
                {success && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm flex items-center gap-2">
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Item secured successfully! Redirecting...
                    </div>
                )}

                {/* Title Input */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Title / Reference</label>
                    <input
                        type="text"
                        required
                        placeholder="e.g., API Keys 2024"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-700"
                    />
                </div>

                {/* Content Input (Sensitive Data) */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sensitive Content</label>
                        <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-500">Encrypted</span>
                    </div>
                    <div className="relative group">
                        <textarea
                            required
                            rows={6}
                            placeholder="Enter passwords, notes, or confidential data here..."
                            value={formData.content}
                            onChange={(e) => setFormData({...formData, content: e.target.value})}
                            className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-700 resize-none font-mono text-sm"
                        />
                        {/* Visual Lock Icon Overlay (Decorative) */}
                        <div className="absolute top-3 right-3 text-zinc-700 pointer-events-none group-focus-within:text-emerald-500/50 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="pt-4 flex items-center justify-end gap-4">
                    <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading || success}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                             <span className="animate-pulse">Encrypting...</span>
                        ) : (
                            <>
                                <span>Save to Vault</span>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </>
                        )}
                    </button>
                </div>

            </form>
        </div>
      </main>
    </div>
  );
}