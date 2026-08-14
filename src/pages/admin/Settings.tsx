import { useEffect, useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input, Button, Spinner, Alert, Field } from '../../components/ui';
import { adminApi } from '../../lib/admin';
import { getErrorMessage } from '../../lib/api';
import { fdatetime } from '../../i18n/format';
import type { RideCategory } from '../../types/ride';
import type { SystemConfig } from '../../types/admin';

const CATEGORIES: RideCategory[] = ['economy', 'comfort', 'luxury', 'van'];

const DEFAULTS: SystemConfig = {
  fare: {
    roadFactor: 1.25,
    roundTo: 500,
    categories: {
      economy: { base: 5000, perKm: 2500 },
      comfort: { base: 7000, perKm: 3000 },
      luxury: { base: 10000, perKm: 4000 },
      van: { base: 8000, perKm: 3000 },
    },
  },
  matching: { requestTtlMs: 60000, maxTargets: 10 },
  tracking: { pingIntervalMs: 5000, staleAfterMs: 30000 },
  sos: { emergencyPhone: '+963944444444' },
  notifications: { pushEnabled: true },
  payLater: { minCompletedRides: 3, maxOutstandingBalance: 100000, maxOutstandingRides: 3, dueDays: 7, blockRidesWhenOverdue: true },
  business: { commissionRate: 0.15, currency: 'SYP', supportPhone: '+963944444444' },
};

