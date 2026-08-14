import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Car, Receipt, Clock, Activity, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Spinner, Alert } from '../../components/ui';
import { adminApi } from '../../lib/admin';
import { getErrorMessage } from '../../lib/api';
import { fnum } from '../../i18n/format';
import type { Overview as OverviewData } from '../../types/admin';

function Card({ icon: Icon, label, value, sub, accent }: { icon: typeof Users; label: string; value: string | number; sub?: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Icon className={`h-4 w-4 ${accent}`} />
        {label}
      </div>
      <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export default function Overview() {
  const { t } = useTranslation();
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError('');
    adminApi
      .overview()
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading && !data) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-9 w-9" />
      </div>
    );
  }

  if (!data) {
    return error ? <Alert tone="error">{error}</Alert> : null;
  }

  return (
    <div className="space-y-6">
      {data.drivers.pending > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-600" />
            <p className="text-sm font-semibold text-amber-900">
              {t('admin.overview.pendingApproval', { count: data.drivers.pending })}
            </p>
          </div>
          <Link to="/admin?tab=drivers" onClick={() => {}} className="text-sm font-bold text-amber-800 hover:underline">
            {t('admin.overview.reviewNow')}
          </Link>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card icon={Users} label={t('admin.overview.totalUsers')} value={fnum(data.users.total)} sub={t('admin.overview.usersBreakdown', { customers: fnum(data.users.customers), drivers: fnum(data.users.drivers), admins: fnum(data.users.admins) })} accent="text-brand-600" />
        <Card icon={Car} label={t('admin.overview.driversOnline')} value={fnum(data.drivers.online)} sub={t('admin.overview.activePending', { active: fnum(data.drivers.active), pending: fnum(data.drivers.pending) })} accent="text-emerald-500" />
        <Card icon={Receipt} label={t('admin.overview.activeRides')} value={fnum(data.rides.active)} sub={t('admin.overview.waitingForDriver', { count: data.rides.requested })} accent="text-violet-500" />
        <Card icon={Activity} label={t('admin.overview.faresToday')} value={t('admin.currency', { amount: fnum(data.today.fares) })} sub={t('admin.overview.tripsToday', { count: data.today.tripsCompleted })} accent="text-amber-500" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-bold text-slate-900">{t('admin.overview.rideStatuses')}</h2>
          <div className="mt-4 space-y-3">
            {[
              [t('admin.overview.statusRequested'), data.rides.requested, 'blue'],
              [t('admin.overview.statusActive'), data.rides.active, 'violet'],
              [t('common.completed'), data.rides.completed, 'green'],
              [t('common.cancelled'), data.rides.cancelled, 'red'],
            ].map(([label, value, color]) => (
              <div key={label as string} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{label}</span>
                <span className={`font-extrabold ${color === 'green' ? 'text-emerald-600' : color === 'red' ? 'text-red-600' : color === 'blue' ? 'text-blue-600' : 'text-violet-600'}`}>
                  {value as number}
                </span>
              </div>
            ))}
            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span className="text-slate-500">{t('admin.overview.allTimeRides')}</span>
                <span className="text-slate-900">{fnum(data.rides.total)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-bold text-slate-900">{t('admin.overview.platformEconomics')}</h2>
          <p className="mt-1 text-xs text-slate-400">{t('admin.overview.basedOnCommission', { rate: fnum(Math.round(data.commissionRate * 100)) })}</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{t('admin.overview.commissionRate')}</span>
              <span className="font-extrabold text-slate-900">{fnum(Math.round(data.commissionRate * 100))}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{t('admin.overview.currency')}</span>
              <span className="font-extrabold text-slate-900">{data.currency}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{t('admin.overview.todaysPlatformCut')}</span>
              <span className="font-extrabold text-emerald-600">{t('admin.currency', { amount: fnum(Math.round(data.today.fares * data.commissionRate)) })}</span>
            </div>
          </div>
          <Link to="/admin" onClick={(e) => e.preventDefault()} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
            <ArrowUpRight className="h-4 w-4" /> {t('admin.overview.detailedReports')}
          </Link>
        </div>
      </div>
    </div>
  );
}
