import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { DealerProfile } from '../lib/api';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Search, MapPin, Phone, Clock } from 'lucide-react';

function DealerCard({
  dealer,
  isPreferred,
  onSetPreferred,
}: {
  dealer: DealerProfile;
  isPreferred: boolean;
  onSetPreferred: () => void;
}) {
  return (
    <Card className={`space-y-3 ${isPreferred ? 'border-2 border-purple-400' : ''}`}>
      {isPreferred && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
          ⭐ My Store
        </span>
      )}

      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-2xl">
          🏪
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 truncate">{dealer.shopName}</p>
          <p className="text-sm text-gray-400">{dealer.province}</p>
        </div>
        <span className="flex-shrink-0 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-600">
          {dealer.currency}
        </span>
      </div>

      <div className="space-y-1 text-sm text-gray-500">
        {dealer.address && (
          <div className="flex items-start gap-2">
            <MapPin size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
            <span>{dealer.address}</span>
          </div>
        )}
        {dealer.phone && (
          <div className="flex items-center gap-2">
            <Phone size={14} className="flex-shrink-0 text-gray-400" />
            <span>{dealer.phone}</span>
          </div>
        )}
        {dealer.openingHours && (
          <div className="flex items-center gap-2">
            <Clock size={14} className="flex-shrink-0 text-gray-400" />
            <span>{dealer.openingHours}</span>
          </div>
        )}
      </div>

      <button
        onClick={onSetPreferred}
        className={`w-full rounded-xl border-2 py-2.5 text-sm font-semibold transition-colors ${
          isPreferred
            ? 'border-purple-500 bg-purple-50 text-purple-700'
            : 'border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600'
        }`}
      >
        {isPreferred ? '✅ My Preferred Store' : 'Set as My Store'}
      </button>
    </Card>
  );
}

export function Dealers() {
  const { user, refreshUser } = useAuth();
  const [dealers, setDealers] = useState<DealerProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadDealers = useCallback(async () => {
    try {
      const res = await api.get('/dealers');
      setDealers(res.data);
    } catch {
      toast.error('Failed to load dealers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDealers();
  }, [loadDealers]);

  const handleSetPreferred = async (dealer: DealerProfile) => {
    try {
      await api.patch('/me', { preferredStore: dealer._id });
      await refreshUser();
      toast.success(`${dealer.shopName} is now your preferred store ✅`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update preferred store');
    }
  };

  const filtered = dealers.filter(
    (d) =>
      d.shopName.toLowerCase().includes(search.toLowerCase()) ||
      d.province.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Dealer Finder</h1>
        <p className="text-sm text-gray-500">Find approved dealers near you</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or province…"
          className="w-full rounded-xl border-2 border-gray-200 py-3 pl-9 pr-4 text-sm focus:border-purple-500 focus:outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner className="py-10" />
      ) : (
        <>
          <p className="text-xs font-medium text-gray-400">
            {filtered.length} dealer{filtered.length !== 1 ? 's' : ''} found
          </p>

          {filtered.length === 0 ? (
            <Card className="py-10 text-center">
              <p className="text-4xl">🏪</p>
              <p className="mt-2 text-sm text-gray-500">No dealers found matching your search</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filtered.map((d) => (
                <DealerCard
                  key={d._id}
                  dealer={d}
                  isPreferred={user?.preferredStore === d._id}
                  onSetPreferred={() => handleSetPreferred(d)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
