import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FileUpload } from '../components/ui/FileUpload';
import { Input } from '../components/ui/Input';
import { Upload, X, Camera } from 'lucide-react';

export function ReceiptUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileSelect = (files: FileList | null) => {
    const selected = files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      if (referralCode.trim()) {
        formData.append('referralCode', referralCode.trim());
      }
      const res = await api.post('/receipts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Receipt uploaded successfully');
      navigate(`/receipt/${res.data._id}/qr`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to upload receipt');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Receipt</h1>
        <p className="text-sm text-gray-500">Take a clear photo of your purchase receipt</p>
      </div>

      <Card>
        <Input
          label="Referral code (optional)"
          placeholder="Enter a professional's referral code"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          autoCapitalize="off"
          autoCorrect="off"
        />
        <p className="mt-2 text-xs text-gray-500">
          Have a code from a professional? Enter it here before submitting your receipt.
        </p>
      </Card>

      <Card>
        {preview ? (
          <div className="space-y-4">
            <img
              src={preview}
              alt="Receipt preview"
              className="max-h-80 w-full rounded-lg object-contain"
            />
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
              >
                <X size={18} className="mr-2" /> Remove
              </Button>
              <Button isLoading={isLoading} className="flex-[2]" onClick={handleSubmit}>
                Submit Receipt
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <Camera size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Upload a Receipt</h3>
            <p className="mx-auto mb-5 max-w-xs text-sm text-gray-500">
              Take a photo or choose from your gallery to earn cashback
            </p>
            <FileUpload onChange={handleFileSelect}>
              <Button className="w-full sm:w-auto">
                <Upload size={18} className="mr-2" /> Select Receipt Image
              </Button>
            </FileUpload>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold text-gray-900">How it works</h3>
        <ol className="space-y-3 text-sm text-gray-600">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-600">
              1
            </span>
            Upload a clear photo of your receipt
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-600">
              2
            </span>
            Upload the QR codes from the products you bought
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-600">
              3
            </span>
            Show the generated cashback QR to a dealer
          </li>
        </ol>
      </Card>
    </div>
  );
}
