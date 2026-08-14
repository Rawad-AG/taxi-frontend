import { useCallback, useEffect, useRef, useState } from 'react';
import { Siren, CheckCircle2, AlertTriangle, ExternalLink, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Alert, Badge, Button, Input, Spinner } from '../../components/ui';
import { sosApi } from '../../lib/sos';
import { getSocket } from '../../lib/socket';
import { getErrorMessage } from '../../lib/api';
import { fdatetime } from '../../i18n/format';
import type { SosIncident } from '../../types/sos';

const REASON_KEYS: Record<string, string> = {
  safety: 'admin.sos.reason.safety',
  accident: 'admin.sos.reason.accident',
  medical: 'admin.sos.reason.medical',
  harassment: 'admin.sos.reason.harassment',
  other: 'admin.sos.reason.other',
};

const roleKey = (role: string) => (role === 'driver' ? 'admin.sos.roleDriver' : 'admin.sos.roleCustomer');

function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.65);
    osc.onended = () => void ctx.close();
  } catch {
    // audio is best-effort
  }
}

export default function SOSPanel() {
  const { t } = useTranslation();
  const [open, setOpen] = useState<SosIncident[]>([]);
  const [resolved, setResolved] = useState<SosIncident[]>([]);
  const [tab, setTab] = useState<'open' | 'resolved'>('open');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState<SosIncident | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const [o, r] = await Promise.all([sosApi.adminList('open'), sosApi.adminList('resolved')]);
      setOpen(o);
      setResolved(r);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const socket = getSocket();
    const onNew = (incident: SosIncident) => {
      setOpen((prev) => [incident, ...prev.filter((i) => i.id !== incident.id)]);
      setFlash(incident);
      beep();
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlash(null), 8000);
    };
    const onResolved = (incident: SosIncident) => {
      setOpen((prev) => prev.filter((i) => i.id !== incident.id));
      setResolved((prev) => [incident, ...prev.filter((i) => i.id !== incident.id)]);
    };
    socket.on('sos:new', onNew);
    socket.on('sos:resolved', onResolved);
    return () => {
      socket.off('sos:new', onNew);
      socket.off('sos:resolved', onResolved);
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  const resolve = async (id: string) => {
    setResolvingId(id);
    setError('');
    try {
      const updated = await sosApi.resolve(id, showNote === id ? note : undefined);
      setOpen((prev) => prev.filter((i) => i.id !== id));
      setResolved((prev) => [updated, ...prev.filter((i) => i.id !== id)]);
      setShowNote(null);
      setNote('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-9 w-9" />
      </div>
    );
  }

  const items = tab === 'open' ? open : resolved;
  const mapLink = (loc: SosIncident['location']) =>
    loc ? `https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}#map=17/${loc.lat}/${loc.lng}` : null;

  return (
    <div className="space-y-5">
      {flash && (
        <div className="flex items-start gap-3 rounded-2xl border-2 border-red-400 bg-red-50 p-4 animate-pulse">
          <Siren className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
          <div>
            <p className="font-bold text-red-800">
              {t('admin.sos.flashTitle', { name: flash.user?.name ?? t('admin.sos.flashUnknownUser'), role: t(roleKey(flash.role)) })}
            </p>
            <p className="text-sm text-red-700">
              {t(REASON_KEYS[flash.reason] ?? 'admin.sos.reason.other')}
              {flash.note ? t('admin.sos.withNote', { note: flash.note }) : ''}
            </p>
          </div>
        </div>
      )}

      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
        <button
          onClick={() => setTab('open')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            tab === 'open' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="h-4 w-4" /> {t('admin.sos.openTab', { count: open.length })}
        </button>
        <button
          onClick={() => setTab('resolved')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            tab === 'resolved' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" /> {t('admin.sos.resolvedTab', { count: resolved.length })}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <Siren className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-semibold text-slate-500">{t('admin.sos.noIncidents', { status: t(tab === 'open' ? 'common.open' : 'common.resolved') })}</p>
        </div>
      ) : (
        items.map((inc) => {
          const link = mapLink(inc.location);
          return (
            <div key={inc.id} className={`rounded-2xl border bg-white p-5 ${inc.status === 'open' ? 'border-red-200' : 'border-slate-200'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full ${inc.status === 'open' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                    <Siren className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">{inc.user?.name ?? t('admin.sos.unknownUser')}</p>
                    <p className="text-xs text-slate-400">
                      {t(roleKey(inc.role))} · {t(REASON_KEYS[inc.reason] ?? 'admin.sos.reason.other')} · {fdatetime(inc.createdAt)}
                    </p>
                  </div>
                </div>
                <Badge color={inc.status === 'open' ? 'red' : 'green'}>{t(inc.status === 'open' ? 'common.open' : 'common.resolved')}</Badge>
              </div>

              {inc.rideId && (
                <p className="mt-3 text-xs text-slate-500">
                  {t('admin.sos.ride')} <span className="font-mono">{inc.rideId}</span>
                </p>
              )}
              {inc.note && <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{inc.note}</p>}
              {inc.resolvedNote && <p className="mt-1 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{t('admin.sos.resolvedWithNote', { note: inc.resolvedNote })}</p>}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {link ? (
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand-300 hover:text-brand-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> {t('admin.sos.viewLocation')}
                  </a>
                ) : null}
                {inc.user?.phone && (
                  <a href={`tel:${inc.user.phone}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand-300 hover:text-brand-700">
                    <Phone className="h-3.5 w-3.5" /> {inc.user.phone}
                  </a>
                )}
                {inc.status === 'open' && (
                  <div className="ms-auto flex items-center gap-2">
                    <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={() => setShowNote(showNote === inc.id ? null : inc.id)}>
                      {t('admin.sos.addNote')}
                    </Button>
                    <Button variant="danger" className="!px-3 !py-1.5 text-xs" loading={resolvingId === inc.id} onClick={() => resolve(inc.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> {t('admin.sos.resolve')}
                    </Button>
                  </div>
                )}
              </div>

              {inc.status === 'open' && showNote === inc.id && (
                <div className="mt-3 flex gap-2">
                  <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('admin.sos.notePlaceholder')} />
                  <Button variant="secondary" className="shrink-0" onClick={() => resolve(inc.id)}>
                    {t('admin.sos.resolveWithNote')}
                  </Button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
