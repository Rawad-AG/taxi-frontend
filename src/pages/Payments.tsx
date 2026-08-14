import { useCallback, useEffect, useState } from 'react';
import { Wallet, Clock3, RefreshCw, CheckCircle2, Banknote, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Alert, Badge, Button, Input, Spinner } from '../components/ui';
import { paymentsApi } from '../lib/payments';
import { getErrorMessage } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { fnum, fdateShort } from '../i18n/format';
import type { PayLaterDebt, PaymentStatus } from '../types/payment';

const TX_KEY: Record<string, string> = {
  deposit: 'deposit',
  ride_payment: 'ridePayment',
  debt_payment: 'debtPayment',
  adjustment: 'adjustment',
};

export default function Payments() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const fmt = (n: number) => t('pay.amountSyp', { amount: fnum(n) });
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [debts, setDebts] = useState<PayLaterDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [deposit, setDeposit] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, d] = await Promise.all([paymentsApi.status(), paymentsApi.debts()]);
      setStatus(s);
      setDebts(d);
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

  const depositNow = async (amount?: number) => {
    const value = amount ?? Number(deposit);
    if (!Number.isFinite(value) || value <= 0) {
      setError(t('pay.amountAboveZero'));
      return;
    }
    setDepositing(true);
    setError('');
    try {
      const res = await paymentsApi.deposit(Math.round(value));
      setMessage(t('pay.gatewaySuccess', { balance: fmt(res.bucketBalance) }));
      setDeposit('');
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDepositing(false);
    }
  };

  const payDebt = async (debtId: string) => {
    setPayingId(debtId);
    setError('');
    try {
      const res = await paymentsApi.payDebt(debtId);
      setMessage(t('pay.debtPaid', { balance: fmt(res.bucketBalance) }));
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPayingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-9 w-9" />
      </div>
    );
  }

  if (!status) return null;

  const openDebts = debts.filter((d) => d.status === 'outstanding' || d.status === 'overdue');

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{t('nav.payments')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('pay.subtitle')}</p>
        </div>
        <Button variant="secondary" onClick={() => void load()}>
          <RefreshCw className="h-4 w-4" /> {t('common.refresh')}
        </Button>
      </div>

      {error && (
        <div className="mt-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      {message && (
        <div className="mt-4">
          <Alert tone="success">{message}</Alert>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600">
              <Wallet className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-400">{t('pay.bucketBalance')}</p>
              <p className="text-2xl font-extrabold text-slate-900">{fmt(status.bucketBalance)}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">{t('pay.bucketDesc')}</p>
          <div className="mt-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{t('pay.topUpSimulated')}</p>
            <div className="flex gap-2">
              <Input type="number" min="1000" step="1000" placeholder={t('common.amount')} value={deposit} onChange={(e) => setDeposit(e.target.value)} />
              <Button loading={depositing} onClick={() => void depositNow()}>
                <Banknote className="h-4 w-4" /> {t('pay.topUp')}
              </Button>
            </div>
            <div className="mt-3 flex gap-2">
              {[25000, 50000, 100000, 200000].map((v) => (
                <button
                  key={v}
                  onClick={() => void depositNow(v)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
                >
                  {v >= 1000 ? `${v / 1000}k` : v}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{t('pay.recentTransactions')}</p>
            <div className="space-y-1.5">
              {status.transactions.length === 0 ? (
                <p className="text-sm text-slate-400">{t('pay.noTransactions')}</p>
              ) : (
                status.transactions.slice(0, 6).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span className="capitalize text-slate-600">{t(`pay.tx.${TX_KEY[tx.type] ?? tx.type}`)}</span>
                    <span className={tx.amount > 0 ? 'font-bold text-emerald-600' : 'font-bold text-slate-800'}>
                      {tx.amount > 0 ? `+${fmt(tx.amount)}` : fmt(tx.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600">
                <Clock3 className="h-5 w-5 text-white" />
              </span>
              <div>
                <p className="text-xs font-medium text-slate-400">{t('pay.payLaterAccount')}</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-extrabold text-slate-900">{fmt(status.payLater.outstandingBalance + status.payLater.overdueBalance)}</p>
                  <Badge color={status.payLater.eligible ? 'green' : 'amber'}>{status.payLater.eligible ? t('pay.eligible') : t('pay.locked')}</Badge>
                </div>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              <li className="flex justify-between">
                <span>{t('pay.completedRides')}</span>
                <span className="font-semibold">{status.payLater.completedRides}</span>
              </li>
              <li className="flex justify-between">
                <span>{t('pay.outstandingTrips')}</span>
                <span className="font-semibold">{status.payLater.outstandingCount}</span>
              </li>
              <li className="flex justify-between">
                <span>{t('pay.overdueTrips')}</span>
                <span className="font-semibold">{status.payLater.overdueCount}</span>
              </li>
            </ul>
            {status.payLater.blockedReason && (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">{status.payLater.blockedReason}</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">{t('pay.debts')}</p>
            {openDebts.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-slate-400">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> {t('pay.noDebts')}
              </p>
            ) : (
              <div className="space-y-3">
                {openDebts.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{fmt(d.amount)}</p>
                      <p className="text-xs text-slate-400">
                        {d.status === 'overdue' ? t('pay.overdueDue', { date: fdateShort(d.dueDate) }) : t('pay.due', { date: fdateShort(d.dueDate) })}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      loading={payingId === d.id}
                      disabled={status.bucketBalance < d.amount}
                      onClick={() => void payDebt(d.id)}
                      title={status.bucketBalance < d.amount ? t('pay.topUpFirst') : t('pay.payFromBucket')}
                    >
                      <CheckCircle2 className="h-4 w-4" /> {t('pay.payFromBucket')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        {t('pay.loggedInAs', { name: user?.firstName ?? t('pay.customerFallback') })}
      </p>
    </div>
  );
}
