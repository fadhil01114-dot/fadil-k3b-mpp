import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Booking, BookingStatus, Customer, Voyage, Cargo, CargoUnit } from '../../types/maritime';
import { BookOpenCheck, Plus, Search, Edit, Trash2, X, ShieldAlert } from 'lucide-react';

export const BookingsManager: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    bookingNumber: string;
    bookingDate: string;
    customerId: string;
    customerName: string;
    voyageId: string;
    voyageNumber: string;
    cargoId: string;
    cargoName: string;
    quantity: number;
    unit: CargoUnit;
    originPortName: string;
    destinationPortName: string;
    totalPrice: number;
    status: BookingStatus;
    notes: string;
  }>({
    bookingNumber: '',
    bookingDate: new Date().toISOString().slice(0, 10),
    customerId: '',
    customerName: '',
    voyageId: '',
    voyageNumber: '',
    cargoId: '',
    cargoName: '',
    quantity: 10,
    unit: 'TEU',
    originPortName: '',
    destinationPortName: '',
    totalPrice: 150000000,
    status: 'Confirmed',
    notes: '',
  });

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    const unsubBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(data);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'bookings'));
    unsubs.push(unsubBookings);

    const unsubCust = onSnapshot(collection(db, 'customers'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(data);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'customers'));
    unsubs.push(unsubCust);

    const unsubVoyages = onSnapshot(collection(db, 'voyages'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Voyage));
      setVoyages(data);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'voyages'));
    unsubs.push(unsubVoyages);

    const unsubCargos = onSnapshot(collection(db, 'cargos'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cargo));
      setCargos(data);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'cargos'));
    unsubs.push(unsubCargos);

    return () => unsubs.forEach(fn => fn());
  }, []);

  const handleOpenAddModal = () => {
    setEditingBooking(null);
    const cust = customers[0];
    const vyg = voyages[0];
    const crg = cargos[0];

    const qty = 10;
    const baseTariff = crg ? crg.baseTariffPerUnit : 15000000;

    setFormData({
      bookingNumber: `BKO-2026-${Math.floor(100 + Math.random() * 900)}`,
      bookingDate: new Date().toISOString().slice(0, 10),
      customerId: cust?.id || '',
      customerName: cust?.companyName || '',
      voyageId: vyg?.id || '',
      voyageNumber: vyg?.voyageNumber || '',
      cargoId: crg?.id || '',
      cargoName: crg?.name || '',
      quantity: qty,
      unit: (crg?.unit || 'TEU') as CargoUnit,
      originPortName: vyg?.originPortName || '',
      destinationPortName: vyg?.destinationPortName || '',
      totalPrice: qty * baseTariff,
      status: 'Confirmed',
      notes: 'Booking order cargo standar',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (bko: Booking) => {
    setEditingBooking(bko);
    setFormData({
      bookingNumber: bko.bookingNumber,
      bookingDate: bko.bookingDate,
      customerId: bko.customerId,
      customerName: bko.customerName,
      voyageId: bko.voyageId,
      voyageNumber: bko.voyageNumber,
      cargoId: bko.cargoId,
      cargoName: bko.cargoName,
      quantity: bko.quantity,
      unit: bko.unit,
      originPortName: bko.originPortName,
      destinationPortName: bko.destinationPortName,
      totalPrice: bko.totalPrice,
      status: bko.status,
      notes: bko.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleCargoOrQtyChange = (cargoId: string, quantity: number) => {
    const selectedCargo = cargos.find(c => c.id === cargoId);
    const baseTariff = selectedCargo ? selectedCargo.baseTariffPerUnit : 0;

    setFormData(prev => ({
      ...prev,
      cargoId,
      cargoName: selectedCargo ? selectedCargo.name : prev.cargoName,
      unit: selectedCargo ? selectedCargo.unit : prev.unit,
      quantity,
      totalPrice: quantity * baseTariff,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const targetId = editingBooking ? editingBooking.id : `bko-${Date.now()}`;

    const selectedCust = customers.find(c => c.id === formData.customerId);
    const selectedVyg = voyages.find(v => v.id === formData.voyageId);
    const selectedCrg = cargos.find(c => c.id === formData.cargoId);

    const newDoc: Booking = {
      id: targetId,
      ...formData,
      customerName: selectedCust ? selectedCust.companyName : formData.customerName,
      voyageNumber: selectedVyg ? selectedVyg.voyageNumber : formData.voyageNumber,
      cargoName: selectedCrg ? selectedCrg.name : formData.cargoName,
      originPortName: selectedVyg ? selectedVyg.originPortName : formData.originPortName,
      destinationPortName: selectedVyg ? selectedVyg.destinationPortName : formData.destinationPortName,
      createdAt: editingBooking ? editingBooking.createdAt : now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'bookings', targetId), newDoc);
      setIsModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, editingBooking ? OperationType.UPDATE : OperationType.CREATE, `bookings/${targetId}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'bookings', id));
      setDeleteConfirmId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `bookings/${id}`);
    }
  };

  const filteredBookings = bookings.filter(b => 
    b.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.voyageNumber.toLowerCase().includes(searchTerm.toLowerCase())
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
            <BookOpenCheck className="w-6 h-6 text-blue-600" />
            <span>Transaksi Booking & Order Pengiriman (Bookings)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Order pengiriman barang pelanggan, pilihan rute voyage, reservasi volume, dan total ongkos angkut.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Booking Order Baru</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cari nomor booking, nama pelanggan, atau nomor voyage..."
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
                <th className="py-3.5 px-4">No. Booking & Tanggal</th>
                <th className="py-3.5 px-4">Pelanggan (Shipper)</th>
                <th className="py-3.5 px-4">Jadwal Voyage</th>
                <th className="py-3.5 px-4">Muatan & Volume</th>
                <th className="py-3.5 px-4">Total Biaya (Freight)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Memuat data booking...</td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Tidak ada order booking ditemukan.</td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-blue-600">{b.bookingNumber}</div>
                      <div className="text-[11px] text-slate-400">{b.bookingDate}</div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {b.customerName}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{b.voyageNumber}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[160px]">{b.originPortName} &rarr; {b.destinationPortName}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{b.cargoName}</div>
                      <div className="text-[11px] font-mono font-bold text-blue-700">{b.quantity} {b.unit}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {formatIDR(b.totalPrice)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        b.status === 'On Board'
                          ? 'bg-blue-100 text-blue-800'
                          : b.status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'Confirmed'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {b.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(b)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(b.id)}
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingBooking ? 'Edit Order Booking' : 'Buat Order Booking Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">No. Booking</label>
                  <input
                    type="text"
                    required
                    value={formData.bookingNumber}
                    onChange={(e) => setFormData({ ...formData, bookingNumber: e.target.value })}
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
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Jadwal Voyage Rute</label>
                <select
                  value={formData.voyageId}
                  onChange={(e) => setFormData({ ...formData, voyageId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {voyages.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.voyageNumber} - {v.vesselName} ({v.originPortName} &rarr; {v.destinationPortName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Jenis Muatan</label>
                  <select
                    value={formData.cargoId}
                    onChange={(e) => handleCargoOrQtyChange(e.target.value, formData.quantity)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {cargos.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Jumlah Volume ({formData.unit})</label>
                  <input
                    type="number"
                    required
                    value={formData.quantity}
                    onChange={(e) => handleCargoOrQtyChange(formData.cargoId, Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Total Biaya Freight (IDR)</label>
                  <input
                    type="number"
                    required
                    value={formData.totalPrice}
                    onChange={(e) => setFormData({ ...formData, totalPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Status Order</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as BookingStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="On Board">On Board</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/20">Simpan Booking</button>
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
            <h3 className="text-base font-bold text-slate-900">Hapus Booking?</h3>
            <p className="text-xs text-slate-500">Data booking order akan dihapus dari Firestore.</p>
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
