import { useCallback, useEffect, useState } from 'react';
import { Search, Ban } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge, Select, Input, Button, Spinner, Alert } from '../../components/ui';
import { adminApi } from '../../lib/admin';
import { getErrorMessage } from '../../lib/api';
import { fnum, fdatetime } from '../../i18n/format';
import type { Ride, RideStatus } from '../../types/ride';

const STATUS_BADGE: Record<RideStatus, 'slate' | 'blue' | 'amber' | 'green' | 'red'> = {
  requested: 'slate',
  accepted: 'blue',
  arrived: 'amber',
  in_progress: 'blue',
  completed: 'green',
  cancelled: 'red',
};

const rideStatusKey = (s: RideStatus) => (s === 'completed' || s === 'cancelled' ? `common.${s}` : `admin.status.${s === 'in_progress' ? 'inProgress' : s}`);

export default function Rides() {
  const { t } = useTranslation();
  const [rides, setRides] = useState<Ride[] | null>(null);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    setRides(null);
    setError('');
    try {
      setRides(await adminApi.rides({ status: status || undefined, q: q || undefined }));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [status, q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const cancel = async (ride: Ride) => {
    if (!window.confirm(t('admin.rides.cancelConfirm', { id: ride.id }))) return;
    setBusyId(ride.id);
    setError('');
    try {
      const updated = await adminApi.cancelRide(ride.id, t('admin.rides.cancelledByAdmin'));
      setRides((list) => (list ? list.map((r) => (r.id === updated.id ? updated : r)) : list));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId('');
    }
  };

  const terminal = (r: Ride) => r.status === 'completed' || r.status === 'cancelled';

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{t('admin.rides.title')}</h2>
          <p className="text-sm text-slate-500">{t('admin.rides.subtitle')}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder={t('admin.rides.searchPlaceholder')} value={q} onChange={(e) => setQ(e.target.value)} className="ps-9" />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-44">
            <option value="">{t('admin.rides.anyStatus')}</option>
            {(['requested', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled'] as RideStatus[]).map((s) => (
              <option key={s} value={s}>
                {t(rideStatusKey(s))}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {rides === null ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        ) : rides.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-400">{t('admin.rides.noRides')}</p>
        ) : (
          rides.map((r) => (
            <div key={r.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge color={STATUS_BADGE[r.status]}>{t(rideStatusKey(r.status))}</Badge>
                  <span className="text-xs text-slate-400">{fdatetime(r.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  <span className="text-emerald-600">●</span> {r.pickup.label || t('common.notAvailable')} <span className="text-slate-300">{t('admin.rides.to')}</span>{' '}
                  <span className="text-red-500">●</span> {r.dropoff.label || t('common.notAvailable')}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {r.customer ? t('admin.rides.customerInfo', { name: r.customer.name, phone: r.customer.phone }) : t('admin.rides.customerDeleted')} ·{' '}
                  {r.driver ? t('admin.rides.customerInfo', { name: r.driver.name, phone: r.driver.phone }) : t('admin.rides.noDriverYet')} ·{' '}
                  <span className="capitalize">{t(`admin.cat.${r.category}`, { defaultValue: r.category })}</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <p className="font-extrabold text-slate-900">{r.status === 'cancelled' ? t('common.notAvailable') : t('admin.currency', { amount: fnum(r.fare.total) })}</p>
                {!terminal(r) && (
                  <Button variant="danger" loading={busyId === r.id} onClick={() => cancel(r)} className="!px-3 !py-1.5 !text-xs">
                    <Ban className="h-4 w-4" /> {t('admin.rides.cancel')}
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
