import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { hotelApi } from '../api/hotelApi';
import HotelCard from '../components/HotelCard';
import { Search, MapPin, Hotel, Filter, RefreshCw } from 'lucide-react';

export default function HotelsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const locationParam = searchParams.get('location') || '';

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(locationParam);
  const [selectedLocation, setSelectedLocation] = useState(locationParam);

  const fetchHotels = async () => {
    setLoading(true);
    setError(null);
    try {
      if (selectedLocation) {
        const data = await hotelApi.getHotelsByLocation(selectedLocation);
        setHotels(data);
      } else {
        const data = await hotelApi.getAllHotels();
        setHotels(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve hotels.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, [selectedLocation]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setSelectedLocation(searchQuery.trim());
    if (searchQuery.trim()) {
      setSearchParams({ location: searchQuery.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleClearFilter = () => {
    setSearchQuery('');
    setSelectedLocation('');
    setSearchParams({});
  };

  // Distinct locations from hotels list for quick pills
  const hotelList = Array.isArray(hotels) ? hotels : [];
  const availableLocations = Array.from(new Set(hotelList.map((h) => h?.location))).filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="border-b border-slate-200 pb-8">
        <div className="flex items-center space-x-2 text-xs font-semibold text-amber-600 uppercase tracking-widest mb-1">
          <Hotel className="w-4 h-4 text-amber-500" />
          <span>DESTINATIONS DIRECTORY</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-display text-slate-900">
          Our Constellation of Luxury Resorts
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-2xl">
          Browse our collection of handpicked properties across iconic destinations. Each stay features authentic character, bespoke suites, and unrivaled hospitality.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleFilterSubmit} className="flex items-center space-x-2 w-full md:w-96">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Filter by city (e.g. Goa, Mumbai)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
          >
            Filter
          </button>
          {selectedLocation && (
            <button
              type="button"
              onClick={handleClearFilter}
              className="px-3 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs transition"
            >
              Clear
            </button>
          )}
        </form>

        {/* Quick Location Pills */}
        {availableLocations.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1 flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-amber-500" />
              <span>Cities:</span>
            </span>
            {availableLocations.map((loc) => (
              <button
                key={loc}
                onClick={() => {
                  setSearchQuery(loc);
                  setSelectedLocation(loc);
                  setSearchParams({ location: loc });
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  selectedLocation.toLowerCase() === loc.toLowerCase()
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchHotels}
            className="flex items-center space-x-1 text-rose-700 font-semibold hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Hotel Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-96 animate-pulse border border-slate-200"></div>
          ))}
        </div>
      ) : hotels.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 max-w-lg mx-auto space-y-4">
          <Hotel className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-xl font-bold font-display text-slate-800">No Resorts Found</h3>
          <p className="text-xs text-slate-500">
            {selectedLocation
              ? `No properties currently listed in "${selectedLocation}". Try clearing the filter or searching for another location.`
              : 'No hotel properties found in the database. Add hotels through the Admin Portal.'}
          </p>
          {selectedLocation && (
            <button
              onClick={handleClearFilter}
              className="px-5 py-2.5 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-amber-400 transition"
            >
              Show All Hotels
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {hotelList.map((hotel, idx) => (
            <HotelCard key={hotel.id} hotel={hotel} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
