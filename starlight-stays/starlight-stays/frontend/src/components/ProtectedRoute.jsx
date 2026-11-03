import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-amber-400 border-t-transparent animate-spin"></div>
        <p className="text-sm font-medium text-slate-400 flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Verifying credentials...</span>
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && (!user?.role || !allowedRoles.includes(user.role))) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center shadow-lg">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold font-display text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-600 mb-6">
          This portal requires administrator privileges (<span className="font-semibold text-rose-600">ROLE_ADMIN</span>). Your current role is <span className="font-semibold">{user?.role}</span>.
        </p>
        <a
          href="/"
          className="inline-flex items-center px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition shadow"
        >
          Return to Guest Lounge
        </a>
      </div>
    );
  }

  return children;
}
