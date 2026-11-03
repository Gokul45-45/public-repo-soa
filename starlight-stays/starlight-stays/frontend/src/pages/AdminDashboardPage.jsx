import React, { useState, useEffect } from 'react';
import { hotelApi } from '../api/hotelApi';
import { roomApi } from '../api/roomApi';
import { bookingApi } from '../api/bookingApi';
import { paymentApi } from '../api/paymentApi';
import StatusBadge from '../components/StatusBadge';
import {
  ShieldCheck,
  Hotel,
  BedDouble,
  CalendarCheck,
  CreditCard,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  RotateCcw,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('hotels'); // 'hotels' | 'rooms' | 'bookings'

  // Data states
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Modals
  const [showAddHotelModal, setShowAddHotelModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);

  // New Hotel Form
  const [hotelForm, setHotelForm] = useState({
    name: '',
    location: '',
    address: '',
    description: '',
    contactNumber: '',
  });

  // New Room Form
  const [roomForm, setRoomForm] = useState({
    hotelId: '',
    roomNumber: '',
    roomType: 'DELUXE',
    capacity: 2,
    price: 3500.0,
    status: 'AVAILABLE',
  });

  const loadAllAdminData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [hotelsData, roomsData, bookingsData, paymentsData] = await Promise.all([
        hotelApi.getAllHotels().catch(() => []),
        roomApi.getAllRooms().catch(() => []),
        bookingApi.getAllBookings().catch(() => []),
        paymentApi.getAllPayments().catch(() => []),
      ]);
      setHotels(hotelsData);
      setRooms(roomsData);
      setBookings(bookingsData);
      setPayments(paymentsData);
    } catch (err) {
      setActionError(err.message || 'Error communicating with backend services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  // Hotel Add/Delete
  const handleAddHotel = async (e) => {
    e.preventDefault();
    setActionError(null);
    setActionMessage(null);
    try {
      const created = await hotelApi.addHotel(hotelForm);
      setActionMessage(`Hotel "${created.name}" created successfully (ID #${created.id}).`);
      setShowAddHotelModal(false);
      setHotelForm({ name: '', location: '', address: '', description: '', contactNumber: '' });
      loadAllAdminData();
    } catch (err) {
      setActionError(err.message || 'Failed to add hotel.');
    }
  };

  const handleDeleteHotel = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete hotel "${name}" (ID #${id})?`)) return;
    try {
      await hotelApi.deleteHotel(id);
      setActionMessage(`Hotel #${id} deleted successfully.`);
      loadAllAdminData();
    } catch (err) {
      setActionError(err.message || 'Failed to delete hotel.');
    }
  };

  // Room Add/Delete
  const handleAddRoom = async (e) => {
    e.preventDefault();
    setActionError(null);
    setActionMessage(null);
    try {
      const payload = {
        ...roomForm,
        hotelId: parseInt(roomForm.hotelId, 10),
        capacity: parseInt(roomForm.capacity, 10),
        price: parseFloat(roomForm.price),
      };
      const created = await roomApi.addRoom(payload);
      setActionMessage(`Room #${created.roomNumber} created successfully (ID #${created.id}).`);
      setShowAddRoomModal(false);
      setRoomForm({ hotelId: '', roomNumber: '', roomType: 'DELUXE', capacity: 2, price: 3500.0, status: 'AVAILABLE' });
      loadAllAdminData();
    } catch (err) {
      setActionError(err.message || 'Failed to add room.');
    }
  };

  const handleDeleteRoom = async (id, roomNumber) => {
    if (!window.confirm(`Are you sure you want to delete Room #${roomNumber} (ID #${id})?`)) return;
    try {
      await roomApi.deleteRoom(id);
      setActionMessage(`Room #${id} deleted successfully.`);
      loadAllAdminData();
    } catch (err) {
      setActionError(err.message || 'Failed to delete room.');
    }
  };

  // Admin Booking Cancel
  const handleAdminCancelBooking = async (id) => {
    if (!window.confirm(`Cancel booking #${id} with administrative authority?`)) return;
    try {
      await bookingApi.cancelBooking(id);
      setActionMessage(`Booking #${id} cancelled by administrator.`);
      loadAllAdminData();
    } catch (err) {
      setActionError(err.message || 'Failed to cancel booking.');
    }
  };

  // Admin Payment Refund
  const handleAdminRefundPayment = async (id) => {
    if (!window.confirm(`Process administrative simulated refund for payment #${id}?`)) return;
    try {
      await paymentApi.refundPayment(id);
      setActionMessage(`Payment #${id} refunded successfully.`);
      loadAllAdminData();
    } catch (err) {
      setActionError(err.message || 'Failed to refund payment.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>CENTRAL ADMINISTRATOR SUITE</span>
          </div>
          <h1 className="text-3xl font-bold font-display text-white">
            Hospitality Operations Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure resort inventory, monitor cross-service bookings, and manage refund lifecycles.
          </p>
        </div>

        <button
          onClick={loadAllAdminData}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh All Services</span>
        </button>
      </div>

      {/* Global Alerts */}
      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-700 font-bold ml-4">✕</button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-700 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('hotels')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'hotels'
              ? 'bg-slate-900 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Hotel className="w-4 h-4 text-amber-400" />
          <span>Hotels & Properties ({hotels.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'rooms'
              ? 'bg-slate-900 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BedDouble className="w-4 h-4 text-amber-400" />
          <span>Room Inventory ({rooms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'bookings'
              ? 'bg-slate-900 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CalendarCheck className="w-4 h-4 text-amber-400" />
          <span>All Bookings ({bookings.length})</span>
        </button>
      </div>

      {/* Tab 1: Hotels Content */}
      {activeTab === 'hotels' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold font-display text-slate-900">Registered Resort Properties</h2>
            <button
              onClick={() => setShowAddHotelModal(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Hotel</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Property Name</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Address</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hotels.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        No hotels found in database.
                      </td>
                    </tr>
                  ) : (
                    hotels.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-400">#{h.id}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{h.name}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                            {h.location}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{h.address}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">{h.contactNumber || '—'}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteHotel(h.id, h.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete hotel"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Rooms Content */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold font-display text-slate-900">Room Inventory Across Properties</h2>
            <button
              onClick={() => setShowAddRoomModal(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Room</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Room ID</th>
                    <th className="py-3 px-4">Hotel</th>
                    <th className="py-3 px-4">Room #</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Capacity</th>
                    <th className="py-3 px-4">Rate / Night</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rooms.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-400">
                        No rooms found in database.
                      </td>
                    </tr>
                  ) : (
                    rooms.map((r) => {
                      const matchedHotel = hotels.find((h) => h.id === r.hotelId);
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-400">#{r.id}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {matchedHotel ? matchedHotel.name : `Hotel #${r.hotelId}`}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">#{r.roomNumber}</td>
                          <td className="py-3.5 px-4 font-medium">{r.roomType}</td>
                          <td className="py-3.5 px-4">{r.capacity} Guests</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">₹{r.price}</td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={r.status} type="room" />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleDeleteRoom(r.id, r.roomNumber)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete room"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Bookings Content */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold font-display text-slate-900">System Reservations & Financials</h2>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Booking ID</th>
                    <th className="py-3 px-4">User ID</th>
                    <th className="py-3 px-4">Room ID</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Booking Status</th>
                    <th className="py-3 px-4">Payment Info</th>
                    <th className="py-3 px-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-400">
                        No reservations on record.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((b) => {
                      const payment = payments.find((p) => p.bookingId === b.id);
                      const isEligibleCancel = b.status === 'CONFIRMED' || b.status === 'PENDING';
                      const isEligibleRefund = payment && payment.status === 'SUCCESS';

                      return (
                        <tr key={b.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">#{b.id}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-500">User #{b.userId}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-500">Room #{b.roomId}</td>
                          <td className="py-3.5 px-4 font-medium text-slate-700">
                            {b.checkIn} → {b.checkOut}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">₹{b.totalAmount}</td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={b.status} />
                          </td>
                          <td className="py-3.5 px-4">
                            {payment ? (
                              <div className="space-y-0.5">
                                <StatusBadge status={payment.status} />
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  {payment.paymentMethod} • {payment.transactionId?.slice(0, 10)}...
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">No record</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            {isEligibleCancel && (
                              <button
                                onClick={() => handleAdminCancelBooking(b.id)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 border border-rose-200 hover:bg-rose-50 rounded-lg transition"
                                title="Cancel reservation"
                              >
                                Cancel
                              </button>
                            )}

                            {isEligibleRefund && (
                              <button
                                onClick={() => handleAdminRefundPayment(payment.id)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 rounded-lg transition"
                                title="Issue simulated refund"
                              >
                                Refund
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Hotel */}
      {showAddHotelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 relative p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold font-display text-slate-900">Add New Luxury Resort</h3>
              <button onClick={() => setShowAddHotelModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddHotel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hotel Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starlight Grand Palace"
                  value={hotelForm.name}
                  onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location (City) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Goa"
                    value={hotelForm.location}
                    onChange={(e) => setHotelForm({ ...hotelForm, location: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Number</label>
                  <input
                    type="text"
                    placeholder="+91 832 245 6789"
                    value={hotelForm.contactNumber}
                    onChange={(e) => setHotelForm({ ...hotelForm, contactNumber: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Miramar Beach Road, Panaji, Goa"
                  value={hotelForm.address}
                  onChange={(e) => setHotelForm({ ...hotelForm, address: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Bespoke description of resort and amenities..."
                  value={hotelForm.description}
                  onChange={(e) => setHotelForm({ ...hotelForm, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddHotelModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow"
                >
                  Save Hotel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Room */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 relative p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold font-display text-slate-900">Add Room to Inventory</h3>
              <button onClick={() => setShowAddRoomModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Hotel *</label>
                <select
                  required
                  value={roomForm.hotelId}
                  onChange={(e) => setRoomForm({ ...roomForm, hotelId: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="">-- Select a property --</option>
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.location}) - ID #{h.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 101, 204"
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room Type</label>
                  <select
                    value={roomForm.roomType}
                    onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="DELUXE">DELUXE</option>
                    <option value="SUITE">SUITE</option>
                    <option value="EXECUTIVE">EXECUTIVE</option>
                    <option value="PRESIDENTIAL">PRESIDENTIAL</option>
                    <option value="STANDARD">STANDARD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price / Night (₹)</label>
                  <input
                    type="number"
                    step="100"
                    min="500"
                    required
                    value={roomForm.price}
                    onChange={(e) => setRoomForm({ ...roomForm, price: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={roomForm.status}
                    onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow"
                >
                  Save Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
