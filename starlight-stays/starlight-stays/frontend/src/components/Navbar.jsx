import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Hotel, CalendarCheck, ShieldCheck, LogOut, User, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-slate-900 text-white shadow-xl sticky top-0 z-50 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <span className="text-xl md:text-2xl font-bold tracking-wider font-display text-white group-hover:text-amber-300 transition-colors">
                STARLIGHT
              </span>
              <span className="text-xs block tracking-widest text-amber-400 font-medium">STAYS & RESORTS</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                isActive('/') ? 'text-amber-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              Home
            </Link>
            <Link
              to="/hotels"
              className={`text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                isActive('/hotels') ? 'text-amber-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Hotel className="w-4 h-4" />
              <span>Resorts & Hotels</span>
            </Link>

            {isAuthenticated && !isAdmin && (
              <Link
                to="/dashboard"
                className={`text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                  isActive('/dashboard') ? 'text-amber-400' : 'text-slate-300 hover:text-white'
                }`}
              >
                <CalendarCheck className="w-4 h-4 text-amber-400" />
                <span>My Reservations</span>
              </Link>
            )}

            {isAuthenticated && isAdmin && (
              <Link
                to="/admin"
                className={`text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                  isActive('/admin') ? 'text-amber-400' : 'text-slate-300 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Admin Portal</span>
              </Link>
            )}
          </div>

          {/* Right side auth buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
                  <User className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-slate-200 max-w-[120px] truncate">{user?.email}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    isAdmin ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-xs text-slate-400 hover:text-rose-400 px-3 py-2 rounded-lg hover:bg-slate-800 transition"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-200 hover:text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-4 py-2 rounded-lg shadow-md hover:shadow-amber-500/20 transition-all duration-200"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-300 hover:text-white p-2 rounded-lg focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-slate-200 hover:text-amber-400"
          >
            Home
          </Link>
          <Link
            to="/hotels"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-slate-200 hover:text-amber-400"
          >
            Resorts & Hotels
          </Link>
          {isAuthenticated && !isAdmin && (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-slate-200 hover:text-amber-400"
            >
              My Reservations
            </Link>
          )}
          {isAuthenticated && isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-slate-200 hover:text-amber-400"
            >
              Admin Portal
            </Link>
          )}
          <div className="pt-3 border-t border-slate-800">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{user?.email}</span>
                  <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[10px]">
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left py-2 text-rose-400 hover:text-rose-300 text-sm font-medium flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-slate-200 hover:text-white bg-slate-800 rounded-lg text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-sm font-semibold"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
