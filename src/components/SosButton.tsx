import { useState } from 'react';
import { Siren, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui';
import { sosApi } from '../lib/sos';
import { getErrorMessage } from '../lib/api';
import type { SosReason } from '../types/sos';

const REASONS: SosReason[] = ['safety', 'accident', 'medical', 'harassment', 'other'];

export default function SosButton({ rideId, className = '' }: { rideId?: string; className?: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<SosReason>('safety');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState<{ emergencyPhone: string } | null>(null);

  const send = async () => {
    setSending(true);
    setError('');
    try {
      const loc: { lat?: number; lng?: number; accuracy?: number } = {};
      if (!rideId && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 }),
          );
          loc.lat = pos.coords.latitude;
          loc.lng = pos.coords.longitude;
          loc.accuracy = pos.coords.accuracy ?? 0;
        } catch {
          // location is optional; send without it
        }
      }
      const result = await sosApi.create({ rideId, reason, note: note || undefined, ...loc });
      setSent({ emergencyPhone: result.emergencyPhone });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className={`rounded-2xl border-2 border-red-300 bg-red-50 p-5 text-center ${className}`}>
        <Siren className="mx-auto h-8 w-8 text-red-600" />
        <p className="mt-2 font-bold text-red-800">{t('sos.sent')}</p>
        <p className="mt-1 text-sm text-red-700">{t('sos.notified')}</p>
        <a href={`tel:${sent.emergencyPhone}`} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
          <Phone className="h-4 w-4" /> {t('sos.call', { phone: sent.emergencyPhone })}
        </a>
      </div>
    );
  }

  return (
    <div className={className}>
      {open && (
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-800">{t('sos.confirmTitle')}</p>
          <p className="mt-0.5 text-xs text-red-600">{t('sos.confirmSubtitle')}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {REASONS.map((key) => (
              <button
                key={key}
                onClick={() => setReason(key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  reason === key ? 'bg-red-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-red-100'
                }`}
              >
                {t(`sos.reason.${key}`)}
              </button>
            ))}
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('sos.notePlaceholder')}
            maxLength={300}
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400"
          />
          {error && <p className="mt-2 text-xs font-medium text-red-700">{error}</p>}
          <div className="mt-3 flex gap-2">
            <Button variant="danger" fullWidth loading={sending} onClick={send}>
              <Siren className="h-4 w-4" /> {t('sos.send')}
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}
      {!open && (
        <Button variant="danger" fullWidth onClick={() => setOpen(true)}>
          <Siren className="h-4 w-4" /> {t('sos.sos')}
        </Button>
      )}
    </div>
  );
}
