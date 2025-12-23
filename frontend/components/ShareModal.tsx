"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

interface VaultItem {
  id: number;
  title: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: VaultItem | null;
}

export default function ShareModal({ isOpen, onClose, item }: ShareModalProps) {
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");

  const [shareConfig, setShareConfig] = useState({
    expires_at: "",
    max_views: 5,
    password: "",
  });

  useEffect(() => {
    if (isOpen) {
      setGeneratedLink("");
      const tomorrow = new Date();
      tomorrow.setHours(tomorrow.getHours() + 24);
      setShareConfig({
        expires_at: tomorrow.toISOString().slice(0, 16),
        max_views: 5,
        password: "",
      });
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("vault_token");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // 2. Use a "Promise Toast" for better UX (Loading -> Success/Error)
    const sharePromise = fetch(`${baseUrl}/vault/share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        vault_item_id: item.id,
        expires_at: new Date(shareConfig.expires_at).toISOString(),
        max_views: shareConfig.max_views,
        password: shareConfig.password || null,
      }),
    }).then(async (res) => {
      if (!res.ok) throw new Error("Failed to generate link");
      const data = await res.json();
      setGeneratedLink(data.share_link);
      return data;
    });

    // This handles Loading, Success, and Error states automatically
    await toast.promise(sharePromise, {
      loading: "Creating secure link...",
      success: "Link generated successfully!",
      error: "Error generating link. Please try again.",
    }).catch(() => {
      // Catch block purely to stop unhandled promise rejection warnings
      // The toast.promise handles the UI feedback
    });

    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    // 3. Simple Success Toast
    toast.success("Copied to clipboard!");
  };

  return (
    <>
      {/* 4. The Toaster Component (Rendered here, or ideally in your root layout) */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#18181b", // zinc-900
            color: "#fff",
            border: "1px solid #3f3f46", // zinc-700
          },
          success: {
            iconTheme: {
              primary: "#10b981", // emerald-500
              secondary: "#fff",
            },
          },
        }}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-[fadeIn_0.2s_ease-out]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {!generatedLink ? (
            <>
              <h2 className="text-xl font-bold text-white mb-1">Share Item</h2>
              <p className="text-zinc-400 text-sm mb-6">
                Configure access rules for <span className="text-emerald-400 font-medium">"{item.title}"</span>.
              </p>

              <form onSubmit={handleShareSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Expires At</label>
                  <input
                    type="datetime-local"
                    required
                    value={shareConfig.expires_at}
                    onChange={(e) => setShareConfig({ ...shareConfig, expires_at: e.target.value })}
                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Max Views</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={shareConfig.max_views}
                    onChange={(e) => setShareConfig({ ...shareConfig, max_views: Number(e.target.value) })}
                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Password (Optional)</label>
                  <input
                    type="password"
                    placeholder="Leave empty for public"
                    value={shareConfig.password}
                    onChange={(e) => setShareConfig({ ...shareConfig, password: e.target.value })}
                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Generating..." : "Generate Secure Link"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500 mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Link Ready!</h3>
              <p className="text-zinc-400 text-sm mb-6">
                This link will expire on {new Date(shareConfig.expires_at).toLocaleDateString()}.
              </p>

              <div className="bg-black border border-emerald-500/30 rounded-lg p-3 flex items-center gap-3 mb-6">
                <code className="text-emerald-400 text-sm flex-1 truncate text-left">{generatedLink}</code>
                <button onClick={copyToClipboard} className="text-zinc-400 hover:text-white transition-colors" title="Copy">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg font-medium"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}