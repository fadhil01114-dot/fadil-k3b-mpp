import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Voyage, VoyageStatus, Vessel, Port } from '../../types/maritime';
import { Navigation, Plus, Search, Edit, Trash2, X, ShieldAlert, ArrowRight } from 'lucide-react';

export const VoyagesManager: React.FC = () => {
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoyage, setEditingVoyage] = useState<Voyage | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    voyageNumber: '',
    vesselId: '',
    vesselName: '',
    originPortId: '',
    originPortName: '',
    destinationPortId: '',
    destinationPortName: '',
    etd: '',
    eta: '',
    captainName: '',
    status: 'Scheduled' as VoyageStatus,
    notes: '',
  });

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    const unsubVoyages = onSnapshot(collection(db, 'voyages'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Voyage));
      setVoyages(data);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'voyages'));
    unsubs.push(unsubVoyages);

    const unsubVessels = onSnapshot(collection(db, 'vessels'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vessel));
      setVessels(data);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'vessels'));
    unsubs.push(unsubVessels);

    const unsubPorts = onSnapshot(collection(db, 'ports'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Port));
      setPorts(data);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'ports'));
    unsubs.push(unsubPorts);

    return () => unsubs.forEach(fn => fn());
  }, []);

  const handleOpenAddModal = () => {
    setEditingVoyage(null);
    const defaultVessel = vessels[0];
    const defaultPort1 = ports[0];
    const defaultPort2 = ports[1] || ports[0];

    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 3);

    setFormData({
      voyageNumber: `VYG-2026-${Math.floor(100 + Math.random() * 900)}`,
      vesselId: defaultVessel?.id || '',
      vesselName: defaultVessel?.name || '',
      originPortId: defaultPort1?.id || '',
      originPortName: defaultPort1 ? `${defaultPort1.name} (${defaultPort1.city})` : '',
      destinationPortId: defaultPort2?.id || '',
      destinationPortName: defaultPort2 ? `${defaultPort2.name} (${defaultPort2.city})` : '',
      etd: today.toISOString().slice(0, 16),
      eta: nextWeek.toISOString().slice(0, 16),
      captainName: 'Capt. Bambang Soetjipto, M.Mar',
      status: 'Scheduled',
      notes: 'Rute pengiriman domestik teratur',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (vyg: Voyage) => {
    setEditingVoyage(vyg);
    setFormData({
      voyageNumber: vyg.voyageNumber,
      vesselId: vyg.vesselId,
      vesselName: vyg.vesselName,
      originPortId: vyg.originPortId,
      originPortName: vyg.originPortName,
      destinationPortId: vyg.destinationPortId,
      destinationPortName: vyg.destinationPortName,
      etd: vyg.etd ? vyg.etd.slice(0, 16) : '',
      eta: vyg.eta ? vyg.eta.slice(0, 16) : '',
      captainName: vyg.captainName,
      status: vyg.status,
      notes: vyg.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const targetId = editingVoyage ? editingVoyage.id : `vyg-${Date.now()}`;

    const selectedVessel = vessels.find(v => v.id === formData.vesselId);
    const selectedOrigin = ports.find(p => p.id === formData.originPortId);
    const selectedDest = ports.find(p => p.id === formData.destinationPortId);

    const newDoc: Voyage = {
      id: targetId,
      ...formData,
      vesselName: selectedVessel ? selectedVessel.name : formData.vesselName,
      originPortName: selectedOrigin ? `${selectedOrigin.name} (${selectedOrigin.city})` : formData.originPortName,
      destinationPortName: selectedDest ? `${selectedDest.name} (${selectedDest.city})` : formData.destinationPortName,
      createdAt: editingVoyage ? editingVoyage.createdAt : now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'voyages', targetId), newDoc);
      setIsModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, editingVoyage ? OperationType.UPDATE : OperationType.CREATE, `voyages/${targetId}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'voyages', id));
      setDeleteConfirmId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `voyages/${id}`);
    }
  };

  const filteredVoyages = voyages.filter(v => 
    v.voyageNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.vesselName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.captainName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Navigation className="w-6 h-6 text-blue-600" />
            <span>Transaksi Jadwal & Rute Pelayaran (Voyages)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Penjadwalan rute pelayaran kapal, pelabuhan asal/tujuan, perkiraan berangkat (ETD) & tiba (ETA).
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Jadwal Voyage Baru</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cari nomor voyage, nama kapal, atau nakhoda..."
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
                <th className="py-3.5 px-4">No. Voyage & Kapal</th>
                <th className="py-3.5 px-4">Rute (Asal &rarr; Tujuan)</th>
                <th className="py-3.5 px-4">Jadwal ETD & ETA</th>
                <th className="py-3.5 px-4">Nakhoda</th>
                <th className="py-3.5 px-4">Status Voyage</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Memuat data jadwal voyage...</td>
                </tr>
              ) : filteredVoyages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Tidak ada jadwal voyage ditemukan.</td>
                </tr>
              ) : (
                filteredVoyages.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block">
                        {v.voyageNumber}
                      </div>
                      <div className="font-bold text-slate-900 mt-1">{v.vesselName}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <span className="truncate max-w-[150px]">{v.originPortName}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[150px]">{v.destinationPortName}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[11px] font-mono">
                      <div><span className="text-slate-400">ETD:</span> {new Date(v.etd).toLocaleString('id-ID')}</div>
                      <div><span className="text-slate-400">ETA:</span> {new Date(v.eta).toLocaleString('id-ID')}</div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {v.captainName}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        v.status === 'In Transit'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : v.status === 'Loading'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : v.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {v.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(v)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(v.id)}
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
                {editingVoyage ? 'Edit Jadwal Voyage' : 'Buat Jadwal Voyage Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nomor Voyage</label>
                  <input
                    type="text"
                    required
                    value={formData.voyageNumber}
                    onChange={(e) => setFormData({ ...formData, voyageNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Kapal Armada</label>
                  <select
                    value={formData.vesselId}
                    onChange={(e) => setFormData({ ...formData, vesselId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {vessels.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Pelabuhan Asal</label>
                  <select
                    value={formData.originPortId}
                    onChange={(e) => setFormData({ ...formData, originPortId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ports.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Pelabuhan Tujuan</label>
                  <select
                    value={formData.destinationPortId}
                    onChange={(e) => setFormData({ ...formData, destinationPortId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ports.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Jadwal ETD (Keberangkatan)</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.etd}
                    onChange={(e) => setFormData({ ...formData, etd: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Jadwal ETA (Kedatangan)</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.eta}
                    onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nakhoda / Captain</label>
                  <input
                    type="text"
                    required
                    value={formData.captainName}
                    onChange={(e) => setFormData({ ...formData, captainName: e.target.value })}
                    placeholder="Capt. Bambang Soetjipto"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Status Voyage</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as VoyageStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Loading">Loading</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Unloading">Unloading</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/20">Simpan Voyage</button>
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
            <h3 className="text-base font-bold text-slate-900">Hapus Voyage?</h3>
            <p className="text-xs text-slate-500">Jadwal voyage akan dihapus dari Firestore.</p>
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
