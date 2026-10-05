import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Invoice, Voyage, Booking, Vessel } from '../../types/maritime';
import { FileBarChart2, Download, Printer, TrendingUp, Ship, BookOpenCheck, Calendar, Filter } from 'lucide-react';

export const ReportsManager: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);

  const [reportType, setReportType] = useState<'REVENUE' | 'VOYAGES' | 'BOOKINGS'>('REVENUE');

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (s) => setInvoices(s.docs.map(d => d.data() as Invoice)), (err) => handleFirestoreError(err, OperationType.GET, 'invoices'));
    unsubs.push(unsubInvoices);

    const unsubVoyages = onSnapshot(collection(db, 'voyages'), (s) => setVoyages(s.docs.map(d => d.data() as Voyage)), (err) => handleFirestoreError(err, OperationType.GET, 'voyages'));
    unsubs.push(unsubVoyages);

    const unsubBookings = onSnapshot(collection(db, 'bookings'), (s) => setBookings(s.docs.map(d => d.data() as Booking)), (err) => handleFirestoreError(err, OperationType.GET, 'bookings'));
    unsubs.push(unsubBookings);

    const unsubVessels = onSnapshot(collection(db, 'vessels'), (s) => {
      setVessels(s.docs.map(d => d.data() as Vessel));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'vessels'));
    unsubs.push(unsubVessels);

    return () => unsubs.forEach(f => f());
  }, []);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const exportToCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (reportType === 'REVENUE') {
      csvContent += 'Invoice Number,Customer,Issue Date,Due Date,Freight Charge,Tax 11%,Total Amount,Status\n';
      invoices.forEach(i => {
        csvContent += `"${i.invoiceNumber}","${i.customerName}","${i.issueDate}","${i.dueDate}",${i.freightCharge},${i.taxAmount},${i.totalAmount},"${i.status}"\n`;
      });
    } else if (reportType === 'VOYAGES') {
      csvContent += 'Voyage Number,Vessel,Origin,Destination,ETD,ETA,Captain,Status\n';
      voyages.forEach(v => {
        csvContent += `"${v.voyageNumber}","${v.vesselName}","${v.originPortName}","${v.destinationPortName}","${v.etd}","${v.eta}","${v.captainName}","${v.status}"\n`;
      });
    } else {
      csvContent += 'Booking Number,Date,Customer,Voyage,Cargo,Quantity,Total Price,Status\n';
      bookings.forEach(b => {
        csvContent += `"${b.bookingNumber}","${b.bookingDate}","${b.customerName}","${b.voyageNumber}","${b.cargoName}",${b.quantity},${b.totalPrice},"${b.status}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileBarChart2 className="w-6 h-6 text-blue-600" />
            <span>Laporan Resmi Manajemen Perusahaan Pelayaran</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Laporan kualitatif & kuantitatif operasional kapal, rekapitulasi pendapatan, serta ekspor file CSV / cetak PDF.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan (PDF)</span>
          </button>
        </div>
      </div>

      {/* Tabs Selection */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setReportType('REVENUE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            reportType === 'REVENUE' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Laporan Pendapatan & Invoices
        </button>
        <button
          onClick={() => setReportType('VOYAGES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            reportType === 'VOYAGES' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Laporan Operasional Voyage
        </button>
        <button
          onClick={() => setReportType('BOOKINGS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            reportType === 'BOOKINGS' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Laporan Status Order & Cargo
        </button>
      </div>

      {/* Printable Report View */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 print-card">
        
        {/* Printable Header */}
        <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 uppercase">
              {reportType === 'REVENUE' && 'LAPORAN REKAPITULASI PENDAPATAN & INVOICE'}
              {reportType === 'VOYAGES' && 'LAPORAN OPERASIONAL JADWAL VOYAGE PELAYARAN'}
              {reportType === 'BOOKINGS' && 'LAPORAN REKAPITULASI BOOKING & KINERJA MUATAN'}
            </h2>
            <p className="text-xs text-slate-500">PT Samudra Maritime Logistics Tbk &bull; Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
          </div>
          <div className="text-right text-xs text-slate-400 font-mono">
            CONFIDENTIAL & OFFICIAL
          </div>
        </div>

        {/* Report Content Table */}
        <div className="overflow-x-auto">
          {reportType === 'REVENUE' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                  <th className="p-3">No. Invoice</th>
                  <th className="p-3">Pelanggan Shipper</th>
                  <th className="p-3">Terbit & Due Date</th>
                  <th className="p-3">Freight Charge</th>
                  <th className="p-3">PPN 11%</th>
                  <th className="p-3">Total Tagihan</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {invoices.map((i) => (
                  <tr key={i.id}>
                    <td className="p-3 font-mono font-bold text-blue-600">{i.invoiceNumber}</td>
                    <td className="p-3 font-semibold">{i.customerName}</td>
                    <td className="p-3">{i.issueDate} / {i.dueDate}</td>
                    <td className="p-3 font-mono">{formatIDR(i.freightCharge)}</td>
                    <td className="p-3 font-mono">{formatIDR(i.taxAmount)}</td>
                    <td className="p-3 font-mono font-bold">{formatIDR(i.totalAmount)}</td>
                    <td className="p-3 font-bold">{i.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'VOYAGES' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                  <th className="p-3">No. Voyage</th>
                  <th className="p-3">Nama Kapal</th>
                  <th className="p-3">Rute Pelayaran</th>
                  <th className="p-3">Jadwal ETD - ETA</th>
                  <th className="p-3">Nakhoda</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {voyages.map((v) => (
                  <tr key={v.id}>
                    <td className="p-3 font-mono font-bold text-blue-600">{v.voyageNumber}</td>
                    <td className="p-3 font-semibold">{v.vesselName}</td>
                    <td className="p-3">{v.originPortName} &rarr; {v.destinationPortName}</td>
                    <td className="p-3 font-mono">{new Date(v.etd).toLocaleDateString()} - {new Date(v.eta).toLocaleDateString()}</td>
                    <td className="p-3">{v.captainName}</td>
                    <td className="p-3 font-bold">{v.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'BOOKINGS' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                  <th className="p-3">No. Booking</th>
                  <th className="p-3">Pelanggan Klien</th>
                  <th className="p-3">Ref Voyage</th>
                  <th className="p-3">Muatan & Volume</th>
                  <th className="p-3">Total Biaya</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="p-3 font-mono font-bold text-blue-600">{b.bookingNumber}</td>
                    <td className="p-3 font-semibold">{b.customerName}</td>
                    <td className="p-3">{b.voyageNumber}</td>
                    <td className="p-3 font-bold">{b.cargoName} ({b.quantity} {b.unit})</td>
                    <td className="p-3 font-mono font-bold">{formatIDR(b.totalPrice)}</td>
                    <td className="p-3 font-bold">{b.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Report Footer */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-800">PT Samudra Maritime Logistics Tbk</p>
            <p>Direktorat Keuangan & Operasional Pelayaran</p>
          </div>
          <div className="text-right">
            <p>Disetujui Oleh: Vice President Maritime Operations</p>
          </div>
        </div>

      </div>

    </div>
  );
};
