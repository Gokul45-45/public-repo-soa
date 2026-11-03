import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full bg-white p-10 rounded-3xl border border-slate-200 text-center shadow-lg space-y-4">
        <Compass className="w-16 h-16 text-amber-500 mx-auto animate-pulse" />
        <h1 className="text-4xl font-bold font-display text-slate-900">404</h1>
        <h2 className="text-xl font-bold font-display text-slate-800">Horizon Not Found</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          The sanctuary or destination route you are looking for does not exist in our constellation.
        </p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Starlight Lounge</span>
        </Link>
      </div>
    </div>
  );
}
