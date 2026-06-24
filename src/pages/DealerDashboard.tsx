import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ScanLine, History } from 'lucide-react';

export function DealerDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-5">
      <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white">
        <p className="text-sm text-purple-100">Dealer Points Balance</p>
        <p className="text-4xl font-extrabold">{user?.pointsBalance.toLocaleString() || 0}</p>
        <p className="text-sm text-purple-100">Scan customer cashback QRs to earn points</p>
      </Card>

      <Link to="/scan">
        <Card className="flex items-center gap-4 hover:bg-gray-50">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-purple-600">
            <ScanLine size={28} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Scan Cashback QR</h3>
            <p className="text-sm text-gray-500">Upload or scan a customer's cashback QR code</p>
          </div>
          <Button>Scan</Button>
        </Card>
      </Link>

      <Link to="/history">
        <Card className="flex items-center gap-4 hover:bg-gray-50">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-purple-600">
            <History size={28} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Scan History</h3>
            <p className="text-sm text-gray-500">View past cashback confirmations</p>
          </div>
        </Card>
      </Link>
    </div>
  );
}
