import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { Receipt } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { QrCode, AlertCircle, ChevronRight } from 'lucide-react';

export function CashbackHistory() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/receipts')
      .then((res) => setReceipts(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cashback History</h1>
        <p className="text-sm text-gray-500">Track your receipts and cashback</p>
      </div>

      {loading ? (
        <LoadingSpinner className="py-10" />
      ) : receipts.length === 0 ? (
        <Card className="py-10 text-center text-gray-500">
          No receipts yet.
          <Link to="/receipt" className="ml-1 font-medium text-purple-600 hover:underline">
            Upload your first receipt
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {receipts.map((r) => (
            <Link key={r._id} to={r.cashoutQrUrl ? `/receipt/${r._id}/cashback` : `/receipt/${r._id}/qr`}>
              <Card className="flex items-center justify-between hover:bg-gray-50">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'
                      }
                    >
                      {r.status}
                    </Badge>
                    {r.cashbackAmount !== undefined && (
                      <span className="font-semibold text-purple-600">
                        {r.cashbackAmount} {r.cashbackCurrency}
                      </span>
                    )}
                    {r.status === 'rejected' && <AlertCircle size={16} className="text-red-500" />}
                  </div>
                  <p className="mt-1 truncate text-xs text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString()} • {r.items?.length || 0} items
                    {r.qrImages && r.qrImages.length > 0 && ` • ${r.qrImages.length} QR images`}
                  </p>
                </div>
                <div className="ml-3 flex items-center gap-2 text-gray-400">
                  {r.cashoutQrUrl ? <QrCode size={18} /> : <AlertCircle size={18} />}
                  <ChevronRight size={18} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
