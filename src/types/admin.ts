import type { RideCategory } from './ride';

export interface CategoryPricing {
  base: number;
  perKm: number;
}

export interface SystemConfig {
  fare: {
    roadFactor: number;
    roundTo: number;
    categories: Record<RideCategory, CategoryPricing>;
  };
  matching: {
    requestTtlMs: number;
    maxTargets: number;
  };
  tracking: {
    pingIntervalMs: number;
    staleAfterMs: number;
  };
  sos: {
    emergencyPhone: string;
  };
  notifications: {
    pushEnabled: boolean;
  };
  payLater: {
    minCompletedRides: number;
    maxOutstandingBalance: number;
    maxOutstandingRides: number;
    dueDays: number;
    blockRidesWhenOverdue: boolean;
  };
  business: {
    commissionRate: number;
    currency: string;
    supportPhone: string;
  };
  updatedAt?: string;
  updatedBy?: string;
}

export interface Overview {
  users: { total: number; customers: number; drivers: number; admins: number };
  drivers: { pending: number; active: number; suspended: number; online: number };
  rides: { requested: number; active: number; completed: number; cancelled: number; total: number };
  today: { tripsCompleted: number; fares: number };
  commissionRate: number;
  currency: string;
}

export interface AdminUser {
  id: string;
  role: 'customer' | 'driver' | 'admin';
  status: 'active' | 'pending' | 'suspended';
  phone: string;
  name: string;
  createdAt: string;
  workingCity: string | null;
  car: { make: string | null; model: string | null; color: string | null; plateNumber: string | null } | null;
}

export interface FinancialReport {
  summary: {
    trips: number;
    fares: number;
    avgFare: number;
    commission: number;
    driverNet: number;
    cancelled: number;
    cancellationRate: number;
    outstandingBalance?: number;
    overdueBalance?: number;
    payLaterShare?: number;
    bucketRides?: number;
    payLaterRides?: number;
    cashRides?: number;
  };
  byCategory: { category: RideCategory; trips: number; fares: number }[];
  daily: { date: string; trips: number; fares: number }[];
  topDrivers: { name: string; phone: string | null; trips: number; earnings: number }[];
  commissionRate: number;
  currency: string;
}

export interface PerformanceReport {
  system: {
    onlineDrivers: number;
    pendingDrivers: number;
    avgAcceptMs: number | null;
    avgCustomerRating: number | null;
  };
  drivers: {
    name: string;
    phone: string | null;
    status: string;
    trips: number;
    earnings: number;
    avgRating: number | null;
    avgAcceptMs: number | null;
  }[];
  customers: { name: string; phone: string | null; trips: number; spent: number }[];
}
