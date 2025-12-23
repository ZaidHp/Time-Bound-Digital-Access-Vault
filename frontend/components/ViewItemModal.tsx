"use client";

import { useState, useEffect } from "react";

interface VaultItem {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

interface ViewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: VaultItem | null;
  onItemUpdated: (updatedItem: VaultItem) => void; // Callback to update Dashboard list
}

export default function ViewItemModal({ isOpen, onClose, item, onItemUpdated }: ViewItemModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ title: "", content: "" });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && item) {
      setFormData({ title: item.title, content: item.content });
      setIsEditing(false);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleSave = async () => {
    setLoading(true);
    const token = localStorage.getItem("vault_token");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      const res = await fetch(`${baseUrl}/vault/items/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to update item");

      const updatedItem = await res.json();

      // Update parent state and exit edit mode
      onItemUpdated(updatedItem);
      setIsEditing(false);

    } catch (err) {
      alert("Failed to save changes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-2xl w-full shadow-2xl animate-[fadeIn_0.2s_ease-out] flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 mr-4">
            {isEditing ? (
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-xl font-bold text-white focus:border-emerald-500 outline-none"
                placeholder="Item Title"
              />
            ) : (
              <h2 className="text-2xl font-bold text-white leading-tight">{formData.title}</h2>
            )}
            <p className="text-zinc-500 text-xs mt-1 font-mono">ID: {item.id}</p>
          </div>

          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto min-h-[200px] mb-6 bg-black/50 border border-zinc-800 rounded-lg p-4">
          {isEditing ? (
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full h-64 bg-transparent text-zinc-300 font-mono text-sm outline-none resize-none"
              placeholder="Enter sensitive content..."
            />
          ) : (
            <pre className="text-zinc-300 font-mono text-sm whitespace-pre-wrap break-all font-sans">
              {formData.content}
            </pre>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <>
               <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-lg text-sm font-semibold border border-zinc-700 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                Edit Item
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}