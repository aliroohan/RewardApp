import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

const CURRENCIES = [
  { value: 'BBD', label: 'Barbados Dollar (BBD)' },
  { value: 'JMD', label: 'Jamaican Dollar (JMD)' },
  { value: 'GYD', label: 'Guyanese Dollar (GYD)' },
  { value: 'XCD', label: 'Eastern Caribbean Dollar (XCD)' },
];

export function Register() {
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer' as 'customer' | 'professional',
    currency: 'BBD',
    privacyConsent: false,
    termsConsent: false,
  });
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register, verifyEmail } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.privacyConsent || !form.termsConsent) {
      toast.error('Please accept the required consents');
      return;
    }
    setIsLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        role: form.role,
        currency: form.currency,
        name: form.name,
        privacyConsent: form.privacyConsent,
        termsConsent: form.termsConsent,
      });
      toast.success('Verification code sent to your email');
      setStep('verify');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await verifyEmail(form.email, code);
      toast.success('Account verified!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        {step === 'form' ? (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
              <p className="text-sm text-gray-500">Join RewardApp to start earning cashback</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                label="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-start gap-2">
                <input
                  id="terms"
                  type="checkbox"
                  checked={form.termsConsent}
                  onChange={(e) => setForm({ ...form, termsConsent: e.target.checked })}
                  className="mt-1"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the terms and conditions
                </label>
              </div>
              <div className="flex items-start gap-2">
                <input
                  id="privacy"
                  type="checkbox"
                  checked={form.privacyConsent}
                  onChange={(e) => setForm({ ...form, privacyConsent: e.target.checked })}
                  className="mt-1"
                />
                <label htmlFor="privacy" className="text-sm text-gray-600">
                  I consent to the privacy policy
                </label>
              </div>
              <Button type="submit" isLoading={isLoading} className="w-full">
                Create Account
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-gray-900">Verify email</h1>
              <p className="text-sm text-gray-500">Enter the OTP sent to {form.email}</p>
            </div>
            <form onSubmit={handleVerify} className="space-y-4">
              <Input
                label="Verification code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
              <Button type="submit" isLoading={isLoading} className="w-full">
                Verify & Sign In
              </Button>
            </form>
          </>
        )}

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-purple-600 hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
