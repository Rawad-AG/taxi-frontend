import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getSocket } from './socket';

const PING_INTERVAL_MS = 5000;

interface Position {
  lat: number;
  lng: number;
  accuracy: number;
}

export function useLocationSharing(rideId: string | undefined) {
  const { t } = useTranslation();
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const watchIdRef = useRef<number | null>(null);
  const positionRef = useRef<Position | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    positionRef.current = null;
    setSharing(false);
  }, []);

  const start = useCallback(() => {
    if (!rideId) return;
    if (!navigator.geolocation) {
      setError(t('map.geoUnsupported'));
      return;
    }
    setError('');
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        positionRef.current = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? 0,
        };
      },
      (err) => {
        setError(err.code === err.PERMISSION_DENIED ? t('map.sharePermissionDenied') : t('map.shareUnableToLocate'));
        stop();
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    );
    timerRef.current = setInterval(() => {
      const p = positionRef.current;
      if (!p) return;
      getSocket().emit('location:update', { rideId, ...p, ts: Date.now() });
    }, PING_INTERVAL_MS);
    setSharing(true);
  }, [rideId, stop, t]);

  useEffect(() => stop, [stop]);

  return { sharing, start, stop, error };
}
