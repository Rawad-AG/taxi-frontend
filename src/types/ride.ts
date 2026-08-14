export type RideStatus = 'requested' | 'accepted' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
export type RideCategory = 'economy' | 'comfort' | 'luxury' | 'van';

export interface RidePoint {
  label?: string;
  lat: number;
  lng: number;
}

export interface RideFare {
  base: number;
  perKm: number;
  distanceKm: number;
  roadDistanceKm: number;
  total: number;
}

export interface RideDriver {
  id: string;
  name: string;
  phone: string | null;
  car: { make: string | null; model: string | null; color: string; plateNumber: string; category: string } | null;
}

export interface RideCustomer {
  id: string;
  name: string;
  phone: string | null;
}

export interface DriverStats {
  tripsCompleted: number;
  earningsTotal: number;
  tripsToday: number;
  earningsToday: number;
  avgRating: number | null;
}

export interface RideLiveLoc {
  lat: number;
  lng: number;
  accuracy?: number;
  ts?: number;
}

export interface Ride {
  id: string;
  status: RideStatus;
  type: 'ride' | 'delivery' | 'send_item';
  category: RideCategory;
  city: string;
  pickup: RidePoint & { area?: string };
  dropoff: RidePoint & { area?: string };
  fare: RideFare;
  timeline: Partial<Record<'requestedAt' | 'acceptedAt' | 'arrivedAt' | 'startedAt' | 'completedAt', string>>;
  cancellation?: { reason?: string; cancelledBy: 'customer' | 'driver' | 'system'; at: string } | null;
  ratings?: {
    customerRating?: number;
    driverRating?: number;
    customerComment?: string;
    driverComment?: string;
  } | null;
  payment?: { method: 'cash' | 'bucket' | 'pay_later'; collected: boolean };
  live?: { driverLoc?: RideLiveLoc | null; customerLoc?: RideLiveLoc | null; updatedAt?: string } | null;
  driver: RideDriver | null;
  customer: RideCustomer | null;
  createdAt: string;
}

export interface RideLocationPayload {
  rideId: string;
  by: 'driver' | 'customer';
  lat: number;
  lng: number;
  accuracy?: number;
  ts: number;
}

export type RideSocketEvents = {
  'ride:request': Ride;
  'ride:request_expired': { rideId: string; reason?: string };
  'ride:accepted': Ride;
  'ride:status': Ride;
  'ride:completed': Ride;
  'location:update': RideLocationPayload;
};
