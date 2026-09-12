import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Asset, AssetStatus } from '../types';
import { AssetCard } from '../components/AssetCard';
import { Users, RefreshCw, UserCheck, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';

interface NomineePortalProps {
  onNavigateToClaim: (assetId: number) => void;
}

export const NomineePortal: React.FC<NomineePortalProps> = ({ onNavigateToClaim }) => {
  const { account, fetchNomineeAssets, acceptNomination } = useWeb3();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const loadAssets = useCallback(async () => {
    if (!account) return;
    setIsLoading(true);
    try {
      const data = await fetchNomineeAssets(account);
      setAssets(data);
    } catch (err) {
      console.error('Failed to load nominee assets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [account, fetchNomineeAssets]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const handleAccept = async (assetId: number) => {
    try {
      setActionLoadingId(assetId);
      await acceptNomination(assetId);
      await loadAssets();
    } catch (err: any) {
      console.error('Accept nomination error:', err);
      alert(err.message || 'Failed to accept nomination');
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingAcceptance = assets.filter((a) => !a.nomineeAccepted);
  const readyToClaim = assets.filter((a) => a.nomineeAccepted && a.status === AssetStatus.Locked);
  const unlockedAssets = assets.filter((a) => a.status === AssetStatus.Unlocked);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Users className="w-3.5 h-3.5" />
            <span>Beneficiary Inheritance Terminal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Nominee Portal
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review your designated inheritance rights, formally accept nominations on-chain, and initiate autonomous AI claim verification upon demise of the vault owner.
          </p>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Pending Acceptance</span>
            <UserCheck className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 font-mono">{pendingAcceptance.length}</p>
          <span className="text-[11px] text-slate-500">Requires on-chain signature</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Eligible for Claim</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-cyan-400 font-mono">{readyToClaim.length}</p>
          <span className="text-[11px] text-slate-500">Ready for AI death cert verification</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Unlocked / Inherited</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{unlockedAssets.length}</p>
          <span className="text-[11px] text-slate-500">Available to decrypt & download</span>
        </div>
      </div>

      {/* Asset List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Designated Vault Allocations</h2>
            <button
              onClick={loadAssets}
              disabled={isLoading}
              title="Refresh nominations"
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {!account ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-white/5 text-center flex flex-col items-center justify-center">
            <AlertCircle className="w-12 h-12 text-slate-500 mb-3" />
            <h3 className="text-base font-semibold text-white">Wallet Not Connected</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Please connect your Ethereum wallet to verify whether you have been assigned as an inheritance nominee.
            </p>
          </div>
        ) : assets.length === 0 ? (
          <div className="p-16 rounded-3xl bg-slate-900/30 border border-white/5 text-center flex flex-col items-center justify-center">
            <Users className="w-12 h-12 text-blue-500/40 mb-3" />
            <h3 className="text-base font-semibold text-white">No Nominations Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Your connected wallet address has not been assigned as a nominee for any active Legacy Vault assets.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                userRole="nominee"
                onAcceptNomination={handleAccept}
                onInitiateClaim={(id) => onNavigateToClaim(id)}
                isActionLoading={actionLoadingId === asset.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
