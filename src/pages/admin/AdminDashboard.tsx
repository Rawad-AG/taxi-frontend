import { useState } from 'react';
import { LayoutDashboard, Users, Car, BarChart3, Settings as SettingsIcon, ShieldCheck, Siren, Wallet, Megaphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Overview from './Overview';
import Drivers from './Drivers';
import Rides from './Rides';
import Reports from './Reports';
import Settings from './Settings';
import SOSPanel from './SOSPanel';
import PaymentsPanel from './PaymentsPanel';
import BroadcastPanel from './BroadcastPanel';

const TABS = [
  { key: 'overview', icon: LayoutDashboard },
  { key: 'drivers', icon: Users },
  { key: 'rides', icon: Car },
  { key: 'reports', icon: BarChart3 },
  { key: 'payments', icon: Wallet },
  { key: 'sos', icon: Siren },
  { key: 'broadcast', icon: Megaphone },
  { key: 'settings', icon: SettingsIcon },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabKey>('overview');

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 shadow-sm shadow-brand-600/30">
          <ShieldCheck className="h-5 w-5 text-white" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{t('admin.title')}</h1>
          <p className="text-sm text-slate-500">{t('admin.subtitle')}</p>
        </div>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5">
        {TABS.map((tabDef) => (
          <button
            key={tabDef.key}
            onClick={() => setTab(tabDef.key)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === tabDef.key ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <tabDef.icon className="h-4 w-4" />
            {t(`admin.tabs.${tabDef.key}`)}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === 'overview' && <Overview />}
        {tab === 'drivers' && <Drivers />}
        {tab === 'rides' && <Rides />}
        {tab === 'reports' && <Reports />}
        {tab === 'payments' && <PaymentsPanel />}
        {tab === 'sos' && <SOSPanel />}
        {tab === 'broadcast' && <BroadcastPanel />}
        {tab === 'settings' && <Settings />}
      </div>
    </div>
  );
}
