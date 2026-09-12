import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Asset } from '../types';
import { X, UserPlus, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { ethers } from 'ethers';

interface AssignNomineeModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignNomineeModal: React.FC<AssignNomineeModalProps> = ({ asset, isOpen, onClose, onSuccess }) => {
  const { assignNominee } = useWeb3();
  const [nomineeAddress, setNomineeAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ethers.isAddress(nomineeAddress.trim())) {
      setError('Please provide a valid Ethereum wallet address.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await assignNominee(asset.id, nomineeAddress.trim());
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setNomineeAddress('');
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Failed to assign nominee:', err);
      setError(err.message || 'Transaction failed on blockchain.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
            <UserPlus className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">Designate Vault Nominee</h3>
          <p className="text-xs text-slate-400 mt-1">
            Assign the beneficiary address authorized to claim <span className="text-cyan-400 font-semibold">"{asset.name}"</span> upon verification.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-8 flex flex-col items-center text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
            <p className="text-sm font-semibold text-white">Nominee Assigned Successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Nominee Ethereum Address
              </label>
              <input
                type="text"
                value={nomineeAddress}
                onChange={(e) => setNomineeAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 font-mono text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
            </div>

            <div className="flex justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-cyan-600/20"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isLoading ? 'Confirming...' : 'Assign on Blockchain'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
