"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ShareModal from "@/components/ShareModal";
import ViewItemModal from "@/components/ViewItemModal";
import { Lock, Plus, FileText, Calendar, Eye, Share2, Activity, ExternalLink, LogOut, Shield, Clock, Sparkles } from "lucide-react";

interface VaultItem {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedViewItem, setSelectedViewItem] = useState<VaultItem | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const token = localStorage.getItem("vault_token");
    if (!token) {
      router.push("/auth");
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${baseUrl}/vault/items`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("vault_token");
        router.push("/auth");
        return;
      }

      if (!res.ok) throw new Error("Failed to fetch vault items");

      const data = await res.json();
      setItems(data);
    } catch (err) {
      setError("Could not load your vault.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("vault_token");
    router.push("/auth");
  };

  const openShareModal = (item: VaultItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const openViewModal = (item: VaultItem) => {
    setSelectedViewItem(item);
    setIsViewModalOpen(true);
  };

  const handleItemUpdate = (updatedItem: VaultItem) => {
    setItems(prevItems =>
      prevItems.map(item => item.id === updatedItem.id ? updatedItem : item)
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black text-zinc-100">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Navigation Bar */}
      <nav className="relative border-b border-zinc-800/50 bg-black/40 backdrop-blur-xl px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold tracking-tight text-lg">TimeVault</div>
              <div className="text-[10px] text-zinc-500 font-medium">SECURE STORAGE</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-emerald-300 font-medium">Protected</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto p-6 md:p-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">Your Secure Vault</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent">
              Vault Dashboard
            </h1>
            <p className="text-zinc-400 max-w-lg text-lg">
              Manage encrypted items and create time-bound access links for secure sharing.
            </p>
          </div>
          <Link
            href="/dashboard/create"
            className="group flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-4 rounded-2xl font-semibold transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            New Vault Item
          </Link>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <span className="text-2xl font-bold text-white">{items.length}</span>
            </div>
            <div className="text-sm text-zinc-500">Total Items</div>
          </div>
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <Lock className="w-5 h-5 text-blue-400" />
              <span className="text-2xl font-bold text-white">{items.length}</span>
            </div>
            <div className="text-sm text-zinc-500">Encrypted</div>
          </div>
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <Share2 className="w-5 h-5 text-purple-400" />
              <span className="text-2xl font-bold text-white">0</span>
            </div>
            <div className="text-sm text-zinc-500">Active Shares</div>
          </div>
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-orange-400" />
              <span className="text-2xl font-bold text-white">0</span>
            </div>
            <div className="text-sm text-zinc-500">Total Views</div>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-zinc-900/50 rounded-2xl border border-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center border border-red-500/20 rounded-2xl bg-red-500/5 backdrop-blur-sm">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-red-400 text-lg font-medium">{error}</p>
          </div>
        ) : items.length === 0 ? (
          // Empty State
          <div className="relative overflow-hidden flex flex-col items-center justify-center py-32 px-4 text-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20 backdrop-blur-sm">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAyIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-zinc-800/50 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 mx-auto border border-zinc-700">
                <Lock className="w-10 h-10 text-zinc-600" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Your vault is empty</h3>
              <p className="text-zinc-500 max-w-md mb-8 text-lg">
                Start securing your sensitive data with encrypted, time-bound storage.
              </p>
              <Link
                href="/dashboard/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                Create your first item
              </Link>
            </div>
          </div>
        ) : (
          // Items Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_40px_rgba(16,185,129,0.1)] hover:-translate-y-1 flex flex-col"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-blue-500/0 group-hover:from-emerald-500/5 group-hover:to-blue-500/5 rounded-2xl transition-all duration-300 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-zinc-950/80 backdrop-blur-sm rounded-xl border border-zinc-800 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/5 transition-all">
                      <FileText className="w-6 h-6 text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 border border-zinc-800 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm">
                      #{item.id}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-zinc-100 mb-3 truncate group-hover:text-white transition-colors" title={item.title}>
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6 flex-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-800/50">
                    <button
                      onClick={() => openViewModal(item)}
                      className="flex items-center justify-center gap-2 text-sm font-medium text-zinc-300 bg-zinc-950/50 hover:bg-zinc-900 py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <Link
                      href={`/dashboard/logs/${item.id}`}
                      className="flex items-center justify-center gap-2 text-sm font-medium text-zinc-300 bg-zinc-950/50 hover:bg-zinc-900 py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all"
                    >
                      <Activity className="w-4 h-4" />
                      Logs
                    </Link>
                    <Link
                      href={`/dashboard/shares/${item.id}`}
                      className="flex items-center justify-center gap-2 text-sm font-medium text-zinc-300 bg-zinc-950/50 hover:bg-zinc-900 py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Links
                    </Link>
                    <button
                      onClick={() => openShareModal(item)}
                      className="flex items-center justify-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem}
      />

      <ViewItemModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        item={selectedViewItem}
        onItemUpdated={handleItemUpdate}
      />
    </div>
  );
}