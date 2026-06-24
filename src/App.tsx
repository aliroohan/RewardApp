import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { ReceiptUpload } from './pages/ReceiptUpload';
import { ReceiptQrUpload } from './pages/ReceiptQrUpload';
import { CashbackQr } from './pages/CashbackQr';
import { CashbackHistory } from './pages/CashbackHistory';
import { Cashout } from './pages/Cashout';
import { Dealers } from './pages/Dealers';
import { DealerDashboard } from './pages/DealerDashboard';
import { DealerScan } from './pages/DealerScan';
import { DealerConfirm } from './pages/DealerConfirm';
import { DealerHistory } from './pages/DealerHistory';
import { CustomerLayout } from './components/layout/CustomerLayout';
import { DealerLayout } from './components/layout/DealerLayout';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

function AppRoutes() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (user?.role === 'dealer') {
    return (
      <Routes>
        <Route element={<DealerLayout />}>
          <Route path="/" element={<DealerDashboard />} />
          <Route path="/scan" element={<DealerScan />} />
          <Route path="/history" element={<DealerHistory />} />
          <Route path="/confirm" element={<DealerConfirm />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/receipt" element={<ReceiptUpload />} />
        <Route path="/receipt/:receiptId/qr" element={<ReceiptQrUpload />} />
        <Route path="/receipt/:receiptId/cashback" element={<CashbackQr />} />
        <Route path="/history" element={<CashbackHistory />} />
        <Route path="/cashout" element={<Cashout />} />
        <Route path="/dealers" element={<Dealers />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" richColors />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