export default function Settings() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getConfig()
      .then((c) => {
        setConfig({ ...c, fare: { ...c.fare, categories: { ...c.fare.categories } }, matching: { ...c.matching }, tracking: { ...c.tracking }, sos: { ...c.sos }, notifications: { ...c.notifications }, payLater: { ...c.payLater }, business: { ...c.business } });
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-9 w-9" />
      </div>
    );
  }

  if (!config) {
    return error ? <Alert tone="error">{error}</Alert> : null;
  }

  const set = (patch: Partial<SystemConfig>) => setConfig((c) => (c ? { ...c, ...patch } : c));
  const setFare = (patch: Partial<SystemConfig['fare']>) => set({ fare: { ...config.fare, ...patch } });
  const setCat = (key: RideCategory, patch: { base?: number; perKm?: number }) =>
    setFare({ categories: { ...config.fare.categories, [key]: { ...config.fare.categories[key], ...patch } } });

  const save = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const { message: msg } = await adminApi.saveConfig(config);
      setMessage(msg);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setMessage('');
    setError('');
    setConfig(DEFAULTS);
  };

  const num = (setter: (n: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => setter(e.target.value === '' ? 0 : Number(e.target.value));

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{t('admin.settings.title')}</h2>
          <p className="text-sm text-slate-500">
            {t('admin.settings.subtitle')}
            {config.updatedAt && ` ${t('admin.settings.lastSaved', { date: fdatetime(config.updatedAt) })}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={reset}>
            <RotateCcw className="h-4 w-4" /> {t('admin.settings.resetDefaults')}
          </Button>
          <Button loading={saving} onClick={save}>
            <Save className="h-4 w-4" /> {t('admin.settings.saveConfig')}
          </Button>
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-bold text-slate-900">{t('admin.settings.farePricing')}</h3>
        <p className="mt-1 text-xs text-slate-400">{t('admin.settings.fareFormula')}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label={t('admin.settings.roadFactor')}>
            <Input type="number" step="0.01" min="1" max="3" value={config.fare.roadFactor} onChange={num((v) => setFare({ roadFactor: v }))} />
          </Field>
          <Field label={t('admin.settings.roundTo')}>
            <Input type="number" step="100" min="1" value={config.fare.roundTo} onChange={num((v) => setFare({ roundTo: v }))} />
          </Field>
          <Field label={t('admin.settings.currency')}>
            <Input value={config.business.currency} maxLength={10} onChange={(e) => set({ business: { ...config.business, currency: e.target.value.toUpperCase() } })} />
          </Field>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {CATEGORIES.map((key) => (
            <div key={key} className="rounded-xl border border-slate-200 p-4">
              <p className="mb-2 text-sm font-bold capitalize text-slate-800">{t(`admin.cat.${key}`)}</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('admin.settings.base')}>
                  <Input type="number" step="500" min="0" value={config.fare.categories[key].base} onChange={num((v) => setCat(key, { base: v }))} />
                </Field>
                <Field label={t('admin.settings.perKm')}>
                  <Input type="number" step="500" min="0" value={config.fare.categories[key].perKm} onChange={num((v) => setCat(key, { perKm: v }))} />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-bold text-slate-900">{t('admin.settings.matching')}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={t('admin.settings.requestExpiry')} hint={t('admin.settings.requestExpiryHint')}>
            <Input
              type="number"
              step="5000"
              min="5000"
              max="600000"
              value={config.matching.requestTtlMs}
              onChange={num((v) => set({ matching: { ...config.matching, requestTtlMs: v } }))}
            />
          </Field>
          <Field label={t('admin.settings.maxDrivers')} hint={t('admin.settings.maxDriversHint')}>
            <Input
              type="number"
              min="1"
              max="50"
              value={config.matching.maxTargets}
              onChange={num((v) => set({ matching: { ...config.matching, maxTargets: v } }))}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-bold text-slate-900">{t('admin.settings.liveTracking')}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={t('admin.settings.pingInterval')} hint={t('admin.settings.pingIntervalHint')}>
            <Input
              type="number"
              step="1000"
              min="1000"
              max="60000"
              value={config.tracking.pingIntervalMs}
              onChange={num((v) => set({ tracking: { ...config.tracking, pingIntervalMs: v } }))}
            />
          </Field>
          <Field label={t('admin.settings.staleAfter')} hint={t('admin.settings.staleAfterHint')}>
            <Input
              type="number"
              step="5000"
              min="5000"
              max="600000"
              value={config.tracking.staleAfterMs}
              onChange={num((v) => set({ tracking: { ...config.tracking, staleAfterMs: v } }))}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-bold text-slate-900">{t('admin.settings.sos')}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={t('admin.settings.emergencyPhone')} hint={t('admin.settings.emergencyPhoneHint')}>
            <Input value={config.sos.emergencyPhone} onChange={(e) => set({ sos: { ...config.sos, emergencyPhone: e.target.value } })} />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-bold text-slate-900">{t('admin.settings.payLater')}</h3>
        <p className="mt-1 text-xs text-slate-400">{t('admin.settings.payLaterHint')}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={t('admin.settings.minCompletedRides')} hint={t('admin.settings.minCompletedRidesHint')}>
            <Input
              type="number"
              min="0"
              max="100"
              value={config.payLater.minCompletedRides}
              onChange={num((v) => set({ payLater: { ...config.payLater, minCompletedRides: v } }))}
            />
          </Field>
          <Field label={t('admin.settings.maxOutstandingBalance')} hint={t('admin.settings.maxOutstandingBalanceHint')}>
            <Input
              type="number"
              step="10000"
              min="0"
              value={config.payLater.maxOutstandingBalance}
              onChange={num((v) => set({ payLater: { ...config.payLater, maxOutstandingBalance: v } }))}
            />
          </Field>
          <Field label={t('admin.settings.maxOutstandingRides')} hint={t('admin.settings.maxOutstandingRidesHint')}>
            <Input
              type="number"
              min="0"
              max="50"
              value={config.payLater.maxOutstandingRides}
              onChange={num((v) => set({ payLater: { ...config.payLater, maxOutstandingRides: v } }))}
            />
          </Field>
          <Field label={t('admin.settings.dueInDays')} hint={t('admin.settings.dueInDaysHint')}>
            <Input
              type="number"
              min="1"
              max="90"
              value={config.payLater.dueDays}
              onChange={num((v) => set({ payLater: { ...config.payLater, dueDays: v } }))}
            />
          </Field>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={config.payLater.blockRidesWhenOverdue}
            onChange={(e) => set({ payLater: { ...config.payLater, blockRidesWhenOverdue: e.target.checked } })}
          />
          {t('admin.settings.blockOverdue')}
        </label>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-bold text-slate-900">{t('admin.settings.notifications')}</h3>
        <p className="mt-1 text-xs text-slate-400">{t('admin.settings.notificationsHint')}</p>
        <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={config.notifications.pushEnabled}
            onChange={(e) => set({ notifications: { ...config.notifications, pushEnabled: e.target.checked } })}
          />
          {t('admin.settings.pushEnabled')}
        </label>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-bold text-slate-900">{t('admin.settings.business')}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={t('admin.settings.commissionRate')} hint={t('admin.settings.commissionRateHint')}>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={config.business.commissionRate}
              onChange={num((v) => set({ business: { ...config.business, commissionRate: v } }))}
            />
          </Field>
          <Field label={t('admin.settings.supportPhone')} hint={t('admin.settings.supportPhoneHint')}>
            <Input value={config.business.supportPhone} onChange={(e) => set({ business: { ...config.business, supportPhone: e.target.value } })} />
          </Field>
        </div>
      </section>

      <p className="text-xs text-slate-400">
        {t('admin.settings.savedBy')} <span className="font-semibold text-slate-600">{config.updatedBy ?? t('common.notAvailable')}</span>.{' '}
        {t('admin.settings.validated')}
      </p>
    </div>
  );
}
