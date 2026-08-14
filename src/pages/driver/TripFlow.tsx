import { useEffect, useState } from 'react';
import { MapPin, Flag, CheckCircle2, Wallet, LocateFixed } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fnum } from '../../i18n/format';
import type { Ride, RideLiveLoc } from '../../types/ride';
import { Button, Badge } from '../../components/ui';
import { getErrorMessage } from '../../lib/api';
import { rideApi } from '../../lib/rides';
import { getSocket } from '../../lib/socket';
import { useLocationSharing } from '../../lib/useLocationSharing';
import LiveRideMap from '../../components/LiveRideMap';
import SosButton from '../../components/SosButton';

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        done ? 'bg-emerald-500 text-white' : active ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'
      }`}
    >
      {done ? <CheckCircle2 className="h-4 w-4" /> : null}
    </div>
  );
}

export default function TripFlow({ ride, onChange }: { ride: Ride; onChange: (ride: Ride | null) => void }) {
  const { t } = useTranslation();
  const STEPS: { key: Ride['status']; label: string }[] = [
    { key: 'accepted', label: t('trip.status.accepted') },
    { key: 'arrived', label: t('trip.status.arrived') },
    { key: 'in_progress', label: t('trip.status.in_progress') },
    { key: 'completed', label: t('trip.status.completed') },
  ];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [customerLoc, setCustomerLoc] = useState<RideLiveLoc | null>(ride.live?.customerLoc ?? null);
  const { sharing, start, stop, error: locError } = useLocationSharing(ride.id);

  const terminal = ride.status === 'completed' || ride.status === 'cancelled';

  useEffect(() => {
    const socket = getSocket();
    const onLocation = (payload: { rideId: string; by: 'driver' | 'customer'; lat: number; lng: number; accuracy?: number; ts: number }) => {
      if (payload.rideId !== ride.id || payload.by !== 'customer') return;
      setCustomerLoc({ lat: payload.lat, lng: payload.lng, accuracy: payload.accuracy, ts: payload.ts });
    };
    socket.on('location:update', onLocation);
    return () => {
      socket.off('location:update', onLocation);
    };
  }, [ride.id]);

  useEffect(() => {
    if (terminal) stop();
  }, [terminal, stop]);

  const run = async (action: 'arrive' | 'start' | 'complete') => {
    setBusy(true);
    setError('');
    try {
      const updated = await rideApi.driverAction(ride.id, action);
      onChange(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const statusIndex = STEPS.findIndex((s) => s.key === ride.status);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-900">{t('trip.activeTrip')}</h2>
        <Badge color={ride.status === 'cancelled' ? 'red' : ride.status === 'completed' ? 'green' : 'blue'}>
          {t(`trip.status.${ride.status}`)}
        </Badge>
      </div>

      {ride.status === 'cancelled' ? (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">
            {t('trip.cancelledBy', { who: t(`trip.by${ride.cancellation?.cancelledBy === 'system' ? 'System' : ride.cancellation?.cancelledBy === 'driver' ? 'Driver' : 'Customer'}`) })}
          </p>
          {ride.cancellation?.reason && <p className="mt-0.5 text-xs">{ride.cancellation.reason}</p>}
        </div>
      ) : (
        <>
          <div className="mt-5 space-y-0">
            <div className="flex items-center gap-3">
              <StepDot active={true} done={statusIndex > 0} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400">{t('trip.pickup')}</p>
                <p className="truncate text-sm font-semibold text-slate-900">{ride.pickup.label || `${ride.pickup.lat.toFixed(4)}, ${ride.pickup.lng.toFixed(4)}`}</p>
              </div>
            </div>
            <div className="ms-4 h-5 w-px border-s border-dashed border-slate-300" />
            <div className="flex items-center gap-3">
              <StepDot active={false} done={statusIndex > 1} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400">{t('trip.dropoff')}</p>
                <p className="truncate text-sm font-semibold text-slate-900">{ride.dropoff.label || `${ride.dropoff.lat.toFixed(4)}, ${ride.dropoff.lng.toFixed(4)}`}</p>
              </div>
            </div>
          </div>

          {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

          {!terminal && <div className="mt-4"><SosButton rideId={ride.id} /></div>}

          {!terminal && (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-400">{t('trip.passengerPosition')}</p>
                <Button variant={sharing ? 'primary' : 'secondary'} className="!px-3 !py-1.5 text-xs" onClick={sharing ? stop : start}>
                  <LocateFixed className="h-4 w-4" /> {sharing ? t('trip.stopSharing') : t('trip.shareLocation')}
                </Button>
              </div>
              {locError && <p className="mb-2 text-xs font-medium text-red-600">{locError}</p>}
              <LiveRideMap pickup={ride.pickup} dropoff={ride.dropoff} customerLoc={customerLoc} height="220px" />
            </div>
          )}

          <div className="mt-5">
            {ride.status === 'accepted' && (
              <Button fullWidth onClick={() => run('arrive')} loading={busy}>
                <MapPin className="h-4 w-4" /> {t('trip.arrivedButton')}
              </Button>
            )}
            {ride.status === 'arrived' && (
              <Button fullWidth onClick={() => run('start')} loading={busy}>
                <Flag className="h-4 w-4" /> {t('trip.startTrip')}
              </Button>
            )}
            {ride.status === 'in_progress' && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                    <Wallet className="h-4 w-4" /> {t('trip.collectFromCustomer')}
                  </div>
                  <span className="text-lg font-extrabold text-emerald-700">{t('driver.amount', { amount: fnum(ride.fare.total) })}</span>
                </div>
                <Button className="mt-3" fullWidth onClick={() => run('complete')} loading={busy}>
                  {t('trip.completeTrip')}
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {terminal && (
        <Button variant="secondary" className="mt-4" fullWidth onClick={() => onChange(null)}>
          {t('trip.dismiss')}
        </Button>
      )}

      {!terminal && ride.driver && (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
            {(ride.driver.name[0] ?? 'D').toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">{ride.driver.name}</p>
            <p className="text-xs text-slate-400">{t('trip.youAreDriving')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
