import { useCallback, useEffect, useState } from 'react';
import { Wallet, CheckCircle2, Archive, RefreshCw, X, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Alert, Badge, Button, Input, Spinner } from '../../components/ui';
import { paymentsApi } from '../../lib/payments';
import { getErrorMessage } from '../../lib/api';
import { fnum, fdatetime } from '../../i18n/format';
import type { AdminDebtsResponse, AdminBucketTransaction, AdminDebt } from '../../types/payment';

function DebtRow({ debt, onSettle, onWaive, busy }: { debt: AdminDebt; onSettle: (d: AdminDebt) => void; onWaive: (d: AdminDebt) => void; busy: boolean }) {
  const { t } = useTranslation();
  const overdue = debt.status === 'overdue' || (debt.status === 'outstanding' && new Date(debt.dueDate).getTime() < Date.now());
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold text-slate-900">{debt.customer?.name ?? t('admin.payments.unknownCustomer')}</p>
          <Badge color={debt.status === 'overdue' || overdue ? 'red' : debt.status === 'paid' ? 'green' : debt.status === 'waived' ? 'slate' : 'amber'}>
            {t(`common.${debt.status}`)}
          </Badge>
          {overdue && debt.status !== 'overdue' && <Badge color="red">{t('admin.payments.dueNow')}</Badge>}
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          {debt.customer?.phone ?? ''} · {t('admin.currency', { amount: fnum(debt.amount) })} · {t('admin.payments.dueDate', { date: fdatetime(debt.dueDate) })}
        </p>
        {debt.settledNote && <p className="mt-1 text-xs italic text-slate-400">{debt.settledNote}</p>}
      </div>
      {debt.status === 'outstanding' || debt.status === 'overdue' ? (
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" loading={busy} onClick={() => onSettle(debt)}>
            <CheckCircle2 className="h-4 w-4" /> {t('admin.payments.settle')}
          </Button>
          <Button variant="ghost" disabled={busy} onClick={() => onWaive(debt)}>
            <Archive className="h-4 w-4" /> {t('admin.payments.waive')}
          </Button>
        </div>
      ) : (
        <p className="shrink-0 text-xs text-slate-400">{debt.paidAt ? t('admin.payments.closedOn', { date: fdatetime(debt.paidAt) }) : ''}</p>
      )}
    </div>
  );
}

