import type { DriverStats, Ride, RideCategory, RideLiveLoc } from '../types/ride';
import type { PaymentMethod } from '../types/payment';
import { api } from './api';

export interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
}

export const rideApi = {
  async estimate(pickup: MapPoint, dropoff: MapPoint, category: RideCategory) {
    const { data } = await api.post<{ fare: Ride['fare'] }>('/rides/estimate', { pickup, dropoff, category });
    return data.fare;
  },

  async create(input: { city: string; category: RideCategory; pickup: MapPoint; dropoff: MapPoint; paymentMethod?: PaymentMethod }) {
    const { data } = await api.post<{ ride: Ride; targetedDrivers: number }>('/rides', input);
    return data;
  },

  async history(): Promise<Ride[]> {
    const { data } = await api.get<{ rides: Ride[] }>('/rides/history');
    return data.rides;
  },

  async driverStats(): Promise<DriverStats> {
    const { data } = await api.get<{ stats: DriverStats }>('/driver/stats');
    return data.stats;
  },

  async cancel(rideId: string, reason?: string): Promise<Ride> {
    const { data } = await api.post<{ ride: Ride }>(`/rides/${rideId}/cancel`, { reason });
    return data.ride;
  },

  async getRide(rideId: string): Promise<Ride> {
    const { data } = await api.get<{ ride: Ride }>(`/rides/${rideId}`);
    return data.ride;
  },

  async getRideLocation(rideId: string): Promise<{ driverLoc: RideLiveLoc | null; customerLoc: RideLiveLoc | null }> {
    const { data } = await api.get<{ driverLoc: RideLiveLoc | null; customerLoc: RideLiveLoc | null }>(`/rides/${rideId}/location`);
    return data;
  },

  async getCurrentRide(): Promise<Ride | null> {
    const { data } = await api.get<{ ride: Ride | null }>('/driver/rides/current');
    return data.ride;
  },

  async driverAction(rideId: string, action: 'accept' | 'arrive' | 'start' | 'complete'): Promise<Ride> {
    const { data } = await api.post<{ ride: Ride }>(`/driver/rides/${rideId}/${action}`);
    return data.ride;
  },

  async rate(rideId: string, rating: number, comment?: string): Promise<Ride> {
    const { data } = await api.post<{ ride: Ride }>(`/rides/${rideId}/rate`, { rating, comment });
    return data.ride;
  },
};
