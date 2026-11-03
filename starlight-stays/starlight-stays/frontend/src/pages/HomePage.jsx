import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { hotelApi } from '../api/hotelApi';
import HotelCard from '../components/HotelCard';
import { Search, Calendar, MapPin, Sparkles, Shield, Compass, Star, ArrowRight, Award } from 'lucide-react';

export default function HomePage() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadHotels() {
      try {
        const data = await hotelApi.getAllHotels();
        setHotels(data);
      } catch (err) {
        console.error('Failed to load hotels for home page', err);
      } finally {
        setLoading(false);
      }
    }
    loadHotels();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchLocation.trim()) {
      navigate(`/hotels?location=${encodeURIComponent(searchLocation.trim())}`);
    } else {
      navigate('/hotels');
    }
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative resort-gradient text-white py-24 md:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-amber-400/30 text-amber-300 text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Project P5004 • Multi-Property Reservation Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-display tracking-tight leading-tight text-white">
            Where Serenity Meets <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">Grandeur</span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm md:text-base text-slate-300 font-light leading-relaxed">
            Discover a curated constellation of luxury resorts, coastal sanctuaries, and alpine estates. Seamlessly powered by high-throughput Spring Boot microservices.
          </p>

          {/* Quick Search Bar */}
          <div className="max-w-3xl mx-auto pt-6">
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white/10 backdrop-blur-md p-3 rounded-2xl md:rounded-full border border-white/20 shadow-2xl flex flex-col md:flex-row items-center gap-3 text-left"
            >
              <div className="flex-1 flex items-center space-x-3 px-4 w-full">
                <MapPin className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="w-full">
                  <span className="block text-[10px] uppercase font-bold text-slate-300 tracking-wider">Destination</span>
                  <input
                    type="text"
                    placeholder="Search by city (e.g. Goa, Manali, Mumbai)..."
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl md:rounded-full text-sm shadow-lg hover:shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>Search Stays</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-amber-600 uppercase tracking-widest mb-1">
              <Award className="w-4 h-4 text-amber-500" />
              <span>HANDPICKED SANCTUARIES</span>
            </div>
            <h2 className="text-3xl font-bold font-display text-slate-900">
              Signature Hotels & Resorts
            </h2>
          </div>
          <Link
            to="/hotels"
            className="mt-4 md:mt-0 inline-flex items-center space-x-1.5 text-sm font-semibold text-amber-600 hover:text-amber-700"
          >
            <span>Browse All Properties</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-96 animate-pulse border border-slate-200"></div>
            ))}
          </div>
        ) : hotels.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-xl mx-auto">
            <Compass className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 font-display">No Properties Available Yet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Connect to the backend services or use the Admin Portal to add your first luxury property.
            </p>
            <Link
              to="/admin"
              className="inline-flex items-center px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg"
            >
              Add Hotels in Admin Portal
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {hotels.slice(0, 3).map((hotel, idx) => (
              <HotelCard key={hotel.id} hotel={hotel} index={idx} />
            ))}
          </div>
        )}
      </section>

      {/* Hospitality Value Pillars */}
      <section className="bg-slate-100 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-widest">WHY CHOOSE STARLIGHT</span>
            <h2 className="text-3xl font-bold font-display text-slate-900 mt-1">The Gold Standard in Hospitality</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-display text-slate-900">Guaranteed Concurrency Safety</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Backed by MySQL pessimistic row locking (<code className="text-amber-700 bg-amber-50 px-1 py-0.5 rounded">SELECT ... FOR UPDATE</code>) preventing double-booking even under intense concurrent traffic.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-display text-slate-900">Dynamic Rate Integrity</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Precision <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">BigDecimal</code> computation per room night, coupled with automated simulated payment processing and instant refund routing.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-display text-slate-900">Decoupled Microservices</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                7 independently scalable Spring Boot microservices orchestrated through Eureka service discovery and Spring Cloud Gateway routing on port 8080.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
