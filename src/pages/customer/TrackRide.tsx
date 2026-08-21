import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Car, Flag, Phone, Loader2, CheckCircle2, XCircle, LocateFixed } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Alert, Badge, Button, Spinner } from '../../components/ui';
import { getSocket } from '../../lib/socket';
import { rideApi } from '../../lib/rides';
import { getErrorMessage } from '../../lib/api';
import { useLocationSharing } from '../../lib/useLocationSharing';
import LiveRideMap from '../../components/LiveRideMap';
import SosButton from '../../components/SosButton';
import { fnum } from '../../i18n/format';
import type { Ride, RideLiveLoc } from '../../types/ride';

const STALE_AFTER_MS = 30000;

const STEPS: { key: Ride['status']; labelKey: string }[] = [
  { key: 'requested', labelKey: 'track.step.requested' },
  { key: 'accepted', labelKey: 'track.step.accepted' },
  { key: 'arrived', labelKey: 'track.step.arrived' },
  { key: 'in_progress', labelKey: 'track.step.inProgress' },
  { key: 'completed', labelKey: 'track.step.completed' },
];

const STATUS_KEY: Record<string, string> = {
  requested: 'requested',
  accepted: 'accepted',
  arrived: 'arrived',
  in_progress: 'inProgress',
  completed: 'completed',
  cancelled: 'cancelled',
};

const WHO_KEY: Record<string, string> = {
  driver: 'driver',
  system: 'system',
};

function Step({ index, total, step, current, done }: { index: number; total: number; step: { key: string; labelKey: string }; current: string; done: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            done ? 'bg-emerald-500 text-white' : current === step.key ? 'bg-brand-600 text-white ring-4 ring-brand-100' : 'bg-slate-200 text-slate-500'
          }`}
        >
          {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
        </div>
        {index < total - 1 && <div className={`w-0.5 flex-1 ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
      </div>
      <div className="pb-5">
        <p className={`font-semibold ${current === step.key ? 'text-slate-900' : done ? 'text-slate-500' : 'text-slate-400'}`}>{t(step.labelKey)}</p>
      </div>
    </div>
  );
}

