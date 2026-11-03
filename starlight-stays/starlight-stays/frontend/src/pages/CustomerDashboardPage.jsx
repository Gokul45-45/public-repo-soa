import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingApi } from '../api/bookingApi';
import { paymentApi } from '../api/paymentApi';
import { roomApi } from '../api/roomApi';
import StatusBadge from '../components/StatusBadge';
import { Calendar, CreditCard, RotateCcw, AlertCircle, CheckCircle2, XCircle, RefreshCw, Hotel, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CustomerDashboardPage() {
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [paymentsMap, setPaymentsMap] = useState({});
  const [roomsMap, setRoomsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchCustomerBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      // Backend automatically scopes to current customer when role is CUSTOMER
      const data = await bookingApi.getAllBookings();
      setBookings(data);

      // Load associated payments for each booking in background
      data.forEach(async (b) => {
        try {
          const pmts = await paymentApi.getPaymentsByBooking(b.id);
          if (pmts && pmts.length > 0) {
            setPaymentsMap((prev) => ({ ...prev, [b.id]: pmts[0] }));
          }
        } catch {
          // Non-blocking
        }

        if (b.roomId && !roomsMap[b.roomId]) {
          try {
            const rm = await roomApi.getRoomById(b.roomId);
            setRoomsMap((prev) => ({ ...prev, [b.roomId]: rm }));
          } catch {
            // Non-blocking
          }
        }
      });
    } catch (err) {
      setError(err.message || 'Failed to retrieve your reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you wish to cancel this reservation? If confirmed, an automatic refund will be triggered.')) {
      return;
    }

    setCancellingId(bookingId);
    setMessage(null);
    setError(null);

    try {
      const updated = await bookingApi.cancelBooking(bookingId);
      setMessage(`Reservation #${bookingId} has been successfully cancelled. The date range is now available for other guests.`);

      // Update state locally
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' } : b))
      );

      // Refresh payments to observe REFUNDED state
      try {
        const pmts = await paymentApi.getPaymentsByBooking(bookingId);
        if (pmts && pmts.length > 0) {
          setPaymentsMap((prev) => ({ ...prev, [bookingId]: pmts[0] }));
        }
      } catch {
        // Non-blocking
      }
    } catch (err) {
      setError(err.message || 'Could not cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Dashboard Header */}
      <div className="bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>GUEST RESERVATION PORTAL</span>
          </div>
          <h1 className="text-3xl font-bold font-display text-white">
            Welcome back, {user?.email}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your sanctuary stays, view payment receipts, and request date cancellations.
          </p>
        </div>

        <button
          onClick={fetchCustomerBookings}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Stays</span>
        </button>
      </div>

      {/* Action Messages */}
      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-emerald-700 font-bold ml-4">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-700 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Bookings List */}
      <div>
        <h2 className="text-xl font-bold font-display text-slate-900 mb-4 flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-amber-500" />
          <span>My Reservation History</span>
        </h2>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-36 bg-white rounded-2xl animate-pulse border border-slate-200"></div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
            <Hotel className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold font-display text-slate-800">No Reservations on Record</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You do not have any active or past reservations under your guest account.
            </p>
            <Link
              to="/hotels"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow transition"
            >
              <span>Explore Resorts & Book a Suite</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const payment = paymentsMap[booking.id];
              const room = roomsMap[booking.roomId];
              const isEligibleForCancel = booking.status === 'CONFIRMED' || booking.status === 'PENDING';

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  {/* Left: Info */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        REF #{booking.id}
                      </span>
                      <StatusBadge status={booking.status} />
                      {payment && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                          Payment: {payment.status} ({payment.paymentMethod})
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 font-display">
                      {room ? `Room #${room.roomNumber} — ${room.roomType}` : `Room #${booking.roomId}`}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        <span>Check-in: <strong className="text-slate-800">{booking.checkIn}</strong></span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        <span>Check-out: <strong className="text-slate-800">{booking.checkOut}</strong></span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        <span>Total: <strong className="text-slate-900">₹{booking.totalAmount}</strong></span>
                      </div>
                    </div>

                    {payment?.transactionId && (
                      <p className="text-[11px] text-slate-400 font-mono">
                        Transaction Ref: {payment.transactionId}
                      </p>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center space-x-3 self-end md:self-center">
                    {isEligibleForCancel && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 disabled:opacity-50"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${cancellingId === booking.id ? 'animate-spin' : ''}`} />
                        <span>{cancellingId === booking.id ? 'Cancelling...' : 'Cancel Reservation'}</span>
                      </button>
                    )}

                    {booking.status === 'CANCELLED' && (
                      <div className="text-right text-xs text-slate-400 italic">
                        Reservation Cancelled
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
