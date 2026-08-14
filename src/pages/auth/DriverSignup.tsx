import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Check, ChevronRight, UserRound, IdCard, MapPin, Car, ClipboardCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Field, Input, Select, Spinner } from '../../components/ui';
import { PhoneInput } from '../../components/PhoneInput';
import { useAuth } from '../../context/AuthContext';
import { BackButton } from './Signup';
import { api } from '../../lib/api';
import { fdate } from '../../i18n/format';
import type { Area, CarMake, CarModel, City } from '../../types';

interface DriverForm {
  fullName: string;
  fatherName: string;
  phone: string;
  password: string;
  nationalId: string;
  licenseNumber: string;
  licenseExpiry: string;
  workingCity: string;
  workingAreas: string[];
  car: {
    make: string;
    model: string;
    year: string;
    color: string;
    plateNumber: string;
    seats: string;
    category: 'economy' | 'comfort' | 'luxury' | 'van';
  };
}

const initialForm: DriverForm = {
  fullName: '',
  fatherName: '',
  phone: '',
  password: '',
  nationalId: '',
  licenseNumber: '',
  licenseExpiry: '',
  workingCity: '',
  workingAreas: [],
  car: { make: '', model: '', year: '', color: '', plateNumber: '', seats: '4', category: 'economy' },
};

