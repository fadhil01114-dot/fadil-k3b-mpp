import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Port } from '../../types/maritime';
import { Anchor, Plus, Search, Edit, Trash2, X, ShieldAlert } from 'lucide-react';

export const PortsManager: React.FC = () => {
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPort, setEditingPort] = useState<Port | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    city: '',
    province: '',
    country: 'Indonesia',
    dockType: 'Dermaga Petikemas & Multipurpose',
    draftDepthMeters: 12,
    berthFeePerDay: 25000000,
    status: 'Aktif' as 'Aktif' | 'Renovasi' | 'Penuh',
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'ports'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Port));
      setPorts(data);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'ports'));

    return () => unsubscribe();
  }, []);

  const handleOpenAddModal = () => {
    setEditingPort(null);
    setFormData({
      code: `IDPRT-${Math.floor(10 + Math.random() * 90)}`,
      name: '',
      city: '',
      province: 'DKI Jakarta',
      country: 'Indonesia',
      dockType: 'Dermaga Petikemas & Multipurpose',
      draftDepthMeters: 13,
      berthFeePerDay: 30000000,
      status: 'Aktif',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (port: Port) => {
    setEditingPort(port);
    setFormData({
      code: port.code,
      name: port.name,
      city: port.city,
      province: port.province,
      country: port.country,
      dockType: port.dockType,
      draftDepthMeters: port.draftDepthMeters,
      berthFeePerDay: port.berthFeePerDay,
      status: port.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const targetId = editingPort ? editingPort.id : `port-${Date.now()}`;

    const newDoc: Port = {
      id: targetId,
      ...formData,
      createdAt: editingPort ? editingPort.createdAt : now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'ports', targetId), newDoc);
      setIsModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, editingPort ? OperationType.UPDATE : OperationType.CREATE, `ports/${targetId}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'ports', id));
      setDeleteConfirmId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `ports/${id}`);
    }
  };

  const filteredPorts = ports.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.city.toLowerCase().includes(searchTerm.toLowerCase())
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
            <Anchor className="w-6 h-6 text-blue-600" />
            <span>Master Data Pelabuhan (Ports)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Data pelabuhan singgah, kedalaman draft, tipe dermaga, dan tarif tambat kapal.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pelabuhan Baru</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cari nama pelabuhan, kode lokasi, atau kota..."
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
                <th className="py-3.5 px-4">Kode & Nama Pelabuhan</th>
                <th className="py-3.5 px-4">Kota & Provinsi</th>
                <th className="py-3.5 px-4">Spesifikasi Dermaga</th>
                <th className="py-3.5 px-4">Tarif Tambat / Hari</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Memuat data pelabuhan...</td>
                </tr>
              ) : filteredPorts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Tidak ada data pelabuhan ditemukan.</td>
                </tr>
              ) : (
                filteredPorts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[11px] font-mono text-blue-600">{p.code}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>{p.city}</div>
                      <div className="text-[11px] text-slate-400">{p.province}, {p.country}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>{p.dockType}</div>
                      <div className="text-[11px] text-slate-500">Draft Kedalaman: {p.draftDepthMeters}m</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {formatIDR(p.berthFeePerDay)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        p.status === 'Aktif'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'Renovasi'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(p.id)}
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
                {editingPort ? 'Edit Data Pelabuhan' : 'Tambah Pelabuhan Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nama Pelabuhan</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Pelabuhan Tanjung Perak"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Kode Port</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="IDSUB"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Kota / Kabupaten</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Surabaya"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Provinsi</label>
                  <input
                    type="text"
                    required
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="Jawa Timur"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Draft Kedalaman (m)</label>
                  <input
                    type="number"
                    required
                    value={formData.draftDepthMeters}
                    onChange={(e) => setFormData({ ...formData, draftDepthMeters: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Tarif Tambat / Hari (IDR)</label>
                <input
                  type="number"
                  required
                  value={formData.berthFeePerDay}
                  onChange={(e) => setFormData({ ...formData, berthFeePerDay: Number(e.target.value) })}
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
                  Simpan Pelabuhan
                </button>
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
            <h3 className="text-base font-bold text-slate-900">Hapus Pelabuhan?</h3>
            <p className="text-xs text-slate-500">
              Data pelabuhan akan dihapus dari database Firestore.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 text-white font-semibold rounded-xl text-xs shadow-md shadow-rose-500/20"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
