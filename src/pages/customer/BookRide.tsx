import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LocateFixed, MapPin, Flag, ArrowUpDown, X, Loader2, Car, Package, Bike, Wallet, Clock3, Banknote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Field, Select } from '../../components/ui';
import MapPicker, { type MapPoint } from '../../components/MapPicker';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { rideApi } from '../../lib/rides';
import { paymentsApi } from '../../lib/payments';
import { getErrorMessage } from '../../lib/api';
import { fnum } from '../../i18n/format';
import type { City } from '../../types';
import type { Ride, RideCategory, RideType } from '../../types/ride';
import type { PaymentMethod, PaymentStatus } from '../../types/payment';

const CATEGORIES: { key: RideCategory; label: string; note: string }[] = [
  { key: 'economy', label: 'book.cat.economy', note: 'book.cat.economyNote' },
  { key: 'comfort', label: 'book.cat.comfort', note: 'book.cat.comfortNote' },
  { key: 'luxury', label: 'book.cat.luxury', note: 'book.cat.luxuryNote' },
  { key: 'van', label: 'book.cat.van', note: 'book.cat.vanNote' },
];

const RIDE_TYPES: { key: RideType; label: string; desc: string; icon: typeof Car }[] = [
  { key: 'ride', label: 'book.type.ride', desc: 'book.type.rideDesc', icon: Car },
  { key: 'delivery', label: 'book.type.delivery', desc: 'book.type.deliveryDesc', icon: Package },
  { key: 'send_item', label: 'book.type.sendItem', desc: 'book.type.sendItemDesc', icon: Bike },
];

function WaitingPanel({ ride, onCancel, onRetry }: { ride: Ride; onCancel: () => void; onRetry: () => void }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [expired, setExpired] = useState('');
  const [accepted, setAccepted] = useState<Ride | null>(null);

  useEffect(() => {
    const socket = getSocket();
    const onExpired = (payload: { rideId: string; reason?: string }) => {
      if (payload.rideId === ride.id) setExpired(payload.reason ?? t('wait.expiredFallback'));
    };
    const onAccepted = (payload: Ride) => {
      if (payload.id === ride.id) {
        setAccepted(payload);
        setTimeout(() => navigate(`/track/${payload.id}`), 1200);
      }
    };
    socket.on('ride:request_expired', onExpired);
    socket.on('ride:accepted', onAccepted);
    return () => {
      socket.off('ride:request_expired', onExpired);
      socket.off('ride:accepted', onAccepted);
    };
  }, [ride.id, navigate, t]);

  if (accepted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500">
            <Car className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-emerald-900">{accepted.driver?.name ?? t('wait.driver')}</p>
            <p className="text-sm text-emerald-700">
              {accepted.driver?.car ? `${accepted.driver.car.make} ${accepted.driver.car.model} · ${accepted.driver.car.color}` : t('wait.onTheWay')}
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-emerald-800">{t('wait.acceptedMsg')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-200 bg-white p-6 shadow-lg shadow-brand-900/5">
      <div className="flex items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        <div>
          <p className="font-bold text-slate-900">{t('wait.looking')}</p>
          <p className="text-sm text-slate-500">
            {t('wait.contacting', {
              label: ride.pickup.label || t('wait.yourPickup'),
              amount: fnum(ride.fare.total),
            })}
          </p>
        </div>
      </div>
      {expired && (
        <div className="mt-4">
          <Alert tone="error">{expired}</Alert>
          <Button className="mt-3" onClick={onRetry}>
            {t('wait.requestAgain')}
          </Button>
        </div>
      )}
      {!expired && (
        <Button variant="secondary" className="mt-4" onClick={onCancel}>
          {t('wait.cancelRequest')}
        </Button>
      )}
    </div>
  );
}

