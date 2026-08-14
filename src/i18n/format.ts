import i18n from './index.js';

const locale = (): 'ar-SY' | 'en-GB' => (i18n.language === 'ar' ? 'ar-SY' : 'en-GB');

export const fnum = (n: number) => n.toLocaleString(locale());
export const fdate = (s: string | Date) => new Date(s).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' });
export const fdatetime = (s: string | Date) =>
  new Date(s).toLocaleString(locale(), { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
export const ftime = (s: string | Date) => new Date(s).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
export const fdateShort = (s: string | Date) => new Date(s).toLocaleDateString(locale());
