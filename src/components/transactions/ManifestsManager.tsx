import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Manifest, ManifestStatus, Voyage } from '../../types/maritime';
import { analyzeCargoManifestAI } from '../../services/geminiService';
import { FileSpreadsheet, Plus, Search, Edit, Trash2, X, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';

export const ManifestsManager: React.FC = () => {
  const [manifests, setManifests] = useState<Manifest[]>([]);
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // AI Modal Analysis State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState('');
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingManifest, setEditingManifest] = useState<Manifest | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    manifestNumber: '',
    voyageId: '',
    voyageNumber: '',
    containerOrSealNo: '',
    shipperName: '',
    consigneeName: '',
    description: '',
    weightKg: 18000,
    volumeM3: 35,
    bayLocation: 'Bay 02 / Row 01 / Tier 82',
    status: 'In Transit' as ManifestStatus,
  });

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    const unsubManifests = onSnapshot(collection(db, 'manifests'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Manifest));
      setManifests(data);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'manifests'));
    unsubs.push(unsubManifests);

    const unsubVoyages = onSnapshot(collection(db, 'voyages'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Voyage));
      setVoyages(data);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'voyages'));
    unsubs.push(unsubVoyages);

    return () => unsubs.forEach(fn => fn());
  }, []);

  const handleOpenAddModal = () => {
    setEditingManifest(null);
    const vyg = voyages[0];

    setFormData({
      manifestNumber: `MNF-2026-${Math.floor(100 + Math.random() * 900)}`,
      voyageId: vyg?.id || '',
      voyageNumber: vyg?.voyageNumber || '',
      containerOrSealNo: `SEAL-${Math.floor(100000 + Math.random() * 899999)}`,
      shipperName: 'PT Samudra Logistik Indonesia',
      consigneeName: 'PT Distributor Nusantara Jaya',
      description: 'Peralatan Industri & Komponen Manufaktur',
      weightKg: 20000,
      volumeM3: 38,
      bayLocation: 'Bay 06 / Row 03 / Tier 84',
      status: 'In Transit',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (mnf: Manifest) => {
    setEditingManifest(mnf);
    setFormData({
      manifestNumber: mnf.manifestNumber,
      voyageId: mnf.voyageId,
      voyageNumber: mnf.voyageNumber,
      containerOrSealNo: mnf.containerOrSealNo,
      shipperName: mnf.shipperName,
      consigneeName: mnf.consigneeName,
      description: mnf.description,
      weightKg: mnf.weightKg,
      volumeM3: mnf.volumeM3,
      bayLocation: mnf.bayLocation,
      status: mnf.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const targetId = editingManifest ? editingManifest.id : `mnf-${Date.now()}`;

    const selectedVyg = voyages.find(v => v.id === formData.voyageId);

    const newDoc: Manifest = {
      id: targetId,
      ...formData,
      voyageNumber: selectedVyg ? selectedVyg.voyageNumber : formData.voyageNumber,
      createdAt: editingManifest ? editingManifest.createdAt : now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'manifests', targetId), newDoc);
      setIsModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, editingManifest ? OperationType.UPDATE : OperationType.CREATE, `manifests/${targetId}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'manifests', id));
      setDeleteConfirmId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `manifests/${id}`);
    }
  };

  const handleRunAiAnalysis = async () => {
    setIsAiModalOpen(true);
    setIsAnalyzingAi(true);
    setAiAnalysisResult('');

    const textPayload = manifests.map(m => 
      `- Item: ${m.containerOrSealNo} | Shipper: ${m.shipperName} | Consignee: ${m.consigneeName} | Berat: ${m.weightKg}kg | Bay Location: ${m.bayLocation} | Deskripsi: ${m.description}`
    ).join('\n');

    const result = await analyzeCargoManifestAI(textPayload);
    setAiAnalysisResult(result);
    setIsAnalyzingAi(false);
  };

  const filteredManifests = manifests.filter(m => 
    m.manifestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.containerOrSealNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.shipperName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.consigneeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            <span>Transaksi Manifest Cargo (Shipment Manifest)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Rincian detail barang muatan per container/seal, posisi bay lokasi kapal, dan pihak shipper/consignee.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunAiAnalysis}
            className="px-3.5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4 text-cyan-200" />
            <span>Analisis AI Manifest</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Item Manifest</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cari nomor manifest, nomor container/seal, shipper, atau consignee..."
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
                <th className="py-3.5 px-4">No. Manifest & Container/Seal</th>
                <th className="py-3.5 px-4">Shipper & Consignee</th>
                <th className="py-3.5 px-4">Deskripsi Barang</th>
                <th className="py-3.5 px-4">Berat & Volume</th>
                <th className="py-3.5 px-4">Posisi Bay Kapal</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Memuat data manifest cargo...</td>
                </tr>
              ) : filteredManifests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Tidak ada item manifest ditemukan.</td>
                </tr>
              ) : (
                filteredManifests.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-blue-600">{m.manifestNumber}</div>
                      <div className="text-[11px] font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-0.5">{m.containerOrSealNo}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{m.shipperName}</div>
                      <div className="text-[11px] text-slate-500">&rarr; {m.consigneeName}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-800">
                      {m.description}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <div>{m.weightKg?.toLocaleString('id-ID')} Kg</div>
                      <div className="text-[11px] text-slate-400">{m.volumeM3} M3</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      {m.bayLocation}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        m.status === 'In Transit'
                          ? 'bg-blue-100 text-blue-800'
                          : m.status === 'Discharged'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {m.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(m)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(m.id)}
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

      {/* AI Manifest Analysis Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                <h3 className="text-base font-bold text-slate-900">Analisis Operasional Manifest AI</h3>
              </div>
              <button onClick={() => setIsAiModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isAnalyzingAi ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500 text-xs font-semibold">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <span>Menganalisis keseimbangan beban & prioritas pembongkaran muatan...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                  {aiAnalysisResult}
                </div>
                <div className="text-right">
                  <button
                    onClick={() => setIsAiModalOpen(false)}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs"
                  >
                    Tutup Hasil
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingManifest ? 'Edit Item Manifest' : 'Tambah Item Manifest Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">No. Manifest</label>
                  <input
                    type="text"
                    required
                    value={formData.manifestNumber}
                    onChange={(e) => setFormData({ ...formData, manifestNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">No. Container / Seal</label>
                  <input
                    type="text"
                    required
                    value={formData.containerOrSealNo}
                    onChange={(e) => setFormData({ ...formData, containerOrSealNo: e.target.value })}
                    placeholder="TGHU-209182 / SEAL-88120"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Jadwal Voyage</label>
                <select
                  value={formData.voyageId}
                  onChange={(e) => setFormData({ ...formData, voyageId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {voyages.map(v => (
                    <option key={v.id} value={v.id}>{v.voyageNumber} - {v.vesselName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nama Shipper (Pengirim)</label>
                  <input
                    type="text"
                    required
                    value={formData.shipperName}
                    onChange={(e) => setFormData({ ...formData, shipperName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nama Consignee (Penerima)</label>
                  <input
                    type="text"
                    required
                    value={formData.consigneeName}
                    onChange={(e) => setFormData({ ...formData, consigneeName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Deskripsi Barang</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Berat (Kg)</label>
                  <input
                    type="number"
                    required
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Volume (M3)</label>
                  <input
                    type="number"
                    required
                    value={formData.volumeM3}
                    onChange={(e) => setFormData({ ...formData, volumeM3: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Bay Location</label>
                  <input
                    type="text"
                    required
                    value={formData.bayLocation}
                    onChange={(e) => setFormData({ ...formData, bayLocation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/20">Simpan Manifest</button>
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
            <h3 className="text-base font-bold text-slate-900">Hapus Item Manifest?</h3>
            <p className="text-xs text-slate-500">Item manifest akan dihapus dari Firestore.</p>
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
