import React, { useState } from 'react';
import { Users, BedDouble, CheckCircle, AlertTriangle, ShieldCheck, Calendar } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { bookingApi } from '../api/bookingApi';

export default function RoomCard({ room, checkIn, checkOut, onBookRoom, nights }) {
  if (!room) return null;
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);

  const isOperable = room.status === 'AVAILABLE';

  const handleCheckAvailability = async () => {
    if (!checkIn || !checkOut) return;
    setCheckingAvailability(true);
    setAvailabilityResult(null);
    try {
      const res = await bookingApi.checkAvailability(room.id, checkIn, checkOut);
      setAvailabilityResult(res);
    } catch (err) {
      setAvailabilityResult({ available: false, message: err.message });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const totalPrice = nights && room.price ? (room.price * nights).toFixed(2) : null;

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-300 p-6 flex flex-col justify-between ${
      isOperable ? 'border-slate-200 hover:border-amber-400 hover:shadow-lg' : 'border-slate-200 bg-slate-50 opacity-80'
    }`}>
      <div>
        {/* Top Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-amber-600 tracking-wider uppercase">Room #{room.roomNumber}</span>
              <StatusBadge status={room.status} />
            </div>
            <h4 className="text-xl font-bold text-slate-900 font-display mt-1">
              {room.roomType}
            </h4>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-slate-900">₹{room.price}</span>
            <span className="text-xs text-slate-400 block">/ night</span>
          </div>
        </div>

        {/* Room Attributes */}
        <div className="flex items-center space-x-4 py-3 border-y border-slate-100 text-xs text-slate-600 mb-4">
          <div className="flex items-center space-x-1.5">
            <Users className="w-4 h-4 text-amber-500" />
            <span>Capacity: {room.capacity} Guests</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <BedDouble className="w-4 h-4 text-amber-500" />
            <span>King / Luxury Bed</span>
          </div>
        </div>

        {/* Date Context / Total summary */}
        {nights > 0 && isOperable && (
          <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3 mb-4 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">Duration:</span>
              <span className="font-semibold text-slate-800 ml-1">{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
            </div>
            <div>
              <span className="text-slate-500">Estimated Total:</span>
              <span className="text-sm font-bold text-amber-700 ml-1.5">₹{totalPrice}</span>
            </div>
          </div>
        )}

        {/* Real-time availability probe banner */}
        {availabilityResult && (
          <div className={`p-3 rounded-xl text-xs mb-4 flex items-start space-x-2 border ${
            availabilityResult.available
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {availabilityResult.available ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-semibold block">{availabilityResult.available ? 'Dates Available' : 'Unavailable'}</span>
              <span>{availabilityResult.message}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-2 flex items-center space-x-2">
        {checkIn && checkOut && isOperable && (
          <button
            onClick={handleCheckAvailability}
            disabled={checkingAvailability}
            className="px-3 py-2.5 rounded-lg border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-medium hover:bg-slate-50 transition flex items-center space-x-1"
            title="Query active booking overlap on backend"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{checkingAvailability ? 'Checking...' : 'Check Dates'}</span>
          </button>
        )}

        <button
          onClick={() => onBookRoom(room)}
          disabled={!isOperable}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-sm ${
            isOperable
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isOperable ? 'Reserve Room' : `Unavailable (${room.status})`}</span>
        </button>
      </div>
    </div>
  );
}