export default function PaymentsPanel() {
  const { t } = useTranslation();
  const [data, setData] = useState<AdminDebtsResponse | null>(null);
  const [transactions, setTransactions] = useState<AdminBucketTransaction[]>([]);
  const [tab, setTab] = useState<'debts' | 'bucket'>('debts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [adjust, setAdjust] = useState<{ userId: string; amount: string; note: string }>({ userId: '', amount: '', note: '' });
  const [done, setDone] = useState('');

  const load = useCallback(async () => {
    try {
      const [d, t] = await Promise.all([paymentsApi.adminDebts(), paymentsApi.adminBucketTransactions()]);
      setData(d);
      setTransactions(t);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const settle = async (d: AdminDebt) => {
    setBusy(d.id);
    setError('');
    try {
      const note = window.prompt(t('admin.payments.settlePrompt'));
      if (note === null) return;
      await paymentsApi.settleDebt(d.id, note || undefined);
      setDone(t('admin.payments.settledFor', { amount: t('admin.currency', { amount: fnum(d.amount) }), name: d.customer?.name ?? t('admin.payments.unknownCustomer') }));
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const waive = async (d: AdminDebt) => {
    setBusy(d.id);
    setError('');
    try {
      const note = window.prompt(t('admin.payments.waivePrompt'));
      if (note === null) return;
      await paymentsApi.waiveDebt(d.id, note || undefined);
      setDone(t('admin.payments.waivedFor', { amount: t('admin.currency', { amount: fnum(d.amount) }), name: d.customer?.name ?? t('admin.payments.unknownCustomer') }));
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const applyAdjust = async () => {
    const amount = Number(adjust.amount);
    if (!adjust.userId || !Number.isFinite(amount) || amount === 0) {
      setError(t('admin.payments.adjustError'));
      return;
    }
    setBusy('adjust');
    setError('');
    try {
      const { bucketBalance } = await paymentsApi.adjustBucket(adjust.userId.trim(), amount, adjust.note || undefined);
      setDone(t('admin.payments.adjusted', { amount: t('admin.currency', { amount: fnum(bucketBalance) }) }));
      setAdjust({ userId: '', amount: '', note: '' });
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-9 w-9" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <Alert tone="error">{error}</Alert>}
      {done && (
        <div className="flex items-center justify-between gap-3">
          <Alert tone="success">{done}</Alert>
          <Button variant="ghost" onClick={() => setDone('')}>
            <X />
          </Button>
        </div>
      )}

      {data && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-400">{t('admin.payments.openDebts')}</p>
            <p className="mt-1 text-xl font-extrabold text-slate-900">{t('admin.currency', { amount: fnum(data.totals.open) })}</p>
            <p className="text-xs text-slate-400">{t('admin.payments.debtsCount', { count: data.totals.counts.outstanding + data.totals.counts.overdue })}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-400">{t('admin.payments.overdue')}</p>
            <p className="mt-1 text-xl font-extrabold text-red-600">{t('admin.currency', { amount: fnum(data.totals.overdue) })}</p>
            <p className="text-xs text-slate-400">{t('admin.payments.debtsCount', { count: data.totals.counts.overdue })}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-400">{t('admin.payments.customerBuckets')}</p>
            <p className="mt-1 flex items-center gap-1 text-xl font-extrabold text-slate-900">
              <Wallet className="h-4 w-4 text-brand-600" />
              {t('admin.currency', { amount: fnum(data.totals.bucketTotal) })}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-400">{t('admin.payments.outstanding')}</p>
            <p className="mt-1 text-xl font-extrabold text-slate-900">{t('admin.currency', { amount: fnum(data.totals.outstanding) })}</p>
          </div>
        </div>
      )}

      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1.5">
        {(['debts', 'bucket'] as const).map((tKey) => (
          <button
            key={tKey}
            onClick={() => setTab(tKey)}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${tab === tKey ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {tKey === 'debts' ? t('admin.payments.tabDebts') : t('admin.payments.tabBucket')}
          </button>
        ))}
      </div>

      {tab === 'debts' ? (
        <div className="space-y-3">
          {data?.debts.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">{t('admin.payments.noOpenDebts')}</p>
          ) : (
            data?.debts.map((d) => <DebtRow key={d.id} debt={d} onSettle={settle} onWaive={waive} busy={busy === d.id} />)
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="flex items-center gap-2 font-bold text-slate-900">
              <Users className="h-4 w-4 text-brand-600" /> {t('admin.payments.manualAdjustment')}
            </p>
            <p className="mt-1 text-xs text-slate-400">{t('admin.payments.manualAdjustmentHint')}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_160px_1fr_auto]">
              <Input placeholder={t('admin.payments.userIdPlaceholder')} value={adjust.userId} onChange={(e) => setAdjust({ ...adjust, userId: e.target.value })} />
              <Input placeholder={t('admin.payments.amountPlaceholder')} type="number" value={adjust.amount} onChange={(e) => setAdjust({ ...adjust, amount: e.target.value })} />
              <Input placeholder={t('admin.payments.notePlaceholder')} value={adjust.note} onChange={(e) => setAdjust({ ...adjust, note: e.target.value })} />
              <Button loading={busy === 'adjust'} onClick={applyAdjust}>
                {t('admin.payments.apply')}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-900">{t('admin.payments.recentTransactions')}</p>
              <Button variant="ghost" onClick={() => void load()}>
                <RefreshCw className="h-4 w-4" /> {t('admin.payments.refresh')}
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              {transactions.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">{t('admin.payments.noTransactions')}</p>
              ) : (
                transactions.slice(0, 30).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">
                        {t(`admin.payments.tx.${tx.type}`, { defaultValue: tx.type.replace('_', ' ') })} {tx.amount > 0 ? `+${t('admin.currency', { amount: fnum(tx.amount) })}` : t('admin.currency', { amount: fnum(tx.amount) })}
                      </p>
                      <p className="truncate text-xs text-slate-400">{tx.note ?? t('admin.payments.noNote', { userId: tx.userId ?? t('admin.payments.user'), date: fdatetime(tx.createdAt) })}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">{fdatetime(tx.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
