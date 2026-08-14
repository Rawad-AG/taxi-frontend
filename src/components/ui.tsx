import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

const inputBase =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 disabled:opacity-60';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className = '', ...props },
  ref,
) {
  return <input ref={ref} className={`${inputBase} ${className}`} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className = '', children, ...props },
  ref,
) {
  return (
    <select ref={ref} className={`${inputBase} ${className}`} {...props}>
      {children}
    </select>
  );
});

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export function Field({ label, error, hint, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({ variant = 'primary', loading, fullWidth, className = '', children, disabled, ...props }: ButtonProps) {
  const styles: Record<string, string> = {
    primary:
      'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500/40 shadow-sm shadow-brand-600/20',
    secondary:
      'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 focus-visible:ring-brand-500/30',
    ghost: 'text-brand-700 hover:bg-brand-50',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500/40',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-60 ${styles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Spinner({ className = 'h-8 w-8' }: { className?: string }) {
  return <Loader2 className={`animate-spin text-brand-600 ${className}`} />;
}

export function Badge({ color = 'slate', children }: { color?: 'slate' | 'green' | 'amber' | 'red' | 'blue'; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}

export function Alert({ tone = 'info', children }: { tone?: 'info' | 'success' | 'error'; children: React.ReactNode }) {
  const tones = {
    info: 'border-brand-200 bg-brand-50 text-brand-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    error: 'border-red-200 bg-red-50 text-red-800',
  };
  return <div className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>;
}
