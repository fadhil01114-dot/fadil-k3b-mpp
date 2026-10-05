import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Anchor, LogOut, Sparkles, Database, User as UserIcon, Bell } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onOpenAIAssistant: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onOpenAIAssistant }) => {
  const { userProfile, logout } = useAuth();

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard Utama & Ringkasan Operasional';
      case 'vessels': return 'Master Data Kapal (Vessels)';
      case 'ports': return 'Master Data Pelabuhan (Ports)';
      case 'cargos': return 'Master Data Muatan & Tarif (Cargo & Rates)';
      case 'crew': return 'Master Data Awak Kapal (Crew & Officer)';
      case 'customers': return 'Master Data Pelanggan / Klien (Clients)';
      case 'voyages': return 'Transaksi Jadwal & Rute Pelayaran (Voyages)';
      case 'bookings': return 'Transaksi Booking & Order Pengiriman (Bookings)';
      case 'manifests': return 'Transaksi Manifest Cargo (Shipment Manifest)';
      case 'invoices': return 'Transaksi Tagihan & Keuangan (Invoices)';
      case 'reports': return 'Laporan Resmi Perusahaan Pelayaran';
      default: return 'Sistem Perusahaan Pelayaran';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        
        {/* Left: Branding & Page Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Anchor className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-slate-900 leading-tight tracking-tight text-base sm:text-lg">
                SAMUDRA MARITIME
              </div>
              <div className="text-xs text-slate-500 font-medium hidden sm:block">
                Sistem Manajemen Enterprise
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden md:block" />

          <div className="hidden md:block">
            <h2 className="text-sm font-semibold text-slate-800">{getPageTitle(activeTab)}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Realtime Firebase Firestore</span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          
          {/* AI Route Assistant Trigger Button */}
          <button
            onClick={onOpenAIAssistant}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4 text-cyan-200 animate-bounce" />
            <span className="hidden sm:inline">AI Asisten Rute & BBM</span>
            <span className="sm:hidden">AI Rute</span>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900 leading-none">
                {userProfile?.displayName || 'Administrator'}
              </span>
              <span className="text-[11px] font-medium text-blue-600 uppercase tracking-wider mt-0.5">
                {userProfile?.role || 'Super Admin'}
              </span>
            </div>

            <img
              src={userProfile?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt="Avatar"
              className="w-9 h-9 rounded-xl border border-slate-200 object-cover"
            />

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Keluar dari Sistem"
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
