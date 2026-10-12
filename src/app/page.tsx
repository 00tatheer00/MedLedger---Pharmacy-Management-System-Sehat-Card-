export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
      <main className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div>
            <span className="inline-block rounded-full bg-emerald-950/80 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-800/50">
              Phase 1 Complete
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              MedLedger
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Pharmacy Management System — DHQ Hospital Kohat
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono text-slate-400">v0.1.0-alpha</span>
            <p className="text-xs text-slate-400">Tech4Edges</p>
          </div>
        </div>

        <div className="mt-6 space-y-4 text-sm text-slate-300">
          <p>
            The technical foundation, modular domain architecture, database schemas, and engineering
            standards for MedLedger have been established.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
              <span className="text-xs font-semibold text-slate-400">Architecture</span>
              <p className="mt-1 text-xs text-slate-300">Modular Next.js App Router & Supabase</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
              <span className="text-xs font-semibold text-slate-400">Code Quality</span>
              <p className="mt-1 text-xs text-slate-300">TypeScript, ESLint, Prettier, Husky</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
              <span className="text-xs font-semibold text-slate-400">Testing Suite</span>
              <p className="mt-1 text-xs text-slate-300">Vitest (Unit) + Playwright (E2E)</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
              <span className="text-xs font-semibold text-slate-400">Compliance</span>
              <p className="mt-1 text-xs text-slate-300">Audit Logging & Role-Based Access</p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-6 flex items-center justify-between text-xs text-slate-400">
          <span>Ready for Phase 2: Design System & Core Primitives</span>
          <span className="font-mono text-slate-400">Kohat, KPK</span>
        </div>
      </main>
    </div>
  );
}
