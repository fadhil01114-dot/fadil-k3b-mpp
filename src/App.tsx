import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

import { Dashboard } from './components/Dashboard';

// Master Data Managers
import { VesselsManager } from './components/master/VesselsManager';
import { PortsManager } from './components/master/PortsManager';
import { CargosManager } from './components/master/CargosManager';
import { CrewManager } from './components/master/CrewManager';
import { CustomersManager } from './components/master/CustomersManager';

// Transaction Managers
import { VoyagesManager } from './components/transactions/VoyagesManager';
import { BookingsManager } from './components/transactions/BookingsManager';
import { ManifestsManager } from './components/transactions/ManifestsManager';
import { InvoicesManager } from './components/transactions/InvoicesManager';

// Reports & AI
import { ReportsManager } from './components/reports/ReportsManager';
import { MaritimeAIAssistant } from './components/ai/MaritimeAIAssistant';

import { Anchor, Loader2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState<boolean>(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg mb-4 animate-bounce">
          <Anchor className="w-7 h-7" />
        </div>
        <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <span>Menghubungkan ke Real Firebase Database...</span>
        </div>
      </div>
    );
  }

  // Requirement 3: Login form as default view when unauthenticated
  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
      />

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Left Drawer Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
        />

        {/* Main Tab Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              setActiveTab={setActiveTab}
              onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
            />
          )}

          {/* Master Data Views */}
          {activeTab === 'vessels' && <VesselsManager />}
          {activeTab === 'ports' && <PortsManager />}
          {activeTab === 'cargos' && <CargosManager />}
          {activeTab === 'crew' && <CrewManager />}
          {activeTab === 'customers' && <CustomersManager />}

          {/* Transaksi Data Views */}
          {activeTab === 'voyages' && <VoyagesManager />}
          {activeTab === 'bookings' && <BookingsManager />}
          {activeTab === 'manifests' && <ManifestsManager />}
          {activeTab === 'invoices' && <InvoicesManager />}

          {/* Laporan View */}
          {activeTab === 'reports' && <ReportsManager />}
        </main>
      </div>

      {/* AI Assistant Modal */}
      <MaritimeAIAssistant
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
