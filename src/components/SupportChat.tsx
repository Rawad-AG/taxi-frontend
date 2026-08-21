import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2, MessageCircle, SendHorizonal, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { sendSupportMessage, type ChatTurn } from '../lib/gemini';

export default function SupportChat() {
  const { t } = useTranslation();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, loading, open]);

  if (location.pathname.startsWith('/admin')) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const history: ChatTurn[] = [...turns, { role: 'user', text }];
    setTurns(history);
    setLoading(true);
    try {
      const reply = await sendSupportMessage(history.slice(-12));
      setTurns([...history, { role: 'model', text: reply }]);
    } catch {
      /* keep the unanswered user message — the panel shows the offline hint */
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title={t('supportChat.title')}
          aria-label={t('supportChat.title')}
          className="fixed bottom-5 end-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-900/30 transition hover:scale-105 hover:bg-brand-700"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 end-5 z-50 flex h-[480px] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
          <div className="flex items-center gap-3 bg-brand-600 px-4 py-3 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <MessageCircle className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight">{t('supportChat.title')}</p>
              <p className="text-[11px] text-white/80">{t('supportChat.subtitle')}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label={t('common.close')}
              className="rounded-lg p-1.5 transition hover:bg-white/15"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-3">
            <div className="max-w-[85%] rounded-2xl rounded-ss-sm bg-white px-3 py-2 text-sm text-slate-700 shadow-sm border border-slate-100">
              {t('supportChat.greeting')}
            </div>
            {turns.map((m, i) =>
              m.role === 'user' ? (
                <div key={i} className="ms-auto max-w-[85%] rounded-2xl rounded-se-sm bg-brand-600 px-3 py-2 text-sm text-white">
                  {m.text}
                </div>
              ) : (
                <div key={i} className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-ss-sm border border-slate-100 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                  {m.text}
                </div>
              ),
            )}
            {loading && (
              <div className="flex w-16 justify-center rounded-2xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
              </div>
            )}
            {!loading && turns.length > 0 && turns[turns.length - 1].role === 'user' && (
              <p className="text-center text-xs text-red-500">{t('supportChat.error')}</p>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-200 bg-white p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder={t('supportChat.placeholder')}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <button
              onClick={() => void send()}
              disabled={loading || !input.trim()}
              aria-label={t('supportChat.send')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
            >
              <SendHorizonal className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}