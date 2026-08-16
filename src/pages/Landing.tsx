import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Car,
  Package,
  Bike,
  Clock,
  ShieldCheck,
  Wallet,
  Star,
  MapPin,
  Users,
  Timer,
  Route,
  BadgeCheck,
  FileText,
  MapPinned,
  Landmark,
  CreditCard,
  HandCoins,
  CalendarClock,
  Headphones,
  ChevronDown,
} from 'lucide-react';

export default function Landing() {
  const { t } = useTranslation();

  const services = [
    { icon: Car, title: t('landing.svc.taxiTitle'), desc: t('landing.svc.taxiDesc') },
    { icon: Package, title: t('landing.svc.deliveryTitle'), desc: t('landing.svc.deliveryDesc') },
    { icon: Bike, title: t('landing.svc.itemTitle'), desc: t('landing.svc.itemDesc') },
  ];

  const stats = [
    { icon: MapPinned, value: '5+', title: t('landing.stats.citiesTitle'), desc: t('landing.stats.citiesDesc') },
    { icon: Route, value: '10K+', title: t('landing.stats.ridesTitle'), desc: t('landing.stats.ridesDesc') },
    { icon: Users, value: '500+', title: t('landing.stats.driversTitle'), desc: t('landing.stats.driversDesc') },
    { icon: Timer, value: '< 4 min', title: t('landing.stats.responseTitle'), desc: t('landing.stats.responseDesc') },
  ];

  const steps = [
    {
      n: '01',
      icon: MapPinned,
      title: t('landing.step1Title'),
      desc: t('landing.step1Desc'),
      bullets: [t('landing.step1Bullet1'), t('landing.step1Bullet2')],
    },
    {
      n: '02',
      icon: Users,
      title: t('landing.step2Title'),
      desc: t('landing.step2Desc'),
      bullets: [t('landing.step2Bullet1'), t('landing.step2Bullet2')],
    },
    {
      n: '03',
      icon: MapPin,
      title: t('landing.step3Title'),
      desc: t('landing.step3Desc'),
      bullets: [t('landing.step3Bullet1'), t('landing.step3Bullet2')],
    },
    {
      n: '04',
      icon: Wallet,
      title: t('landing.step4Title'),
      desc: t('landing.step4Desc'),
      bullets: [t('landing.step4Bullet1'), t('landing.step4Bullet2')],
    },
  ];

  const values = [
    { icon: HandCoins, title: t('landing.values.fair.title'), desc: t('landing.values.fair.desc') },
    { icon: ShieldCheck, title: t('landing.values.safe.title'), desc: t('landing.values.safe.desc') },
    { icon: MapPinned, title: t('landing.values.local.title'), desc: t('landing.values.local.desc') },
    { icon: FileText, title: t('landing.values.transparent.title'), desc: t('landing.values.transparent.desc') },
  ];

  const safety = [
    { icon: ShieldCheck, title: t('landing.safety.sos.title'), desc: t('landing.safety.sos.desc') },
    { icon: MapPin, title: t('landing.safety.track.title'), desc: t('landing.safety.track.desc') },
    { icon: BadgeCheck, title: t('landing.safety.verify.title'), desc: t('landing.safety.verify.desc') },
    { icon: FileText, title: t('landing.safety.record.title'), desc: t('landing.safety.record.desc') },
  ];

  const payMethods = [
    { icon: Wallet, title: t('landing.pay.cash.title'), desc: t('landing.pay.cash.desc') },
    { icon: Landmark, title: t('landing.pay.bucket.title'), desc: t('landing.pay.bucket.desc') },
    { icon: CreditCard, title: t('landing.pay.later.title'), desc: t('landing.pay.later.desc') },
  ];

  const perks = [
    { icon: HandCoins, title: t('landing.perks.earn.title'), desc: t('landing.perks.earn.desc') },
    { icon: CalendarClock, title: t('landing.perks.time.title'), desc: t('landing.perks.time.desc') },
    { icon: Headphones, title: t('landing.perks.support.title'), desc: t('landing.perks.support.desc') },
    { icon: Wallet, title: t('landing.perks.payout.title'), desc: t('landing.perks.payout.desc') },
  ];

  const faqs = [
    { q: t('landing.faq.q1'), a: t('landing.faq.a1') },
    { q: t('landing.faq.q2'), a: t('landing.faq.a2') },
    { q: t('landing.faq.q3'), a: t('landing.faq.a3') },
    { q: t('landing.faq.q4'), a: t('landing.faq.a4') },
    { q: t('landing.faq.q5'), a: t('landing.faq.a5') },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 text-white">
        <div className="absolute -end-24 -top-24 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -start-24 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
              <MapPin className="h-3.5 w-3.5 text-amber-400" /> {t('landing.cities')}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              {t('landing.heroLine1')}
              <br />
              {t('landing.heroLine2')}
              <br />
              <span className="text-amber-400">{t('landing.heroLine3')}</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-brand-100">{t('landing.heroDesc')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="rounded-xl bg-amber-400 px-6 py-3 font-bold text-brand-950 shadow-lg shadow-amber-500/30 transition hover:bg-amber-300"
              >
                {t('landing.ctaFirstRide')}
              </Link>
              <Link
                to="/signup"
                className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-bold backdrop-blur transition hover:bg-white/20"
              >
                {t('landing.ctaBecomeDriver')}
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </span>
                <span className="font-semibold">{t('landing.rating')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span className="font-semibold">{t('landing.verifiedDrivers')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wallet className="h-4 w-4 text-emerald-400" />
                <span className="font-semibold">{t('landing.fairPrices')}</span>
              </div>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative h-80 w-80 rounded-3xl bg-white/10 p-8 backdrop-blur">
                <div className="flex h-full flex-col justify-between rounded-2xl bg-white p-5 text-slate-900 shadow-2xl">
                  <div>
                    <div className="flex items-center gap-2">
                      <Car className="h-5 w-5 text-brand-600" />
                      <span className="font-bold">DRMTaxi</span>
                    </div>
                    <div className="mt-6 space-y-4 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full bg-emerald-500" />
                        <div>
                          <p className="font-semibold">{t('landing.mock.pickup')}</p>
                          <p className="text-xs text-slate-400">{t('landing.mock.arrival')}</p>
                        </div>
                      </div>
                      <div className="ms-1.5 h-6 w-px bg-slate-200" />
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full bg-brand-600" />
                        <div>
                          <p className="font-semibold">{t('landing.mock.dropoff')}</p>
                          <p className="text-xs text-slate-400">{t('landing.mock.tripTime')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs font-medium text-slate-500">{t('landing.mock.estimate')}</span>
                    <span className="text-lg font-extrabold text-brand-700">25,000 SYP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-b border-brand-800 bg-brand-900">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 text-white md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.title} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <s.icon className="h-5 w-5 text-amber-400" />
              </span>
              <div>
                <p className="text-xl font-extrabold">{s.value}</p>
                <p className="text-sm font-semibold text-brand-100">{s.title}</p>
                <p className="text-xs text-brand-300">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">{t('landing.servicesTitle')}</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-500">{t('landing.servicesDesc')}</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-brand-300 hover:shadow-lg hover:shadow-brand-900/5"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                <s.icon className="h-6 w-6 text-brand-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{s.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About us */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">{t('landing.about.title')}</h2>
              <p className="mt-4 leading-relaxed text-slate-600">{t('landing.about.p1')}</p>
              <p className="mt-3 leading-relaxed text-slate-600">{t('landing.about.p2')}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {values.map((v) => (
                <div key={v.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/10">
                    <v.icon className="h-5 w-5 text-brand-700" />
                  </span>
                  <h3 className="mt-3 font-bold text-slate-900">{v.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works — extended */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">{t('landing.howTitle')}</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-500">{t('landing.howSubtitle')}</p>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:shadow-lg hover:shadow-brand-900/5">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
                  <s.icon className="h-5 w-5 text-brand-600" />
                </span>
                <span className="text-3xl font-extrabold text-brand-100">{s.n}</span>
              </div>
              <h3 className="mt-4 font-bold text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
              <ul className="mt-3 space-y-1.5">
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-xs text-slate-600">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-brand-50/50 p-6">
            <h3 className="flex items-center gap-2 font-bold text-slate-900">
              <Car className="h-5 w-5 text-brand-700" /> {t('landing.howRiderTitle')}
            </h3>
            <ul className="mt-3 space-y-2">
              {[t('landing.howRider1'), t('landing.howRider2'), t('landing.howRider3'), t('landing.howRider4')].map((i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  {i}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="flex items-center gap-2 font-bold text-slate-900">
              <Users className="h-5 w-5 text-brand-700" /> {t('landing.howDriverTitle')}
            </h3>
            <ul className="mt-3 space-y-2">
              {[t('landing.howDriver1'), t('landing.howDriver2'), t('landing.howDriver3'), t('landing.howDriver4')].map((i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Safety & trust */}
      <section className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 py-16 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-extrabold tracking-tight">{t('landing.safety.title')}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-brand-100">{t('landing.safety.subtitle')}</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {safety.map((s) => (
              <div key={s.title} className="rounded-2xl bg-white/5 p-6 backdrop-blur transition hover:bg-white/10">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/15">
                  <s.icon className="h-6 w-6 text-amber-400" />
                </span>
                <h3 className="mt-4 font-bold">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-brand-100">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payments */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">{t('landing.pay.title')}</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-500">{t('landing.pay.subtitle')}</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {payMethods.map((m) => (
            <div key={m.title} className="rounded-2xl border border-slate-200 bg-white p-6 text-center transition hover:border-brand-300 hover:shadow-lg hover:shadow-brand-900/5">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                <m.icon className="h-6 w-6 text-brand-600" />
              </span>
              <h3 className="mt-4 font-bold text-slate-900">{m.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{m.desc}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-center text-sm font-medium text-amber-800">
          {t('landing.pay.transparent')}
        </p>
      </section>

      {/* Driver perks + CTA */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">{t('landing.perks.title')}</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-slate-500">{t('landing.perks.subtitle')}</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {perks.map((p) => (
              <div key={p.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/10">
                  <p.icon className="h-5 w-5 text-brand-700" />
                </span>
                <h3 className="mt-3 font-bold text-slate-900">{p.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-10 text-white md:flex-row">
            <div>
              <h2 className="text-2xl font-extrabold">{t('landing.driveTitle')}</h2>
              <p className="mt-2 max-w-md text-brand-100">{t('landing.driveDesc')}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-5 w-5 text-amber-400" />
                <span>{t('landing.online24h')}</span>
              </div>
              <Link
                to="/signup"
                className="rounded-xl bg-white px-6 py-3 font-bold text-brand-900 transition hover:bg-brand-50"
              >
                {t('landing.registerDriver')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">{t('landing.faq.title')}</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-500">{t('landing.faq.subtitle')}</p>
        <div className="mt-8 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 open:border-brand-300">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-slate-900">
                {f.q}
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="pb-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-3xl bg-amber-400 p-10 text-center text-brand-950">
            <h2 className="text-3xl font-extrabold">{t('landing.ctaTitle')}</h2>
            <p className="mx-auto mt-2 max-w-xl font-medium text-brand-900/80">{t('landing.ctaDesc')}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/signup"
                className="rounded-xl bg-brand-950 px-6 py-3 font-bold text-white transition hover:bg-brand-900"
              >
                {t('landing.ctaBookNow')}
              </Link>
              <Link
                to="/signup"
                className="rounded-xl border-2 border-brand-950/20 bg-transparent px-6 py-3 font-bold text-brand-950 transition hover:bg-brand-950/10"
              >
                {t('landing.ctaDriverJoin')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
