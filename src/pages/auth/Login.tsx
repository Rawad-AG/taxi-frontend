import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Field, Input } from '../../components/ui';
import { PhoneInput } from '../../components/PhoneInput';
import { useAuth } from '../../context/AuthContext';
import { AuthShell } from '../../components/AuthShell';
import type { AuthResponse } from '../../types';

interface OtpChallenge {
  phone: string;
  password: string;
  otpChannel: 'sms' | 'whatsapp';
  devOtp?: string;
  expiresIn?: number;
}

export default function Login() {
  const { login, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [code, setCode] = useState('');

  const onCredentialsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone || !password) {
      setError(t('auth.login.fillBoth'));
      return;
    }
    setLoading(true);
    try {
      const data: AuthResponse = await login(phone, password);
      if (data.requiresOtp) {
        setChallenge({
          phone: data.phone ?? phone,
          password,
          otpChannel: data.otpChannel ?? 'sms',
          devOtp: data.devOtp,
          expiresIn: data.expiresIn,
        });
        setCode('');
      } else {
        navigate('/home');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!challenge) return;
    setError('');
    if (!/^\d{6}$/.test(code)) {
      setError(t('auth.otp.codeRequired'));
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(challenge.phone, code);
      navigate('/home');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (challenge) {
    const minutes = Math.max(1, Math.round((challenge.expiresIn ?? 300) / 60));
    return (
      <AuthShell
        title={t('auth.otp.title')}
        subtitle={t('auth.otp.subtitle', {
          phone: challenge.phone,
          channel: challenge.otpChannel === 'whatsapp' ? t('auth.otp.channel.whatsapp') : t('auth.otp.channel.sms'),
        })}
      >
        <form onSubmit={onOtpSubmit} className="space-y-4">
          {error && <Alert tone="error">{error}</Alert>}
          {challenge.devOtp && (
            <Alert tone="info">
              {t('auth.otp.devHint')} <strong>{challenge.devOtp}</strong>
            </Alert>
          )}
          <Field label={t('auth.otp.fieldLabel', { minutes })}>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={t('auth.otp.placeholder')}
              inputMode="numeric"
              autoFocus
            />
          </Field>
          <Button type="submit" fullWidth loading={loading}>
            {t('auth.otp.submit')}
          </Button>
          <div className="text-center">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setChallenge(null);
                setError('');
              }}
              className="text-sm font-medium text-brand-700 hover:underline disabled:opacity-50"
            >
              {t('auth.otp.backToPassword')}
            </button>
          </div>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('auth.login.title')} subtitle={t('auth.login.subtitle')}>
      <form onSubmit={onCredentialsSubmit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label={t('auth.login.phone')}>
          <PhoneInput value={phone} onChange={setPhone} />
        </Field>
        <Field label={t('auth.login.password')}>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.login.passwordPlaceholder')}
          />
        </Field>
        <div className="text-end">
          <Link to="/forgot-password" className="text-sm font-medium text-brand-700 hover:underline">
            {t('auth.login.forgotPassword')}
          </Link>
        </div>
        <Button type="submit" fullWidth loading={loading}>
          {t('auth.login.submit')}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        {t('auth.login.newHere')}{' '}
        <Link to="/signup" className="font-semibold text-brand-700 hover:underline">
          {t('auth.login.createAccount')}
        </Link>
      </p>
    </AuthShell>
  );
}
