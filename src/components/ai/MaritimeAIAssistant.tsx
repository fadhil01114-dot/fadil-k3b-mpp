import React, { useState } from 'react';
import { estimateRouteAndFuelAI } from '../../services/geminiService';
import { Sparkles, X, Ship, Anchor, Compass, Loader2, Zap, AlertCircle } from 'lucide-react';

interface MaritimeAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MaritimeAIAssistant: React.FC<MaritimeAIAssistantProps> = ({ isOpen, onClose }) => {
  const [vesselName, setVesselName] = useState('MV Samudra Nusantara');
  const [vesselType, setVesselType] = useState('Container Ship 2,500 TEU');
  const [originPort, setOriginPort] = useState('Pelabuhan Tanjung Priok (Jakarta)');
  const [destinationPort, setDestinationPort] = useState('Pelabuhan Tanjung Perak (Surabaya)');
  const [cargoWeightTon, setCargoWeightTon] = useState(15000);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    estimatedDistanceNauticalMiles: number;
    estimatedHours: number;
    estimatedFuelConsumpionLiters: number;
    estimatedFuelCostIDR: number;
    weatherRecommendation: string;
    aiInsights: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleRunEstimation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const res = await estimateRouteAndFuelAI(
      vesselName,
      vesselType,
      originPort,
      destinationPort,
      cargoWeightTon
    );

    setResult(res);
    setLoading(false);
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">AI Asisten Optimasi Rute & BBM Pelayaran</h2>
              <p className="text-xs text-slate-500">Estimasi cerdas jarak mil laut, durasi, dan konsumsi bahan bakar kapal via Gemini AI</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleRunEstimation} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nama Kapal</label>
              <input
                type="text"
                required
                value={vesselName}
                onChange={(e) => setVesselName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Tipe Kapal</label>
              <input
                type="text"
                required
                value={vesselType}
                onChange={(e) => setVesselType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Pelabuhan Asal</label>
              <input
                type="text"
                required
                value={originPort}
                onChange={(e) => setOriginPort(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Pelabuhan Tujuan</label>
              <input
                type="text"
                required
                value={destinationPort}
                onChange={(e) => setDestinationPort(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Berat Muatan Estimated (Ton)</label>
            <input
              type="number"
              required
              value={cargoWeightTon}
              onChange={(e) => setCargoWeightTon(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Kalkulasi Rute AI Sedang Berjalan...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-cyan-200" />
                <span>Jalankan Kalkulasi Optimasi AI</span>
              </>
            )}
          </button>
        </form>

        {/* AI Result View */}
        {result && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-white space-y-4 animate-fadeIn">
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4" />
              <span>HASIL ESTIMASI GEMINI AI MARITIME</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                <div className="text-[10px] text-slate-300 uppercase">Jarak Laut</div>
                <div className="text-lg font-bold text-cyan-300 font-mono mt-0.5">{result.estimatedDistanceNauticalMiles} <span className="text-xs">NM</span></div>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                <div className="text-[10px] text-slate-300 uppercase">Waktu Berlayar</div>
                <div className="text-lg font-bold text-cyan-300 font-mono mt-0.5">{result.estimatedHours} <span className="text-xs">Jam</span></div>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                <div className="text-[10px] text-slate-300 uppercase">Estimasi BBM</div>
                <div className="text-lg font-bold text-cyan-300 font-mono mt-0.5">{result.estimatedFuelConsumpionLiters?.toLocaleString('id-ID')} <span className="text-xs">Liter</span></div>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                <div className="text-[10px] text-slate-300 uppercase">Biaya BBM (IDR)</div>
                <div className="text-xs font-bold text-emerald-400 font-mono mt-1 truncate">{formatIDR(result.estimatedFuelCostIDR)}</div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-blue-900/50 border border-blue-400/20 text-slate-200">
                <span className="font-bold text-cyan-300 block mb-0.5">&bull; Prediksi Cuaca & Kecepatan:</span>
                {result.weatherRecommendation}
              </div>

              <div className="p-3 rounded-xl bg-blue-900/50 border border-blue-400/20 text-slate-200">
                <span className="font-bold text-cyan-300 block mb-0.5">&bull; Rekomendasi Efisiensi AI:</span>
                {result.aiInsights}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
