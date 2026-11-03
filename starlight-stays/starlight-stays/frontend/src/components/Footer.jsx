import React from 'react';
import { Sparkles, MapPin, Phone, Mail, Shield, Award, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <span className="text-xl font-bold font-display text-white tracking-wider">STARLIGHT</span>
                <span className="text-[10px] block text-amber-400 tracking-widest font-semibold">STAYS & RESORTS</span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Curated luxury properties, sanctuary escapes, and bespoke hospitality experiences worldwide.
            </p>
            <div className="flex items-center space-x-2 text-xs text-amber-400">
              <Award className="w-4 h-4" />
              <span>Project P5004 • Spring Cloud Architecture</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4 font-display">
              Destinations & Stays
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/hotels" className="hover:text-amber-400 transition-colors">All Luxury Hotels</Link>
              </li>
              <li>
                <Link to="/hotels?location=Goa" className="hover:text-amber-400 transition-colors">Coastal Retreats (Goa)</Link>
              </li>
              <li>
                <Link to="/hotels?location=Manali" className="hover:text-amber-400 transition-colors">Alpine Villas (Manali)</Link>
              </li>
              <li>
                <Link to="/hotels?location=Mumbai" className="hover:text-amber-400 transition-colors">City Suites (Mumbai)</Link>
              </li>
            </ul>
          </div>

          {/* Microservices Architecture */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4 font-display">
              System Architecture
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Eureka Discovery (Port 8761)</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Spring Cloud Gateway (Port 8080)</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>User, Hotel, Room Services</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Booking & Payment Services</span>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4 font-display">
              Concierge Service
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-center space-x-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Starlight Grand Boulevard, Luxury Mile</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>+91 1800 258 7827 (STAR)</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>concierge@starlightstays.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400">
          <p>© 2026 Starlight Stays & Resorts. All rights reserved.</p>
          <p className="mt-2 md:mt-0 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Pessimistic Concurrency Protected • JWT Secured</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
