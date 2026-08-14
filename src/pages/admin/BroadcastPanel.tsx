import { useCallback, useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Spinner } from '../../components/ui';
import { adminApi } from '../../lib/admin';
import { getErrorMessage } from '../../lib/api';

interface BroadcastItem {
  title: string;
  body: string;
  sentAt: string;
  count: number;
}

const AUDIENCES = ['all', 'customers', 'drivers'] as const;
type Audience = (typeof AUDIENCES)[number];

export default function BroadcastPanel() {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<Audience>('all');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [history, setHistory] = useState<BroadcastItem[] | null>(null);

  const load = useCallback(() => {
    adminApi
      .broadcastHistory()
      .then(setHistory)
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const send = async () => {
    if (!title.trim() || !body.trim()) {
      setError(t('admin.broadcast.required'));
      return;
    }
    setSending(true);
    setError('');
    setResult('');
    try {
      const { sent } = await adminApi.broadcast({ title: title.trim(), body: body.trim(), audience });
      setResult(t('admin.broadcast.sent', { count: sent }));
      setTitle('');
      setBody('');
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Megaphone className="h-5 w-5 text-brand-600" />
          {t('admin.broadcast.title')}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{t('admin.broadcast.subtitle')}</p>

        <div className="mt-4 grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">{t('admin.broadcast.titleLabel')}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">{t('admin.broadcast.bodyLabel')}</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">{t('admin.broadcast.audienceLabel')}</label>
            <div className="flex flex-wrap gap-2">
              {AUDIENCES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAudience(a)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    audience === a ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t(`admin.broadcast.audience.${a}`)}
                </button>
              ))}
            </div>
          </div>
          {error && <Alert tone="error">{error}</Alert>}
          {result && <Alert tone="success">{result}</Alert>}
          <div>
            <Button onClick={send} disabled={sending}>
              {sending ? '…' : t('admin.broadcast.send')}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">{t('admin.broadcast.recent')}</h3>
        {history === null ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-6 w-6" />
          </div>
        ) : history.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">{t('admin.broadcast.none')}</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {history.map((b, i) => (
              <li key={`${b.sentAt}-${i}`} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{b.title}</p>
                  <p className="truncate text-xs text-slate-500">{b.body}</p>
                </div>
                <div className="shrink-0 text-end text-xs text-slate-400">
                  <p>{new Date(b.sentAt).toLocaleString()}</p>
                  <p className="font-semibold text-slate-500">
                    {b.count} {t('admin.broadcast.recipients')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}