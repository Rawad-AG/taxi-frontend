import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Package, Bike, ChevronRight, MapPin, CreditCard, Phone, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { rideApi } from '../lib/rides';
import SosButton from '../components/SosButton';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [tripCount, setTripCount] = useState<number | null>(null);

  useEffect(() => {
    rideApi
      .history()
      .then((rides) => setTripCount(rides.filter((r) => r.status === 'completed').length))
      .catch(() => {});
  }, []);

  const services = [
    {
      icon: Car,
      titleKey: 'customer.services.taxi.title',
      descKey: 'customer.services.taxi.desc',
      to: '/book',
      badgeKey: null,
      disabled: false,
    },
    {
      icon: Package,
      titleKey: 'customer.services.delivery.title',
      descKey: 'customer.services.delivery.desc',
      to: '#',
      badgeKey: 'customer.comingSoon',
      disabled: true,
    },
    {
      icon: Bike,
      titleKey: 'customer.services.item.title',
      descKey: 'customer.services.item.desc',
      to: '#',
      badgeKey: 'customer.comingSoon',
      disabled: true,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {t('customer.welcomeBack', { name: user?.firstName ?? '' })}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t('customer.whatToMove')}</p>
        </div>
        <Link
          to="/profile"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
        >
          <CreditCard className="me-1.5 inline h-4 w-4" /> {t('customer.myAccount')}
        </Link>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {services.map((s) => (
          <Link
            key={s.titleKey}
            to={s.to}
            aria-disabled={s.disabled}
            className={`group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-300 hover:shadow-lg hover:shadow-brand-900/5 ${
              s.disabled ? 'pointer-events-none' : ''
            }`}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
              <s.icon className="h-6 w-6 text-brand-600" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{t(s.titleKey)}</h2>
              {s.badgeKey && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                  {t(s.badgeKey)}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm text-slate-500">{t(s.descKey)}</p>
            <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-brand-600 opacity-0 transition group-hover:opacity-100">
              {s.disabled ? t('customer.soon') : t('customer.bookNow')} <ChevronRight className="h-4 w-4" />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-brand-600" />
            <div>
              <p className="font-bold text-slate-900">{t('customer.favPlaces.title')}</p>
              <p className="text-sm text-slate-500">{t('customer.favPlaces.desc')}</p>
            </div>
          </div>
          <Link
            to="/profile"
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700"
          >
            {t('customer.favPlaces.manage')}
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-slate-400" />
            <h3 className="font-bold text-slate-900">{t('customer.needHelp')}</h3>
          </div>
          <p className="mt-2 text-sm text-slate-500">{t('customer.supportDesc')}</p>
          <a href="tel:+963944444444" className="mt-3 inline-block font-bold text-brand-700 hover:underline">
            944 444 444
          </a>
          <div className="mt-3">
            <SosButton />
          </div>
        </div>
        <Link to="/history" className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-brand-300">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-slate-400" />
            <h3 className="font-bold text-slate-900">{t('customer.rideHistory.title')}</h3>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {tripCount === null || tripCount === 0
              ? t('customer.rideHistory.empty')
              : t('customer.rideHistory.count', { count: tripCount })}
          </p>
          <span className="mt-3 inline-block text-sm font-semibold text-brand-700">
            {tripCount !== null && tripCount > 0 ? t('common.viewAll') : t('customer.browse')}
          </span>
        </Link>
        <Link to="/payments" className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-brand-300">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-slate-400" />
            <h3 className="font-bold text-slate-900">{t('nav.payments')}</h3>
          </div>
          <p className="mt-2 text-sm text-slate-500">{t('customer.paymentsDesc')}</p>
          <span className="mt-3 inline-block text-sm font-semibold text-brand-700">{t('customer.manage')}</span>
        </Link>
      </div>
    </div>
  );
}
