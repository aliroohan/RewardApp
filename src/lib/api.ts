import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://huzaifarasheed29-rewardcrm.hf.space/api';
console.log(BASE_URL)
export const api = axios.create({
  baseURL: BASE_URL,
  // timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface LoginResponse {
  token: string;
  user: User;
}

export interface User {
  _id: string;
  email: string;
  role: 'customer' | 'dealer' | 'professional';
  name?: string;
  currency: string;
  pointsBalance: number;
  lifetimePoints: number;
  tier: 'Bronze' | 'Silver' | 'Gold';
  emailVerified: boolean;
  profileCompleted: boolean;
  referralCode?: string;
  gender?: string;
  ageRange?: string;
  segment?: string;
  province?: string;
  preferredStore?: string;
  fcmToken?: string;
  referredBy?: string | { _id: string };
}

export interface DealerProfile {
  _id: string;
  userId: string;
  shopName: string;
  address: string;
  province: string;
  phone: string;
  openingHours?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  currency: string;
}

export interface ReceiptItem {
  productSku: string;
  quantity: number;
  price: number;
}

export interface ReceiptQrImage {
  _id?: string;
  imageUrl: string;
  status: 'pending' | 'decoded' | 'failed';
  decodedCodes: string[];
  error?: string;
  createdAt: string;
}

export interface Receipt {
  _id: string;
  userId: string;
  imageUrl: string;
  storeName?: string;
  totalAmount?: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected';
  ocrConfidence?: number;
  pointsAwarded?: number;
  items?: ReceiptItem[];
  qrImages?: ReceiptQrImage[];
  cashoutQrUrl?: string;
  cashoutRequestId?: string;
  cashbackAmount?: number;
  cashbackCurrency?: string;
  createdAt: string;
}

export interface CashoutRequest {
  _id: string;
  userId: string;
  dealerId?: string;
  receiptId?: string;
  pointsAmount: number;
  cashAmount: number;
  currency: string;
  status: 'pending' | 'dealer_confirmed' | 'completed' | 'cancelled' | 'expired';
  source: 'manual' | 'receipt_qr' | 'professional_qr';
  cashoutQrUrl?: string;
  customerPoints: number;
  dealerPoints: number;
  professionalPoints: number;
  createdAt: string;
}

export interface ProfessionalCashoutQrData {
  cashoutQrUrl: string;
  cashoutRequestId: string;
  cashAmount: number;
  currency: string;
  pointsAmount: number;
  status?: CashoutRequest['status'];
}

export interface QrImageClaimResult {
  success: boolean;
  decodedCount: number;
  validCodes: string[];
  invalidCodes: { code: string; reason: string }[];
  customerPoints: number;
  dealerPoints: number;
  professionalPoints: number;
  cashbackAmount: number;
  currency: string;
  cashoutRequestId?: string;
  cashoutQrUrl?: string;
  pendingApproval?: boolean;
  message?: string;
}

export interface ScanCashoutResult {
  cashoutRequestId: string;
  source?: 'manual' | 'receipt_qr' | 'professional_qr';
  customer: User;
  receipt?: Receipt;
  cashbackAmount: number;
  currency: string;
  pointsAmount?: number;
  customerPoints: number;
  dealerPoints: number;
  professionalPoints: number;
}
