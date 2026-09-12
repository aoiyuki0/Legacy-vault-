import React, { useState, useRef } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { uploadToPinata } from '../services/api';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { ethers } from 'ethers';

interface CreateAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateAssetModal: React.FC<CreateAssetModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { createAsset, assignNominee } = useWeb3();
  const [assetName, setAssetName] = useState('');
  const [nomineeAddress, setNomineeAddress] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [step, setStep] = useState<'idle' | 'uploading_ipfs' | 'signing_tx' | 'assigning_nominee' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim()) {
      setErrorMessage('Please provide an asset title or description.');
      return;
    }
    if (!selectedFile) {
      setErrorMessage('Please select a file to encrypt & deposit into IPFS.');
      return;
    }
    if (nomineeAddress.trim() && !ethers.isAddress(nomineeAddress.trim())) {
      setErrorMessage('The provided nominee address is not a valid Ethereum address.');
      return;
    }

    setErrorMessage('');
    try {
      // 1. Upload to Pinata IPFS
      setStep('uploading_ipfs');
      setStatusMessage('Encrypting & uploading asset payload to Pinata IPFS...');
      
      const ipfsResult = await uploadToPinata(selectedFile);
      if (!ipfsResult.success || !ipfsResult.cid) {
        throw new Error(ipfsResult.error || 'Failed to upload asset to IPFS.');
      }

      const ipfsCid = ipfsResult.cid;

      // 2. Call Smart Contract createAsset
      setStep('signing_tx');
      setStatusMessage('Please confirm the transaction in your wallet to mint asset on-chain...');
      const { assetId } = await createAsset(assetName.trim(), ipfsCid);

      // 3. Assign Nominee if specified
      if (nomineeAddress.trim()) {
        setStep('assigning_nominee');
        setStatusMessage(`Assigning nominee ${nomineeAddress.slice(0, 6)}... on-chain...`);
        await assignNominee(assetId, nomineeAddress.trim());
      }

      setStep('done');
      setStatusMessage('Asset successfully secured in Legacy Vault!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Asset creation error:', err);
      setStep('error');
      setErrorMessage(err.message || 'An unexpected error occurred during asset creation.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={step !== 'idle' && step !== 'done' && step !== 'error'}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight">Deposit New Digital Asset</h2>
          <p className="text-xs text-slate-400 mt-1">
            Files are pinned to decentralized IPFS and ownership is minted directly to your smart contract vault.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {step !== 'idle' && step !== 'error' ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            {step === 'done' ? (
              <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce" />
            ) : (
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
            )}
            <div>
              <p className="text-sm font-semibold text-white">{statusMessage}</p>
              <p className="text-xs text-slate-400 mt-1">Please do not close this window</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Asset Name / Description
              </label>
              <input
                type="text"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="e.g. Master Crypto Seed Phrase & Deeds"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
            </div>

            {/* File Dropzone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Asset Payload File
              </label>
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-2xl cursor-pointer text-center transition-all ${
                  dragActive
                    ? 'border-cyan-400 bg-cyan-950/20'
                    : selectedFile
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : 'border-white/10 hover:border-white/20 bg-slate-950/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center space-y-2">
                  {selectedFile ? (
                    <>
                      <FileText className="w-8 h-8 text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-300 truncate max-w-xs">
                        {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                      <span className="text-[10px] text-slate-400">Click to replace file</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-cyan-400" />
                      <p className="text-xs text-slate-300">
                        <span className="font-semibold text-cyan-400">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-[10px] text-slate-500">Documents, keys, PDFs, images or archives</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Optional Nominee Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Nominee EVM Address (Optional)
              </label>
              <input
                type="text"
                value={nomineeAddress}
                onChange={(e) => setNomineeAddress(e.target.value)}
                placeholder="0x... (Can also be designated later)"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
              >
                Secure & Mint Asset
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
