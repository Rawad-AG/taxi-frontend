import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Field, Input } from '../../components/ui';
import { PhoneInput } from '../../components/PhoneInput';
import { useAuth } from '../../context/AuthContext';
import { BackButton } from './Signup';

export default function CustomerSignup({ onBack }: { onBack: () => void }) {
  const { registerCustomer } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerCustomer(form);
      navigate('/home');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <BackButton onClick={onBack} />
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('auth.customerSignup.firstName')}>
            <Input
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              placeholder={t('auth.customerSignup.firstNamePlaceholder')}
              autoComplete="given-name"
            />
          </Field>
          <Field label={t('auth.customerSignup.lastName')}>
            <Input
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              placeholder={t('auth.customerSignup.lastNamePlaceholder')}
              autoComplete="family-name"
            />
          </Field>
        </div>
        <Field label={t('auth.customerSignup.phone')} hint={t('auth.customerSignup.phoneHint')}>
          <PhoneInput value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
        </Field>
        <Field label={t('auth.customerSignup.password')} hint={t('auth.customerSignup.passwordHint')}>
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={t('auth.customerSignup.passwordPlaceholder')}
            autoComplete="new-password"
          />
        </Field>
        <Button type="submit" fullWidth loading={loading}>
          {t('auth.customerSignup.submit')}
        </Button>
      </form>
    </>
  );
}