export default function DriverSignup({ onBack }: { onBack: () => void }) {
  const { registerDriver } = useAuth();
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<DriverForm>(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [makes, setMakes] = useState<CarMake[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const STEPS = [
    { label: t('auth.driverSignup.step.personal'), icon: UserRound },
    { label: t('auth.driverSignup.step.license'), icon: IdCard },
    { label: t('auth.driverSignup.step.workArea'), icon: MapPin },
    { label: t('auth.driverSignup.step.car'), icon: Car },
    { label: t('auth.driverSignup.step.review'), icon: ClipboardCheck },
  ];

  useEffect(() => {
    let active = true;
    Promise.all([api.get<{ cities: City[] }>('/lookups/cities'), api.get<{ carMakes: CarMake[] }>('/lookups/car-makes')])
      .then(([c, m]) => {
        if (!active) return;
        setCities(c.data.cities);
        setMakes(m.data.carMakes);
      })
      .finally(() => active && setDataLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!form.workingCity) {
      setAreas([]);
      return;
    }
    api.get<{ areas: Area[] }>(`/lookups/cities/${form.workingCity}/areas`).then((res) => setAreas(res.data.areas));
  }, [form.workingCity]);

  useEffect(() => {
    if (!form.car.make) {
      setModels([]);
      return;
    }
    api.get<{ carModels: CarModel[] }>(`/lookups/car-makes/${form.car.make}/models`).then((res) => setModels(res.data.carModels));
  }, [form.car.make]);

  const set = useCallback(<K extends keyof DriverForm>(key: K, value: DriverForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  const toggleArea = (id: string) => {
    setForm((f) => ({
      ...f,
      workingAreas: f.workingAreas.includes(id) ? f.workingAreas.filter((a) => a !== id) : [...f.workingAreas, id],
    }));
  };

  const validateStep = (): string | null => {
    switch (step) {
      case 0:
        if (form.fullName.trim().length < 3) return t('auth.driverSignup.err.fullName');
        if (form.fatherName.trim().length < 2) return t('auth.driverSignup.err.fatherName');
        if (!/^\d{8,11}$/.test(form.nationalId)) return t('auth.driverSignup.err.nationalId');
        if (!form.phone.startsWith('+963')) return t('auth.driverSignup.err.phone');
        if (form.password.length < 6) return t('auth.driverSignup.err.password');
        return null;
      case 1:
        if (form.licenseNumber.trim().length < 4) return t('auth.driverSignup.err.licenseNumber');
        if (!form.licenseExpiry || new Date(form.licenseExpiry) <= new Date()) return t('auth.driverSignup.err.licenseExpiry');
        return null;
      case 2:
        if (!form.workingCity) return t('auth.driverSignup.err.workingCity');
        if (form.workingAreas.length === 0) return t('auth.driverSignup.err.workingArea');
        return null;
      case 3:
        if (!form.car.make || !form.car.model) return t('auth.driverSignup.err.carMakeModel');
        const year = Number(form.car.year);
        if (!year || year < 1990 || year > new Date().getFullYear() + 1) return t('auth.driverSignup.err.carYear');
        if (form.car.color.trim().length < 2) return t('auth.driverSignup.err.carColor');
        if (form.car.plateNumber.trim().length < 3) return t('auth.driverSignup.err.plateNumber');
        return null;
      default:
        return null;
    }
  };

  const next = () => {
    setError('');
    const v = validateStep();
    if (v) {
      setError(v);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await registerDriver({
        fullName: form.fullName,
        fatherName: form.fatherName,
        phone: form.phone,
        password: form.password,
        nationalId: form.nationalId,
        licenseNumber: form.licenseNumber,
        licenseExpiry: new Date(form.licenseExpiry).toISOString(),
        workingCity: form.workingCity,
        workingAreas: form.workingAreas,
        car: {
          make: form.car.make,
          model: form.car.model,
          year: Number(form.car.year),
          color: form.car.color,
          plateNumber: form.car.plateNumber,
          seats: Number(form.car.seats),
          category: form.car.category,
        },
      });
      if (user) setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">{t('auth.driverSignup.success.title')}</h2>
        <p className="mt-2 text-sm text-slate-600">{t('auth.driverSignup.success.desc')}</p>
        <Button variant="secondary" className="mt-6" onClick={onBack}>
          {t('auth.driverSignup.success.backToHome')}
        </Button>
      </div>
    );
  }

  const carMakeName = makes.find((m) => m._id === form.car.make)?.name ?? '';
  const carModelName = models.find((m) => m._id === form.car.model)?.name ?? '';
  const cityName = cities.find((c) => c._id === form.workingCity)?.name ?? '';

  return (
    <>
      <BackButton onClick={step === 0 ? onBack : () => setStep(step - 1)} />
      <ol className="mb-6 flex items-center gap-1">
        {STEPS.map((s, i) => (
          <li key={s.label} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                  i < step
                    ? 'bg-emerald-500 text-white'
                    : i === step
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                }`}
              >
                {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
              </div>
              {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 rounded ${i < step ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
            </div>
            <span className={`text-[10px] font-medium ${i === step ? 'text-brand-700' : 'text-slate-400'}`}>{s.label}</span>
          </li>
        ))}
      </ol>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}

        {step === 0 && (
          <>
            <Field label={t('auth.driverSignup.fullName')}>
              <Input
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                placeholder={t('auth.driverSignup.fullNamePlaceholder')}
              />
            </Field>
            <Field label={t('auth.driverSignup.fatherName')}>
              <Input
                value={form.fatherName}
                onChange={(e) => set('fatherName', e.target.value)}
                placeholder={t('auth.driverSignup.fatherNamePlaceholder')}
              />
            </Field>
            <Field label={t('auth.driverSignup.nationalId')} hint={t('auth.driverSignup.nationalIdHint')}>
              <Input
                value={form.nationalId}
                onChange={(e) => set('nationalId', e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder={t('auth.driverSignup.nationalIdPlaceholder')}
                inputMode="numeric"
              />
            </Field>
            <Field label={t('auth.driverSignup.phone')}>
              <PhoneInput value={form.phone} onChange={(phone) => set('phone', phone)} />
            </Field>
            <Field label={t('auth.driverSignup.password')} hint={t('auth.driverSignup.passwordHint')}>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder={t('auth.driverSignup.passwordPlaceholder')}
              />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label={t('auth.driverSignup.licenseNumber')}>
              <Input
                value={form.licenseNumber}
                onChange={(e) => set('licenseNumber', e.target.value)}
                placeholder={t('auth.driverSignup.licenseNumberPlaceholder')}
              />
            </Field>
            <Field label={t('auth.driverSignup.licenseExpiry')}>
              <Input
                type="date"
                value={form.licenseExpiry}
                onChange={(e) => set('licenseExpiry', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label={t('auth.driverSignup.workingCity')}>
              <Select value={form.workingCity} onChange={(e) => set('workingCity', e.target.value)}>
                <option value="">{t('auth.driverSignup.selectCity')}</option>
                {cities.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('auth.driverSignup.workingAreas')} hint={t('auth.driverSignup.workingAreasHint')}>
              <div className="flex flex-wrap gap-2">
                {areas.length === 0 && <p className="text-sm text-slate-400">{t('auth.driverSignup.chooseCityFirst')}</p>}
                {areas.map((a) => {
                  const selected = form.workingAreas.includes(a._id);
                  return (
                    <button
                      type="button"
                      key={a._id}
                      onClick={() => toggleArea(a._id)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        selected
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-brand-400'
                      }`}
                    >
                      {a.name}
                    </button>
                  );
                })}
              </div>
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('auth.driverSignup.carMake')}>
                <Select value={form.car.make} onChange={(e) => set('car', { ...form.car, make: e.target.value, model: '' })}>
                  <option value="">{t('auth.driverSignup.selectMake')}</option>
                  {makes.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t('auth.driverSignup.carModel')}>
                <Select
                  value={form.car.model}
                  onChange={(e) => set('car', { ...form.car, model: e.target.value })}
                  disabled={!form.car.make}
                >
                  <option value="">{form.car.make ? t('auth.driverSignup.selectModel') : t('auth.driverSignup.pickMakeFirst')}</option>
                  {models.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label={t('auth.driverSignup.year')}>
                <Input
                  value={form.car.year}
                  onChange={(e) => set('car', { ...form.car, year: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  placeholder={t('auth.driverSignup.yearPlaceholder')}
                  inputMode="numeric"
                />
              </Field>
              <Field label={t('auth.driverSignup.color')}>
                <Input
                  value={form.car.color}
                  onChange={(e) => set('car', { ...form.car, color: e.target.value })}
                  placeholder={t('auth.driverSignup.colorPlaceholder')}
                />
              </Field>
              <Field label={t('auth.driverSignup.seats')}>
                <Select value={form.car.seats} onChange={(e) => set('car', { ...form.car, seats: e.target.value })}>
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 20, 30].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('auth.driverSignup.plateNumber')}>
                <Input
                  value={form.car.plateNumber}
                  onChange={(e) => set('car', { ...form.car, plateNumber: e.target.value })}
                  placeholder={t('auth.driverSignup.plateNumberPlaceholder')}
                />
              </Field>
              <Field label={t('auth.driverSignup.carClass')}>
                <Select value={form.car.category} onChange={(e) => set('car', { ...form.car, category: e.target.value as DriverForm['car']['category'] })}>
                  <option value="economy">{t('auth.driverSignup.category.economy')}</option>
                  <option value="comfort">{t('auth.driverSignup.category.comfort')}</option>
                  <option value="luxury">{t('auth.driverSignup.category.luxury')}</option>
                  <option value="van">{t('auth.driverSignup.category.van')}</option>
                </Select>
              </Field>
            </div>
          </>
        )}

        {step === 4 && (
          <div className="space-y-3 text-sm">
            {[
              [t('auth.driverSignup.review.fullName'), form.fullName],
              [t('auth.driverSignup.review.fatherName'), form.fatherName],
              [t('auth.driverSignup.review.phone'), form.phone],
              [t('auth.driverSignup.review.nationalId'), form.nationalId],
              [
                t('auth.driverSignup.review.license'),
                t('auth.driverSignup.review.licenseValue', { number: form.licenseNumber, date: fdate(form.licenseExpiry) }),
              ],
              [
                t('auth.driverSignup.review.workArea'),
                `${cityName}: ${form.workingAreas.map((id) => areas.find((a) => a._id === id)?.name).join(', ')}`,
              ],
              [
                t('auth.driverSignup.review.car'),
                `${carMakeName} ${carModelName} ${form.car.year} · ${form.car.color} · ${form.car.plateNumber}`,
              ],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-2.5">
                <span className="text-slate-500">{k}</span>
                <span className="text-end font-medium text-slate-900">{v}</span>
              </div>
            ))}
            <Alert tone="info">{t('auth.driverSignup.review.notice')}</Alert>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {step < STEPS.length - 1 && (
            <Button type="button" onClick={next} fullWidth>
              {t('auth.driverSignup.continue')} <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          )}
          {step === STEPS.length - 1 && (
            <Button type="submit" fullWidth loading={loading}>
              {t('auth.driverSignup.submitApplication')}
            </Button>
          )}
        </div>
      </form>
    </>
  );
}
