import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCheck, ShieldAlert, Wallet, Car, Info, BellRing } from 'lucide-react';
import { fdatetime } from '../i18n/format';
import { notificationApi } from '../lib/notifications';
import { getSocket, connectSocket } from '../lib/socket';
import {
  browserNotifySupported,
  getBrowserPermission,
  requestBrowserPermission,
  showBrowserNotification,
} from '../lib/browserNotify';
import type { AppNotification, NotificationType } from '../types/notification';

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  ride: Car,
  sos: ShieldAlert,
  payment: Wallet,
  account: Info,
  admin: Info,
  system: Info,
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    connectSocket();
    const socket = getSocket();
    notificationApi.unreadCount().then(setUnread).catch(() => {});
    if (browserNotifySupported()) setBrowserPerm(getBrowserPermission());
    const onNew = (n: AppNotification) => {
      setUnread((u) => u + 1);
      refresh();
      showBrowserNotification(n.title, n.body ?? null, () => openItem(n));
    };
    socket.on('notification:new', onNew);
    return () => {
      socket.off('notification:new', onNew);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enableBrowser = async () => {
    const perm = await requestBrowserPermission();
    setBrowserPerm(perm);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await notificationApi.list(20);
      setItems(data.notifications);
      setUnread(data.unread);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    refresh();
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const openItem = (n: AppNotification) => {
    setOpen(false);
    const rideId = n.data?.rideId;
    if (typeof rideId === 'string' && rideId) navigate(`/track/${rideId}`);
    else navigate('/history');
    notificationApi.markRead(n.id).catch(() => {});
  };

  const markAll = async () => {
    await notificationApi.markAllRead();
    setUnread(0);
    setItems((list) => list.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        title={t('notify.title')}
        aria-label={t('notify.buttonAria', { count: unread })}
      >
        <Bell className="h-4.5 w-4.5" />
        {unread > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="font-bold text-slate-900">{t('notify.title')}</p>
            {unread > 0 && (
              <button onClick={markAll} className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
                <CheckCheck className="h-3.5 w-3.5" /> {t('notify.markAllRead')}
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && !loading && (
              <p className="px-4 py-10 text-center text-sm text-slate-400">{t('notify.empty')}</p>
            )}
            {items.map((n) => {
              const Icon = TYPE_ICON[n.type] ?? Info;
              return (
                <button
                  key={n.id}
                  onClick={() => openItem(n)}
                  className={`flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-start transition hover:bg-slate-50 ${n.read ? '' : 'bg-brand-50/50'}`}
                >
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${n.read ? 'bg-slate-100 text-slate-400' : 'bg-brand-100 text-brand-700'}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900">{n.title}</span>
                    {n.body && <span className="mt-0.5 block text-xs leading-snug text-slate-500">{n.body}</span>}
                    <span className="mt-1 block text-[10px] text-slate-400">{fdatetime(n.createdAt)}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {browserPerm !== null && (
            <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-2.5">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <BellRing className="h-3.5 w-3.5" />
                {browserPerm === 'granted' && t('notify.browserEnabled')}
                {browserPerm === 'denied' && t('notify.browserDenied')}
                {browserPerm === 'default' && t('notify.browserHint')}
              </span>
              {browserPerm !== 'granted' && browserPerm !== 'denied' && (
                <button onClick={enableBrowser} className="rounded-lg bg-brand-700 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-brand-800">
                  {t('notify.browserEnable')}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
