import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Cargo, CargoCategory, CargoUnit } from '../../types/maritime';
import { Package, Plus, Search, Edit, Trash2, X, ShieldAlert } from 'lucide-react';

export const CargosManager: React.FC = () => {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Container 20ft' as CargoCategory,
    unit: 'TEU' as CargoUnit,
    baseTariffPerUnit: 15000000,
    description: '',
    hazardClass: '',
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'cargos'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cargo));
      setCargos(data);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'cargos'));

    return () => unsubscribe();
  }, []);

  const handleOpenAddModal = () => {
    setEditingCargo(null);
    setFormData({
      code: `CRG-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      category: 'Container 20ft',
      unit: 'TEU',
      baseTariffPerUnit: 15000000,
      description: 'Muatan standar pengiriman antarpulau',
      hazardClass: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cargo: Cargo) => {
    setEditingCargo(cargo);
    setFormData({
      code: cargo.code,
      name: cargo.name,
      category: cargo.category,
      unit: cargo.unit,
      baseTariffPerUnit: cargo.baseTariffPerUnit,
      description: cargo.description || '',
      hazardClass: cargo.hazardClass || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const targetId = editingCargo ? editingCargo.id : `cargo-${Date.now()}`;

    const newDoc: Cargo = {
      id: targetId,
      ...formData,
      createdAt: editingCargo ? editingCargo.createdAt : now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'cargos', targetId), newDoc);
      setIsModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, editingCargo ? OperationType.UPDATE : OperationType.CREATE, `cargos/${targetId}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'cargos', id));
      setDeleteConfirmId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `cargos/${id}`);
    }
  };

  const filteredCargos = cargos.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
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
            <Package className="w-6 h-6 text-blue-600" />
            <span>Master Data Muatan & Tarif (Cargo & Rates)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kategori muatan barang, unit pengukuran, dan tarif dasar ongkos angkut (Freight Rate).
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Jenis Muatan</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cari jenis muatan, kode, atau kategori barang..."
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
                <th className="py-3.5 px-4">Kode & Nama Muatan</th>
                <th className="py-3.5 px-4">Kategori Barang</th>
                <th className="py-3.5 px-4">Satuan Unit</th>
                <th className="py-3.5 px-4">Tarif Dasar per Satuan</th>
                <th className="py-3.5 px-4">Sertifikasi & Keterangan</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Memuat data muatan...</td>
                </tr>
              ) : filteredCargos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Tidak ada muatan ditemukan.</td>
                </tr>
              ) : (
                filteredCargos.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-[11px] font-mono text-blue-600">{c.code}</div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {c.category}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {c.unit}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {formatIDR(c.baseTariffPerUnit)} <span className="text-[10px] text-slate-400">/ {c.unit}</span>
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-slate-500">
                      <div>{c.description || '-'}</div>
                      {c.hazardClass && <span className="text-rose-600 font-bold">{c.hazardClass}</span>}
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingCargo ? 'Edit Data Muatan' : 'Tambah Muatan Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nama Muatan</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Petikemas Standard 20 Feet"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as CargoCategory })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Container 20ft">Container 20ft</option>
                    <option value="Container 40ft">Container 40ft</option>
                    <option value="Liquid Bulk">Liquid Bulk</option>
                    <option value="Dry Bulk">Dry Bulk</option>
                    <option value="General Cargo">General Cargo</option>
                    <option value="Dangerous Goods">Dangerous Goods</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Satuan Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as CargoUnit })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TEU">TEU</option>
                    <option value="Ton">Ton</option>
                    <option value="KL">KL (Kilo Liter)</option>
                    <option value="M3">M3 (Meter Kubik)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Tarif Dasar per Satuan (IDR)</label>
                <input
                  type="number"
                  required
                  value={formData.baseTariffPerUnit}
                  onChange={(e) => setFormData({ ...formData, baseTariffPerUnit: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Deskripsi</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/20"
                >
                  Simpan Muatan
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
            <h3 className="text-base font-bold text-slate-900">Hapus Data Muatan?</h3>
            <p className="text-xs text-slate-500">Data muatan akan dihapus dari Firestore.</p>
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
