import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { CashoutRequest, User } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const STATUS_VARIANTS: Record<string, 'warning' | 'info' | 'success' | 'danger' | 'neutral'> = {
  pending: 'warning',
  dealer_confirmed: 'info',
  completed: 'success',
  cancelled: 'danger',
  expired: 'neutral',
};

const SOURCE_LABELS: Record<string, string> = {
  receipt_qr: 'Receipt cashback',
  professional_qr: 'Professional cashout',
  manual: 'Manual cashout',
};

type CashoutWithCustomer = CashoutRequest & {
  userId: string | User;
};

function getCustomerLabel(userId: string | User): string | null {
  if (typeof userId === 'object' && userId !== null) {
    return userId.name || userId.email || null;
  }
  return null;
}

function getPointsEarned(c: CashoutRequest): number {
  if (c.source === 'receipt_qr') {
    return (c.customerPoints || 0) + (c.dealerPoints || 0);
  }
  return c.pointsAmount || 0;
}

export function DealerHistory() {
  const [cashouts, setCashouts] = useState<CashoutWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/cashouts')
      .then((res) => setCashouts(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scan History</h1>
        <p className="text-sm text-gray-500">Past cashback confirmations and scans</p>
      </div>

      {loading ? (
        <LoadingSpinner className="py-10" />
      ) : cashouts.length === 0 ? (
        <Card className="py-10 text-center text-gray-500">
          No confirmed cashouts yet. Scan a customer QR to get started.
        </Card>
      ) : (
        <div className="space-y-3">
          {cashouts.map((c) => {
            const customer = getCustomerLabel(c.userId);
            return (
              <Card key={c._id}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">
                    {c.cashAmount} {c.currency}
                  </span>
                  <Badge variant={STATUS_VARIANTS[c.status] ?? 'neutral'}>
                    {c.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {SOURCE_LABELS[c.source] || c.source}
                  {customer && ` · ${customer}`}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(c.createdAt).toLocaleDateString()} · +{getPointsEarned(c).toLocaleString()} pts earned
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
