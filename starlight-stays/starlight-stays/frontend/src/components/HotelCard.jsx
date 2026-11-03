import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Star, ArrowRight } from 'lucide-react';

// Curated high quality hotel & resort images
const HOTEL_IMAGES = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
];

export default function HotelCard({ hotel, index = 0 }) {
  if (!hotel) return null;
  const imageUrl = HOTEL_IMAGES[index % HOTEL_IMAGES.length];

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col group">
      {/* Image container */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={imageUrl}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 backdrop-blur-md text-amber-300 border border-amber-400/30">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>{hotel.location}</span>
          </span>
        </div>
        <div className="absolute bottom-3 right-4 flex items-center space-x-1 text-amber-400">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-current" />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900 font-display mb-2 group-hover:text-amber-600 transition-colors">
            {hotel.name}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
            {hotel.description || 'Experience bespoke comfort, Michelin-inspired dining, and panoramic horizons at our signature sanctuary.'}
          </p>
          <div className="space-y-1.5 text-xs text-slate-500 mb-6">
            <p className="flex items-center space-x-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{hotel.address}</span>
            </p>
            {hotel.contactNumber && (
              <p className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{hotel.contactNumber}</span>
              </p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Signature Stay</span>
            <span className="text-xs font-semibold text-slate-700">Multi-Room Inventory</span>
          </div>
          <Link
            to={`/hotels/${hotel.id}`}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
          >
            <span>View Suites</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
