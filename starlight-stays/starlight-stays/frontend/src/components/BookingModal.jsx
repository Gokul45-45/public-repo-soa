import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingApi } from '../api/bookingApi';
import { X, ShieldCheck, CreditCard, Smartphone, Building2, AlertCircle, CheckCircle2, Calendar, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BookingModal({ room, initialCheckIn, initialCheckOut, onClose, onSuccess }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Helper to format date YYYY-MM-DD in local time
  const formatLocalDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayLocal = formatLocalDate(new Date());

  // Default to tomorrow and tomorrow + 3 if not provided
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minCheckIn = formatLocalDate(tomorrow);

  const defaultOut = new Date(tomorrow);
  defaultOut.setDate(defaultOut.getDate() + 3);

  const [checkIn, setCheckIn] = useState(initialCheckIn || minCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut || formatLocalDate(defaultOut));
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Calculate nights
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const nights = calculateNights();
  const totalAmount = nights > 0 && room.price ? (room.price * nights).toFixed(2) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isAuthenticated) {
      navigate('/login', { state: { message: 'Please sign in to complete your reservation.' } });
      return;
    }

    if (!checkIn || !checkOut) {
      setError('Check-in and check-out dates are required.');
      return;
    }

    if (checkIn <= todayLocal) {
      setError('Check-in date must be strictly in the future (tomorrow or later).');
      return;
    }

    if (checkOut <= checkIn) {
      setError('Check-out must be after check-in.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        userId: user.userId,
        roomId: room.id,
        checkIn: checkIn,
        checkOut: checkOut,
        totalAmount: parseFloat(totalAmount),
        paymentMethod: paymentMethod,
      };

      const response = await bookingApi.createBooking(payload);
      setConfirmedBooking(response);
      if (onSuccess) onSuccess(response);
    } catch (err) {
      setError(err.message || 'Failed to complete booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {confirmedBooking ? (
          /* Confirmation View */
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">
                Reservation Confirmed
              </span>
              <h3 className="text-2xl font-bold font-display text-slate-900 mt-1">
                Booking Reference #{confirmedBooking.id}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                A booking confirmation and receipt have been issued under your account.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 text-xs text-left space-y-2.5 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Room</span>
                <span className="font-semibold text-slate-800">#{room.roomNumber} ({room.roomType})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dates</span>
                <span className="font-semibold text-slate-800">{confirmedBooking.checkIn} to {confirmedBooking.checkOut}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-bold text-emerald-600">{confirmedBooking.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid</span>
                <span className="font-bold text-slate-900">₹{confirmedBooking.totalAmount}</span>
              </div>
              {confirmedBooking.payment && (
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Transaction ID</span>
                  <span className="font-mono text-[11px] text-slate-700">{confirmedBooking.payment.transactionId}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center space-x-3">
              <button
                onClick={() => {
                  onClose();
                  navigate('/dashboard');
                }}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition shadow"
              >
                Go to My Reservations
              </button>
              <button
                onClick={onClose}
                className="px-5 py-3 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-xl transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form View */
          <div>
            {/* Modal Header */}
            <div className="resort-gradient p-6 text-white">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold mb-1">
                <Sparkles className="w-4 h-4" />
                <span>CONFIRM RESERVATION</span>
              </div>
              <h3 className="text-xl font-bold font-display">
                Room #{room.roomNumber} — {room.roomType}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Capacity: {room.capacity} Guests • ₹{room.price} / night
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Reservation Unsuccessful</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Check-in Date</label>
                  <input
                    type="date"
                    min={minCheckIn}
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-slate-400">Earliest: Tomorrow</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Check-out Date</label>
                  <input
                    type="date"
                    min={checkIn || minCheckIn}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-slate-400">Must be after check-in</span>
                </div>
              </div>

              {/* Price Calculation Card */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Price per night</span>
                  <span>₹{room.price}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Length of stay</span>
                  <span>{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-amber-200">
                  <span>Total Amount</span>
                  <span className="text-amber-800 text-base">₹{totalAmount}</span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Simulated Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center justify-center space-y-1.5 transition ${
                      paymentMethod === 'CARD'
                        ? 'border-amber-500 bg-amber-50/50 text-amber-900 ring-2 ring-amber-400/40'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-amber-600" />
                    <span>Credit / Debit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center justify-center space-y-1.5 transition ${
                      paymentMethod === 'UPI'
                        ? 'border-amber-500 bg-amber-50/50 text-amber-900 ring-2 ring-amber-400/40'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-amber-600" />
                    <span>UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('NET_BANKING')}
                    className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center justify-center space-y-1.5 transition ${
                      paymentMethod === 'NET_BANKING'
                        ? 'border-amber-500 bg-amber-50/50 text-amber-900 ring-2 ring-amber-400/40'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-amber-600" />
                    <span>Net Banking</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Payments are simulated by the Payment Service microservice.
                </p>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || nights <= 0}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm shadow-md hover:shadow-amber-500/20 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Locking Room & Authorizing...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm & Pay ₹{totalAmount}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
