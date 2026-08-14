import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Field, Input } from '../../components/ui';
import { PhoneInput } from '../../components/PhoneInput';
import { authApi } from '../../lib/auth';
import { AuthShell } from '../../components/AuthShell';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (code.length !== 6) {
      setError(t('auth.reset.codeError'));
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(phone, code, newPassword);
      navigate('/login', { state: { reset: true } });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={t('auth.reset.title')} subtitle={t('auth.reset.subtitle')}>
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label={t('auth.reset.phone')}>
          <PhoneInput value={phone} onChange={setPhone} />
        </Field>
        <Field label={t('auth.reset.code')}>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder={t('auth.reset.codePlaceholder')}
            inputMode="numeric"
            className="text-center text-xl tracking-[0.5em]"
            autoFocus
          />
        </Field>
        <Field label={t('auth.reset.newPassword')}>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t('auth.reset.passwordPlaceholder')}
            autoComplete="new-password"
          />
        </Field>
        <Button type="submit" fullWidth loading={loading}>
          {t('auth.reset.submit')}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        <Link to="/login" className="font-semibold text-brand-700 hover:underline">
          {t('auth.reset.backToLogin')}
        </Link>
      </p>
    </AuthShell>
  );
}
