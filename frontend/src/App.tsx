import React, { useState } from 'react';
import { Web3Provider, useWeb3 } from './context/Web3Context';
import { Navbar } from './components/Navbar';
import { OwnerDashboard } from './pages/OwnerDashboard';
import { NomineePortal } from './pages/NomineePortal';
import { ClaimWizard } from './pages/ClaimWizard';
import { NavTab } from './types';
import { Shield, Lock, ExternalLink, Github, Heart } from 'lucide-react';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [activeClaimAssetId, setActiveClaimAssetId] = useState<number | null>(null);
  const { contractAddress } = useWeb3();

  const handleNavigateToClaim = (assetId: number) => {
    setActiveClaimAssetId(assetId);
    setCurrentTab('claim');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Navbar */}
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'dashboard' && (
          <OwnerDashboard onNavigateToClaim={() => {}} />
        )}
        {currentTab === 'nominee' && (
          <NomineePortal onNavigateToClaim={() => {}} />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 bg-slate-950/80 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-cyan-500" />
            <span className="font-semibold text-slate-400">Legacy Vault Protocol</span>
            <span className="text-slate-600">|</span>
            <span>IPFS + Smart Contracts + AI Verification</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="font-mono text-[11px] text-slate-600 truncate max-w-xs sm:max-w-md">
              Contract: {contractAddress}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  );
}

export default App;
