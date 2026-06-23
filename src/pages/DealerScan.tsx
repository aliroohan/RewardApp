import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { api } from '../lib/api';
import type { ScanCashoutResult } from '../lib/api';
import { Card } from '../components/ui/Card';
import { FileUpload } from '../components/ui/FileUpload';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Upload, Camera, X } from 'lucide-react';

export function DealerScan() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'select' | 'camera' | 'upload'>('select');
  const [isLoading, setIsLoading] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannedRef = useRef(false);

  useEffect(() => {
    if (mode === 'camera') {
      scannedRef.current = false;
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scannerRef.current.render(
        (decodedText) => {
          if (scannedRef.current) return;
          scannedRef.current = true;
          handleDecodedToken(decodedText);
        },
        () => {}
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [mode]);

  const handleFileUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post<ScanCashoutResult>('/dealers/scan-cashout-qr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate('/confirm', { state: res.data });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to scan QR code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecodedToken = async (token: string) => {
    setIsLoading(true);
    try {
      const blob = await fetch(token).then((r) => r.blob());
      const file = new File([blob], 'qr.png', { type: blob.type || 'image/png' });
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post<ScanCashoutResult>('/dealers/scan-cashout-qr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate('/confirm', { state: res.data });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to scan QR code');
      scannedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <LoadingSpinner />
        <p className="mt-3 text-sm text-gray-500">Scanning cashback QR...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scan Cashback QR</h1>
        <p className="text-sm text-gray-500">Upload an image or use your camera</p>
      </div>

      {mode === 'select' && (
        <div className="space-y-4">
          <button
            onClick={() => setMode('camera')}
            className="flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm hover:bg-gray-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <Camera size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Use Camera</h3>
              <p className="text-sm text-gray-500">Scan the customer's QR code with your camera</p>
            </div>
          </button>

          <button
            onClick={() => setMode('upload')}
            className="flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm hover:bg-gray-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <Upload size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Upload Image</h3>
              <p className="text-sm text-gray-500">Select a saved QR code image</p>
            </div>
          </button>
        </div>
      )}

      {mode === 'camera' && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Camera Scan</h3>
            <button onClick={() => setMode('select')} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          <div id="qr-reader" className="overflow-hidden rounded-lg" />
        </Card>
      )}

      {mode === 'upload' && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Upload QR Image</h3>
            <button onClick={() => setMode('select')} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          <FileUpload onChange={handleFileUpload}>
            <div className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-12 hover:bg-gray-50">
              <Upload size={32} className="mb-2 text-purple-600" />
              <span className="font-medium text-gray-900">Select QR image</span>
              <span className="text-sm text-gray-500">PNG or JPG</span>
            </div>
          </FileUpload>
        </Card>
      )}
    </div>
  );
}
