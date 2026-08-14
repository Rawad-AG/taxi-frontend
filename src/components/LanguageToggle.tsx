import { useTranslation } from 'react-i18next';
import { setLanguage } from '../i18n';
import type { Lang } from '../i18n/dict';

export default function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation();
  const current: Lang = i18n.language === 'ar' ? 'ar' : 'en';

  return (
    <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5" role="group" aria-label="Language">
      {(['en', 'ar'] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
            current === lang ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:text-brand-700'
          }`}
        >
          {lang === 'en' ? 'EN' : compact ? 'ع' : 'عربي'}
        </button>
      ))}
    </div>
  );
}
