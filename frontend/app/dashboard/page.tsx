"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ShareModal from "@/components/ShareModal";
import ViewItemModal from "@/components/ViewItemModal";
import Image from "next/image";

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
    // Update the item in the local list without refetching
    setItems(prevItems =>
      prevItems.map(item => item.id === updatedItem.id ? updatedItem : item)
    );
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-emerald-500/30">

      {/* --- Navigation Bar --- */}
      <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-white shadow-emerald-500/20 shadow-lg">V</div>
            <span className="font-bold tracking-tight text-lg">Time-Bound Vault</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-xs text-zinc-500 hidden sm:block">
               Authenticated Session
            </div>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto p-6 md:p-12">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Vault</h1>
            <p className="text-zinc-500 max-w-lg">
              Manage your securely stored items. Create temporary access links to share sensitive data securely.
            </p>
          </div>
          <Link
            href="/dashboard/create"
            className="group flex items-center gap-2 bg-white text-black px-5 py-3 rounded-full font-semibold hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
          >
            <span className="text-xl leading-none font-light group-hover:rotate-90 transition-transform duration-300">+</span>
            Secure New Item
          </Link>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-zinc-900/50 rounded-2xl border border-zinc-800" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center border border-red-900/30 rounded-2xl bg-red-900/10">
            <p className="text-red-400">{error}</p>
          </div>
        ) : items.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-600">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Your vault is empty</h3>
            <p className="text-zinc-500 max-w-sm mb-6">
              Content you add will appear here. Encrypted and ready to share.
            </p>
            <Link
              href="/dashboard/create"
              className="text-emerald-500 hover:text-emerald-400 font-medium hover:underline"
            >
              Create your first item &rarr;
            </Link>
          </div>
        ) : (
          // Items Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative bg-zinc-900/50 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900/80 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-900/10 flex flex-col"
              >
                {/* Icon & Title */}
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 group-hover:border-emerald-500/30 transition-colors">
                     <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 border border-zinc-800 px-2 py-1 rounded bg-black">
                    ID: {item.id}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-zinc-100 mb-2 truncate" title={item.title}>
                  {item.title}
                </h3>

                <p className="text-sm text-zinc-500 mb-6 flex-1">
                  Created on {new Date(item.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-800">
                  <button onClick={() => openViewModal(item)}
                    className="text-xs font-medium text-zinc-300 bg-zinc-950 hover:bg-zinc-900 py-2 rounded-lg border border-zinc-800 transition-colors">
                    View
                  </button>
                    <Link
  href={`/dashboard/logs/${item.id}`}
  className="flex items-center justify-center text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg border border-zinc-700 transition-colors"
>
  Audit Logs
</Link>

                    <Link
  href={`/dashboard/shares/${item.id}`}
  className="flex items-center justify-center text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg border border-zinc-700 transition-colors"
>
  Manage Links
</Link>

                  <button
                    onClick={() => openShareModal(item)}
                    className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-950 bg-emerald-500 hover:bg-emerald-400 py-2 rounded-lg transition-colors"
                  >
                    Share
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                  </button>
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