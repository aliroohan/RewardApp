import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../lib/api';
import type { ScanCashoutResult } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CheckCircle, Banknote, User, Package } from 'lucide-react';

export function DealerConfirm() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state as ScanCashoutResult | null;
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (!data) {
    return (
      <Card className="py-10 text-center text-gray-500">
        No scan data. Please scan a cashback QR first.
        <div className="mt-4">
          <Button onClick={() => navigate('/scan')}>Go to Scan</Button>
        </div>
      </Card>
    );
  }

  const isProfessionalCashout = data.source === 'professional_qr';
  const pointsTransferred = isProfessionalCashout
    ? (data.pointsAmount || 0)
    : data.customerPoints + data.dealerPoints;
  const recipientLabel = isProfessionalCashout ? 'professional' : 'customer';

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await api.post(`/cashouts/${data.cashoutRequestId}/dealer-confirm`);
      toast.success('Cashback completed. Points transferred to your account.');
      setConfirmed(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to confirm cashback');
    } finally {
      setIsConfirming(false);
    }
  };

  if (confirmed) {
    return (
      <Card className="py-12 text-center">
        <CheckCircle size={64} className="mx-auto mb-4 text-green-500" />
        <h2 className="text-2xl font-bold text-gray-900">Cashback Completed</h2>
        <p className="mt-2 text-gray-500">You paid {data.cashbackAmount} {data.currency} to the {recipientLabel}.</p>
        <p className="mt-1 text-sm text-gray-500">
          Points earned: {pointsTransferred} pts
        </p>
        <Button onClick={() => navigate('/')} className="mt-6 w-full">
          Back to Dashboard
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isProfessionalCashout ? 'Confirm Professional Cashout' : 'Confirm Cashback'}
        </h1>
        <p className="text-sm text-gray-500">
          Review the details and confirm payment to the {recipientLabel}
        </p>
      </div>

      <Card className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
          <Banknote size={28} />
        </div>
        <h2 className="text-3xl font-extrabold text-purple-600">
          {data.cashbackAmount} {data.currency}
        </h2>
        <p className="text-sm text-gray-500">Pay this amount to the {recipientLabel}</p>
        <Badge variant="warning" className="mt-3">Pending confirmation</Badge>
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold text-gray-900">
          {isProfessionalCashout ? 'Professional' : 'Customer'}
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
            <User size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">{data.customer?.name || data.customer?.email}</p>
            <p className="text-xs text-gray-500">{data.customer?.email}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold text-gray-900">Points Breakdown</h3>
        <div className="space-y-2 text-sm">
          {isProfessionalCashout ? (
            <div className="flex justify-between">
              <span className="text-gray-500">Professional points (transferred to you)</span>
              <span className="font-medium text-gray-900">{data.pointsAmount || 0} pts</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer points (transferred to you)</span>
                <span className="font-medium text-gray-900">{data.customerPoints} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dealer points</span>
                <span className="font-medium text-gray-900">{data.dealerPoints} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Professional points</span>
                <span className="font-medium text-gray-900">{data.professionalPoints} pts</span>
              </div>
            </>
          )}
        </div>
      </Card>

      {data.receipt?.items && data.receipt.items.length > 0 && (
        <Card>
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
            <Package size={18} /> Products
          </h3>
          <div className="space-y-2">
            {data.receipt.items.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                <span className="font-medium text-gray-900">{it.productSku}</span>
                <span className="text-gray-500">Qty: {it.quantity}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Button onClick={handleConfirm} isLoading={isConfirming} className="w-full">
        Confirm Cashback Paid
      </Button>
    </div>
  );
}
