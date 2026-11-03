import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { hotelApi } from '../api/hotelApi';
import { roomApi } from '../api/roomApi';
import RoomCard from '../components/RoomCard';
import BookingModal from '../components/BookingModal';
import { MapPin, Phone, ArrowLeft, Star, BedDouble, Calendar, Sparkles, AlertCircle } from 'lucide-react';

export default function HotelDetailPage() {
  const { id } = useParams();

  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to format date YYYY-MM-DD in local time
  const formatLocalDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Date selection for reservation
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minCheckIn = formatLocalDate(tomorrow);

  const defaultOut = new Date(tomorrow);
  defaultOut.setDate(defaultOut.getDate() + 3);

  const [checkIn, setCheckIn] = useState(minCheckIn);
  const [checkOut, setCheckOut] = useState(formatLocalDate(defaultOut));

  // Booking modal state
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);

  useEffect(() => {
    async function loadHotelAndRooms() {
      setLoading(true);
      setError(null);
      try {
        const [hotelData, roomsData] = await Promise.all([
          hotelApi.getHotelById(id),
          roomApi.getRoomsByHotel(id),
        ]);
        setHotel(hotelData);
        setRooms(roomsData);
      } catch (err) {
        setError(err.message || 'Failed to load hotel details.');
      } finally {
        setLoading(false);
      }
    }
    loadHotelAndRooms();
  }, [id]);

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const nights = calculateNights();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mx-auto"></div>
        <p className="text-xs text-slate-400">Loading sanctuary and suites...</p>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-white border border-slate-200 rounded-2xl text-center shadow-sm space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold font-display text-slate-900">Hotel Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'The requested property could not be retrieved from the Hotel Service.'}</p>
        <Link
          to="/hotels"
          className="inline-flex items-center space-x-1 px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Resorts</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Back button */}
      <Link
        to="/hotels"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-amber-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to All Properties</span>
      </Link>

      {/* Hero Header Card */}
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7 p-8 md:p-12 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>STARLIGHT EXCLUSIVE RESORT</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold font-display text-slate-900 leading-tight">
              {hotel.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-500">
              <span className="flex items-center space-x-1.5 text-slate-700 font-semibold bg-slate-100 px-3 py-1 rounded-full">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>{hotel.location}</span>
              </span>
              <span>{hotel.address}</span>
              {hotel.contactNumber && (
                <span className="flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{hotel.contactNumber}</span>
                </span>
              )}
            </div>

            <p className="mt-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
              {hotel.description ||
                'Welcome to this luxury destination offering private sanctuaries, bespoke amenities, and gourmet dining overlooking breathtaking vistas.'}
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
              <span className="text-xs font-bold text-slate-700 ml-2">5.0 Luxury Rating</span>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Live Service Discovery Verified
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-full">
          <img
            src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80"
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent"></div>
        </div>
      </div>

      {/* Reservation Planning & Date Selection Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-4 h-4" />
            <span>Select Reservation Dates</span>
          </div>
          <p className="text-xs text-slate-300">
            Dates must be strictly in the future. Pricing adjusts automatically based on night count.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Check-in</label>
            <input
              type="date"
              min={minCheckIn}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="text-xs bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Check-out</label>
            <input
              type="date"
              min={checkIn || minCheckIn}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="text-xs bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-4 md:pt-0">
            <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Length of Stay</span>
            <span className="inline-block px-4 py-2 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-xl text-xs font-bold">
              {nights > 0 ? `${nights} ${nights === 1 ? 'Night' : 'Nights'}` : 'Select Dates'}
            </span>
          </div>
        </div>
      </div>

      {/* Available Suites & Rooms Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold font-display text-slate-900 flex items-center space-x-2">
              <BedDouble className="w-6 h-6 text-amber-500" />
              <span>Available Suites & Rooms</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select your preferred luxury room type to view details or proceed with reservation.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {rooms.length} {rooms.length === 1 ? 'Room listed' : 'Rooms listed'}
          </span>
        </div>

        {rooms.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <BedDouble className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 font-display">No Rooms Listed Yet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              This property does not have any active rooms configured in Room Service.
            </p>
            <Link
              to="/admin"
              className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition"
            >
              Add Rooms in Admin Portal
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                checkIn={checkIn}
                checkOut={checkOut}
                nights={nights}
                onBookRoom={(r) => setSelectedRoomForBooking(r)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Popup */}
      {selectedRoomForBooking && (
        <BookingModal
          room={selectedRoomForBooking}
          initialCheckIn={checkIn}
          initialCheckOut={checkOut}
          onClose={() => setSelectedRoomForBooking(null)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
