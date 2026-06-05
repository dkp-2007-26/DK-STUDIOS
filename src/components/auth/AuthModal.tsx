import { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BRAND_LOGO_SRC, BRAND_NAME } from '../../lib/brand';

interface AuthModalProps {
  mode: 'login' | 'forgot';
  onClose: () => void;
  onSwitch: (mode: 'login' | 'forgot') => void;
}

export default function AuthModal({ mode, onClose, onSwitch }: AuthModalProps) {
  const { signIn, sendPasswordReset } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (mode === 'forgot') {
      const { error: resetError } = await sendPasswordReset(form.email);
      if (resetError) {
        setError(resetError.message || 'Could not send reset email.');
      } else {
        setSuccess('Password reset link sent. Check your email inbox.');
      }
      setLoading(false);
      return;
    }

    const { error: signInError } = await signIn(form.email, form.password);
    if (signInError) setError(signInError.message || 'Invalid email or password.');
    else onClose();
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-lg border border-gold-900/30 bg-dark-300 shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />

        <div className="p-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>

          <div className="mb-7 text-center">
            <img src={BRAND_LOGO_SRC} alt={BRAND_NAME} className="mx-auto mb-4 h-14 w-auto object-contain" />
            <h2 className="text-2xl font-bold text-white">
              {mode === 'forgot' ? 'Reset password' : 'Sign in'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {mode === 'forgot'
                ? 'Enter your Supabase auth email to receive a reset link.'
                : `Use your ${BRAND_NAME} email and password.`}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                placeholder="Email Address"
                required
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="w-full rounded-lg border border-white/5 bg-dark-200 py-3 pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-gray-600 focus:border-gold-600/40"
              />
            </div>

            {mode === 'login' && (
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  className="w-full rounded-lg border border-white/5 bg-dark-200 py-3 pl-11 pr-11 text-sm text-white outline-none transition-all placeholder:text-gray-600 focus:border-gold-600/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-700/30 bg-red-900/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-green-700/30 bg-green-900/20 px-4 py-3 text-sm text-green-400">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold-600 to-gold-400 py-3.5 text-sm font-bold text-black shadow-gold transition-all duration-300 hover:from-gold-500 hover:to-gold-300 disabled:opacity-70"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
              ) : mode === 'forgot' ? (
                <>
                  Send reset link
                  <KeyRound size={16} />
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setError('');
                setSuccess('');
                onSwitch(mode === 'forgot' ? 'login' : 'forgot');
              }}
              className="text-sm font-medium text-gold-400 transition-colors hover:text-gold-300"
            >
              {mode === 'forgot' ? 'Back to login' : 'Forgot password?'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
