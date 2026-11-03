import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle, RotateCcw, ShieldCheck, Wrench } from 'lucide-react';

export default function StatusBadge({ status, type = 'booking' }) {
  if (!status) return null;

  const normalized = status.toUpperCase();

  const configs = {
    CONFIRMED: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      label: 'Confirmed',
    },
    PENDING: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: <Clock className="w-3.5 h-3.5 animate-pulse" />,
      label: 'Pending',
    },
    CANCELLED: {
      bg: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: <XCircle className="w-3.5 h-3.5" />,
      label: 'Cancelled',
    },
    FAILED: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      label: 'Failed',
    },
    REFUNDED: {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: <RotateCcw className="w-3.5 h-3.5" />,
      label: 'Refunded',
    },
    SUCCESS: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      label: 'Paid (Success)',
    },
    AVAILABLE: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      label: 'Available',
    },
    MAINTENANCE: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: <Wrench className="w-3.5 h-3.5" />,
      label: 'Maintenance',
    },
    INACTIVE: {
      bg: 'bg-slate-100 text-slate-500 border-slate-300',
      icon: <XCircle className="w-3.5 h-3.5" />,
      label: 'Inactive',
    },
  };

  const current = configs[normalized] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: null,
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${current.bg}`}
    >
      {current.icon}
      <span>{current.label}</span>
    </span>
  );
}
