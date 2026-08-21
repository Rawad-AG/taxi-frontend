import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Badge, Alert, Button, Field, Input } from '../components/ui';
import { Car, MapPin, Phone, ShieldCheck, Wallet, Star, Trash2, Plus, Camera, Pencil, Save, X } from 'lucide-react';
import { formatSyrianPhone } from '../lib/phone';
import { fdate, fnum } from '../i18n/format';
import { profileApi } from '../lib/profile';
import { paymentsApi } from '../lib/payments';
import { getErrorMessage } from '../lib/api';
import MapPicker, { type MapPoint } from '../components/MapPicker';
import type { PaymentStatus } from '../types/payment';
import type { PayLaterDebt } from '../types/payment';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-3 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-end font-medium text-slate-900">{value}</span>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
        <span className="text-brand-600">{icon}</span>
        <h2 className="font-bold text-slate-900">{title}</h2>
      </div>
      <div className="px-6 pb-4">{children}</div>
    </div>
  );
}

function OtpStep({ hint, devOtp, error, code, setCode, busy, onSubmit, onCancel }: {
  hint: string;
  devOtp?: string;
  error: string;
  code: string;
  setCode: (v: string) => void;
  busy: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-slate-600">{hint}</p>
      {devOtp && (
        <Alert tone="info">
          {t('auth.otp.devHint')} <b>{devOtp}</b>
        </Alert>
      )}
      {error && <Alert tone="error">{error}</Alert>}
      <Input
        placeholder={t('auth.otp.placeholder')}
        inputMode="numeric"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
      />
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          {t('common.cancel')}
        </Button>
        <Button onClick={onSubmit} loading={busy}>
          {t('common.confirm')}
        </Button>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, setUser } = useAuth();
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // --- name editing ---
  const [editingName, setEditingName] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // --- change phone ---
  const [phoneStep, setPhoneStep] = useState<'idle' | 'form' | 'otp'>('idle');
  const [newPhone, setNewPhone] = useState('');
  const [phoneChallenge, setPhoneChallenge] = useState<{ phone: string; devOtp?: string } | null>(null);
  const [phoneCode, setPhoneCode] = useState('');

  // --- 2fa ---
  const [twoFactorPending, setTwoFactorPending] = useState<boolean | null>(null);
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<{ devOtp?: string } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // --- saved places ---
  const [addingPlace, setAddingPlace] = useState(false);
  const [placeForm, setPlaceForm] = useState<{ name: string; label: string; point: MapPoint | null }>({ name: '', label: '', point: null });

  // --- saved routes ---
  const [addingRoute, setAddingRoute] = useState(false);
  const [routeMode, setRouteMode] = useState<'pickup' | 'dropoff'>('pickup');
  const [routeForm, setRouteForm] = useState<{ name: string; pickup: MapPoint | null; dropoff: MapPoint | null }>({ name: '', pickup: null, dropoff: null });

  // --- payments ---
  const [payments, setPayments] = useState<PaymentStatus | null>(null);
  const [debts, setDebts] = useState<PayLaterDebt[]>([]);

  useEffect(() => {
    paymentsApi
      .status()
      .then(setPayments)
      .catch(() => {});
    paymentsApi
      .debts()
      .then(setDebts)
      .catch(() => {});
  }, []);

  if (!user) return null;
  const isDriver = user.role === 'driver';
  const p = user.driverProfile;
  const places = user.savedPlaces ?? [];
  const routes = user.savedRoutes ?? [];
  const displayName = isDriver ? p?.fullName ?? 'Driver' : `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  const initial = displayName[0] ?? 'U';

  const cityName = isDriver && typeof p?.workingCity === 'object' && p?.workingCity ? p.workingCity.name : '';
  const rawAreas = isDriver && p?.workingAreas ? p.workingAreas.map((a) => (typeof a === 'object' ? a.name : '')) : [];
  const areaNames = rawAreas.filter(Boolean).join(', ');
  const carMake = isDriver && typeof p?.car?.make === 'object' && p?.car?.make ? p.car.make.name : '';
  const carModel = isDriver && typeof p?.car?.model === 'object' && p?.car?.model ? p.car.model.name : '';

  const applyUser = (u: typeof user) => setUser(u);

  const saveName = async () => {
    setError('');
    setSaved('');
    setBusy(true);
    try {
      const u = await profileApi.update(isDriver ? { firstName: firstName } : { firstName, lastName });
      applyUser(u);
      setEditingName(false);
      setSaved(t('profile.savedName'));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const pickAvatar = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError(t('profile.avatarNotImage'));
      return;
    }
    if (file.size > 2_500_000) {
      setError(t('profile.avatarTooLarge'));
      return;
    }
    setError('');
    setSaved('');
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('read-failed'));
      });
      const u = await profileApi.update({ avatar: dataUrl });
      applyUser(u);
      setSaved(t('profile.avatarSaved'));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const requestChangePhone = async () => {
    setError('');
    setSaved('');
    setBusy(true);
    try {
      const ch = await profileApi.requestChangePhone(formatSyrianPhone(newPhone));
      setPhoneChallenge({ phone: ch.phone, devOtp: ch.devOtp });
      setPhoneStep('otp');
      setPhoneCode('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const verifyChangePhone = async () => {
    setError('');
    setBusy(true);
    try {
      const { user: u, accessToken } = await profileApi.verifyChangePhone(phoneCode);
      localStorage.setItem('drmtaxi.token', accessToken);
      applyUser(u);
      setPhoneStep('idle');
      setNewPhone('');
      setPhoneChallenge(null);
      setPhoneCode('');
      setSaved(t('profile.phoneChanged'));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleTwoFactor = async (enabled: boolean) => {
    setError('');
    setSaved('');
    setBusy(true);
    try {
      const ch = await profileApi.requestTwoFactor();
      setTwoFactorPending(enabled);
      setTwoFactorChallenge({ devOtp: ch.devOtp });
      setTwoFactorCode('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const confirmTwoFactor = async () => {
    if (twoFactorPending === null) return;
    setError('');
    setBusy(true);
    try {
      const u = await profileApi.confirmTwoFactor(twoFactorPending, twoFactorCode);
      applyUser(u);
      setTwoFactorPending(null);
      setTwoFactorChallenge(null);
      setTwoFactorCode('');
      setSaved(twoFactorPending ? t('profile.twoFactorEnabled') : t('profile.twoFactorDisabled'));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submitPlace = async () => {
    if (!placeForm.point) return;
    setError('');
    setBusy(true);
    try {
      const u = await profileApi.addPlace({ name: placeForm.name, label: placeForm.label, lat: placeForm.point.lat, lng: placeForm.point.lng });
      applyUser(u);
      setAddingPlace(false);
      setPlaceForm({ name: '', label: '', point: null });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const deletePlace = async (id: string) => {
    setError('');
    setBusy(true);
    try {
      applyUser(await profileApi.deletePlace(id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submitRoute = async () => {
    if (!routeForm.pickup || !routeForm.dropoff) return;
    setError('');
    setBusy(true);
    try {
      const u = await profileApi.addRoute({ name: routeForm.name, pickup: routeForm.pickup, dropoff: routeForm.dropoff });
      applyUser(u);
      setAddingRoute(false);
      setRouteForm({ name: '', pickup: null, dropoff: null });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const deleteRoute = async (id: string) => {
    setError('');
    setBusy(true);
    try {
      applyUser(await profileApi.deleteRoute(id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const payDebt = async (id: string) => {
    setError('');
    setBusy(true);
    try {
      await paymentsApi.payDebt(id);
      setPayments(await paymentsApi.status());
      setDebts(await paymentsApi.debts());
      setSaved(t('profile.debtPaid'));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const toggle = twoFactorPending !== null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{t('profile.title')}</h1>
      <p className="mt-1 text-sm text-slate-500">{t('profile.subtitle')}</p>

      {user.status === 'pending' && (
        <div className="mt-5">
          <Alert tone="info">{t('profile.pendingApproval')}</Alert>
        </div>
      )}
      {error && (
        <div className="mt-5">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      {saved && (
        <div className="mt-5">
          <Alert tone="success">{saved}</Alert>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between bg-gradient-to-r from-brand-50 to-white px-6 py-4">
          <div className="flex items-center gap-3">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-xl font-extrabold text-white">
                {initial}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                {editingName ? (
                  <>
                    <Input className="w-28 py-1 text-sm" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    {!isDriver && <Input className="w-28 py-1 text-sm" value={lastName} onChange={(e) => setLastName(e.target.value)} />}
                    <Button className="px-2 py-1 text-xs" onClick={saveName} loading={busy} disabled={isDriver ? firstName.trim().length < 2 : firstName.trim().length < 2 || lastName.trim().length < 2}>
                      <Save className="h-3.5 w-3.5" />
                    </Button>
                    <button onClick={() => setEditingName(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title={t('common.cancel')}>
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-slate-900">{displayName}</p>
                    <button
                      onClick={() => {
                        setFirstName(isDriver ? (p?.fullName ?? '') : (user.firstName ?? ''));
                        setLastName(user.lastName ?? '');
                        setEditingName(true);
                      }}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                      title={t('profile.editName')}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
              <p className="text-xs capitalize text-slate-500">{user.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user.status === 'active' && <Badge color="green">{t('common.active')}</Badge>}
            {user.status === 'pending' && <Badge color="amber">{t('common.pending')}</Badge>}
            {user.status === 'suspended' && <Badge color="red">{t('common.suspended')}</Badge>}
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
              title={t('profile.changeAvatar')}
            >
              <Camera className="me-1 inline h-3.5 w-3.5" /> {t('profile.changeAvatar')}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void pickAvatar(f);
              }}
            />
          </div>
        </div>
        <div className="px-6 pb-4">
          <Row label={t('common.phone')} value={formatSyrianPhone(user.phone)} />
          <Row label={t('profile.memberSince')} value={fdate(user.createdAt)} />
          {isDriver && (
            <>
              <Row label={t('profile.fatherName')} value={p?.fatherName ?? t('common.notAvailable')} />
              <Row label={t('profile.nationalId')} value={p?.nationalId ?? t('common.notAvailable')} />
              <Row label={t('profile.licenseNumber')} value={p?.licenseNumber ?? t('common.notAvailable')} />
              <Row label={t('profile.licenseExpiry')} value={p?.licenseExpiry ? fdate(p.licenseExpiry) : t('common.notAvailable')} />
            </>
          )}
        </div>
      </div>

      <Section icon={<Phone className="h-5 w-5" />} title={t('profile.phoneSection')}>
        {phoneStep === 'idle' && (
          <Button variant="secondary" onClick={() => setPhoneStep('form')}>
            {t('profile.changePhone')}
          </Button>
        )}
        {phoneStep === 'form' && (
          <div className="mt-3 space-y-3">
            <Field label={t('profile.newPhone')} hint={t('auth.customerSignup.phoneHint')}>
              <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+963 9XX XXX XXX" />
            </Field>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setPhoneStep('idle')} disabled={busy}>
                {t('common.cancel')}
              </Button>
              <Button onClick={requestChangePhone} loading={busy} disabled={!formatSyrianPhone(newPhone).match(/^\+9639\d{8}$/)}>
                {t('common.next')}
              </Button>
            </div>
          </div>
        )}
        {phoneStep === 'otp' && phoneChallenge && (
          <OtpStep
            hint={t('profile.otpToNewPhone', { phone: phoneChallenge.phone })}
            devOtp={phoneChallenge.devOtp}
            error={error}
            code={phoneCode}
            setCode={setPhoneCode}
            busy={busy}
            onSubmit={verifyChangePhone}
            onCancel={() => setPhoneStep('form')}
          />
        )}
      </Section>

      <Section icon={<ShieldCheck className="h-5 w-5" />} title={t('profile.twoFactorTitle')}>
        <p className="text-sm text-slate-500">{t('profile.twoFactorDesc')}</p>
        <div className="mt-3 flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3">
          <span className="text-sm font-semibold text-slate-700">
            {user.twoFactorEnabled ? t('profile.twoFactorOn') : t('profile.twoFactorOff')}
          </span>
          <button
            onClick={() => void toggleTwoFactor(!user.twoFactorEnabled)}
            disabled={toggle}
            aria-label={user.twoFactorEnabled ? t('profile.disable2fa') : t('profile.enable2fa')}
            className={`relative h-6 w-11 rounded-full transition ${user.twoFactorEnabled ? 'bg-brand-600' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${user.twoFactorEnabled ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
        {toggle && twoFactorChallenge && (
          <OtpStep
            hint={t('profile.twoFactorOtpHint', { action: twoFactorPending ? t('profile.enable2fa') : t('profile.disable2fa') })}
            devOtp={twoFactorChallenge.devOtp}
            error={error}
            code={twoFactorCode}
            setCode={setTwoFactorCode}
            busy={busy}
            onSubmit={confirmTwoFactor}
            onCancel={() => {
              setTwoFactorPending(null);
              setTwoFactorChallenge(null);
            }}
          />
        )}
      </Section>

      <Section icon={<MapPin className="h-5 w-5" />} title={t('profile.placesTitle')}>
        <p className="text-sm text-slate-500">{t('profile.placesDesc')}</p>
        {places.length > 0 && (
          <div className="mt-3 space-y-2">
            {places.map((pl) => (
              <div key={pl._id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5">
                <div>
                  <p className="text-sm font-bold text-slate-800">{pl.name}</p>
                  <p className="text-xs text-slate-500">
                    {pl.label || `${pl.lat.toFixed(4)}, ${pl.lng.toFixed(4)}`}
                  </p>
                </div>
                <button onClick={() => void deletePlace(pl._id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title={t('common.delete')}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        {!addingPlace ? (
          <Button variant="secondary" className="mt-3" onClick={() => setAddingPlace(true)}>
            <Plus className="h-4 w-4" /> {t('profile.addPlace')}
          </Button>
        ) : (
          <div className="mt-3 space-y-3">
            <Field label={t('profile.placeName')}>
              <Input value={placeForm.name} onChange={(e) => setPlaceForm({ ...placeForm, name: e.target.value })} />
            </Field>
            <Field label={t('profile.placeLabel')}>
              <Input value={placeForm.label} onChange={(e) => setPlaceForm({ ...placeForm, label: e.target.value })} />
            </Field>
            <MapPicker
              center={{ lat: 33.5138, lng: 36.2765 }}
              pickup={placeForm.point}
              dropoff={null}
              onPick={(point) => setPlaceForm((f) => ({ ...f, point: { lat: point.lat, lng: point.lng, label: point.label ?? f.label } }))}
              height="220px"
            />
            {placeForm.point && <p className="text-xs text-slate-500">{placeForm.point.lat.toFixed(5)}, {placeForm.point.lng.toFixed(5)}</p>}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setAddingPlace(false)} disabled={busy}>
                {t('common.cancel')}
              </Button>
              <Button onClick={submitPlace} loading={busy} disabled={!placeForm.name.trim() || !placeForm.point}>
                {t('common.save')}
              </Button>
            </div>
          </div>
        )}
      </Section>

      <Section icon={<Star className="h-5 w-5" />} title={t('profile.routesTitle')}>
        <p className="text-sm text-slate-500">{t('profile.routesDesc')}</p>
        {routes.length > 0 && (
          <div className="mt-3 space-y-2">
            {routes.map((r) => (
              <div key={r._id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5">
                <div>
                  <p className="text-sm font-bold text-slate-800">{r.name}</p>
                  <p className="text-xs text-slate-500">
                    {r.pickup.label || `${r.pickup.lat.toFixed(4)}, ${r.pickup.lng.toFixed(4)}`} → {r.dropoff.label || `${r.dropoff.lat.toFixed(4)}, ${r.dropoff.lng.toFixed(4)}`}
                  </p>
                </div>
                <button onClick={() => void deleteRoute(r._id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title={t('common.delete')}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        {!addingRoute ? (
          <Button variant="secondary" className="mt-3" onClick={() => setAddingRoute(true)}>
            <Plus className="h-4 w-4" /> {t('profile.addRoute')}
          </Button>
        ) : (
          <div className="mt-3 space-y-3">
            <Field label={t('profile.routeName')}>
              <Input value={routeForm.name} onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })} />
            </Field>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setRouteMode('pickup')}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${routeMode === 'pickup' ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
              >
                {t('book.pickup')}: {routeForm.pickup?.label || t('profile.tapMap')}
              </button>
              <button
                onClick={() => setRouteMode('dropoff')}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${routeMode === 'dropoff' ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
              >
                {t('book.dropoff')}: {routeForm.dropoff?.label || t('profile.tapMap')}
              </button>
            </div>
            <MapPicker
              center={{ lat: 33.5138, lng: 36.2765 }}
              pickup={routeForm.pickup}
              dropoff={routeForm.dropoff}
              onPick={(point) => {
                setRouteForm((f) =>
                  routeMode === 'pickup' ? { ...f, pickup: { lat: point.lat, lng: point.lng, label: point.label ?? f.pickup?.label } } : { ...f, dropoff: { lat: point.lat, lng: point.lng, label: point.label ?? f.dropoff?.label } },
                );
              }}
              height="220px"
            />
            {places.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {places.map((pl) => (
                  <button
                    key={pl._id}
                    onClick={() =>
                      setRouteForm((f) =>
                        routeMode === 'pickup'
                          ? { ...f, pickup: { lat: pl.lat, lng: pl.lng, label: pl.name } }
                          : { ...f, dropoff: { lat: pl.lat, lng: pl.lng, label: pl.name } },
                      )
                    }
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand-300 hover:text-brand-700"
                  >
                    {pl.name}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setAddingRoute(false)} disabled={busy}>
                {t('common.cancel')}
              </Button>
              <Button onClick={submitRoute} loading={busy} disabled={!routeForm.name.trim() || !routeForm.pickup || !routeForm.dropoff}>
                {t('common.save')}
              </Button>
            </div>
          </div>
        )}
      </Section>

      <Section icon={<Wallet className="h-5 w-5" />} title={t('profile.paymentsTitle')}>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('pay.bucketBalance')}</p>
            <p className="mt-1 text-xl font-extrabold text-brand-700">
              {payments ? t('pay.amountSyp', { amount: fnum(payments.bucketBalance) }) : t('common.notAvailable')}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t('pay.payLaterAccount')}</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {payments ? (payments.payLater.eligible ? `${t('pay.completedRides')}: ${payments.payLater.completedRides}` : t('pay.locked')) : t('common.notAvailable')}
            </p>
            {payments && !payments.payLater.eligible && <p className="mt-1 text-xs text-slate-400">{payments.payLater.blockedReason}</p>}
          </div>
        </div>
        {debts.length > 0 && (
          <div className="mt-4 space-y-2">
            {debts.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5">
                <div>
                  <p className="text-sm font-bold text-slate-800">{t('pay.amountSyp', { amount: fnum(d.amount) })}</p>
                  <p className="text-xs text-slate-500">{new Date(d.dueDate).getTime() < Date.now() ? t('pay.overdueDue', { date: fdate(d.dueDate) }) : t('pay.due', { date: fdate(d.dueDate) })}</p>
                </div>
                <Button variant="secondary" className="px-3 py-1.5 text-xs" loading={busy} onClick={() => void payDebt(d.id)}>
                  {t('pay.payFromBucket')}
                </Button>
              </div>
            ))}
          </div>
        )}
        <Link to="/payments" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">
          {t('profile.managePayments')}
        </Link>
      </Section>

      {isDriver && (
        <>
          <Section icon={<MapPin className="h-5 w-5" />} title={t('profile.workingArea')}>
            <Row label={t('common.city')} value={cityName || t('common.notAvailable')} />
            <Row label={t('profile.areas')} value={areaNames || t('common.notAvailable')} />
          </Section>

          <Section icon={<Car className="h-5 w-5" />} title={t('profile.car')}>
            <Row label={t('profile.makeModel')} value={carMake && carModel ? `${carMake} ${carModel}` : t('common.notAvailable')} />
            <Row label={t('profile.year')} value={p?.car?.year != null ? String(p.car.year) : t('common.notAvailable')} />
            <Row label={t('profile.color')} value={p?.car?.color ?? t('common.notAvailable')} />
            <Row label={t('profile.plateNumber')} value={p?.car?.plateNumber ?? t('common.notAvailable')} />
            <Row label={t('profile.seats')} value={p?.car?.seats != null ? String(p.car.seats) : t('common.notAvailable')} />
            <Row label={t('profile.class')} value={p?.car?.category ? t(`book.cat.${p.car.category}`) : t('common.notAvailable')} />
          </Section>
        </>
      )}

      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-900">
        <Phone className="h-4 w-4 shrink-0" />
        {t('profile.supportLine', { phone: '944 444 444' })}
      </div>
    </div>
  );
}
