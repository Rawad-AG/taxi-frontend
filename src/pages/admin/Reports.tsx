import { useEffect, useState } from 'react';
import { Wallet, Receipt, Percent, XCircle, TrendingUp, Users, Timer, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Select, Spinner, Alert } from '../../components/ui';
import { adminApi } from '../../lib/admin';
import { getErrorMessage } from '../../lib/api';
import { fnum, fdateShort } from '../../i18n/format';
import type { FinancialReport, PerformanceReport } from '../../types/admin';

type Range = '7d' | '30d' | '90d' | 'all';

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const RANGES: Record<Range, { from?: string }> = {
  '7d': { from: isoDaysAgo(7) },
  '30d': { from: isoDaysAgo(30) },
  '90d': { from: isoDaysAgo(90) },
  all: {},
};

const RANGE_KEYS: Record<Range, string> = {
  '7d': 'admin.reports.last7Days',
  '30d': 'admin.reports.last30Days',
  '90d': 'admin.reports.last90Days',
  all: 'admin.reports.allTime',
};

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof Wallet; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Icon className={`h-4 w-4 ${accent}`} />
        {label}
      </div>
      <p className="mt-2 text-xl font-extrabold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

function DailyChart({ daily }: { daily: { date: string; trips: number; fares: number }[] }) {
  const { t } = useTranslation();
  const max = Math.max(...daily.map((d) => d.fares), 1);
  return (
    <div>
      <div className="flex h-40 items-end gap-1">
        {daily.length === 0 && <p className="pb-4 text-sm text-slate-400">{t('admin.reports.noRidesInPeriod')}</p>}
        {daily.map((d) => (
          <div key={d.date} className="group relative flex-1">
            <div
              className="w-full rounded-t bg-brand-500 transition hover:bg-brand-600"
              style={{ height: `${Math.max((d.fares / max) * 150, d.trips > 0 ? 4 : 0)}px` }}
            />
            <div className="pointer-events-none absolute bottom-full start-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
              {t('admin.reports.dailyTotals', {
                date: fdateShort(d.date),
                trips: fnum(d.trips),
                amount: t('admin.currency', { amount: fnum(d.fares) }),
              })}
            </div>
          </div>
        ))}
      </div>
      {daily.length > 0 && (
        <p className="mt-2 text-[11px] text-slate-400">
          {t('admin.reports.dateRangeFares', { from: fdateShort(daily[0].date), to: fdateShort(daily[daily.length - 1].date) })}
        </p>
      )}
    </div>
  );
}

