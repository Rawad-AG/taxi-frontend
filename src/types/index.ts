export type UserRole = 'customer' | 'driver' | 'admin';

export interface CarInfo {
  make: { _id: string; name: string } | string;
  model: { _id: string; name: string } | string;
  year: number;
  color: string;
  plateNumber: string;
  seats: number;
  category: 'economy' | 'comfort' | 'luxury' | 'van';
}

export interface DriverProfile {
  fullName: string;
  fatherName: string;
  nationalId: string;
  licenseNumber: string;
  licenseExpiry: string;
  workingCity: { _id: string; name: string } | string | null;
  workingAreas: ({ _id: string; name: string } | string)[];
  car: CarInfo | null;
}

export interface User {
  id: string;
  role: UserRole;
  phone: string;
  status: 'active' | 'pending' | 'suspended';
  firstName?: string;
  lastName?: string;
  driverProfile?: DriverProfile | null;
  createdAt: string;
}

export interface AuthResponse {
  user?: User;
  accessToken?: string;
  message?: string;
  requiresOtp?: boolean;
  otpChannel?: 'sms' | 'whatsapp';
  phone?: string;
  expiresIn?: number;
  devOtp?: string;
}

export interface OtpVerifyResponse {
  user: User;
  accessToken: string;
}

export interface City {
  _id: string;
  name: string;
  slug: string;
  lat?: number;
  lng?: number;
}

export interface Area {
  _id: string;
  name: string;
  slug: string;
}

export interface CarMake {
  _id: string;
  name: string;
}

export interface CarModel {
  _id: string;
  name: string;
  category: 'economy' | 'comfort' | 'luxury' | 'van';
  seats: number;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: { path: string; message: string }[];
  };
}
