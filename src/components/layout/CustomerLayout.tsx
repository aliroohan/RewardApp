import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, Upload, History, LogOut, QrCode, CreditCard, Store } from 'lucide-react';

export function CustomerLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const nav = [
    { path: '/',         label: 'Home',     icon: Home },
    { path: '/receipt',  label: 'Receipt',  icon: Upload },
    { path: '/cashout',  label: 'Cashout',  icon: CreditCard },
    { path: '/dealers',  label: 'Dealers',  icon: Store },
    { path: '/history',  label: 'History',  icon: History },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white">
              <QrCode size={18} />
            </div>
            <h1 className="text-lg font-bold" style={{ color: '#111827' }}>RewardApp</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name || user?.email}</p>
              <p className="text-xs text-gray-500">{user?.pointsBalance.toLocaleString()} pts</p>
            </div>
            <button
              onClick={logout}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-3xl">
          <Outlet />
        </div>
      </main>

      <nav className="sticky bottom-0 border-t bg-white px-2 py-2">
        <div className="mx-auto flex max-w-3xl justify-around">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                  active ? 'text-purple-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