export default function TrackRide() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [driverLoc, setDriverLoc] = useState<RideLiveLoc | null>(null);
  const [driverStale, setDriverStale] = useState(false);
  const { sharing, start, stop, error: locError } = useLocationSharing(id);
  const lastLocRef = useRef<RideLiveLoc | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const r = await rideApi.getRide(id);
      setRide(r);
      if (r.live?.driverLoc) {
        lastLocRef.current = r.live.driverLoc;
        setDriverLoc(r.live.driverLoc);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!id) return;
    const socket = getSocket();
    const onStatus = (payload: Ride) => {
      if (payload.id === id) setRide(payload);
    };
    const onLocation = (payload: { rideId: string; by: 'driver' | 'customer'; lat: number; lng: number; accuracy?: number; ts: number }) => {
      if (payload.rideId !== id || payload.by !== 'driver') return;
      const loc = { lat: payload.lat, lng: payload.lng, accuracy: payload.accuracy, ts: payload.ts };
      lastLocRef.current = loc;
      setDriverLoc(loc);
      setDriverStale(false);
    };
    socket.on('ride:status', onStatus);
    socket.on('ride:completed', onStatus);
    socket.on('location:update', onLocation);
    const staleTimer = setInterval(() => {
      const loc = lastLocRef.current;
      if (loc?.ts && Date.now() - loc.ts > STALE_AFTER_MS) setDriverStale(true);
    }, 5000);
    return () => {
      socket.off('ride:status', onStatus);
      socket.off('ride:completed', onStatus);
      socket.off('location:update', onLocation);
      clearInterval(staleTimer);
    };
  }, [id]);

  const refreshLocation = useCallback(async () => {
    if (!id) return;
    try {
      const loc = await rideApi.getRideLocation(id);
      if (loc.driverLoc) {
        lastLocRef.current = loc.driverLoc;
        setDriverLoc(loc.driverLoc);
      }
    } catch {
      // location fetch is best-effort
    }
  }, [id]);

  useEffect(() => {
    if (ride?.driver) refreshLocation();
  }, [ride?.driver, refreshLocation]);

  const cancel = async () => {
    if (!ride) return;
    setCancelling(true);
    setError('');
    try {
      const updated = await rideApi.cancel(ride.id);
      setRide(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="font-bold text-slate-900">{t('track.notFound')}</p>
        <Link to="/book" className="mt-3 inline-block font-semibold text-brand-700 hover:underline">
          {t('track.bookNewRide')}
        </Link>
      </div>
    );
  }

  const terminal = ride.status === 'completed' || ride.status === 'cancelled';
  const currentIndex = STEPS.findIndex((s) => s.key === ride.status);
  const canCancel = !terminal && ride.status !== 'in_progress' && ride.status !== 'completed';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{t('track.yourRide')}</h1>
        <Badge color={ride.status === 'cancelled' ? 'red' : ride.status === 'completed' ? 'green' : 'blue'}>
          {t(`track.status.${STATUS_KEY[ride.status] ?? ride.status}`)}
        </Badge>
      </div>

      {error && (
        <div className="mt-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <div className="mt-6 grid gap-5 md:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:col-span-3">
          <div className="flex items-start gap-3">
            <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-emerald-500" />
            <div>
              <p className="text-xs font-medium text-slate-400">{t('book.pickup')}</p>
              <p className="font-bold text-slate-900">{ride.pickup.label || `${ride.pickup.lat.toFixed(4)}, ${ride.pickup.lng.toFixed(4)}`}</p>
            </div>
          </div>
          <div className="ms-[5px] my-2 h-6 w-px border-l border-dashed border-slate-300" />
          <div className="flex items-start gap-3">
            <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-red-500" />
            <div>
              <p className="text-xs font-medium text-slate-400">{t('book.dropoff')}</p>
              <p className="font-bold text-slate-900">{ride.dropoff.label || `${ride.dropoff.lat.toFixed(4)}, ${ride.dropoff.lng.toFixed(4)}`}</p>
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            {STEPS.map((s, i) => (
              <Step key={s.key} index={i} total={STEPS.length} step={s} current={ride.status} done={i < currentIndex} />
            ))}
          </div>

          {ride.driver && !terminal && (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-400">{t('track.liveLocation')}</p>
                {driverLoc && (
                  <span className={`text-xs font-semibold ${driverStale ? 'text-slate-400' : 'text-emerald-600'}`}>
                    {driverStale ? t('track.locationStale') : t('track.driverMoving')}
                  </span>
                )}
              </div>
              <LiveRideMap
                pickup={ride.pickup}
                dropoff={ride.dropoff}
                driverLoc={driverLoc}
                driverStale={driverStale}
                height="260px"
              />
            </div>
          )}

          {ride.status === 'requested' && !terminal && (
            <div className="mt-2 flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-900">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('track.lookingArea')}
            </div>
          )}
          {ride.status === 'completed' && (
            <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              {t('track.tripCompleted', { amount: fnum(ride.fare.total) })}
            </div>
          )}
          {ride.status === 'cancelled' && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {ride.cancellation?.cancelledBy !== 'customer'
                ? t('track.cancelledBy', { who: t(`track.who.${WHO_KEY[ride.cancellation?.cancelledBy ?? ''] ?? 'driver'}`) })
                : t('track.cancelled')}
              {ride.cancellation?.reason ? ` ${t('track.cancelReason', { reason: ride.cancellation.reason })}` : ''}
            </div>
          )}
        </div>

        <div className="space-y-4 md:col-span-2">
          {ride.driver ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-lg font-extrabold text-white">
                  {ride.driver.name[0]?.toUpperCase() ?? 'D'}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{ride.driver.name}</p>
                  <p className="text-xs text-slate-400">{ride.driver.car ? `${ride.driver.car.make} ${ride.driver.car.model} · ${ride.driver.car.color}` : t('track.yourDriver')}</p>
                </div>
              </div>
              {ride.driver.car?.plateNumber && (
                <p className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                  <Car className="h-4 w-4 text-slate-400" />
                  {t('track.plate', { plate: ride.driver.car.plateNumber })}
                </p>
              )}
              {ride.driver.phone && !terminal && (
                <a
                  href={`tel:${ride.driver.phone}`}
                  className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
                >
                  <Phone className="h-4 w-4" /> {t('track.callDriver')}
                </a>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
              <Car className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-500">{t('track.noDriverYet')}</p>
            </div>
          )}

          {!terminal && (ride.status === 'accepted' || ride.status === 'arrived') && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">{t('track.shareLocation')}</p>
                  <p className="text-xs text-slate-400">{t('track.shareLocationDesc')}</p>
                </div>
                <Button variant={sharing ? 'primary' : 'secondary'} className="!px-3 !py-2 text-xs" onClick={sharing ? stop : start}>
                  <LocateFixed className="h-4 w-4" /> {sharing ? t('track.stopSharing') : t('track.share')}
                </Button>
              </div>
              {locError && <p className="mt-2 text-xs font-medium text-red-600">{locError}</p>}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{t('track.tripFare')}</span>
              <span className="text-lg font-extrabold text-brand-700">{t('track.fare', { amount: fnum(ride.fare.total) })}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span>
                {t(`book.type.${ride.type}`)} · {t(`book.cat.${ride.category}`)}
              </span>
              <span>{t('track.distanceKm', { km: ride.fare.roadDistanceKm.toFixed(1) })} · {t('pay.method.cash')}</span>
            </div>
          </div>

          {canCancel && (
            <Button variant="danger" fullWidth loading={cancelling} onClick={cancel}>
              <XCircle className="h-4 w-4" /> {t('track.cancelRide')}
            </Button>
          )}
          {!terminal && <SosButton rideId={ride.id} />}
          {terminal && (
            <Link to="/book">
              <Button fullWidth>
                <Flag className="h-4 w-4" /> {t('track.bookAnother')}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
