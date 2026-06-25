import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { CashoutRequest, Receipt } from '../lib/api';
import { isProfessional } from '../lib/roles';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Download, Clock, CheckCircle2 } from 'lucide-react';

const STATUS_VARIANTS: Record<string, 'warning' | 'info' | 'success' | 'danger' | 'neutral'> = {
  pending: 'warning',
  dealer_confirmed: 'info',
  completed: 'success',
  cancelled: 'danger',
  expired: 'neutral',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending dealer scan',
  dealer_confirmed: 'Dealer confirmed',
  completed: 'Cashback completed',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

interface CashoutQrData {
  cashoutQrUrl: string;
  cashoutRequestId: string;
  cashbackAmount: number;
  currency: string;
  customerPoints: number;
  dealerPoints: number;
  professionalPoints: number;
  status?: CashoutRequest['status'];
  completedAt?: string;
  pendingApproval?: boolean;
  message?: string;
}

export function CashbackQr() {
  const { user } = useAuth();
  const { receiptId } = useParams<{ receiptId: string }>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const showPoints = isProfessional(user);
  const [data, setData] = useState<CashoutQrData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!receiptId) return;
    try {
      const [receiptsRes, qrRes] = await Promise.all([
        api.get('/receipts'),
        api.get(`/receipts/${receiptId}/cashout-qr`),
      ]);
      setReceipt(receiptsRes.data.find((r: Receipt) => r._id === receiptId));
      setData(qrRes.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load cashback QR');
    } finally {
      setLoading(false);
    }
  }, [receiptId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (data?.status !== 'pending') return;
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [data?.status, fetchData]);

  const handleDownload = () => {
    if (!data?.cashoutQrUrl) return;
    const link = document.createElement('a');
    link.href = data.cashoutQrUrl;
    link.download = `cashout-${data.cashoutRequestId}.png`;
    link.target = '_blank';
    link.click();
  };

  const status = data?.status || 'pending';
  const isCompleted = status === 'completed';

  if (loading) return <LoadingSpinner className="py-10" />;

  if (data?.pendingApproval || !data?.cashoutQrUrl) {
    return (
      <Card className="py-12 text-center">
        <Clock size={48} className="mx-auto mb-4 text-amber-500" />
        <h2 className="text-xl font-bold text-gray-900">Receipt Under Review</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
          {data?.message || 'Your receipt is pending approval. The cashback QR will be generated once approved.'}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isCompleted ? 'Cashback Received' : 'Your Cashback QR'}
        </h1>
        <p className="text-sm text-gray-500">
          {isCompleted
            ? 'Your dealer has confirmed this cashback.'
            : 'Show this QR code to an approved dealer to receive cashback'}
        </p>
      </div>

      {isCompleted && (
        <Card className="flex items-center gap-3 border-green-200 bg-green-50 py-4">
          <CheckCircle2 size={28} className="shrink-0 text-green-600" />
          <div>
            <p className="font-semibold text-green-900">Cashback completed</p>
            <p className="text-sm text-green-700">
              {data.cashbackAmount} {data.currency} received
              {data.completedAt && ` on ${new Date(data.completedAt).toLocaleDateString()}`}
            </p>
          </div>
        </Card>
      )}

      <Card className="text-center">
        <div className="mb-4 inline-block rounded-2xl border-4 border-purple-100 bg-white p-3">
          <img
            src={data?.cashoutQrUrl}
            alt="Cashback QR Code"
            className={`h-64 w-64 object-contain ${isCompleted ? 'opacity-60' : ''}`}
          />
        </div>
        <h2 className="text-3xl font-extrabold text-purple-600">
          {data?.cashbackAmount} {data?.currency}
        </h2>
        <p className="text-sm text-gray-500">Cashback amount</p>
        <Button variant="outline" className="mt-4 w-full" onClick={handleDownload}>
          <Download size={18} className="mr-2" /> Save QR Code
        </Button>
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold text-gray-900">{showPoints ? 'Breakdown' : 'Status'}</h3>
        <div className="space-y-2 text-sm">
          {showPoints && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer points value</span>
                <span className="font-medium text-gray-900">{data?.customerPoints} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dealer points</span>
                <span className="font-medium text-gray-900">{data?.dealerPoints} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Professional points</span>
                <span className="font-medium text-gray-900">{data?.professionalPoints} pts</span>
              </div>
            </>
          )}
          <div className={`flex justify-between ${showPoints ? 'border-t pt-2' : ''}`}>
            <span className="text-gray-500">Status</span>
            <Badge variant={STATUS_VARIANTS[status] ?? 'neutral'}>
              {STATUS_LABELS[status] ?? status.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>
      </Card>

      {receipt?.items && receipt.items.length > 0 && (
        <Card>
          <h3 className="mb-3 font-semibold text-gray-900">Products</h3>
          <div className="space-y-2">
            {receipt.items.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                <span className="font-medium text-gray-900">{it.productSku}</span>
                <span className="text-gray-500">Qty: {it.quantity}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
