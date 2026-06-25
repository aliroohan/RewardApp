import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { isProfessional } from '../lib/roles';
import { api } from '../lib/api';
import type { CashoutRequest, ProfessionalCashoutQrData } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Download } from 'lucide-react';

const STATUS_VARIANTS: Record<string, 'warning' | 'info' | 'success' | 'danger' | 'neutral'> = {
  pending:          'warning',
  dealer_confirmed: 'info',
  completed:        'success',
  cancelled:        'danger',
  expired:          'neutral',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending dealer scan',
  dealer_confirmed: 'Dealer confirmed',
  completed: 'Cashout completed',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

export function Cashout() {
  const { user, refreshUser } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [pointsInput, setPointsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [qrData, setQrData] = useState<ProfessionalCashoutQrData | null>(null);

  const [cashouts, setCashouts] = useState<CashoutRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [loadingQrId, setLoadingQrId] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const res = await api.get('/cashouts');
      setCashouts(res.data);
    } catch {
      // silent
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (step !== 2 || !qrData) return;
    const current = cashouts.find((c) => c._id === qrData.cashoutRequestId);
    if (current?.status !== 'pending') return;
    const interval = setInterval(loadHistory, 5000);
    return () => clearInterval(interval);
  }, [step, qrData, cashouts, loadHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pts = parseInt(pointsInput, 10);
    if (isNaN(pts) || pts <= 0) { toast.error('Enter a valid points amount'); return; }
    if (user && pts > user.pointsBalance) {
      toast.error(`You only have ${user.pointsBalance.toLocaleString()} points available`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/cashouts', { pointsAmount: pts });
      setQrData({
        cashoutQrUrl: res.data.cashoutQrUrl,
        cashoutRequestId: res.data._id,
        cashAmount: res.data.cashAmount,
        currency: res.data.currency,
        pointsAmount: res.data.pointsAmount,
      });
      setStep(2);
      await Promise.all([loadHistory(), refreshUser()]);
      toast.success('Cashout QR generated!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create cashout request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShowQr = async (id: string) => {
    setLoadingQrId(id);
    try {
      const res = await api.get<ProfessionalCashoutQrData>(`/cashouts/${id}/qr`);
      setQrData(res.data);
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load cashout QR');
    } finally {
      setLoadingQrId(null);
    }
  };

  const handleUserConfirm = async (id: string) => {
    setConfirmingId(id);
    try {
      await api.post(`/cashouts/${id}/user-confirm`);
      toast.success('Cashout receipt confirmed ✅');
      loadHistory();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to confirm');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleNewCashout = () => {
    setStep(1);
    setPointsInput('');
    setQrData(null);
  };

  const handleDownload = () => {
    if (!qrData?.cashoutQrUrl) return;
    const link = document.createElement('a');
    link.href = qrData.cashoutQrUrl;
    link.download = `cashout-${qrData.cashoutRequestId}.png`;
    link.target = '_blank';
    link.click();
  };

  if (!user) return null;
  if (!isProfessional(user)) return <Navigate to="/" replace />;

  const activeCashout = qrData
    ? cashouts.find((c) => c._id === qrData.cashoutRequestId)
    : undefined;
  const qrStatus = activeCashout?.status ?? qrData?.status ?? 'pending';
  const qrCompleted = qrStatus === 'completed';

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 p-6 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-6 h-28 w-28 rounded-full bg-white/8" />
        <p className="text-sm text-purple-200">Available Points</p>
        <p className="text-5xl font-extrabold tracking-tight">{user.pointsBalance.toLocaleString()}</p>
        <p className="mt-1 text-sm text-purple-200">Generate a QR code and show it to any approved dealer</p>
      </div>

      {step === 1 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-base font-bold" style={{ color: '#111827' }}>Enter Points to Cash Out</h2>
          <Card>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
              Points to Cash Out
            </label>
            <input
              type="number"
              value={pointsInput}
              onChange={(e) => setPointsInput(e.target.value)}
              placeholder="e.g. 1000"
              min={1}
              max={user.pointsBalance}
              className="w-full rounded-xl border-2 border-gray-200 p-4 text-center text-3xl font-bold text-gray-900 focus:border-purple-500 focus:outline-none"
            />
            <p className="mt-1.5 text-center text-xs text-gray-400">
              Available: {user.pointsBalance.toLocaleString()} pts
            </p>
          </Card>
          <Button type="submit" isLoading={submitting} className="w-full">
            Generate Cashout QR
          </Button>
        </form>
      )}

      {step === 2 && qrData && (
        <div className="space-y-4">
          <Card className="text-center border-purple-200 bg-purple-50">
            <h2 className="text-xl font-extrabold text-gray-900">
              {qrCompleted ? 'Cashout Completed' : 'Your Cashout QR'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {qrCompleted
                ? 'Your dealer has confirmed this cashout.'
                : 'Show this QR code to a dealer to receive cash'}
            </p>
            <div className="mx-auto mt-4 inline-block rounded-2xl border-4 border-purple-100 bg-white p-3">
              <img
                src={qrData.cashoutQrUrl}
                alt="Cashout QR Code"
                className={`h-64 w-64 object-contain ${qrCompleted ? 'opacity-60' : ''}`}
              />
            </div>
            <h3 className="mt-4 text-3xl font-extrabold text-purple-600">
              {qrData.cashAmount} {qrData.currency}
            </h3>
            <p className="text-sm text-gray-500">{qrData.pointsAmount.toLocaleString()} points</p>
            <div className="mt-3 flex justify-center">
              <Badge variant={STATUS_VARIANTS[qrStatus] ?? 'neutral'}>
                {STATUS_LABELS[qrStatus] ?? qrStatus.replace(/_/g, ' ')}
              </Badge>
            </div>
            <Button variant="outline" className="mt-4 w-full" onClick={handleDownload}>
              <Download size={18} className="mr-2" /> Save QR Code
            </Button>
          </Card>
          <Button className="w-full" onClick={handleNewCashout}>
            New Cashout Request
          </Button>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-base font-bold" style={{ color: '#111827' }}>Cashout History</h2>
        {loadingHistory ? (
          <LoadingSpinner className="py-8" />
        ) : cashouts.length === 0 ? (
          <Card className="py-8 text-center text-sm text-gray-500">
            No cashout requests yet
          </Card>
        ) : (
          <Card className="divide-y divide-gray-100 p-0 overflow-hidden">
            {cashouts.map((c) => (
              <div key={c._id} className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">
                    💸 {c.pointsAmount.toLocaleString()} pts
                  </span>
                  <Badge variant={STATUS_VARIANTS[c.status] ?? 'neutral'}>
                    {STATUS_LABELS[c.status] ?? c.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400">
                  {c.cashAmount} {c.currency} · {new Date(c.createdAt).toLocaleDateString()}
                </p>
                {c.status === 'pending' && c.source === 'professional_qr' && (
                  <button
                    onClick={() => handleShowQr(c._id)}
                    disabled={loadingQrId === c._id}
                    className="mt-2 rounded-lg border border-purple-300 bg-purple-50 px-4 py-1.5 text-sm font-semibold text-purple-700 hover:bg-purple-100 disabled:opacity-50"
                  >
                    {loadingQrId === c._id ? 'Loading…' : 'Show QR Code'}
                  </button>
                )}
                {c.status === 'dealer_confirmed' && (
                  <button
                    onClick={() => handleUserConfirm(c._id)}
                    disabled={confirmingId === c._id}
                    className="mt-2 rounded-lg border border-green-300 bg-green-50 px-4 py-1.5 text-sm font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
                  >
                    {confirmingId === c._id ? 'Confirming…' : '✅ Confirm Receipt'}
                  </button>
                )}
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
