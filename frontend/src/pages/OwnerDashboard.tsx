import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Asset, AssetStatus } from '../types';
import { AssetCard } from '../components/AssetCard';
import { CreateAssetModal } from '../components/CreateAssetModal';
import { AssignNomineeModal } from '../components/AssignNomineeModal';
import { Shield, Plus, RefreshCw, Lock, Unlock, Users, Clock, AlertCircle, Sparkles } from 'lucide-react';

export const OwnerDashboard: React.FC<{ onNavigateToClaim: (assetId: number) => void }> = ({ onNavigateToClaim }) => {
  const { account, fetchOwnerAssets, registerVault } = useWeb3();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedAssetForNominee, setSelectedAssetForNominee] = useState<Asset | null>(null);
  const [filter, setFilter] = useState<'all' | 'locked' | 'pending' | 'unlocked'>('all');

  const loadAssets = useCallback(async () => {
    if (!account) return;
    setIsLoading(true);
    try {
      const data = await fetchOwnerAssets(account);
      setAssets(data);
    } catch (err) {
      console.error('Failed to load owner assets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [account, fetchOwnerAssets]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const handleRegisterVault = async () => {
    try {
      setIsRegistering(true);
      await registerVault();
      alert('Vault registered successfully on-chain!');
    } catch (err: any) {
      console.error('Vault registration error:', err);
      alert(err.message || 'Failed to register vault');
    } finally {
      setIsRegistering(false);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    if (filter === 'locked') return asset.status === AssetStatus.Locked;
    if (filter === 'pending') return asset.status === AssetStatus.ClaimPending;
    if (filter === 'unlocked') return asset.status === AssetStatus.Unlocked;
    return true;
  });

  const totalLocked = assets.filter((a) => a.status === AssetStatus.Locked).length;
  const totalNominated = assets.filter((a) => a.nominee && a.nominee !== '0x0000000000000000000000000000000000000000').length;
  const totalClaimsPending = assets.filter((a) => a.status === AssetStatus.ClaimPending).length;
  const totalUnlocked = assets.filter((a) => a.status === AssetStatus.Unlocked).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Shield className="w-3.5 h-3.5" />
            <span>Encrypted Sovereign Vault</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Vault Owner Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Deposit confidential digital assets, assign verifiable heirs, and manage autonomous on-chain inheritance conditions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={handleRegisterVault}
            disabled={isRegistering || !account}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-xs font-semibold border border-white/10 transition-all flex items-center space-x-2"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isRegistering ? 'Registering...' : 'Register Vault'}</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!account}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all flex items-center space-x-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Deposit Asset</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Total Assets</span>
            <Lock className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{assets.length}</p>
          <span className="text-[11px] text-slate-500">{totalLocked} currently sealed</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Designated Nominees</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{totalNominated}</p>
          <span className="text-[11px] text-slate-500">Heirs assigned to assets</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Claims Under Review</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 font-mono">{totalClaimsPending}</p>
          <span className="text-[11px] text-slate-500">Awaiting unlock execution</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Inherited & Unlocked</span>
            <Unlock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{totalUnlocked}</p>
          <span className="text-[11px] text-slate-500">Transferred to heirs</span>
        </div>
      </div>

      {/* Asset Explorer Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Vault Inventory</h2>
            <button
              onClick={loadAssets}
              disabled={isLoading}
              title="Refresh inventory"
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-900 border border-white/5 self-start text-xs">
            {(['all', 'locked', 'pending', 'unlocked'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                  filter === tab
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Assets Grid or Empty State */}
        {!account ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-white/5 text-center flex flex-col items-center justify-center">
            <AlertCircle className="w-12 h-12 text-slate-500 mb-3" />
            <h3 className="text-base font-semibold text-white">Wallet Not Connected</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Please connect your Ethereum wallet in the navigation bar above to view your secured assets.
            </p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="p-16 rounded-3xl bg-slate-900/30 border border-white/5 text-center flex flex-col items-center justify-center">
            <Lock className="w-12 h-12 text-cyan-500/40 mb-3" />
            <h3 className="text-base font-semibold text-white">No Assets Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1 mb-5">
              You haven't deposited any digital assets under this filter yet.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Deposit First Asset</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                userRole="owner"
                onAssignNominee={(item) => setSelectedAssetForNominee(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateAssetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadAssets}
      />

      <AssignNomineeModal
        asset={selectedAssetForNominee}
        isOpen={!!selectedAssetForNominee}
        onClose={() => setSelectedAssetForNominee(null)}
        onSuccess={loadAssets}
      />
    </div>
  );
};
