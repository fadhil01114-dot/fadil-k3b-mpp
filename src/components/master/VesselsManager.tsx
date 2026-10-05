import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Vessel, VesselType, VesselStatus } from '../../types/maritime';
import { 
  Ship, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

export const VesselsManager: React.FC = () => {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVessel, setEditingVessel] = useState<Vessel | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    vesselType: VesselType;
    flag: string;
    imoNumber: string;
    capacityDwt: number;
    capacityTeu: number;
    yearBuilt: number;
    status: VesselStatus;
    imageUrl: string;
    lengthMeters: number;
    beamMeters: number;
  }>({
    name: '',
    code: '',
    vesselType: 'Container',
    flag: 'Indonesia',
    imoNumber: 'IMO 9900000',
    capacityDwt: 25000,
    capacityTeu: 1500,
    yearBuilt: 2022,
    status: 'Siap Muat',
    imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=800&q=80',
    lengthMeters: 180,
    beamMeters: 28,
  });

  useEffect(() => {
    // Realtime Firestore listener
    const unsubscribe = onSnapshot(collection(db, 'vessels'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vessel));
      setVessels(data);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'vessels'));

    return () => unsubscribe();
  }, []);

  const handleOpenAddModal = () => {
    setEditingVessel(null);
    setFormData({
      name: '',
      code: `VSL-${Math.floor(100 + Math.random() * 900)}`,
      vesselType: 'Container',
      flag: 'Indonesia',
      imoNumber: `IMO ${Math.floor(9000000 + Math.random() * 999999)}`,
      capacityDwt: 30000,
      capacityTeu: 2000,
      yearBuilt: 2023,
      status: 'Siap Muat',
      imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=800&q=80',
      lengthMeters: 190,
      beamMeters: 30,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (vessel: Vessel) => {
    setEditingVessel(vessel);
    setFormData({
      name: vessel.name,
      code: vessel.code,
      vesselType: vessel.vesselType,
      flag: vessel.flag,
      imoNumber: vessel.imoNumber,
      capacityDwt: vessel.capacityDwt,
      capacityTeu: vessel.capacityTeu,
      yearBuilt: vessel.yearBuilt,
      status: vessel.status,
      imageUrl: vessel.imageUrl || '',
      lengthMeters: vessel.lengthMeters,
      beamMeters: vessel.beamMeters,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const targetId = editingVessel ? editingVessel.id : `vessel-${Date.now()}`;

    const newDoc: Vessel = {
      id: targetId,
      ...formData,
      createdAt: editingVessel ? editingVessel.createdAt : now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'vessels', targetId), newDoc);
      setIsModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, editingVessel ? OperationType.UPDATE : OperationType.CREATE, `vessels/${targetId}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vessels', id));
      setDeleteConfirmId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `vessels/${id}`);
    }
  };

  const filteredVessels = vessels.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.imoNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || v.vesselType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Ship className="w-6 h-6 text-blue-600" />
            <span>Master Data Kapal (Vessels)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Data spesifikasi teknis, status operasional, dan kapasitas armada kapal persisten di Firestore.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kapal Baru</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama kapal, kode, atau nomor IMO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full sm:w-48 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">Semua Tipe Kapal</option>
          <option value="Container">Container</option>
          <option value="Tanker">Tanker</option>
          <option value="Bulk Carrier">Bulk Carrier</option>
          <option value="Tugboat & Barge">Tugboat & Barge</option>
          <option value="Ro-Ro / Passenger">Ro-Ro / Passenger</option>
        </select>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Kapal & Identitas</th>
                <th className="py-3.5 px-4">Tipe & Bendera</th>
                <th className="py-3.5 px-4">Kapasitas DWT / TEU</th>
                <th className="py-3.5 px-4">Dimensi (P x L)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Memuat data kapal dari Firestore...</td>
                </tr>
              ) : filteredVessels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Tidak ada data kapal yang ditemukan.</td>
                </tr>
              ) : (
                filteredVessels.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img src={v.imageUrl || 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=800&q=80'} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                        <div>
                          <div className="font-bold text-slate-900">{v.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{v.code} &bull; {v.imoNumber}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{v.vesselType}</div>
                      <div className="text-[11px] text-slate-400">{v.flag} ({v.yearBuilt})</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <div>{v.capacityDwt?.toLocaleString('id-ID')} DWT</div>
                      {v.capacityTeu > 0 && <div className="text-[11px] text-blue-600">{v.capacityTeu?.toLocaleString('id-ID')} TEU</div>}
                    </td>

                    <td className="py-3.5 px-4">
                      <span>{v.lengthMeters}m x {v.beamMeters}m</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        v.status === 'Berlayar'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : v.status === 'Siap Muat'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : v.status === 'Sandar/Dermaga'
                          ? 'bg-slate-200 text-slate-800 border border-slate-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {v.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(v)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Kapal"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(v.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Kapal"
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

      {/* Modal Form Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingVessel ? 'Edit Data Kapal' : 'Tambah Kapal Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nama Kapal</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. MV Samudra Jaya"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Kode Kapal</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="VSL-001"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Tipe Kapal</label>
                  <select
                    value={formData.vesselType}
                    onChange={(e) => setFormData({ ...formData, vesselType: e.target.value as VesselType })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Container">Container</option>
                    <option value="Tanker">Tanker</option>
                    <option value="Bulk Carrier">Bulk Carrier</option>
                    <option value="Tugboat & Barge">Tugboat & Barge</option>
                    <option value="Ro-Ro / Passenger">Ro-Ro / Passenger</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Status Operasional</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as VesselStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Berlayar">Berlayar</option>
                    <option value="Siap Muat">Siap Muat</option>
                    <option value="Sandar/Dermaga">Sandar/Dermaga</option>
                    <option value="Maintenance/Dok">Maintenance/Dok</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">IMO Number</label>
                  <input
                    type="text"
                    required
                    value={formData.imoNumber}
                    onChange={(e) => setFormData({ ...formData, imoNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">DWT (Ton)</label>
                  <input
                    type="number"
                    required
                    value={formData.capacityDwt}
                    onChange={(e) => setFormData({ ...formData, capacityDwt: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Kapasitas TEU</label>
                  <input
                    type="number"
                    value={formData.capacityTeu}
                    onChange={(e) => setFormData({ ...formData, capacityTeu: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">URL Foto / Gambar Kapal</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/20"
                >
                  Simpan Ke Firestore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Hapus Data Kapal?</h3>
            <p className="text-xs text-slate-500">
              Tindakan ini akan menghapus kapal dari database Firestore secara permanen.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-rose-500/20"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
