"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// Types matching the Backend Schema
interface ShareLink {
  id: number;
  token: string;
  expires_at: string;
  max_views: number;
  current_views: number;
  remaining_views: number;
  status: "Active" | "Expired" | "Locked" | "Revoked";
  is_password_protected: boolean;
  is_active: boolean;
}

export default function LinkManagementPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id;

  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit Modal State
  const [editingLink, setEditingLink] = useState<ShareLink | null>(null);
  const [editForm, setEditForm] = useState({ expires_at: "", max_views: 0 });
  const [saving, setSaving] = useState(false);

  // 1. Fetch Links on Load
  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    const token = localStorage.getItem("vault_token");
    if (!token) {
      router.push("/auth");
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${baseUrl}/vault/items/${itemId}/shares`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 403) throw new Error("Unauthorized access.");
      if (!res.ok) throw new Error("Failed to fetch links.");

      const data = await res.json();
      setLinks(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Action Handlers
  const handleCopy = (token: string) => {
    const url = `${window.location.origin}/access/${token}`;
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  const handleToggleLock = async (link: ShareLink) => {
    // Optimistic Update
    const newStatus = !link.is_active;
    updateLinkState(link.id, { is_active: newStatus });

    try {
      await updateBackend(link.id, { is_active: newStatus });
      fetchLinks(); // Refresh to get computed status (Revoked vs Locked)
    } catch (err) {
      alert("Failed to update status.");
      fetchLinks(); // Revert
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this link? It will stop working immediately.")) return;

    // Optimistic Remove
    setLinks((prev) => prev.filter((l) => l.id !== id));

    const token = localStorage.getItem("vault_token");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      const res = await fetch(`${baseUrl}/vault/shares/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
    } catch (err) {
      alert("Error deleting link.");
      fetchLinks(); // Revert
    }
  };

  const openEditModal = (link: ShareLink) => {
    setEditingLink(link);
    // Format date for datetime-local input
    const dateStr = new Date(link.expires_at).toISOString().slice(0, 16);
    setEditForm({ expires_at: dateStr, max_views: link.max_views });
  };

  const handleSaveEdit = async () => {
    if (!editingLink) return;
    setSaving(true);

    try {
      await updateBackend(editingLink.id, {
        expires_at: new Date(editForm.expires_at).toISOString(),
        max_views: editForm.max_views,
      });
      setEditingLink(null);
      fetchLinks();
    } catch (err) {
      alert("Failed to update link.");
    } finally {
      setSaving(false);
    }
  };

  // Helper: Backend API Call
  const updateBackend = async (id: number, payload: any) => {
    const token = localStorage.getItem("vault_token");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const res = await fetch(`${baseUrl}/vault/shares/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("API Error");
  };

  // Helper: Local State Update
  const updateLinkState = (id: number, changes: Partial<ShareLink>) => {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...changes } : l)));
  };

  // Helper: Status Badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "Expired": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "Locked": return "bg-red-500/20 text-red-400 border-red-500/30"; // View limit
      case "Revoked": return "bg-zinc-700 text-zinc-400 border-zinc-600"; // Manual lock
      default: return "bg-zinc-800 text-zinc-500";
    }
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
          <span className="font-bold tracking-tight">Manage Links</span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 md:p-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Share Links</h1>
            <p className="text-zinc-500">Manage access tokens for Item #{itemId}.</p>
          </div>
          <button
            onClick={() => router.push("/dashboard")} // Or open create modal
            className="hidden md:flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm border border-zinc-700 transition-colors"
          >
            Create New Link
          </button>
        </div>

        {loading ? (
           <div className="grid gap-4 animate-pulse">
             {[1,2,3].map(i => <div key={i} className="h-24 bg-zinc-900/50 rounded-xl border border-zinc-800"/>)}
           </div>
        ) : error ? (
          <div className="p-8 text-center bg-red-900/10 border border-red-900/20 rounded-xl text-red-400">{error}</div>
        ) : links.length === 0 ? (
           <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
             <p className="text-zinc-500">No share links generated yet.</p>
           </div>
        ) : (
          <div className="grid gap-4">
            {links.map((link) => (
              <div key={link.id} className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:bg-zinc-900/50 hover:border-zinc-700">

                {/* Info Section */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(link.status)}`}>
                      {link.status}
                    </span>
                    {link.is_password_protected && (
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                         <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                         Protected
                      </span>
                    )}
                    <span className="text-xs text-zinc-600 font-mono">ID: {link.id}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <code className="bg-black px-2 py-1 rounded text-emerald-500 text-sm font-mono truncate max-w-[200px]">
                      ...{link.token.slice(-12)}
                    </code>
                    <button onClick={() => handleCopy(link.token)} className="text-zinc-500 hover:text-white transition-colors" title="Copy Link">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-zinc-400">
                    <span>
                      <strong className="text-zinc-300">Expires:</strong> {new Date(link.expires_at).toLocaleString()}
                    </span>
                    <span>
                      <strong className="text-zinc-300">Views:</strong> {link.current_views} / {link.max_views}
                    </span>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 border-zinc-800 pt-3 md:pt-0">
                  <button
                    onClick={() => openEditModal(link)}
                    className="flex-1 md:flex-none text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg transition-colors border border-zinc-700"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleToggleLock(link)}
                    className={`flex-1 md:flex-none text-xs font-medium px-3 py-2 rounded-lg transition-colors border ${
                      link.is_active 
                        ? "bg-amber-900/20 text-amber-500 border-amber-900/30 hover:bg-amber-900/30" 
                        : "bg-emerald-900/20 text-emerald-500 border-emerald-900/30 hover:bg-emerald-900/30"
                    }`}
                  >
                    {link.is_active ? "Lock" : "Unlock"}
                  </button>

                  <button
                    onClick={() => handleDelete(link.id)}
                    className="flex-1 md:flex-none text-xs font-medium bg-red-900/10 hover:bg-red-900/20 text-red-500 px-3 py-2 rounded-lg transition-colors border border-red-900/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {editingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditingLink(null)} />
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-[fadeIn_0.1s_ease-out]">
            <h3 className="text-lg font-bold text-white mb-4">Edit Link Configuration</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Extend Expiration</label>
                <input
                  type="datetime-local"
                  value={editForm.expires_at}
                  onChange={e => setEditForm({...editForm, expires_at: e.target.value})}
                  className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Update Max Views</label>
                <input
                  type="number"
                  min={editingLink.current_views} // Cannot be less than what's already viewed
                  value={editForm.max_views}
                  onChange={e => setEditForm({...editForm, max_views: Number(e.target.value)})}
                  className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Current views: {editingLink.current_views}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingLink(null)}
                className="flex-1 py-2 text-zinc-400 hover:text-white text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg transition-colors text-sm"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}