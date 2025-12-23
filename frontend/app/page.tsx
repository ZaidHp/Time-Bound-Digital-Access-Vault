import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
      <div className="text-center space-y-6 max-w-2xl px-4">
        {/* Logo / Icon */}
        <div className="mx-auto w-20 h-20 bg-emerald-900/30 rounded-full flex items-center justify-center border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h1 className="text-5xl font-bold tracking-tighter bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
          Time-Bound Vault
        </h1>

        <p className="text-zinc-400 text-lg">
          Secure, ephemeral digital storage. Access is granted only within specific time windows.
        </p>

        <div className="pt-8">
          <Link
            href="/auth"
            className="px-8 py-3 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-colors"
          >
            Enter Vault
          </Link>
        </div>
      </div>
    </div>
  );
}