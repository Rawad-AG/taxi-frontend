import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ToggleLeft,
  Car,
  MapPin,
  Wallet,
  Clock,
  Star,
  CalendarDays,
  Settings,
  ChevronRight,
  CreditCard,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { fnum } from '../i18n/format';
import { Badge, Alert } from '../components/ui';
import { driverApi } from '../lib/driver';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket';
import { getErrorMessage } from '../lib/api';
import { rideApi } from '../lib/rides';
import type { DriverStats, Ride } from '../types/ride';
import RequestCard from './driver/RequestCard';
import TripFlow from './driver/TripFlow';
import SosButton from '../components/SosButton';

function Stat({ icon: Icon, label, value, accent }: { icon: typeof Wallet; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Icon className={`h-4 w-4 ${accent}`} />
        {label}
      </div>
      <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [online, setOnline] = useState(false);
  const [presenceLoading, setPresenceLoading] = useState(true);
  const [presenceError, setPresenceError] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [incoming, setIncoming] = useState<Ride | null>(null);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [stats, setStats] = useState<DriverStats | null>(null);
  const profile = user?.driverProfile;

  useEffect(() => {
    rideApi.driverStats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeRide?.status === 'completed') {
      rideApi.driverStats().then(setStats).catch(() => {});
    }
  }, [activeRide?.status]);

  useEffect(() => {
    let active = true;
    driverApi
      .getPresence()
      .then((p) => {
        if (!active) return;
        setOnline(p.online);
        if (p.online) connectSocket();
      })
      .catch((err) => {
        if (active) setPresenceError(getErrorMessage(err));
      })
      .finally(() => active && setPresenceLoading(false));
    rideApi
      .getCurrentRide()
      .then((ride) => {
        if (active && ride) setActiveRide(ride);
      })
      .catch(() => {});
    return () => {
      active = false;
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    const onRequest = (ride: Ride) => {
      if (!activeRide) setIncoming(ride);
    };
    const onStatus = (ride: Ride) => {
      if (activeRide && ride.id === activeRide.id) {
        setActiveRide(ride);
        setIncoming(null);
      }
    };
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('ride:request', onRequest);
    socket.on('ride:status', onStatus);
    if (socket.connected) setSocketConnected(true);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('ride:request', onRequest);
      socket.off('ride:status', onStatus);
    };
  }, [activeRide]);

  const toggleOnline = async () => {
    setPresenceError('');
    try {
      const next = !online;
      const presence = await driverApi.setPresence(next);
      setOnline(presence.online);
      if (presence.online) connectSocket();
      else disconnectSocket();
    } catch (err) {
      setPresenceError(getErrorMessage(err));
    }
  };

  const cityName = typeof profile?.workingCity === 'object' && profile?.workingCity ? profile.workingCity.name : '';
  const carMake = typeof profile?.car?.make === 'object' && profile?.car?.make ? profile.car.make.name : '';
  const carModel = typeof profile?.car?.model === 'object' && profile?.car?.model ? profile.car.model.name : '';
  const rawAreas = profile?.workingAreas?.map((a) => (typeof a === 'object' ? a.name : '')) ?? [];
  const areaNames = rawAreas.filter(Boolean).join(', ');

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{t('driver.dashboardTitle')}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('driver.welcomeBack', { name: profile?.fullName ?? t('driver.you'), city: cityName || t('driver.syria') })}
          </p>
        </div>
        <button
          onClick={toggleOnline}
          disabled={presenceLoading || user?.status !== 'active'}
          className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${
            online
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
          } disabled:pointer-events-none disabled:opacity-50`}
        >
          <ToggleLeft className={`h-5 w-5 ${online ? 'rotate-180' : ''}`} />
          {online ? t('driver.onlineTakingRequests') : t('driver.goOnline')}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium">
        {online ? (
          <span className={`inline-flex items-center gap-1.5 ${socketConnected ? 'text-emerald-600' : 'text-amber-600'}`}>
            {socketConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {socketConnected ? t('driver.connectedLive') : t('driver.connecting')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-slate-400">
            <WifiOff className="h-3.5 w-3.5" />
            {t('driver.offlineNoRequests')}
          </span>
        )}
        {presenceError && <span className="text-red-600">{presenceError}</span>}
      </div>

      {user?.status === 'pending' && (
        <div className="mt-6">
          <Alert tone="info">{t('driver.pendingApproval')}</Alert>
        </div>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Wallet} label={t('driver.earningsToday')} value={stats ? t('driver.amount', { amount: fnum(stats.earningsToday) }) : '—'} accent="text-emerald-500" />
        <Stat icon={Clock} label={t('driver.tripsCompleted')} value={stats ? fnum(stats.tripsCompleted) : '—'} accent="text-brand-600" />
        <Stat icon={Star} label={t('driver.rating')} value={stats?.avgRating != null ? `${stats.avgRating.toFixed(1)} ★` : '—'} accent="text-amber-500" />
        <Stat icon={CalendarDays} label={t('driver.tripsToday')} value={stats ? fnum(stats.tripsToday) : '—'} accent="text-violet-500" />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">{t('driver.tripRequests')}</h2>
            {activeRide ? (
              <Badge color="blue">{t('driver.onTrip')}</Badge>
            ) : incoming ? (
              <Badge color="amber">{t('driver.newRequest')}</Badge>
            ) : (
              <Badge color="slate">{t('driver.waitingForRequests')}</Badge>
            )}
          </div>
          {activeRide ? (
            <div className="mt-4">
              <TripFlow ride={activeRide} onChange={setActiveRide} />
            </div>
          ) : incoming ? (
            <div className="mt-4">
              <RequestCard
                ride={incoming}
                onAccept={async () => {
                  const ride = await rideApi.driverAction(incoming.id, 'accept');
                  setActiveRide(ride);
                  setIncoming(null);
                }}
                onDecline={() => setIncoming(null)}
              />
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-14 text-center">
              <Car className="h-10 w-10 text-slate-300" />
              <p className="mt-3 font-semibold text-slate-600">{t('driver.noRequestsNow')}</p>
              <p className="mt-1 text-sm text-slate-400">
                {online ? t('driver.requestsRealtime') : t('driver.goOnlineToReceive')}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-brand-600" />
              <h3 className="font-bold text-slate-900">{t('driver.workingArea')}</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {cityName}
              {areaNames && ` — ${areaNames}`}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-brand-600" />
              <h3 className="font-bold text-slate-900">{t('driver.yourCar')}</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {carMake && carModel ? `${carMake} ${carModel}` : t('driver.noCarRegistered')}
              {profile?.car ? ` · ${profile.car.year} · ${profile.car.color}` : ''}
            </p>
            <p className="mt-1 text-xs text-slate-400">{t('driver.plate', { plate: profile?.car?.plateNumber ?? '—' })}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-brand-600" />
              <h3 className="font-bold text-slate-900">{t('driver.wallet')}</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {t('driver.balance')}: <span className="font-bold text-slate-900">{t('driver.amount', { amount: fnum(0) })}</span>
            </p>
            <p className="mt-1 text-xs text-slate-400">{t('driver.withdrawalsHint')}</p>
          </div>
          {!activeRide && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <SosButton />
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Link
          to="/profile"
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-brand-300"
        >
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-slate-400" />
            <div>
              <p className="font-bold text-slate-900">{t('driver.profileDocuments')}</p>
              <p className="text-sm text-slate-500">{t('driver.profileDocumentsSub')}</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-300 rtl:rotate-180" />
        </Link>
        <Link
          to="/history"
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-brand-300"
        >
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-slate-400" />
            <div>
              <p className="font-bold text-slate-900">{t('driver.earningsHistory')}</p>
              <p className="text-sm text-slate-500">
                {stats
                  ? t('driver.earningsSummary', { trips: fnum(stats.tripsCompleted), total: t('driver.amount', { amount: fnum(stats.earningsTotal) }) })
                  : t('driver.breakdowns')}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-300 rtl:rotate-180" />
        </Link>
      </div>
    </div>
  );
}
