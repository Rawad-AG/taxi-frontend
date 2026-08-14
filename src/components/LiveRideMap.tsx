import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import type { MapPoint } from './MapPicker';
import type { RideLiveLoc } from '../types/ride';
import 'leaflet/dist/leaflet.css';

interface LiveRideMapProps {
  pickup: MapPoint;
  dropoff: MapPoint;
  driverLoc?: RideLiveLoc | null;
  customerLoc?: RideLiveLoc | null;
  driverStale?: boolean;
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

const driverIcon = L.divIcon({
  className: '',
  html: '<div class="map-pin map-pin-blue"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

const driverStaleIcon = L.divIcon({
  className: '',
  html: '<div class="map-pin map-pin-grey"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

const customerIcon = L.divIcon({
  className: '',
  html: '<div class="map-pin map-pin-violet"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    map.fitBounds(points, { padding: [40, 40] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points)]);
  return null;
}

export default function LiveRideMap({
  pickup,
  dropoff,
  driverLoc,
  customerLoc,
  driverStale,
  height = '300px',
}: LiveRideMapProps) {
  const { t } = useTranslation();
  const bounds: [number, number][] = [
    [pickup.lat, pickup.lng],
    [dropoff.lat, dropoff.lng],
  ];
  if (driverLoc) bounds.push([driverLoc.lat, driverLoc.lng]);
  if (customerLoc) bounds.push([customerLoc.lat, customerLoc.lng]);

  return (
    <div aria-label={t('map.liveMapAria')}>
      <MapContainer
        center={[pickup.lat, pickup.lng]}
        zoom={14}
        scrollWheelZoom
        style={{ height, width: '100%', borderRadius: '1rem', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={bounds} />
        <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />
        <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon} />
        <Polyline positions={[[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]} color="#1b7df5" dashArray="6 6" weight={3} />
        {driverLoc && <Marker position={[driverLoc.lat, driverLoc.lng]} icon={driverStale ? driverStaleIcon : driverIcon} />}
        {customerLoc && <Marker position={[customerLoc.lat, customerLoc.lng]} icon={customerIcon} />}
      </MapContainer>
      {driverLoc && driverStale && (
        <p className="mt-1 text-center text-xs text-slate-400">{t('map.staleHint')}</p>
      )}
    </div>
  );
}
