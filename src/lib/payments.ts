import type { AdminBucketTransaction, AdminDebt, AdminDebtsResponse, BucketTransaction, PaymentStatus, PayLaterDebt } from '../types/payment';
import { api } from './api';

export const paymentsApi = {
  async status(): Promise<PaymentStatus> {
    const { data } = await api.get<PaymentStatus>('/payments/status');
    return data;
  },

  async deposit(amount: number): Promise<{ bucketBalance: number }> {
    const { data } = await api.post<{ bucketBalance: number }>('/payments/bucket/deposit', { amount });
    return data;
  },

  async debts(): Promise<PayLaterDebt[]> {
    const { data } = await api.get<{ debts: PayLaterDebt[] }>('/payments/debts');
    return data.debts;
  },

  async payDebt(debtId: string): Promise<{ debt: PayLaterDebt; bucketBalance: number }> {
    const { data } = await api.post<{ debt: PayLaterDebt; bucketBalance: number }>(`/payments/debts/${debtId}/pay`);
    return data;
  },

  async bucketHistory(): Promise<BucketTransaction[]> {
    const { data } = await api.get<{ transactions: BucketTransaction[] }>('/payments/bucket/history');
    return data.transactions;
  },

  async adminDebts(): Promise<AdminDebtsResponse> {
    const { data } = await api.get<AdminDebtsResponse>('/admin/debts');
    return data;
  },

  async settleDebt(debtId: string, note?: string): Promise<{ debt: AdminDebt }> {
    const { data } = await api.post<{ debt: AdminDebt }>(`/admin/debts/${debtId}/settle`, { note });
    return data;
  },

  async waiveDebt(debtId: string, note?: string): Promise<{ debt: AdminDebt }> {
    const { data } = await api.post<{ debt: AdminDebt }>(`/admin/debts/${debtId}/waive`, { note });
    return data;
  },

  async adjustBucket(userId: string, amount: number, note?: string): Promise<{ bucketBalance: number }> {
    const { data } = await api.post<{ bucketBalance: number }>('/admin/bucket/adjust', { userId, amount, note });
    return data;
  },

  async adminBucketTransactions(): Promise<AdminBucketTransaction[]> {
    const { data } = await api.get<{ transactions: AdminBucketTransaction[] }>('/admin/bucket/transactions');
    return data.transactions;
  },
};
