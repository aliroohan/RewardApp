import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../lib/api';
import type { Receipt } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Download, Clock } from 'lucide-react';

interface CashoutQrData {
  cashoutQrUrl: string;
  cashoutRequestId: string;
  cashbackAmount: number;
  currency: string;
  customerPoints: number;
  dealerPoints: number;
  professionalPoints: number;
  pendingApproval?: boolean;
  message?: string;
}

export function CashbackQr() {
  const { receiptId } = useParams<{ receiptId: string }>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [data, setData] = useState<CashoutQrData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
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
  };

  useEffect(() => {
    fetchData();
  }, [receiptId]);

  const handleDownload = () => {
    if (!data?.cashoutQrUrl) return;
    const link = document.createElement('a');
    link.href = data.cashoutQrUrl;
    link.download = `cashout-${data.cashoutRequestId}.png`;
    link.target = '_blank';
    link.click();
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Your Cashback QR</h1>
        <p className="text-sm text-gray-500">Show this QR code to an approved dealer to receive cashback</p>
      </div>

      <Card className="text-center">
        <div className="mb-4 inline-block rounded-2xl border-4 border-purple-100 bg-white p-3">
          <img
            src={data?.cashoutQrUrl}
            alt="Cashback QR Code"
            className="h-64 w-64 object-contain"
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
        <h3 className="mb-3 font-semibold text-gray-900">Breakdown</h3>
        <div className="space-y-2 text-sm">
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
          <div className="flex justify-between border-t pt-2">
            <span className="text-gray-500">Status</span>
            <Badge variant="warning">Pending dealer scan</Badge>
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
