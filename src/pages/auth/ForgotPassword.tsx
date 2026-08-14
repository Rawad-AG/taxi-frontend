import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Field } from '../../components/ui';
import { PhoneInput } from '../../components/PhoneInput';
import { authApi } from '../../lib/auth';
import { AuthShell } from '../../components/AuthShell';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(phone);
      navigate('/reset-password', { state: { phone } });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={t('auth.forgot.title')} subtitle={t('auth.forgot.subtitle')}>
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label={t('auth.forgot.phone')}>
          <PhoneInput value={phone} onChange={setPhone} />
        </Field>
        <Button type="submit" fullWidth loading={loading}>
          {t('auth.forgot.submit')}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        {t('auth.forgot.remembered')}{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:underline">
          {t('auth.forgot.backToLogin')}
        </Link>
      </p>
    </AuthShell>
  );
}
