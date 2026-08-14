import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Badge, Alert } from '../components/ui';
import { Car, MapPin, Phone } from 'lucide-react';
import { formatSyrianPhone } from '../lib/phone';
import { fdate } from '../i18n/format';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-3 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-end font-medium text-slate-900">{value}</span>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (!user) return null;
  const isDriver = user.role === 'driver';
  const p = user.driverProfile;

  const cityName = isDriver && typeof p?.workingCity === 'object' && p?.workingCity ? p.workingCity.name : '';
  const rawAreas = isDriver && p?.workingAreas ? p.workingAreas.map((a) => (typeof a === 'object' ? a.name : '')) : [];
  const areaNames = rawAreas.filter(Boolean).join(', ');
  const carMake = isDriver && typeof p?.car?.make === 'object' && p?.car?.make ? p.car.make.name : '';
  const carModel = isDriver && typeof p?.car?.model === 'object' && p?.car?.model ? p.car.model.name : '';

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{t('profile.title')}</h1>
      <p className="mt-1 text-sm text-slate-500">{t('profile.subtitle')}</p>

      {user.status === 'pending' && (
        <div className="mt-5">
          <Alert tone="info">{t('profile.pendingApproval')}</Alert>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between bg-gradient-to-r from-brand-50 to-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-lg font-extrabold text-white">
              {(isDriver ? p?.fullName?.[0] : user.firstName?.[0]) ?? 'U'}
            </div>
            <div>
              <p className="font-bold text-slate-900">{isDriver ? p?.fullName : `${user.firstName} ${user.lastName}`}</p>
              <p className="text-xs capitalize text-slate-500">{user.role}</p>
            </div>
          </div>
          {user.status === 'active' && <Badge color="green">{t('common.active')}</Badge>}
          {user.status === 'pending' && <Badge color="amber">{t('common.pending')}</Badge>}
          {user.status === 'suspended' && <Badge color="red">{t('common.suspended')}</Badge>}
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

      {isDriver && (
        <>
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
              <MapPin className="h-5 w-5 text-brand-600" />
              <h2 className="font-bold text-slate-900">{t('profile.workingArea')}</h2>
            </div>
            <div className="px-6 pb-4">
              <Row label={t('common.city')} value={cityName || t('common.notAvailable')} />
              <Row label={t('profile.areas')} value={areaNames || t('common.notAvailable')} />
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
              <Car className="h-5 w-5 text-brand-600" />
              <h2 className="font-bold text-slate-900">{t('profile.car')}</h2>
            </div>
            <div className="px-6 pb-4">
              <Row label={t('profile.makeModel')} value={carMake && carModel ? `${carMake} ${carModel}` : t('common.notAvailable')} />
              <Row label={t('profile.year')} value={p?.car?.year != null ? String(p.car.year) : t('common.notAvailable')} />
              <Row label={t('profile.color')} value={p?.car?.color ?? t('common.notAvailable')} />
              <Row label={t('profile.plateNumber')} value={p?.car?.plateNumber ?? t('common.notAvailable')} />
              <Row label={t('profile.seats')} value={p?.car?.seats != null ? String(p.car.seats) : t('common.notAvailable')} />
              <Row label={t('profile.class')} value={p?.car?.category ? t(`book.cat.${p.car.category}`) : t('common.notAvailable')} />
            </div>
          </div>
        </>
      )}

      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-900">
        <Phone className="h-4 w-4 shrink-0" />
        {t('profile.supportLine', { phone: '944 444 444' })}
      </div>
    </div>
  );
}
