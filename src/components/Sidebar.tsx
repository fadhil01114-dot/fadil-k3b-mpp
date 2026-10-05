import React from 'react';
import { 
  LayoutDashboard, 
  Ship, 
  Anchor, 
  Package, 
  Users, 
  Building2, 
  Navigation, 
  BookOpenCheck, 
  FileSpreadsheet, 
  Receipt, 
  FileBarChart2, 
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAIAssistant: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onOpenAIAssistant }) => {
  const navSections = [
    {
      title: 'UTAMA',
      items: [
        { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
      ]
    },
    {
      title: 'MASTER DATA',
      items: [
        { id: 'vessels', label: 'Data Kapal', icon: Ship },
        { id: 'ports', label: 'Data Pelabuhan', icon: Anchor },
        { id: 'cargos', label: 'Muatan & Tarif', icon: Package },
        { id: 'crew', label: 'Awak Kapal (Crew)', icon: Users },
        { id: 'customers', label: 'Data Pelanggan', icon: Building2 },
      ]
    },
    {
      title: 'TRANSAKSI DATA',
      items: [
        { id: 'voyages', label: 'Jadwal Pelayaran', icon: Navigation },
        { id: 'bookings', label: 'Booking & Order', icon: BookOpenCheck },
        { id: 'manifests', label: 'Manifest Cargo', icon: FileSpreadsheet },
        { id: 'invoices', label: 'Tagihan & Keuangan', icon: Receipt },
      ]
    },
    {
      title: 'LAPORAN & AI',
      items: [
        { id: 'reports', label: 'Laporan Resmi', icon: FileBarChart2 },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 shrink-0 hidden lg:flex flex-col justify-between h-[calc(100vh-61px)] sticky top-[61px] overflow-y-auto p-4">
      
      <div className="space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx}>
            <h3 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase px-3 mb-2">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* AI Assistant Banner at bottom of sidebar */}
      <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-white relative overflow-hidden">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold mb-1">
          <Sparkles className="w-4 h-4" />
          <span>MARITIME AI HELPER</span>
        </div>
        <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
          Hitung estimasi rute, bahan bakar (BBM), dan optimasi muatan otomatis.
        </p>
        <button
          onClick={onOpenAIAssistant}
          className="w-full py-2 px-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
        >
          <span>Buka Asisten AI</span>
        </button>
      </div>

    </aside>
  );
};
