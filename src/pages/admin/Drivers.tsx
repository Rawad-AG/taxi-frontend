import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge, Select, Input, Button, Spinner, Alert } from '../../components/ui';
import { adminApi } from '../../lib/admin';
import { getErrorMessage } from '../../lib/api';
import { fdate } from '../../i18n/format';
import type { AdminUser } from '../../types/admin';

const STATUS_BADGE: Record<string, 'green' | 'amber' | 'red' | 'blue'> = {
  active: 'green',
  pending: 'amber',
  suspended: 'red',
  admin: 'blue',
};

export default function Drivers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    setUsers(null);
    setError('');
    try {
      setUsers(await adminApi.users({ role: 'driver', status: status || undefined, q: q || undefined }));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [status, q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const decide = async (u: AdminUser, approve: boolean) => {
    setBusyId(u.id);
    setError('');
    try {
      const updated = await adminApi.driverDecision(u.id, approve);
      setUsers((list) => (list ? list.map((x) => (x.id === updated.id ? updated : x)) : list));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId('');
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{t('admin.drivers.title')}</h2>
          <p className="text-sm text-slate-500">{t('admin.drivers.subtitle')}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder={t('admin.drivers.searchPlaceholder')} value={q} onChange={(e) => setQ(e.target.value)} className="ps-9" />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-40">
            <option value="">{t('admin.drivers.anyStatus')}</option>
            <option value="pending">{t('common.pending')}</option>
            <option value="active">{t('common.active')}</option>
            <option value="suspended">{t('common.suspended')}</option>
          </Select>
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {users === null ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        ) : users.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-400">{t('admin.drivers.noUsers')}</p>
        ) : (
          users.map((u) => (
            <div key={u.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-base font-extrabold text-white">
                  {u.name?.[0]?.toUpperCase() ?? u.phone[0]}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{u.name || t('admin.drivers.unnamed')}</p>
                  <p className="text-xs text-slate-400">
                    {u.phone} · {t('admin.drivers.joined', { date: fdate(u.createdAt) })}
                  </p>
                  {u.car && (
                    <p className="mt-0.5 text-xs text-slate-500">
                      {[u.car.make, u.car.model, u.car.color].filter(Boolean).join(' ')} · {u.car.plateNumber}
                    </p>
                  )}
                  {u.workingCity && <p className="text-xs text-slate-500">{t('admin.drivers.worksIn', { city: u.workingCity })}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={STATUS_BADGE[u.status] ?? 'slate'}>{t(`common.${u.status}`)}</Badge>
                {u.role === 'driver' && u.status === 'pending' && (
                  <>
                    <Button variant="secondary" loading={busyId === u.id} onClick={() => decide(u, false)} className="!px-3 !py-1.5 !text-xs">
                      <XCircle className="h-4 w-4" /> {t('admin.drivers.reject')}
                    </Button>
                    <Button loading={busyId === u.id} onClick={() => decide(u, true)} className="!px-3 !py-1.5 !text-xs">
                      <CheckCircle2 className="h-4 w-4" /> {t('admin.drivers.approve')}
                    </Button>
                  </>
                )}
                {u.role === 'driver' && u.status !== 'pending' && (
                  <Button variant={u.status === 'active' ? 'danger' : 'secondary'} loading={busyId === u.id} onClick={() => decide(u, u.status !== 'active')} className="!px-3 !py-1.5 !text-xs">
                    {u.status === 'active' ? t('admin.drivers.suspend') : t('admin.drivers.reactivate')}
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
