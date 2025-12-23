"use client";

import { useState, useEffect } from "react";
import { Lock, Clock, Shield, Eye, Key, CheckCircle, ArrowRight, User, LogOut } from 'lucide-react';

export default function VaultLanding() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Check login status on mount
  useEffect(() => {
    // Check for auth token or session
    const token = localStorage.getItem("vault_token");
    setIsLoggedIn(!!token);
  }, []);

  const handleAuthClick = () => {
    if (isLoggedIn) {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/auth';
    }
  };

  const handleLogout = () => {
     localStorage.removeItem("vault_token");
    setIsLoggedIn(false);
    setShowDropdown(false);
    window.location.href = '/';
  };

  const features = [
    {
      icon: Lock,
      title: "Secure Storage",
      description: "Store sensitive data with military-grade encryption and access controls"
    },
    {
      icon: Clock,
      title: "Time-Bound Access",
      description: "Set precise expiration times for all shared content"
    },
    {
      icon: Eye,
      title: "View Limits",
      description: "Control exactly how many times content can be accessed"
    },
    {
      icon: Key,
      title: "Password Protection",
      description: "Add an extra layer of security with optional passwords"
    },
    {
      icon: Shield,
      title: "Audit Logs",
      description: "Complete visibility into every access attempt"
    },
    {
      icon: CheckCircle,
      title: "Auto-Expiry",
      description: "Content automatically becomes inaccessible when rules are violated"
    }
  ];

  const useCases = [
    "Share API keys with team members",
    "Distribute one-time passwords",
    "Send sensitive business documents",
    "Share confidential meeting notes"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-emerald-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          {/* Navigation */}
          <nav className="flex items-center justify-between mb-20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30">
                <Lock className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-xl font-bold">TimeVault</span>
            </div>

            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-10 h-10 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-full flex items-center justify-center border border-emerald-500/30 transition-all"
                >
                  <User className="w-5 h-5 text-emerald-400" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50">
                    <button
                      onClick={() => window.location.href = '/dashboard'}
                      className="w-full px-4 py-3 text-left hover:bg-zinc-800 transition-colors flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span>Dashboard</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left hover:bg-zinc-800 transition-colors flex items-center gap-2 text-red-400"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => window.location.href = '/auth'}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full border border-white/10 transition-all"
              >
                Sign In
              </button>
            )}
          </nav>

          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-8">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-300">End-to-end secured sharing</span>
            </div>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-white via-emerald-100 to-white bg-clip-text text-transparent">
                Share Secrets
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400 bg-clip-text text-transparent">
                That Self-Destruct
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Create time-bound access links for sensitive data. Once viewed or expired, your secrets vanish forever.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleAuthClick}
                className="group px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-full font-semibold text-lg transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] flex items-center gap-2"
              >
                {isLoggedIn ? 'Go to Dashboard' : 'Start Securing Now'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-full font-semibold text-lg transition-all">
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-20 max-w-2xl mx-auto">
              <div>
                <div className="text-3xl font-bold text-emerald-400">256-bit</div>
                <div className="text-sm text-zinc-500 mt-1">Encryption</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-400">100%</div>
                <div className="text-sm text-zinc-500 mt-1">Audit Trail</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-400">0ms</div>
                <div className="text-sm text-zinc-500 mt-1">Access After Expiry</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Built for <span className="text-emerald-400">Security</span>
          </h2>
          <p className="text-xl text-zinc-400">Enterprise-grade features in a simple interface</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl hover:border-emerald-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]"
            >
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                <feature.icon className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-zinc-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Perfect for
              <br />
              <span className="text-emerald-400">Sensitive Sharing</span>
            </h2>
            <p className="text-xl text-zinc-400 mb-8">
              Whether you're a developer, security professional, or business owner, TimeVault ensures your sensitive data stays under control.
            </p>
            <ul className="space-y-4">
              {useCases.map((useCase, index) => (
                <li key={index} className="flex items-center gap-3 text-lg">
                  <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-zinc-300">{useCase}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>

              <div className="space-y-4">
                <div className="bg-black/50 rounded-lg p-4 border border-zinc-700">
                  <div className="text-sm text-zinc-500 mb-2">Share Link Configuration</div>
                  <div className="text-emerald-400 font-mono text-sm">expires: 24 hours</div>
                  <div className="text-emerald-400 font-mono text-sm">max_views: 1</div>
                  <div className="text-emerald-400 font-mono text-sm">password: required</div>
                </div>

                <div className="bg-black/50 rounded-lg p-4 border border-zinc-700">
                  <div className="text-sm text-zinc-500 mb-2">Generated Link</div>
                  <div className="text-zinc-300 font-mono text-sm break-all">
                    vault.app/s/xK9mP2nQ7w...
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Clock className="w-4 h-4" />
                  <span>Link expires in 23h 59m</span>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -z-10 -top-4 -right-4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -z-10 -bottom-4 -left-4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="relative bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-3xl p-12 md:p-20 text-center overflow-hidden border border-emerald-500/20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50"></div>

          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to secure your secrets?
            </h2>
            <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">
              Join thousands of security-conscious users who trust TimeVault with their sensitive data.
            </p>
            <button
              onClick={handleAuthClick}
              className="px-10 py-5 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-all text-lg shadow-[0_20px_60px_rgba(255,255,255,0.2)]"
            >
              {isLoggedIn ? 'Go to Dashboard' : 'Create Your Vault Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              <span className="font-semibold">TimeVault</span>
            </div>
            <div className="text-sm text-zinc-500">
              © 2025 TimeVault.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}