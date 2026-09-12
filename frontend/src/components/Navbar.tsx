import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { NavTab } from '../types';
import { Settings, AlertTriangle } from 'lucide-react';
import { SUPPORTED_NETWORKS } from '../config/contracts';

interface NavbarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { account, chainId, isConnecting, connectWallet, disconnectWallet, switchNetwork, contractAddress, setContractAddress } = useWeb3();
  const [showConfig, setShowConfig] = useState(false);
  const [tempAddress, setTempAddress] = useState(contractAddress);

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempAddress.trim()) {
      setContractAddress(tempAddress.trim());
      setShowConfig(false);
    }
  };

  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Simple Brand Text - No Logo */}
        <div className="cursor-pointer select-none" onClick={() => setCurrentTab('dashboard')}>
          <span className="font-bold text-lg tracking-tight text-white">Legacy Vault</span>
        </div>

        {/* Clean Nav Tabs */}
        <nav className="flex items-center space-x-1 p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`px-3.5 py-1.5 rounded font-medium transition-all ${
              currentTab === 'dashboard'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Owner Dashboard
          </button>

          <button
            onClick={() => setCurrentTab('nominee')}
            className={`px-3.5 py-1.5 rounded font-medium transition-all ${
              currentTab === 'nominee'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Nominee Portal
          </button>
        </nav>

        {/* Web3 Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            title="Configure Contract Address"
            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          {account ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={disconnectWallet}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>{shortenAddress(account)}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>

      </div>

      {/* Contract Settings Popover */}
      {showConfig && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative">
          <div className="absolute top-2 right-4 w-80 p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50">
            <h4 className="text-xs font-semibold text-white mb-2">Contract Address</h4>
            <form onSubmit={handleSaveConfig} className="space-y-3">
              <input
                type="text"
                value={tempAddress}
                onChange={(e) => setTempAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowConfig(false)}
                  className="px-2.5 py-1 rounded text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
