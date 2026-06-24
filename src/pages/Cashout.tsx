import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { isProfessional } from '../lib/roles';
import { api } from '../lib/api';
import type { DealerProfile, CashoutRequest } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { CheckCircle, Store } from 'lucide-react';

const STATUS_VARIANTS: Record<string, 'warning' | 'info' | 'success' | 'danger' | 'neutral'> = {
  pending:          'warning',
  dealer_confirmed: 'info',
  completed:        'success',
  cancelled:        'danger',
  expired:          'neutral',
};

export function Cashout() {
  const { user, refreshUser } = useAuth();

  /* wizard step */
  const [step, setStep] = useState<1 | 2 | 3>(1);

  /* step 1 – dealer list */
  const [dealers, setDealers]               = useState<DealerProfile[]>([]);
  const [selectedDealer, setSelectedDealer] = useState<DealerProfile | null>(null);
  const [loadingDealers, setLoadingDealers] = useState(true);

  /* step 2 – points entry */
  const [pointsInput, setPointsInput] = useState('');
  const [submitting, setSubmitting]   = useState(false);

  /* step 3 – created cashout */
  const [createdId, setCreatedId] = useState<string | null>(null);

  /* history */
  const [cashouts, setCashouts]         = useState<CashoutRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [confirmingId, setConfirmingId]     = useState<string | null>(null);

  const loadDealers = useCallback(async () => {
    try {
      const res = await api.get('/dealers');
      const approved = (res.data as DealerProfile[]).filter((d) => d.approvalStatus === 'approved');
      setDealers(approved);
    } catch {
      toast.error('Failed to load dealers');
    } finally {
      setLoadingDealers(false);
    }
  }, []);

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
    loadDealers();
    loadHistory();
  }, [loadDealers, loadHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pts = parseInt(pointsInput, 10);
    if (!selectedDealer) { toast.error('Select a dealer first'); return; }
    if (isNaN(pts) || pts <= 0) { toast.error('Enter a valid points amount'); return; }
    if (user && pts > user.pointsBalance) {
      toast.error(`You only have ${user.pointsBalance.toLocaleString()} points available`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/cashouts', {
        dealerId:     selectedDealer.userId,
        pointsAmount: pts,
      });
      setCreatedId(res.data._id);
      setStep(3);
      await Promise.all([loadHistory(), refreshUser()]);
      toast.success('Cashout request created!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create cashout request');
    } finally {
      setSubmitting(false);
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
    setSelectedDealer(null);
    setPointsInput('');
    setCreatedId(null);
  };

  if (!user) return null;
  if (!isProfessional(user)) return <Navigate to="/" replace />;

  return (
    <div className="space-y-6">
      {/* Balance hero card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 p-6 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-6 h-28 w-28 rounded-full bg-white/8" />
        <p className="text-sm text-purple-200">Available Points</p>
        <p className="text-5xl font-extrabold tracking-tight">{user.pointsBalance.toLocaleString()}</p>
        <p className="mt-1 text-sm text-purple-200">Cash out at an approved dealer near you</p>
      </div>

      {/* Step indicators */}
      {step < 3 && (
        <div className="flex items-center justify-center gap-2">
          {([1, 2] as const).map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  step >= n ? 'bg-purple-600 text-white' : 'border-2 border-gray-200 text-gray-400'
                }`}
              >
                {n}
              </div>
              {n < 2 && (
                <div className={`h-0.5 w-12 rounded ${step > 1 ? 'bg-purple-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── STEP 1: Choose dealer ── */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-base font-bold" style={{ color: '#111827' }}>Step 1 — Choose a Dealer</h2>

          {loadingDealers ? (
            <LoadingSpinner className="py-8" />
          ) : dealers.length === 0 ? (
            <Card className="py-10 text-center">
              <Store size={36} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-500">No approved dealers available</p>
            </Card>
          ) : (
            <Card className="divide-y divide-gray-100 p-0 overflow-hidden">
              {dealers.map((d) => (
                <button
                  key={d._id}
                  type="button"
                  onClick={() => setSelectedDealer(d)}
                  className={`flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors ${
                    selectedDealer?._id === d._id ? 'bg-purple-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xl flex-shrink-0">
                    🏪
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{d.shopName}</p>
                    <p className="text-xs text-gray-400 truncate">{d.address} · {d.province}</p>
                  </div>
                  {selectedDealer?._id === d._id && (
                    <CheckCircle size={20} className="text-purple-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </Card>
          )}

          <Button
            className="w-full"
            disabled={!selectedDealer}
            onClick={() => selectedDealer && setStep(2)}
          >
            Next →
          </Button>
        </div>
      )}

      {/* ── STEP 2: Enter points ── */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-base font-bold" style={{ color: '#111827' }}>Step 2 — Enter Points Amount</h2>
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Selected Dealer</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{selectedDealer?.shopName}</p>
            <p className="text-sm text-gray-400">{selectedDealer?.address}</p>

            <div className="mt-4 border-t pt-4">
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
            </div>
          </Card>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-shrink-0">
              ← Back
            </Button>
            <Button type="submit" isLoading={submitting} className="flex-1">
              Submit Cashout
            </Button>
          </div>
        </form>
      )}

      {/* ── STEP 3: Cashout created ── */}
      {step === 3 && createdId && (
        <div className="space-y-4">
          <Card className="text-center border-purple-200 bg-purple-50">
            <div className="mb-3 text-4xl">💸</div>
            <h2 className="text-xl font-extrabold text-gray-900">Cashout Request Created</h2>
            <p className="mt-1 text-sm text-gray-500">Show this code to your dealer</p>
            <div className="mx-auto mt-4 max-w-xs rounded-xl border-2 border-purple-400 bg-white p-4">
              <p className="break-all font-mono text-sm font-bold text-gray-800 tracking-wider">{createdId}</p>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              Your dealer will scan or enter this ID to confirm the payment.
            </p>
          </Card>
          <Button className="w-full" onClick={handleNewCashout}>
            New Cashout Request
          </Button>
        </div>
      )}

      {/* ── Cashout History ── */}
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
                    {c.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <p className="mt-1 font-mono text-xs text-gray-400 truncate">ID: {c._id}</p>
                <p className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</p>
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
