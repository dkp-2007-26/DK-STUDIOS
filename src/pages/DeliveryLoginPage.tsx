import { useState } from 'react';
import { ShieldCheck, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Page } from '../hooks/useRouter';

interface DeliveryLoginPageProps {
  navigate: (page: Page) => void;
}

export default function DeliveryLoginPage({ navigate }: DeliveryLoginPageProps) {
  const { signIn, signOut } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: signInErr, user } = await signIn(form.email, form.password);
    if (signInErr) {
      setError(signInErr.message || 'Invalid credentials');
      setLoading(false);
      return;
    }

    if (!user?.isDelivery) {
      await signOut();
      setError('Access denied. Delivery account only.');
      setLoading(false);
      return;
    }

    navigate('delivery-scan');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-dark-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gold-900/20 border border-gold-700/30 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={30} className="text-gold-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Delivery Access</h1>
          <p className="text-gray-500 text-sm mt-1">Secure scan portal for delivery confirmation</p>
        </div>

        <div className="bg-dark-300 border border-gold-900/20 rounded-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Delivery Email"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-dark-200 border border-white/5 text-white placeholder-gray-600 focus:outline-none focus:border-gold-600/40 text-sm"
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Password"
                className="w-full pl-11 pr-11 py-3 rounded-xl bg-dark-200 border border-white/5 text-white placeholder-gray-600 focus:outline-none focus:border-gold-600/40 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-900/20 border border-red-700/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-gold-600 to-gold-400 text-black font-bold rounded-xl hover:from-gold-500 hover:to-gold-300 transition-all shadow-gold disabled:opacity-70"
            >
              {loading ? 'Signing In...' : 'Open Delivery Scanner'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-700 text-xs mt-4">
          Delivery login: delivery@dkpstudios.in / Delivery@123
        </p>
      </div>
    </div>
  );
}
