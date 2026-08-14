import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet';
import { LocateFixed } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
  accuracy?: number;
}

interface MapPickerProps {
  center: { lat: number; lng: number };
  pickup: MapPoint | null;
  dropoff: MapPoint | null;
  onPick: (point: MapPoint) => void;
  height?: string;
}

const pickupIcon = L.divIcon({
  className: '',
  html: '<div class="map-pin map-pin-green"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

const dropoffIcon = L.divIcon({
  className: '',
  html: '<div class="map-pin map-pin-red"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

function ClickHandler({ onPick }: { onPick: (p: MapPoint) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function FlyToCenter({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([center.lat, center.lng], 12, { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng]);
  return null;
}

function LocateButton({ onClick, locating }: { onClick: () => void; locating: boolean }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={t('map.locate')}
      aria-label={t('map.locate')}
      className={`absolute end-3 top-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-md transition hover:bg-slate-50 ${
        locating ? 'text-brand-600' : 'text-slate-600'
      }`}
    >
      <LocateFixed className={`h-5 w-5 ${locating ? 'animate-pulse' : ''}`} />
    </button>
  );
}

export default function MapPicker({ center, pickup, dropoff, onPick, height = '380px' }: MapPickerProps) {
  const { t } = useTranslation();
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  const useMyLocation = () => {
    setError('');
    if (!navigator.geolocation) {
      setError(t('map.geoUnsupported'));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onPick({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: t('map.myLocation'),
          accuracy: pos.coords.accuracy ?? 0,
        });
      },
      (err) => {
        setLocating(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? t('map.permissionDenied')
            : t('map.unableToLocate'),
        );
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
  };

  return (
    <div className="relative">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        scrollWheelZoom
        style={{ height, width: '100%', borderRadius: '1rem', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyToCenter center={center} />
        <ClickHandler onPick={onPick} />
        {pickup?.accuracy ? <Circle center={[pickup.lat, pickup.lng]} radius={pickup.accuracy} pathOptions={{ color: '#1b7df5', fillColor: '#1b7df5', fillOpacity: 0.12, weight: 1.5 }} /> : null}
        {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />}
        {dropoff && <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon} />}
        {pickup && dropoff && <Polyline positions={[[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]} color="#1b7df5" dashArray="6 6" weight={3} />}
      </MapContainer>
      <LocateButton onClick={useMyLocation} locating={locating} />
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
