import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Car, UserRound, ChevronLeft, AlertTriangle } from 'lucide-react';
import { Alert } from '../../components/ui';
import { AuthShell } from '../../components/AuthShell';
import { useAuth } from '../../context/AuthContext';
import CustomerSignup from './CustomerSignup';
import DriverSignup from './DriverSignup';

type RoleChoice = 'none' | 'customer' | 'driver';

export default function Signup() {
  const [role, setRole] = useState<RoleChoice>('none');
  const { user } = useAuth();
  const { t } = useTranslation();

  const base = (
    <div className="grid gap-4 sm:grid-cols-2">
      {([
        {
          key: 'customer' as const,
          icon: <UserRound className="h-7 w-7 text-brand-600" />,
          title: t('auth.signup.role.customerTitle'),
          desc: t('auth.signup.role.customerDesc'),
        },
        {
          key: 'driver' as const,
          icon: <Car className="h-7 w-7 text-amber-500" />,
          title: t('auth.signup.role.driverTitle'),
          desc: t('auth.signup.role.driverDesc'),
        },
      ]).map((opt) => (
        <button
          key={opt.key}
          onClick={() => setRole(opt.key)}
          className="group rounded-2xl border-2 border-slate-200 bg-slate-50 p-5 text-start transition hover:border-brand-500 hover:bg-brand-50"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">{opt.icon}</div>
          <p className="font-bold text-slate-900">{opt.title}</p>
          <p className="mt-1 text-sm text-slate-500">{opt.desc}</p>
        </button>
      ))}
    </div>
  );

  return (
    <AuthShell title={t('auth.signup.title')} subtitle={t('auth.signup.subtitle')}>
      {role === 'none' && base}
      {role === 'customer' && <CustomerSignup onBack={() => setRole('none')} />}
      {role === 'driver' && <DriverSignup onBack={() => setRole('none')} />}
      {user?.status === 'pending' && (
        <div className="mt-4">
          <Alert tone="info">
            <AlertTriangle className="me-1 inline h-4 w-4" />
            {t('auth.signup.pendingApproval')}
          </Alert>
        </div>
      )}
      <p className="mt-6 text-center text-sm text-slate-600">
        {t('auth.signup.haveAccount')}{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:underline">
          {t('auth.signup.login')}
        </Link>
      </p>
    </AuthShell>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-brand-700"
    >
      <ChevronLeft className="h-4 w-4 rtl:rotate-180" /> {t('auth.signup.back')}
    </button>
  );
}

export { BackButton };
