import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Crew, CrewRole, Vessel } from '../../types/maritime';
import { Users, Plus, Search, Edit, Trash2, X, ShieldAlert } from 'lucide-react';

export const CrewManager: React.FC = () => {
  const [crewList, setCrewList] = useState<Crew[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCrew, setEditingCrew] = useState<Crew | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nik: '',
    name: '',
    role: 'Kapten / Nakhoda' as CrewRole,
    assignedVesselId: '',
    assignedVesselName: '',
    certification: 'ANT-I & GMDSS',
    phone: '',
    email: '',
    status: 'Aktif' as 'Aktif' | 'Cuti' | 'Sakit' | 'Nonaktif',
  });

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    const unsubCrew = onSnapshot(collection(db, 'crew'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Crew));
      setCrewList(data);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'crew'));
    unsubs.push(unsubCrew);

    const unsubVessels = onSnapshot(collection(db, 'vessels'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vessel));
      setVessels(data);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'vessels'));
    unsubs.push(unsubVessels);

    return () => unsubs.forEach(fn => fn());
  }, []);

  const handleOpenAddModal = () => {
    setEditingCrew(null);
    setFormData({
      nik: `CRW-${Math.floor(10000000 + Math.random() * 89999999)}`,
      name: '',
      role: 'Kapten / Nakhoda',
      assignedVesselId: vessels[0]?.id || '',
      assignedVesselName: vessels[0]?.name || '',
      certification: 'ANT-I & GMDSS Certification',
      phone: '0812-3456-7890',
      email: '',
      status: 'Aktif',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (crew: Crew) => {
    setEditingCrew(crew);
    setFormData({
      nik: crew.nik,
      name: crew.name,
      role: crew.role,
      assignedVesselId: crew.assignedVesselId || '',
      assignedVesselName: crew.assignedVesselName || '',
      certification: crew.certification,
      phone: crew.phone,
      email: crew.email,
      status: crew.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const targetId = editingCrew ? editingCrew.id : `crew-${Date.now()}`;

    const selectedVessel = vessels.find(v => v.id === formData.assignedVesselId);

    const newDoc: Crew = {
      id: targetId,
      ...formData,
      assignedVesselName: selectedVessel ? selectedVessel.name : formData.assignedVesselName,
      createdAt: editingCrew ? editingCrew.createdAt : now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'crew', targetId), newDoc);
      setIsModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, editingCrew ? OperationType.UPDATE : OperationType.CREATE, `crew/${targetId}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'crew', id));
      setDeleteConfirmId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `crew/${id}`);
    }
  };

  const filteredCrew = crewList.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nik.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Master Data Awak Kapal (Crew & Officers)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Data Perwira & ABK, penugasan kapal, sertifikasi maritim (ANT/ATT/BST), dan kontak darurat.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Crew Baru</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cari nama awak kapal, NIK, atau jabatan perwira..."
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
                <th className="py-3.5 px-4">NIK & Nama Lengkap</th>
                <th className="py-3.5 px-4">Jabatan Perwira / ABK</th>
                <th className="py-3.5 px-4">Kapal Assigned</th>
                <th className="py-3.5 px-4">Sertifikasi</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Memuat data awak kapal...</td>
                </tr>
              ) : filteredCrew.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Tidak ada data crew ditemukan.</td>
                </tr>
              ) : (
                filteredCrew.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{c.nik}</div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {c.role}
                    </td>

                    <td className="py-3.5 px-4 text-blue-700 font-semibold">
                      {c.assignedVesselName || 'Belum Assigned'}
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-slate-600">
                      {c.certification}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        c.status === 'Aktif'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'Cuti'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(c.id)}
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
                {editingCrew ? 'Edit Data Crew' : 'Tambah Crew Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Capt. Bambang Soetjipto"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Jabatan Perwira</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as CrewRole })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Kapten / Nakhoda">Kapten / Nakhoda</option>
                    <option value="Mualim I">Mualim I</option>
                    <option value="Mualim II">Mualim II</option>
                    <option value="KKM / Chief Engineer">KKM / Chief Engineer</option>
                    <option value="Masinis II">Masinis II</option>
                    <option value="Kelasi / AB">Kelasi / AB</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Cuti">Cuti</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Kapal Penugasan</label>
                <select
                  value={formData.assignedVesselId}
                  onChange={(e) => setFormData({ ...formData, assignedVesselId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Belum Assigned --</option>
                  {vessels.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.vesselType})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Sertifikasi Maritim</label>
                <input
                  type="text"
                  required
                  value={formData.certification}
                  onChange={(e) => setFormData({ ...formData, certification: e.target.value })}
                  placeholder="ANT-I & GMDSS Certification"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/20">Simpan Data Crew</button>
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
            <h3 className="text-base font-bold text-slate-900">Hapus Data Crew?</h3>
            <p className="text-xs text-slate-500">Data awak kapal akan dihapus dari Firestore.</p>
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
