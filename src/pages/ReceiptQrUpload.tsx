import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../lib/api';
import type { Receipt, QrImageClaimResult } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FileUpload } from '../components/ui/FileUpload';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { X, QrCode, AlertCircle } from 'lucide-react';

export function ReceiptQrUpload() {
  const { receiptId } = useParams<{ receiptId: string }>();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [referralCode, setReferralCode] = useState('');
  const [result, setResult] = useState<QrImageClaimResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!receiptId) return;
    api
      .get('/receipts')
      .then((res) => {
        const found = res.data.find((r: Receipt) => r._id === receiptId);
        if (found) setReceipt(found);
      })
      .finally(() => setPageLoading(false));
  }, [receiptId]);

  const handleFiles = (selected: FileList | null) => {
    if (!selected) return;
    const newFiles = Array.from(selected);
    setFiles((prev) => [...prev, ...newFiles]);
    setPreviews((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!receiptId || files.length === 0) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('images', f));
      if (referralCode.trim()) {
        formData.append('referralCode', referralCode.trim());
      }
      const res = await api.post<QrImageClaimResult>(`/receipts/${receiptId}/qr-images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      if (res.data.success && res.data.cashoutQrUrl) {
        toast.success(res.data.message || 'QR codes validated successfully');
      } else if (res.data.pendingApproval) {
        toast.info(res.data.message || 'Receipt pending approval');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to process QR images');
    } finally {
      setIsLoading(false);
    }
  };

  if (pageLoading) return <LoadingSpinner className="py-10" />;
  if (!receipt) return <Card className="py-10 text-center text-gray-500">Receipt not found</Card>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Product QR Codes</h1>
        <p className="text-sm text-gray-500">Upload photos of the QR codes on your purchased products</p>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Receipt</p>
            <p className="text-xs text-gray-500">{new Date(receipt.createdAt).toLocaleDateString()}</p>
          </div>
          <Badge variant={receipt.status === 'approved' ? 'success' : 'warning'}>{receipt.status}</Badge>
        </div>
        {receipt.items && receipt.items.length > 0 && (
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Items</p>
            <div className="flex flex-wrap gap-2">
              {receipt.items.map((it, idx) => (
                <span
                  key={idx}
                  className="rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm"
                >
                  {it.productSku} × {it.quantity}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {!result?.cashoutQrUrl ? (
        <Card>
          <div className="space-y-4">
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {previews.map((p, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={p}
                      alt={`QR ${idx + 1}`}
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                    <button
                      onClick={() => removeFile(idx)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <FileUpload onChange={handleFiles} multiple>
              <div className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-8 hover:bg-gray-50">
                <QrCode size={28} className="mb-2 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Add QR code images</span>
                <span className="text-xs text-gray-500">You can select multiple</span>
              </div>
            </FileUpload>

            <Input
              label="Referral code (optional)"
              placeholder="Enter a professional's referral code"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              autoCapitalize="off"
              autoCorrect="off"
            />

            <Button
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={files.length === 0}
              className="w-full"
            >
              Validate QR Codes
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
            <QrCode size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">QR Codes Validated</h3>
          <p className="mb-4 text-sm text-gray-500">
            Cashback:{' '}
            <span className="font-bold text-purple-600">
              {result.cashbackAmount} {result.currency}
            </span>
          </p>
          <Button onClick={() => navigate(`/receipt/${receiptId}/cashback`)} className="w-full">
            View Cashback QR
          </Button>
        </Card>
      )}

      {result && result.invalidCodes.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <div className="mb-2 flex items-center gap-2 text-red-700">
            <AlertCircle size={18} />
            <span className="font-semibold">Some QR codes were invalid</span>
          </div>
          <ul className="space-y-1 text-sm text-red-600">
            {result.invalidCodes.map((ic, idx) => (
              <li key={idx}>• {ic.code}: {ic.reason}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
