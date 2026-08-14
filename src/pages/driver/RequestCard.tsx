import { useEffect, useState } from 'react';
import { MapPin, Timer, Car } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fnum } from '../../i18n/format';
import type { Ride } from '../../types/ride';
import { Button } from '../../components/ui';
import { getErrorMessage } from '../../lib/api';

const REQUEST_TTL_S = 60;

export default function RequestCard({ ride, onAccept, onDecline }: { ride: Ride; onAccept: () => void; onDecline: () => void }) {
  const { t } = useTranslation();
  const [secondsLeft, setSecondsLeft] = useState(REQUEST_TTL_S);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSecondsLeft(REQUEST_TTL_S);
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [ride.id]);

  const accept = async () => {
    setBusy(true);
    setError('');
    try {
      await onAccept();
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  };

  if (secondsLeft === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <Timer className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-2 font-bold text-slate-600">{t('driver.requestExpired')}</p>
        <p className="mt-1 text-sm text-slate-400">{t('driver.requestExpiredSub')}</p>
      </div>
    );
  }

  const pct = (secondsLeft / REQUEST_TTL_S) * 100;

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-xl shadow-brand-900/10">
      <div className="flex items-center justify-between bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-3 text-white">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Timer className="h-4 w-4" />
          {t('driver.newRideRequest')}
        </div>
        <span className="rounded-full bg-white/20 px-3 py-0.5 text-sm font-extrabold tabular-nums">{secondsLeft}s</span>
      </div>
      <div className="h-1 w-full bg-brand-100">
        <div className="h-full bg-white transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="p-5">
        <div className="flex items-start gap-3">
          <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-emerald-500" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400">{t('driver.pickup')}</p>
            <p className="truncate font-bold text-slate-900">{ride.pickup.label || `${ride.pickup.lat.toFixed(4)}, ${ride.pickup.lng.toFixed(4)}`}</p>
            <p className="text-xs text-slate-400">{t('driver.kmAwayFromDropoff', { km: ride.fare.roadDistanceKm.toFixed(1) })}</p>
          </div>
        </div>
        <div className="ms-[5px] h-5 w-px border-s border-dashed border-slate-300" />
        <div className="flex items-start gap-3">
          <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-red-500" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400">{t('driver.dropoff')}</p>
            <p className="truncate font-bold text-slate-900">{ride.dropoff.label || `${ride.dropoff.lat.toFixed(4)}, ${ride.dropoff.lng.toFixed(4)}`}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MapPin className="h-4 w-4" />
            <span className="capitalize">{ride.category}</span> · {ride.type}
          </div>
          <span className="text-xl font-extrabold text-brand-700">{t('driver.amount', { amount: fnum(ride.fare.total) })}</span>
        </div>

        {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onDecline} disabled={busy}>
            {t('driver.decline')}
          </Button>
          <Button onClick={accept} loading={busy}>
            <Car className="h-4 w-4" /> {t('driver.accept')}
          </Button>
        </div>
      </div>
    </div>
  );
}
