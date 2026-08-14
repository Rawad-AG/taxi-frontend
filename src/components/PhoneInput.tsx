import { forwardRef, useCallback } from 'react';

const COUNTRY = '+963';
const PREFIX = '9';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput(
  { value, onChange, error, id, name, disabled },
  ref,
) {
  const digits = value.replace(/^\+963/, '').replace(/\D/g, '');

  const handleChange = useCallback(
    (raw: string) => {
      const clean = raw.replace(/\D/g, '').replace(/^9/, '').slice(0, 8);
      onChange(`${COUNTRY}${PREFIX}${clean}`);
    },
    [onChange],
  );

  const display = digits ? digits : PREFIX;
  const groups = display.slice(1).match(/.{1,3}/g) ?? [];

  return (
    <div>
      <div
        className={`flex items-stretch overflow-hidden rounded-xl border bg-white transition focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30 ${
          error ? 'border-red-400' : 'border-slate-300'
        }`}
      >
        <span className="flex items-center gap-1 border-e border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-700">
          <span className="inline-block h-2 w-3.5 rounded-sm bg-gradient-to-br from-red-500 to-red-700" />
          {COUNTRY} <span className="text-slate-400">|</span>
        </span>
        <span className="flex items-center px-1 text-sm font-medium text-slate-500">{PREFIX}</span>
        <input
          ref={ref}
          id={id}
          name={name}
          inputMode="numeric"
          autoComplete="tel"
          disabled={disabled}
          placeholder="XX XXX XXX"
          className="w-full min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm tracking-[0.15em] text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60"
          value={groups.join(' ')}
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
});
