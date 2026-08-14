import { Logo } from './Layout';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="rounded-2xl bg-white/10 p-2 backdrop-blur">
            <Logo to="/" />
          </div>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-2xl shadow-brand-950/40">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 mb-6 text-sm text-slate-500">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
