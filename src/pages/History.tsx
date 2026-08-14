import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, Car, History as HistoryIcon, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Badge, Alert, Spinner, Button } from '../components/ui';
import { rideApi } from '../lib/rides';
import { getErrorMessage } from '../lib/api';
import { fnum, fdate, ftime } from '../i18n/format';
import type { Ride, RideStatus } from '../types/ride';

const STATUS_BADGE: Record<RideStatus, 'blue' | 'green' | 'red' | 'amber' | 'slate'> = {
  requested: 'slate',
  accepted: 'blue',
  arrived: 'amber',
  in_progress: 'blue',
  completed: 'green',
  cancelled: 'red',
};

const STATUS_KEY: Record<string, string> = {
  requested: 'requested',
  accepted: 'accepted',
  arrived: 'arrived',
  in_progress: 'inProgress',
  completed: 'completed',
  cancelled: 'cancelled',
};

const METHOD_KEY: Record<string, string> = {
  cash: 'cash',
  bucket: 'bucket',
  pay_later: 'payLater',
};

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400" aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-4 w-4 ${n <= value ? 'fill-amber-400' : 'fill-slate-200 text-slate-200'}`} />
      ))}
    </span>
  );
}

function RatingBox({ ride, isDriver }: { ride: Ride; isDriver: boolean }) {
  const { t } = useTranslation();
  const mine = isDriver ? ride.ratings?.driverRating : ride.ratings?.customerRating;
  const theirComment = isDriver ? ride.ratings?.customerComment : ride.ratings?.driverComment;
  const [value, setValue] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(!!mine);

  useEffect(() => {
    setDone(!!mine);
  }, [mine]);

  if (done) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Stars value={mine ?? 0} />
        <span>{t('hist.rated', { rating: mine ?? '-' })}</span>
        {theirComment && <span className="italic">“{theirComment}”</span>}
      </div>
    );
  }

  const save = async () => {
    if (value === 0) {
      setError(t('hist.ratingHint'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await rideApi.rate(ride.id, value, comment.trim() || undefined);
      setDone(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50/50 p-3">
      <p className="text-sm font-semibold text-slate-700">{isDriver ? t('hist.rateCustomer') : t('hist.rateDriver')}</p>
      <div className="mt-1.5 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setValue(n)}
            aria-label={`${n} star`}
            className="rounded-md p-1 transition-transform hover:scale-110"
          >
            <Star
              className={`h-5 w-5 ${n <= value ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t('hist.commentPlaceholder')}
        maxLength={300}
        rows={2}
        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
      />
      <div className="mt-2 flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? '…' : t('hist.saveRating')}
        </Button>
        {error && <span className="text-xs font-medium text-red-600">{error}</span>}
      </div>
    </div>
  );
}

function RideRow({ ride, isDriver }: { ride: Ride; isDriver: boolean }) {
  const { t } = useTranslation();
  const other = isDriver ? ride.customer : ride.driver;
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-400">
            {fdate(ride.createdAt)}
            {' · '}
            {ftime(ride.createdAt)}
          </span>
          <Badge color={STATUS_BADGE[ride.status]}>{t(`track.status.${STATUS_KEY[ride.status] ?? ride.status}`)}</Badge>
        </div>
        <div className="mt-2 flex flex-col gap-1.5 text-sm">
          <p className="flex items-center gap-2 text-slate-700">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
            <span className="truncate">{ride.pickup.label || `${ride.pickup.lat.toFixed(4)}, ${ride.pickup.lng.toFixed(4)}`}</span>
          </p>
          <p className="flex items-center gap-2 text-slate-700">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
            <span className="truncate">{ride.dropoff.label || `${ride.dropoff.lat.toFixed(4)}, ${ride.dropoff.lng.toFixed(4)}`}</span>
          </p>
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
          <span className="capitalize">{t(`book.cat.${ride.category}`)}</span>
          <span>{t('track.distanceKm', { km: ride.fare.roadDistanceKm.toFixed(1) })}</span>
          {ride.payment?.method && (
            <span className="capitalize">{t(`pay.method.${METHOD_KEY[ride.payment.method] ?? ride.payment.method}`)}</span>
          )}
          {other && (
            <span>
              {isDriver ? t('hist.passenger') : t('hist.driver')}: <span className="font-semibold text-slate-600">{other.name}</span>
            </span>
          )}
        </p>
      </div>
      <div className="shrink-0 text-end">
        <p className={`text-lg font-extrabold ${ride.status === 'completed' ? 'text-emerald-600' : ride.status === 'cancelled' ? 'text-slate-400' : 'text-slate-900'}`}>
          {ride.status === 'cancelled' ? t('common.notAvailable') : t('track.fare', { amount: fnum(ride.fare.total) })}
        </p>
        <Link to={`/track/${ride.id}`} className="text-xs font-semibold text-brand-700 hover:underline">
          {t('hist.viewDetails')}
        </Link>
      </div>
      {ride.status === 'completed' && <RatingBox ride={ride} isDriver={isDriver} />}
    </div>
  );
}

export default function History() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isDriver = user?.role === 'driver';
  const [rides, setRides] = useState<Ride[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    rideApi
      .history()
      .then(setRides)
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  const completed = rides?.filter((r) => r.status === 'completed').length ?? 0;
  const earned = rides?.filter((r) => r.status === 'completed').reduce((sum, r) => sum + r.fare.total, 0) ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
          <HistoryIcon className="h-5 w-5 text-brand-600" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{isDriver ? t('hist.titleDriver') : t('hist.title')}</h1>
          <p className="text-sm text-slate-500">{isDriver ? t('hist.subtitleDriver') : t('hist.subtitle')}</p>
        </div>
      </div>

      {rides && rides.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">
              {isDriver ? (
                <>
                  <ArrowDown className="me-1 inline h-4 w-4 text-emerald-500" /> {t('hist.totalEarnings')}
                </>
              ) : (
                <>
                  <ArrowUp className="me-1 inline h-4 w-4 text-brand-500" /> {t('hist.completedRides')}
                </>
              )}
            </p>
            <p className="mt-1 text-xl font-extrabold text-slate-900">
              {isDriver ? t('track.fare', { amount: fnum(earned) }) : String(completed)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{isDriver ? t('hist.allTimeDriver') : t('hist.allTime')}</p>
            <p className="mt-1 text-xl font-extrabold text-slate-900">{rides.length}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {rides === null ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        ) : rides.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 py-16 text-center">
            <Car className="h-10 w-10 text-slate-300" />
            <p className="mt-3 font-semibold text-slate-600">{isDriver ? t('hist.emptyDriver') : t('hist.empty')}</p>
            {!isDriver && (
              <Link to="/book" className="mt-2 text-sm font-semibold text-brand-700 hover:underline">
                {t('hist.bookFirstRide')}
              </Link>
            )}
          </div>
        ) : (
          rides.map((ride) => <RideRow key={ride.id} ride={ride} isDriver={isDriver} />)
        )}
      </div>
    </div>
  );
}