export default function Reports() {
  const { t } = useTranslation();
  const [range, setRange] = useState<Range>('30d');
  const [financial, setFinancial] = useState<FinancialReport | null>(null);
  const [performance, setPerformance] = useState<PerformanceReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError('');
    const { from } = RANGES[range];
    Promise.all([adminApi.financialReport(from), adminApi.performanceReport(from)])
      .then(([f, p]) => {
        setFinancial(f);
        setPerformance(p);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [range]);

  if (loading && !financial) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-9 w-9" />
      </div>
    );
  }

  if (!financial || !performance) {
    return error ? <Alert tone="error">{error}</Alert> : null;
  }

  const s = financial.summary;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{t('admin.reports.title')}</h2>
          <p className="text-sm text-slate-500">{t('admin.reports.period', { label: t(RANGE_KEYS[range]) })}</p>
        </div>
        <Select value={range} onChange={(e) => setRange(e.target.value as Range)} className="sm:w-44">
          <option value="7d">{t('admin.reports.last7Days')}</option>
          <option value="30d">{t('admin.reports.last30Days')}</option>
          <option value="90d">{t('admin.reports.last90Days')}</option>
          <option value="all">{t('admin.reports.allTime')}</option>
        </Select>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <section>
        <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
          <Wallet className="h-4 w-4 text-brand-600" /> {t('admin.reports.financialSummary')}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={Receipt} label={t('admin.reports.completedTrips')} value={fnum(s.trips)} accent="text-brand-600" />
          <StatCard icon={Wallet} label={t('admin.reports.totalFares')} value={t('admin.currency', { amount: fnum(s.fares) })} accent="text-emerald-500" />
          <StatCard icon={TrendingUp} label={t('admin.reports.avgFare')} value={t('admin.currency', { amount: fnum(s.avgFare) })} accent="text-violet-500" />
          <StatCard icon={Percent} label={t('admin.reports.platformCommission')} value={`${t('admin.currency', { amount: fnum(s.commission) })} (${fnum(Math.round(financial.commissionRate * 100))}%)`} accent="text-amber-500" />
          <StatCard icon={XCircle} label={t('admin.reports.cancelled')} value={`${fnum(s.cancelled)} (${(s.cancellationRate * 100).toFixed(1)}%)`} accent="text-red-500" />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {t('admin.reports.driversNet', { amount: t('admin.currency', { amount: fnum(s.driverNet) }) })} {t('admin.reports.methodSplit')}{' '}
          {[
            t('admin.reports.methodCash', { count: s.cashRides ?? 0 }),
            t('admin.reports.methodBucket', { count: s.bucketRides ?? 0 }),
            t('admin.reports.methodPayLater', {
              count: s.payLaterRides ?? 0,
              percent: fnum(s.payLaterShare !== undefined ? Math.round(s.payLaterShare * 100) : 0),
            }),
          ].join(' · ')}
          {s.outstandingBalance !== undefined &&
            ` · ${t('admin.reports.outstandingDebt', {
              amount: t('admin.currency', { amount: fnum(s.outstandingBalance) }),
              overdue: t('admin.currency', { amount: fnum(s.overdueBalance ?? 0) }),
            })}`}
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">{t('admin.reports.faresByCategory')}</h3>
          <div className="mt-4 space-y-3">
            {financial.byCategory.length === 0 && <p className="text-sm text-slate-400">{t('admin.reports.noCompletedRides')}</p>}
            {financial.byCategory.map((c) => (
              <div key={c.category} className="flex items-center justify-between text-sm">
                <span className="capitalize text-slate-600">{t(`admin.cat.${c.category}`, { defaultValue: c.category })}</span>
                <span className="font-semibold text-slate-900">
                  {t('admin.reports.tripsAndFares', { trips: fnum(c.trips), amount: t('admin.currency', { amount: fnum(c.fares) }) })}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">{t('admin.reports.dailyFareTrend')}</h3>
          <div className="mt-4">
            <DailyChart daily={financial.daily} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="flex items-center gap-2 font-bold text-slate-900">
          <Users className="h-4 w-4 text-brand-600" /> {t('admin.reports.topDriversByEarnings')}
        </h3>
        <div className="mt-4 space-y-3">
          {financial.topDrivers.length === 0 && <p className="text-sm text-slate-400">{t('admin.reports.noDataYet')}</p>}
          {financial.topDrivers.map((d, i) => (
            <div key={d.phone} className="flex items-center justify-between border-b border-slate-50 pb-2 text-sm last:border-0">
              <span className="text-slate-700">
                <span className="me-2 font-bold text-slate-400">{t('admin.reports.rank', { rank: i + 1 })}</span>
                {d.name}
              </span>
              <span className="font-semibold text-slate-900">
                {t('admin.reports.tripsAndEarnings', { trips: fnum(d.trips), amount: t('admin.currency', { amount: fnum(d.earnings) }) })}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="flex items-center gap-2 font-bold text-slate-900">
          <Users className="h-4 w-4 text-brand-600" /> {t('admin.reports.driverPerformance')}
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 pe-4 font-semibold">{t('admin.reports.thDriver')}</th>
                <th className="pb-2 pe-4 font-semibold">{t('admin.reports.thTrips')}</th>
                <th className="pb-2 pe-4 font-semibold">{t('admin.reports.thEarnings')}</th>
                <th className="pb-2 pe-4 font-semibold">{t('admin.reports.thRating')}</th>
                <th className="pb-2 font-semibold">{t('admin.reports.thAvgAccept')}</th>
              </tr>
            </thead>
            <tbody>
              {performance.drivers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-slate-400">
                    {t('admin.reports.noRidesInPeriod')}
                  </td>
                </tr>
              )}
              {performance.drivers.map((d) => (
                <tr key={d.phone ?? d.name} className="border-b border-slate-50 last:border-0">
                  <td className="py-2.5 pe-4 font-semibold text-slate-800">{d.name}</td>
                  <td className="py-2.5 pe-4 text-slate-600">{fnum(d.trips)}</td>
                  <td className="py-2.5 pe-4 text-slate-600">{t('admin.currency', { amount: fnum(d.earnings) })}</td>
                  <td className="py-2.5 pe-4 text-slate-600">{d.avgRating != null ? t('admin.reports.starRating', { rating: fnum(d.avgRating) }) : t('common.notAvailable')}</td>
                  <td className="py-2.5 text-slate-600">{d.avgAcceptMs != null ? t('admin.reports.seconds', { seconds: (d.avgAcceptMs / 1000).toFixed(1) }) : t('common.notAvailable')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="flex items-center gap-2 font-bold text-slate-900">
            <Users className="h-4 w-4 text-brand-600" /> {t('admin.reports.topCustomers')}
          </h3>
          <div className="mt-4 space-y-3">
            {performance.customers.length === 0 && <p className="text-sm text-slate-400">{t('admin.reports.noDataYet')}</p>}
            {performance.customers.map((c, i) => (
              <div key={c.phone} className="flex items-center justify-between border-b border-slate-50 pb-2 text-sm last:border-0">
                <span className="text-slate-700">
                  <span className="me-2 font-bold text-slate-400">{t('admin.reports.rank', { rank: i + 1 })}</span>
                  {c.name}
                </span>
                <span className="font-semibold text-slate-900">
                  {t('admin.reports.ridesAndSpent', { trips: fnum(c.trips), amount: t('admin.currency', { amount: fnum(c.spent) }) })}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-900">{t('admin.reports.systemHealth')}</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600">
                <Users className="h-4 w-4 text-slate-400" /> {t('admin.reports.driversOnlineNow')}
              </span>
              <span className="font-extrabold text-slate-900">{fnum(performance.system.onlineDrivers)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600">
                <Timer className="h-4 w-4 text-slate-400" /> {t('admin.reports.avgAcceptTime')}
              </span>
              <span className="font-extrabold text-slate-900">
                {performance.system.avgAcceptMs != null ? t('admin.reports.seconds', { seconds: (performance.system.avgAcceptMs / 1000).toFixed(1) }) : t('common.notAvailable')}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600">
                <Star className="h-4 w-4 text-slate-400" /> {t('admin.reports.avgCustomerRating')}
              </span>
              <span className="font-extrabold text-slate-900">
                {performance.system.avgCustomerRating != null ? t('admin.reports.starRating', { rating: fnum(performance.system.avgCustomerRating) }) : t('common.notAvailable')}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600">
                <Timer className="h-4 w-4 text-slate-400" /> {t('admin.reports.pendingDrivers')}
              </span>
              <span className="font-extrabold text-slate-900">{fnum(performance.system.pendingDrivers)}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