export default function BookRide() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const queryType = searchParams.get('type');
  const [cities, setCities] = useState<City[]>([]);
  const [cityId, setCityId] = useState('');
  const [pickup, setPickup] = useState<MapPoint | null>(null);
  const [dropoff, setDropoff] = useState<MapPoint | null>(null);
  const [category, setCategory] = useState<RideCategory>('economy');
  const [type, setType] = useState<RideType>(() => (RIDE_TYPES.some((r) => r.key === queryType) ? (queryType as RideType) : 'ride'));
  const [fare, setFare] = useState<Ride['fare'] | null>(null);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  useEffect(() => {
    let active = true;
    api.get<{ cities: City[] }>('/lookups/cities').then((res) => {
      if (!active) return;
      setCities(res.data.cities);
      if (!res.data.cities.length) {
        setError(t('book.noCities'));
        return;
      }
      const damascus = res.data.cities.find((c) => c.name === 'Damascus');
      setCityId(damascus?._id ?? res.data.cities[0]?._id ?? '');
    });
    return () => {
      active = false;
    };
  }, [t]);

  const city = useMemo(() => cities.find((c) => c._id === cityId), [cities, cityId]);
  const center = useMemo(
    () => ({ lat: city?.lat ?? 33.5138, lng: city?.lng ?? 36.2765 }),
    [city],
  );

  useEffect(() => {
    paymentsApi
      .status()
      .then(setPaymentStatus)
      .catch(() => setPaymentStatus(null));
  }, []);

  useEffect(() => {
    if (!pickup || !dropoff || activeRide) {
      setFare(null);
      return;
    }
    let cancelled = false;
    rideApi
      .estimate(pickup, dropoff, category)
      .then((f) => !cancelled && setFare(f))
      .catch((err) => !cancelled && setError(getErrorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [pickup, dropoff, category, activeRide]);

  useEffect(() => {
    if (paymentMethod === 'bucket' && paymentStatus && (paymentStatus.bucketBalance <= 0 || (!!fare && paymentStatus.bucketBalance < fare.total))) {
      setPaymentMethod('cash');
    }
    if (paymentMethod === 'pay_later' && paymentStatus && (!paymentStatus.payLater.eligible || paymentStatus.payLater.blocked)) {
      setPaymentMethod('cash');
    }
  }, [paymentMethod, paymentStatus, fare]);

  const handlePick = useCallback(
    (point: MapPoint) => {
      setError('');
      if (!pickup) setPickup(point);
      else if (!dropoff) setDropoff(point);
      else {
        setPickup(point);
        setDropoff(null);
      }
    },
    [pickup, dropoff],
  );

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError(t('book.geoUnsupported'));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickup({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: t('book.myLocation') });
        setLocating(false);
      },
      () => {
        setError(t('book.geoFailed'));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const requestRide = async () => {
    if (!pickup || !dropoff || !cityId) {
      setError(t('book.missingDetails'));
      return;
    }
    setError('');
    setRequesting(true);
    try {
      const { ride } = await rideApi.create({ city: cityId, category, type, pickup, dropoff, paymentMethod });
      setActiveRide(ride);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRequesting(false);
    }
  };

  const cancelRide = async () => {
    if (!activeRide) return;
    setError('');
    try {
      await rideApi.cancel(activeRide.id);
      setActiveRide(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const reset = () => {
    setActiveRide(null);
    setPickup(null);
    setDropoff(null);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{t('nav.bookRide')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('book.tapMapIntro')}</p>
        </div>
        <Link to="/customer" className="text-sm font-semibold text-brand-700 hover:underline">
          {t('book.backToDashboard')}
        </Link>
      </div>

      {error && (
        <div className="mt-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <MapPicker center={center} pickup={pickup} dropoff={dropoff} onPick={handlePick} height="440px" />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Field label={t('book.city')}>
              <Select
                value={cityId}
                onChange={(e) => {
                  setCityId(e.target.value);
                  setPickup(null);
                  setDropoff(null);
                  setFare(null);
                }}
                className="w-44"
              >
                {cities.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <button
              onClick={useMyLocation}
              disabled={locating}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-700 disabled:opacity-60"
            >
              <LocateFixed className="h-4 w-4" />
              {locating ? t('book.locating') : t('book.useMyLocation')}
            </button>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <span className="h-3 w-3 shrink-0 rounded-full bg-emerald-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-400">{t('book.pickup')}</p>
                  <p className="truncate font-semibold text-slate-900">{pickup ? (pickup.label || `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}`) : t('book.tapMapPickup')}</p>
                </div>
                {pickup && (
                  <button onClick={() => setPickup(null)} className="rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  setPickup(dropoff);
                  setDropoff(pickup);
                }}
                disabled={!pickup || !dropoff}
                className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-brand-400 hover:text-brand-600 disabled:opacity-40"
                title={t('book.swap')}
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <span className="h-3 w-3 shrink-0 rounded-full bg-red-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-400">{t('book.dropoff')}</p>
                  <p className="truncate font-semibold text-slate-900">{dropoff ? (dropoff.label || `${dropoff.lat.toFixed(4)}, ${dropoff.lng.toFixed(4)}`) : t('book.tapMapDropoff')}</p>
                </div>
                {dropoff && (
                  <button onClick={() => setDropoff(null)} className="rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{t('book.rideType')}</p>
              <div className="grid grid-cols-3 gap-2">
                {RIDE_TYPES.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setType(r.key)}
                    title={t(r.desc)}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-bold transition ${
                      type === r.key ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300'
                    }`}
                  >
                    <r.icon className="h-4 w-4" />
                    {t(r.label)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  title={t(c.note)}
                  className={`rounded-xl border px-2 py-2 text-xs font-bold transition ${
                    category === c.key
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300'
                  }`}
                >
                  {t(c.label)}
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-brand-100 bg-brand-50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-brand-900">
                <MapPin className="h-4 w-4" />
                {fare ? t('book.kmTrip', { km: fare.roadDistanceKm.toFixed(1) }) : t('book.estimate')}
              </div>
              <span className="text-lg font-extrabold text-brand-700">
                {fare ? t('pay.amountSyp', { amount: fnum(fare.total) }) : t('common.notAvailable')}
              </span>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{t('book.paymentMethod')}</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-bold transition ${
                    paymentMethod === 'cash' ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300'
                  }`}
                >
                  <Banknote className="h-4 w-4" />
                  {t('pay.method.cash')}
                </button>
                <button
                  onClick={() => paymentStatus && paymentStatus.bucketBalance > 0 && (!fare || paymentStatus.bucketBalance >= fare.total) && setPaymentMethod('bucket')}
                  disabled={!paymentStatus || paymentStatus.bucketBalance <= 0 || (!!fare && paymentStatus.bucketBalance < fare.total)}
                  title={
                    paymentStatus && paymentStatus.bucketBalance <= 0
                      ? t('book.bucketTopUpHint')
                      : fare && paymentStatus && paymentStatus.bucketBalance < fare.total
                        ? t('book.bucketLowHint')
                        : undefined
                  }
                  className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    paymentMethod === 'bucket' ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300'
                  }`}
                >
                  <Wallet className="h-4 w-4" />
                  {t('pay.method.bucket')}
                  <span className="text-[10px] font-medium opacity-80">{paymentStatus ? t('pay.amountSyp', { amount: fnum(paymentStatus.bucketBalance) }) : '…'}</span>
                </button>
                <button
                  onClick={() => paymentStatus?.payLater.eligible && setPaymentMethod('pay_later')}
                  disabled={!paymentStatus || !paymentStatus.payLater.eligible || paymentStatus.payLater.blocked}
                  title={paymentStatus ? (paymentStatus.payLater.blockedReason ?? undefined) : undefined}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    paymentMethod === 'pay_later' ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300'
                  }`}
                >
                  <Clock3 className="h-4 w-4" />
                  {t('pay.method.payLater')}
                  <span className="text-[10px] font-medium opacity-80">
                    {paymentStatus ? (paymentStatus.payLater.eligible ? t('pay.available') : t('pay.locked')) : '…'}
                  </span>
                </button>
              </div>
              {paymentMethod !== 'cash' && fare && paymentStatus && paymentStatus.bucketBalance < fare.total && paymentMethod === 'bucket' && (
                <p className="mt-1 text-[11px] text-amber-600">{t('book.bucketLowWarning')}</p>
              )}
              {paymentStatus && !paymentStatus.payLater.eligible && (
                <p className="mt-1 text-[11px] text-slate-400">{paymentStatus.payLater.blockedReason}</p>
              )}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button disabled className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-2 py-2 text-[11px] font-semibold text-slate-400">
                  {t('book.shamCash')}
                </button>
                <button disabled className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-2 py-2 text-[11px] font-semibold text-slate-400">
                  {t('book.syriatelCash')}
                </button>
              </div>
            </div>

            {!activeRide ? (
              <Button className="mt-4" fullWidth loading={requesting} disabled={!pickup || !dropoff || !cityId} onClick={requestRide}>
                <Flag className="h-4 w-4" /> {t('book.requestRide')}
              </Button>
            ) : (
              <div className="mt-4">
                <WaitingPanel ride={activeRide} onCancel={cancelRide} onRetry={reset} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
