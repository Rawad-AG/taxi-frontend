export type PaymentMethod = 'cash' | 'bucket' | 'pay_later';
export type MockPaymentMethod = 'sham_cash' | 'syriatel_cash';
export type DebtStatus = 'outstanding' | 'paid' | 'overdue' | 'waived';

export interface PayLaterStatus {
  eligible: boolean;
  completedRides: number;
  outstandingBalance: number;
  outstandingCount: number;
  overdueBalance: number;
  overdueCount: number;
  blocked: boolean;
  blockedReason: string | null;
}

export interface BucketTransaction {
  id: string;
  type: 'deposit' | 'ride_payment' | 'debt_payment' | 'adjustment';
  amount: number;
  rideId: string | null;
  debtId?: string | null;
  note: string | null;
  balanceAfter: number | null;
  createdAt: string;
}

export interface PaymentStatus {
  bucketBalance: number;
  payLater: PayLaterStatus;
  transactions: BucketTransaction[];
}

export interface PayLaterDebt {
  id: string;
  ride: string;
  amount: number;
  status: DebtStatus;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
  settledBy?: string | null;
  settledNote?: string | null;
}

export interface AdminDebt extends PayLaterDebt {
  customer: { id: string; name: string; phone: string | null } | null;
}

export interface AdminDebtsResponse {
  debts: AdminDebt[];
  totals: {
    outstanding: number;
    overdue: number;
    open: number;
    bucketTotal: number;
    counts: { outstanding: number; overdue: number };
  };
}

export interface AdminBucketTransaction {
  id: string;
  userId: string | null;
  type: BucketTransaction['type'];
  amount: number;
  note: string | null;
  balanceAfter: number | null;
  createdAt: string;
}
