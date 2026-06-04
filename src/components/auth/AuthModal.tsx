import { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Chrome } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BRAND_LOGO_SRC, BRAND_NAME } from '../../lib/brand';

interface AuthModalProps {
  mode: 'login' | 'signup';
  onClose: () => void;
  onSwitch: (mode: 'login' | 'signup') => void;
}

export default function AuthModal({ mode, onClose, onSwitch }: AuthModalProps) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (mode === 'login') {
      const { error: err } = await signIn(form.email, form.password);
      if (err) setError(err.message || 'Invalid email or password');
      else onClose();
    } else {
      if (!form.name.trim()) {
        setError('Please enter your name');
        setLoading(false);
        return;
      }
      const { error: err } = await signUp(form.email, form.password, form.name);
      if (err) setError(err.message || 'Could not create account');
      else {
        setSuccess('Account created! You can now login.');
        setTimeout(() => onSwitch('login'), 1500);
      }
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error: err } = await signInWithGoogle();
    if (err) setError('Google login failed. Please try again.');
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-dark-300 border border-gold-900/30 rounded-2xl shadow-card overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />

        <div className="p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={16} />
          </button>

          <div className="text-center mb-7">
            <img
              src={BRAND_LOGO_SRC}
              alt={BRAND_NAME}
              className="h-14 w-auto object-contain mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-white">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {mode === 'login' ? `Sign in to your ${BRAND_NAME} account` : `Join ${BRAND_NAME} today`}
            </p>
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 hover:border-white/20 transition-all duration-200 mb-5 text-sm font-medium disabled:opacity-50"
          >
            <Chrome size={18} className="text-blue-400" />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-600 text-xs">or continue with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-dark-200 border border-white/5 text-white placeholder-gray-600 focus:outline-none focus:border-gold-600/40 transition-all text-sm"
                />
              </div>
            )}

            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                placeholder="Email Address"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-dark-200 border border-white/5 text-white placeholder-gray-600 focus:outline-none focus:border-gold-600/40 transition-all text-sm"
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                required
                minLength={6}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full pl-11 pr-11 py-3 rounded-xl bg-dark-200 border border-white/5 text-white placeholder-gray-600 focus:outline-none focus:border-gold-600/40 transition-all text-sm"
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
            {success && (
              <div className="px-4 py-3 rounded-xl bg-green-900/20 border border-green-700/30 text-green-400 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-gold-600 to-gold-400 text-black font-bold rounded-xl hover:from-gold-500 hover:to-gold-300 transition-all duration-300 shadow-gold disabled:opacity-70 text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-5">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => onSwitch(mode === 'login' ? 'signup' : 'login')}
              className="text-gold-400 hover:text-gold-300 font-medium transition-colors"
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
