import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, User } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const isExpired = queryParams.get('expired') === 'true';

  const from = location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const user = await login(email, password);
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials or User Service unavailable.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick preset helper for tester convenience
  const fillPreset = (presetEmail, presetPass) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-full flex items-center justify-center mx-auto shadow-md">
            <Sparkles className="w-6 h-6 text-slate-950" />
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
            Guest Lounge Access
          </h2>
          <p className="text-xs text-slate-500">
            Sign in with your verified Starlight credentials
          </p>
        </div>

        {/* Expired Session Alert */}
        {isExpired && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Your session has expired. Please sign in again.</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Authentication Failed</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Credentials Pre-fills for Testing */}
        <div className="pt-4 border-t border-slate-100">
          <span className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider text-center mb-2.5">
            Quick Testing Accounts
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillPreset('alice@starlight.com', 'SecretPassword123')}
              className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-amber-50 hover:border-amber-300 transition text-left flex items-center space-x-1.5"
            >
              <User className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <div className="truncate">
                <span className="font-semibold block text-[11px] text-slate-800">Customer</span>
                <span className="text-[10px] text-slate-400 block truncate">alice@starlight.com</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => fillPreset('admin@starlight.com', 'AdminPassword123')}
              className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-emerald-50 hover:border-emerald-300 transition text-left flex items-center space-x-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="font-semibold block text-[11px] text-slate-800">Admin</span>
                <span className="text-[10px] text-slate-400 block truncate">admin@starlight.com</span>
              </div>
            </button>
          </div>
        </div>

        {/* Register link */}
        <div className="text-center text-xs text-slate-500">
          New to Starlight Stays?{' '}
          <Link to="/register" className="font-semibold text-amber-600 hover:text-amber-700">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
