import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Invoice, InvoiceStatus, Booking, Customer } from '../../types/maritime';
import { Receipt, Plus, Search, Edit, Trash2, X, ShieldAlert, Printer, CheckCircle2 } from 'lucide-react';

export const InvoicesManager: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Print Invoice Preview Modal
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    bookingId: '',
    bookingNumber: '',
    customerId: '',
    customerName: '',
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    freightCharge: 250000000,
    handlingFee: 10000000,
    portFee: 5000000,
    taxAmount: 29150000, // 11%
    totalAmount: 294150000,
    status: 'Belum Lunas' as InvoiceStatus,
    paymentMethod: 'Transfer Mandiri VA / BCA Corporate',
    notes: 'Jatuh tempo 14 hari kalender',
  });

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
      setInvoices(data);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'invoices'));
    unsubs.push(unsubInvoices);

    const unsubBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(data);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'bookings'));
    unsubs.push(unsubBookings);

    const unsubCust = onSnapshot(collection(db, 'customers'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(data);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'customers'));
    unsubs.push(unsubCust);

    return () => unsubs.forEach(fn => fn());
  }, []);

  const recalculateTotal = (freight: number, handling: number, port: number) => {
    const sub = freight + handling + port;
    const tax = Math.round(sub * 0.11); // 11% PPN
    const total = sub + tax;
    return { tax, total };
  };

  const handleOpenAddModal = () => {
    setEditingInvoice(null);
    const bko = bookings[0];
    const cust = customers[0];

    const freight = bko ? bko.totalPrice : 300000000;
    const handling = 12000000;
    const port = 6000000;
    const { tax, total } = recalculateTotal(freight, handling, port);

    setFormData({
      invoiceNumber: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      bookingId: bko?.id || '',
      bookingNumber: bko?.bookingNumber || '',
      customerId: cust?.id || '',
      customerName: cust?.companyName || '',
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      freightCharge: freight,
      handlingFee: handling,
      portFee: port,
      taxAmount: tax,
      totalAmount: total,
      status: 'Belum Lunas',
      paymentMethod: 'Transfer Bank Mandiri Virtual Account',
      notes: 'Term pembayaran 14 hari kerja',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (inv: Invoice) => {
    setEditingInvoice(inv);
    setFormData({
      invoiceNumber: inv.invoiceNumber,
      bookingId: inv.bookingId,
      bookingNumber: inv.bookingNumber,
      customerId: inv.customerId,
      customerName: inv.customerName,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      freightCharge: inv.freightCharge,
      handlingFee: inv.handlingFee,
      portFee: inv.portFee,
      taxAmount: inv.taxAmount,
      totalAmount: inv.totalAmount,
      status: inv.status,
      paymentMethod: inv.paymentMethod || '',
      notes: inv.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleAmountChange = (field: 'freightCharge' | 'handlingFee' | 'portFee', val: number) => {
    const updated = {
      ...formData,
      [field]: val,
    };
    const { tax, total } = recalculateTotal(
      field === 'freightCharge' ? val : formData.freightCharge,
      field === 'handlingFee' ? val : formData.handlingFee,
      field === 'portFee' ? val : formData.portFee
    );
    setFormData({
      ...updated,
      taxAmount: tax,
      totalAmount: total,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const targetId = editingInvoice ? editingInvoice.id : `inv-${Date.now()}`;

    const selectedCust = customers.find(c => c.id === formData.customerId);
    const selectedBko = bookings.find(b => b.id === formData.bookingId);

    const newDoc: Invoice = {
      id: targetId,
      ...formData,
      customerName: selectedCust ? selectedCust.companyName : formData.customerName,
      bookingNumber: selectedBko ? selectedBko.bookingNumber : formData.bookingNumber,
      createdAt: editingInvoice ? editingInvoice.createdAt : now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'invoices', targetId), newDoc);
      setIsModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, editingInvoice ? OperationType.UPDATE : OperationType.CREATE, `invoices/${targetId}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'invoices', id));
      setDeleteConfirmId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `invoices/${id}`);
    }
  };

  const filteredInvoices = invoices.filter(i => 
    i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            <span>Transaksi Tagihan & Keuangan (Invoices)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Penagihan jasa pelayaran, kalkulasi PPN 11%, status kelunasan invoice, dan cetak invoice resmi.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Invoice Tagihan Baru</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cari nomor invoice, nama pelanggan, atau nomor booking..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">No. Invoice & Ref Booking</th>
                <th className="py-3.5 px-4">Pelanggan Klien</th>
                <th className="py-3.5 px-4">Tanggal Terbit & Due Date</th>
                <th className="py-3.5 px-4">Subtotal + PPN 11%</th>
                <th className="py-3.5 px-4">Total Tagihan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Memuat data invoice keuangan...</td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Tidak ada tagihan invoice ditemukan.</td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-blue-600">{inv.invoiceNumber}</div>
                      <div className="text-[11px] font-mono text-slate-400">Booking: {inv.bookingNumber}</div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {inv.customerName}
                    </td>

                    <td className="py-3.5 px-4 text-[11px]">
                      <div><span className="text-slate-400">Terbit:</span> {inv.issueDate}</div>
                      <div><span className="text-slate-400">Jatuh Tempo:</span> <span className="font-semibold text-rose-700">{inv.dueDate}</span></div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      <div>Freight: {formatIDR(inv.freightCharge)}</div>
                      <div className="text-slate-400">PPN 11%: {formatIDR(inv.taxAmount)}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900 text-sm">
                      {formatIDR(inv.totalAmount)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        inv.status === 'Lunas'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.status === 'Jatuh Tempo'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPrintInvoice(inv)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 transition-colors"
                          title="Cetak Official Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(inv)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(inv.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Official Invoice Modal */}
      {printInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 print-card">
            
            {/* Kop Surat Corporate */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">PT SAMUDRA MARITIME LOGISTICS TBK</h2>
                <p className="text-xs text-slate-500 mt-1">Gedung Samudra Tower Lt. 12, Jl. Yos Sudarso No. 88, Tanjung Priok, Jakarta</p>
                <p className="text-xs text-slate-500">Telp: (021) 4300-8800 | Email: billing@samudra-maritime.co.id</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-extrabold text-blue-700 block">INVOICE TAGIHAN</span>
                <span className="font-mono text-xs font-bold text-slate-800">{printInvoice.invoiceNumber}</span>
              </div>
            </div>

            {/* Bill To Info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px]">DITAGIHKAN KEPADA:</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{printInvoice.customerName}</div>
                <div className="text-slate-600 mt-0.5">Ref Order Booking: <span className="font-mono font-semibold">{printInvoice.bookingNumber}</span></div>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-400 uppercase text-[10px]">TANGGAL PENAGIHAN:</span>
                <div className="font-semibold text-slate-800 mt-0.5">Terbit: {printInvoice.issueDate}</div>
                <div className="font-semibold text-rose-700">Jatuh Tempo: {printInvoice.dueDate}</div>
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="p-3">Deskripsi Komponen Jasa Pelayaran</th>
                    <th className="p-3 text-right">Jumlah (IDR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="p-3 text-slate-800">Biaya Ongkos Angkut Kapal (Freight Charge)</td>
                    <td className="p-3 text-right font-mono font-semibold">{formatIDR(printInvoice.freightCharge)}</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-800">Biaya Handling & Bongkar Muat Terminal</td>
                    <td className="p-3 text-right font-mono font-semibold">{formatIDR(printInvoice.handlingFee)}</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-800">Biaya Tambat Pelabuhan (Port Berth Charge)</td>
                    <td className="p-3 text-right font-mono font-semibold">{formatIDR(printInvoice.portFee)}</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="p-3 text-slate-700">PPN (11%)</td>
                    <td className="p-3 text-right font-mono text-slate-900">{formatIDR(printInvoice.taxAmount)}</td>
                  </tr>
                  <tr className="bg-blue-50 text-blue-900 font-extrabold text-sm">
                    <td className="p-3">TOTAL TAGIHAN KELUNASAN</td>
                    <td className="p-3 text-right font-mono">{formatIDR(printInvoice.totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment & Signatures */}
            <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-100">
              <div>
                <span className="font-bold text-slate-700">Metode Pembayaran:</span>
                <p className="text-slate-600 font-mono mt-0.5">{printInvoice.paymentMethod}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                  printInvoice.status === 'Lunas' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  STATUS: {printInvoice.status.toUpperCase()}
                </span>
              </div>
              <div className="text-center">
                <p className="text-slate-500 mb-8">Departemen Keuangan & Billing</p>
                <p className="font-bold text-slate-900 underline">PT Samudra Maritime Logistics Tbk</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 no-print pt-4 border-t border-slate-200">
              <button
                onClick={() => setPrintInvoice(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs shadow-md flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Invoice (PDF)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingInvoice ? 'Edit Data Invoice' : 'Buat Invoice Tagihan Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">No. Invoice</label>
                  <input
                    type="text"
                    required
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Pelanggan Klien</label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.companyName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Referensi Order Booking</label>
                <select
                  value={formData.bookingId}
                  onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {bookings.map(b => (
                    <option key={b.id} value={b.id}>{b.bookingNumber} - {b.customerName} ({b.cargoName})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Biaya Freight (IDR)</label>
                  <input
                    type="number"
                    required
                    value={formData.freightCharge}
                    onChange={(e) => handleAmountChange('freightCharge', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Biaya Handling (IDR)</label>
                  <input
                    type="number"
                    required
                    value={formData.handlingFee}
                    onChange={(e) => handleAmountChange('handlingFee', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs font-medium text-blue-900 space-y-1">
                <div className="flex justify-between">
                  <span>PPN 11% (Otomatis):</span>
                  <span className="font-mono font-bold">{formatIDR(formData.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-blue-950 pt-1 border-t border-blue-200">
                  <span>Total Invoice:</span>
                  <span className="font-mono">{formatIDR(formData.totalAmount)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Status Pembayaran</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as InvoiceStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Belum Lunas">Belum Lunas</option>
                    <option value="Sebagian">Sebagian</option>
                    <option value="Lunas">Lunas</option>
                    <option value="Jatuh Tempo">Jatuh Tempo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Jatuh Tempo</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/20">Simpan Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Hapus Invoice?</h3>
            <p className="text-xs text-slate-500">Data tagihan invoice akan dihapus dari Firestore.</p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs">Batal</button>
              <button onClick={() => handleDelete(deleteConfirmId)} className="px-4 py-2 bg-rose-600 text-white font-semibold rounded-xl text-xs shadow-md shadow-rose-500/20">Hapus</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
