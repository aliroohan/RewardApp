import type { User } from './api';

/** Customers who have not yet linked a professional referral code. */
export function canEnterReferralCode(user: User | null | undefined): boolean {
  return !!user && user.role === 'customer' && !user.referredBy;
}
