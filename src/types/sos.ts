export type SosReason = 'safety' | 'accident' | 'medical' | 'harassment' | 'other';

export interface SosIncident {
  id: string;
  userId: string;
  role: 'customer' | 'driver' | 'admin';
  rideId: string | null;
  location: { lat: number; lng: number; accuracy?: number; ts?: number } | null;
  reason: SosReason;
  note: string | null;
  status: 'open' | 'resolved';
  resolvedBy: string | null;
  resolvedNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  user: { name: string; phone: string | null } | null;
}
