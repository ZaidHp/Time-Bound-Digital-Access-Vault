"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Form State
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const backend_url = process.env.NEXT_PUBLIC_API_URL;

    // 1. Determine Endpoint (Note the /auth prefix)
    const endpoint = isLogin
      ? `${backend_url}/auth/login`
      : `${backend_url}/auth/register`;

    console.log("Connecting to:", endpoint);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed");
      }

      // 2. Success: Store Token & Redirect
      localStorage.setItem("vault_token", data.access_token);
      router.push("/dashboard");

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black font-sans selection:bg-emerald-500/30">

      {/* --- Background Effects --- */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-900/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none" />

      {/* --- Main Card --- */}
      <div className="relative z-10 w-full max-w-md p-1">
        {/* Border Gradient Wrapper */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-zinc-800/30 rounded-2xl blur-sm" />

        <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

          {/* Header Section */}
          <div className="px-8 pt-8 pb-6 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              {isLogin ? "Access Vault" : "Join the Vault"}
            </h1>
            <p className="text-zinc-400 text-sm">
              {isLogin
                ? "Enter your credentials to unlock secure data."
                : "Create a new secure identity."}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mx-8 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">

            {/* Username Input */}
            <div className="group relative">
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="peer w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-transparent focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                placeholder="Username"
              />
              <label className="absolute left-4 top-3 text-zinc-500 text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-zinc-500 peer-placeholder-shown:text-base peer-focus:top-[-10px] peer-focus:left-3 peer-focus:text-emerald-400 peer-focus:text-xs peer-focus:bg-zinc-900/90 peer-focus:px-1 cursor-text pointer-events-none">
                Username
              </label>
            </div>

            {/* Password Input */}
            <div className="group relative">
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="peer w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-transparent focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                placeholder="Password"
              />
              <label className="absolute left-4 top-3 text-zinc-500 text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-zinc-500 peer-placeholder-shown:text-base peer-focus:top-[-10px] peer-focus:left-3 peer-focus:text-emerald-400 peer-focus:text-xs peer-focus:bg-zinc-900/90 peer-focus:px-1 cursor-text pointer-events-none">
                Password
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3.5 group overflow-hidden rounded-lg bg-emerald-600 text-white font-semibold shadow-lg transition-all hover:bg-emerald-500 hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isLogin ? "Unlock Vault" : "Create Account"}
              </span>
              {/* Shine Effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
            </button>
          </form>

          {/* Footer Toggle */}
          <div className="px-8 py-4 bg-white/5 border-t border-white/5 text-center">
            <p className="text-zinc-400 text-sm">
              {isLogin ? "New user?" : "Already authorized?"}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setFormData({ username: "", password: "" });
                }}
                className="ml-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors hover:underline"
              >
                {isLogin ? "Sign up here" : "Login here"}
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}