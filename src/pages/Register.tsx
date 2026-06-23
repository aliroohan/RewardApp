import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

const CURRENCIES = ['BBD', 'JMD', 'GYD', 'XCD'];
const ROLES = [
  { key: 'customer',     label: 'Customer',     emoji: '🏠', desc: 'DIY homeowner / trade buyer' },
  { key: 'professional', label: 'Professional', emoji: '🏗️', desc: 'Architect, contractor, painter' },
];
const GENDERS     = ['male', 'female', 'other'];
const AGE_GROUPS  = ['18-24', '25-34', '35-44', '45-54', '55+'];
const ACCOUNT_TYPES = [
  { key: 'household', label: '🏡 Household' },
  { key: 'company',   label: '🏢 Company' },
  { key: 'trade',     label: '🛠️ Trade' },
];

function OptionChip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 min-w-fit rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all ${
        active
          ? 'border-purple-600 bg-purple-50 text-purple-700'
          : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300'
      }`}
    >
      {children}
    </button>
  );
}

export function Register() {
  const navigate = useNavigate();
  const { register, verifyEmail } = useAuth();

  const [step, setStep] = useState<1 | 2 | 'verify'>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');

  // Step 1
  const [role, setRole]             = useState<'customer' | 'professional'>('customer');
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [profession, setProfession] = useState('');

  // Step 2
  const [gender, setGender]           = useState('male');
  const [ageRange, setAgeRange]       = useState('25-34');
  const [accountType, setAccountType] = useState<'household' | 'company' | 'trade'>('household');
  const [province, setProvince]       = useState('');
  const [preferredStore, setPreferredStore] = useState('');
  const [currency, setCurrency]       = useState('BBD');

  // Consent
  const [privacyConsent, setPrivacyConsent]     = useState(false);
  const [termsConsent, setTermsConsent]         = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { toast.error('Please fill in all required fields'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (role === 'professional' && !profession) { toast.error('Please enter your profession'); return; }
    setStep(2);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacyConsent || !termsConsent) {
      toast.error('Please accept the Privacy Policy and Terms & Conditions');
      return;
    }
    setIsLoading(true);
    try {
      await register({
        email:           email.trim().toLowerCase(),
        password,
        role,
        currency,
        name:            name.trim(),
        gender,
        ageRange,
        accountType,
        province:        province.trim(),
        preferredStore:  preferredStore.trim(),
        profession:      role === 'professional' ? profession.trim() : undefined,
        privacyConsent,
        termsConsent,
        marketingConsent,
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
      await verifyEmail(email.trim().toLowerCase(), code);
      toast.success('Account verified! Welcome aboard 🎉');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Progress bar dots ── */
  const Progress = () => (
    <div className="mb-6 flex gap-2">
      {[1, 2].map((n) => (
        <div
          key={n}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            (step === 1 && n === 1) || (step === 2 && n <= 2)
              ? 'bg-purple-600'
              : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  );

  /* ── VERIFY STEP ── */
  if (step === 'verify') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-2xl">📧</div>
            <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Verify your email</h1>
            <p className="mt-1 text-sm text-gray-500">Enter the OTP sent to <strong>{email}</strong></p>
          </div>
          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              label="Verification code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              required
            />
            <Button type="submit" isLoading={isLoading} className="w-full">
              Verify & Sign In
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  /* ── STEP 1: Credentials ── */
  if (step === 1) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
        <Card className="w-full max-w-md">
          <Progress />
          <div className="mb-5">
            <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Create Account</h1>
            <p className="text-sm text-gray-500">Join the Paint Loyalty Programme</p>
          </div>

          <form onSubmit={handleNext} className="space-y-4">
            {/* Role selector */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">I am a…</label>
              <div className="flex gap-3">
                {ROLES.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setRole(r.key as 'customer' | 'professional')}
                    className={`flex-1 rounded-xl border-2 p-4 text-center transition-all ${
                      role === r.key
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <div className="text-2xl">{r.emoji}</div>
                    <div className={`mt-1 text-sm font-bold ${role === r.key ? 'text-purple-700' : 'text-gray-700'}`}>
                      {r.label}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-400">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
            />

            {role === 'professional' && (
              <Input
                label="Profession"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="e.g. Architect, Painter, Contractor"
                required
              />
            )}

            <Button type="submit" className="w-full">
              Continue →
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-purple-600 hover:underline">Sign in</Link>
          </p>
        </Card>
      </div>
    );
  }

  /* ── STEP 2: Demographics & Consents ── */
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <Progress />
        <div className="mb-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="rounded-lg p-1.5 text-purple-600 hover:bg-purple-50"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Demographics & Territory</h1>
            <p className="text-sm text-gray-500">Tell us a bit more about you</p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          {/* Gender */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Gender</label>
            <div className="flex gap-2">
              {GENDERS.map((g) => (
                <OptionChip key={g} active={gender === g} onClick={() => setGender(g)}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </OptionChip>
              ))}
            </div>
          </div>

          {/* Age Group */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Age Group</label>
            <div className="flex flex-wrap gap-2">
              {AGE_GROUPS.map((a) => (
                <OptionChip key={a} active={ageRange === a} onClick={() => setAgeRange(a)}>
                  {a}
                </OptionChip>
              ))}
            </div>
          </div>

          {/* Account Type */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Account Type</label>
            <div className="flex gap-2">
              {ACCOUNT_TYPES.map((t) => (
                <OptionChip key={t.key} active={accountType === t.key} onClick={() => setAccountType(t.key as 'household' | 'company' | 'trade')}>
                  {t.label}
                </OptionChip>
              ))}
            </div>
          </div>

          {/* Province */}
          <Input
            label="Province / Territory"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            placeholder="e.g. Kingston, St. James"
          />

          {/* Preferred Store */}
          <Input
            label="Preferred Store (optional)"
            value={preferredStore}
            onChange={(e) => setPreferredStore(e.target.value)}
            placeholder="e.g. Kingston Hardware Depot"
          />

          {/* Currency */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Currency / Territory</label>
            <div className="grid grid-cols-4 gap-2">
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`rounded-xl border-2 py-3 text-sm font-bold transition-all ${
                    currency === c
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-400">Select your primary market currency</p>
          </div>

          {/* Consents */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <p className="text-sm font-bold text-gray-700">Terms & Consents</p>
            {[
              { id: 'privacy', label: 'I agree to the Privacy Policy', value: privacyConsent, set: setPrivacyConsent, required: true },
              { id: 'terms',   label: 'I agree to the Terms & Conditions', value: termsConsent, set: setTermsConsent, required: true },
              { id: 'mkt',     label: 'Receive marketing communications (optional)', value: marketingConsent, set: setMarketingConsent, required: false },
            ].map(({ id, label, value, set, required }) => (
              <label key={id} className="flex items-start gap-3 cursor-pointer">
                <input
                  id={id}
                  type="checkbox"
                  checked={value}
                  onChange={(e) => set(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600"
                />
                <span className="text-sm text-gray-600">
                  {label}{required && <span className="ml-0.5 text-red-500">*</span>}
                </span>
              </label>
            ))}
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            disabled={!privacyConsent || !termsConsent || isLoading}
            className="w-full"
          >
            Create Account
          </Button>
        </form>
      </Card>
    </div>
  );
}
