import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { Receipt } from '../lib/api';
import { isProfessional } from '../lib/roles';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Upload, QrCode, History, ChevronRight, CreditCard, Store } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const showPoints = isProfessional(user);

  useEffect(() => {
    api.get('/receipts').then((res) => setReceipts(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      {showPoints ? (
        <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white">
          <p className="text-sm text-purple-100">Available Points</p>
          <p className="text-4xl font-extrabold">{user?.pointsBalance.toLocaleString() || 0}</p>
          <p className="text-sm text-purple-100">Lifetime: {user?.lifetimePoints.toLocaleString() || 0}</p>
          <div className="mt-4 flex gap-2">
            <Badge variant="info">{user?.tier || 'Bronze'}</Badge>
            <Badge variant="neutral">{user?.currency}</Badge>
          </div>
        </Card>
      ) : (
        <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white">
          <p className="text-sm text-purple-100">Welcome back</p>
          <p className="text-2xl font-extrabold">{user?.name || user?.email?.split('@')[0]}</p>
          <p className="mt-1 text-sm text-purple-100">Upload receipts to earn cashback at dealers</p>
          <div className="mt-4">
            <Badge variant="neutral">{user?.currency}</Badge>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Link to="/receipt">
          <Card className="flex h-full flex-col items-center justify-center gap-2 text-center hover:bg-gray-50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <Upload size={20} />
            </div>
            <span className="font-medium text-gray-900">Upload Receipt</span>
          </Card>
        </Link>
        {showPoints && (
          <Link to="/cashout">
            <Card className="flex h-full flex-col items-center justify-center gap-2 text-center hover:bg-gray-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CreditCard size={20} />
              </div>
              <span className="font-medium text-gray-900">Cash Out</span>
            </Card>
          </Link>
        )}
        <Link to="/dealers">
          <Card className="flex h-full flex-col items-center justify-center gap-2 text-center hover:bg-gray-50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Store size={20} />
            </div>
            <span className="font-medium text-gray-900">Find Dealers</span>
          </Card>
        </Link>
        <Link to="/history">
          <Card className="flex h-full flex-col items-center justify-center gap-2 text-center hover:bg-gray-50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <History size={20} />
            </div>
            <span className="font-medium text-gray-900">History</span>
          </Card>
        </Link>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: '#111827' }}>Recent Receipts</h2>
          <Link to="/history" className="text-sm font-medium text-purple-600 hover:underline">
            View all
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : receipts.length === 0 ? (
          <Card className="py-8 text-center text-gray-500">
            No receipts yet. Upload your first receipt to get cashback.
          </Card>
        ) : (
          <div className="space-y-3">
            {receipts.slice(0, 5).map((r) => (
              <Link key={r._id} to={r.cashoutQrUrl ? `/receipt/${r._id}/cashback` : `/receipt/${r._id}/qr`}>
                <Card className="flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'
                        }
                      >
                        {r.status}
                      </Badge>
                      {r.cashbackAmount !== undefined && (
                        <span className="text-sm font-semibold text-purple-600">
                          {r.cashbackAmount} {r.cashbackCurrency}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(r.createdAt).toLocaleDateString()} • {r.items?.length || 0} items
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    {r.cashoutQrUrl ? <QrCode size={18} /> : <Upload size={18} />}
                    <ChevronRight size={18} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
