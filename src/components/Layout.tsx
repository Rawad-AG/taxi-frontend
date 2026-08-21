import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Car, LogOut, LayoutDashboard, User as UserIcon, Phone, History, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import LanguageToggle from './LanguageToggle';

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-sm shadow-brand-600/30">
        <Car className="h-5 w-5 text-white" />
      </span>
      <span className="text-lg font-extrabold tracking-tight text-slate-900">
        DRM<span className="text-brand-600">Taxi</span>
      </span>
    </Link>
  );
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {!user && (
            <>
              <NavLink to="/" className={navLinkClass} end>
                {t('nav.home')}
              </NavLink>
              <NavLink to="/how-it-works" className={navLinkClass}>
                {t('nav.howItWorks')}
              </NavLink>
              <NavLink to="/support" className={navLinkClass}>
                {t('nav.support')}
              </NavLink>
            </>
          )}
          {user?.role === 'customer' && (
            <NavLink to="/book" className={navLinkClass}>
              {t('nav.bookRide')}
            </NavLink>
          )}
          {user?.role === 'driver' && (
            <NavLink to="/driver" className={navLinkClass}>
              <LayoutDashboard className="ms-1 inline h-4 w-4" />
              {t('nav.dashboard')}
            </NavLink>
          )}
          {user && (
            <NavLink to="/history" className={navLinkClass}>
              <History className="ms-1 inline h-4 w-4" />
              {t('nav.history')}
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={navLinkClass}>
              <ShieldCheck className="ms-1 inline h-4 w-4" />
              {t('nav.admin')}
            </NavLink>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          {user ? (
            <>
              <NotificationBell />
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
              >
                <UserIcon className="h-4 w-4 text-slate-400" />
                <span className="hidden max-w-32 truncate sm:inline">
                  {user.role === 'customer' ? `${user.firstName} ${user.lastName}` : user.driverProfile?.fullName ?? 'Driver'}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                title={t('nav.logout')}
                aria-label={t('nav.logout')}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </>
          ) : (
            <>
              <a
                href="tel:+963944444444"
                className="hidden items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-700 sm:flex"
              >
                <Phone className="h-4 w-4" />
                944 444 444
              </a>
              <Link
                to="/login"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/signup"
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700"
              >
                {t('nav.signup')}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row">
        <Logo />
        <p>{t('nav.footerTagline')}</p>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="hover:text-brand-700">
            {t('nav.privacy')}
          </Link>
          <Link to="/terms" className="hover:text-brand-700">
            {t('nav.terms')}
          </Link>
          <Link to="/contact" className="hover:text-brand-700">
            {t('nav.contact')}
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
