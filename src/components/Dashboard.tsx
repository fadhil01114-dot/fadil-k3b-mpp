import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Vessel, Voyage, Booking, Invoice } from '../types/maritime';
import { 
  Ship, 
  Anchor, 
  TrendingUp, 
  DollarSign, 
  Navigation, 
  BookOpenCheck, 
  Clock, 
  Plus, 
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  onOpenAIAssistant: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, onOpenAIAssistant }) => {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Realtime listeners to Firestore as Single Source of Truth
    const unsubs: (() => void)[] = [];

    const unsubVessels = onSnapshot(collection(db, 'vessels'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vessel));
      setVessels(data);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'vessels'));
    unsubs.push(unsubVessels);

    const unsubVoyages = onSnapshot(collection(db, 'voyages'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Voyage));
      setVoyages(data);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'voyages'));
    unsubs.push(unsubVoyages);

    const unsubBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(data);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'bookings'));
    unsubs.push(unsubBookings);

    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
      setInvoices(data);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'invoices'));
    unsubs.push(unsubInvoices);

    return () => unsubs.forEach(fn => fn());
  }, []);

  // Compute stats
  const totalSailing = vessels.filter(v => v.status === 'Berlayar').length;
  const activeVoyagesCount = voyages.filter(v => v.status === 'In Transit' || v.status === 'Loading').length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const paidRevenue = invoices.filter(i => i.status === 'Lunas').reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-cyan-300 text-xs font-semibold mb-3 border border-cyan-400/30">
            <ShieldCheck className="w-4 h-4 text-cyan-300" />
            <span>Sistem Operasional Perusahaan Pelayaran Terintegrasi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Selamat Datang di Portal Samudra Maritime
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Kelola armada kapal, rute jadwal pelayaran, pendaftaran booking cargo, manifest muatan, serta invoice pembayaran secara terpusat dengan data persisten real-time.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('voyages')}
              className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              <span>Kelola Jadwal Voyage</span>
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs backdrop-blur-sm border border-white/20 transition-all flex items-center gap-2"
            >
              <BookOpenCheck className="w-4 h-4" />
              <span>Buat Order Booking Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Armada Berlayar</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {totalSailing} <span className="text-sm font-semibold text-slate-500">/ {vessels.length} Kapal</span>
            </div>
            <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{((totalSailing / (vessels.length || 1)) * 100).toFixed(0)}% Utilitas Armada</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Ship className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Voyage Aktif</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {activeVoyagesCount} <span className="text-sm font-semibold text-slate-500">Rute</span>
            </div>
            <div className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5" />
              <span>Dalam Pelayaran & Loading</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
            <Navigation className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Booking Cargo</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {bookings.length} <span className="text-sm font-semibold text-slate-500">Order</span>
            </div>
            <div className="text-xs text-indigo-600 font-medium mt-1 flex items-center gap-1">
              <BookOpenCheck className="w-3.5 h-3.5" />
              <span>{bookings.filter(b => b.status === 'Delivered').length} Terkirim Sampai Tujuan</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <BookOpenCheck className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pendapatan Invoices</div>
            <div className="text-xl font-extrabold text-slate-900 mt-1 truncate max-w-[170px]">
              {formatIDR(totalRevenue)}
            </div>
            <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Lunas: {formatIDR(paidRevenue)}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Content Grid: Voyages in Progress & Vessels Fleet Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Active Voyages List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Jadwal Pelayaran Aktif Saat Ini</h2>
              <p className="text-xs text-slate-500">Status rute kapal dalam perjalanan & pemuatan barang</p>
            </div>
            <button
              onClick={() => setActiveTab('voyages')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Lihat Semua ({voyages.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {voyages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">Belum ada data jadwal pelayaran di Firestore.</div>
            ) : (
              voyages.slice(0, 4).map((vyg) => (
                <div key={vyg.id} className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-all bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {vyg.voyageNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{vyg.vesselName}</span>
                    </div>
                    <div className="text-xs font-medium text-slate-600 flex items-center gap-2">
                      <span>{vyg.originPortName}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{vyg.destinationPortName}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3">
                      <span>Nakhoda: {vyg.captainName}</span>
                      <span>ETA: {new Date(vyg.eta).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      vyg.status === 'In Transit'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : vyg.status === 'Loading'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : vyg.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {vyg.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Fleet Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Status Armada Kapal</h2>
            <button
              onClick={() => setActiveTab('vessels')}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Kelola Kapal
            </button>
          </div>

          <div className="space-y-3">
            {vessels.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                    <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{v.name}</div>
                    <div className="text-[11px] text-slate-500">{v.vesselType} &bull; {v.imoNumber}</div>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  v.status === 'Berlayar'
                    ? 'bg-blue-100 text-blue-700'
                    : v.status === 'Siap Muat'
                    ? 'bg-emerald-100 text-emerald-700'
                    : v.status === 'Sandar/Dermaga'
                    ? 'bg-slate-200 text-slate-800'
                    : 'bg-rose-100 text-rose-700'
                }`}>
                  {v.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
