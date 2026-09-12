import React, { useState, useEffect, useRef } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Asset, AssetStatus, AiVerificationResult } from '../types';
import { verifyDeathCertificate, unlockAssetViaBackend, getIpfsUrl, getMockVerificationResult } from '../services/api';
import { 
  Sparkles, 
  UploadCloud, 
  FileCheck2, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  QrCode, 
  Database, 
  FileText, 
  Loader2, 
  ExternalLink, 
  Lock, 
  Unlock, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface ClaimWizardProps {
  initialAssetId?: number | null;
  onNavigateToNominee: () => void;
}

export const ClaimWizard: React.FC<ClaimWizardProps> = ({ initialAssetId, onNavigateToNominee }) => {
  const { account, fetchNomineeAssets, submitClaim, unlockAsset, fetchAssetById } = useWeb3();
  const [nomineeAssets, setNomineeAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(initialAssetId ?? null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<AiVerificationResult | null>(null);
  const [claimTxHash, setClaimTxHash] = useState<string>('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load nominee assets for selector
  useEffect(() => {
    if (!account) return;
    const fetchAssets = async () => {
      const data = await fetchNomineeAssets(account);
      setNomineeAssets(data);
      if (initialAssetId != null) {
        setSelectedAssetId(initialAssetId);
      } else if (data.length > 0 && selectedAssetId == null) {
        setSelectedAssetId(data[0].id);
      }
    };
    fetchAssets();
  }, [account, initialAssetId, fetchNomineeAssets]);

  // Load detailed asset state
  useEffect(() => {
    if (selectedAssetId != null) {
      fetchAssetById(selectedAssetId).then((res) => {
        if (res) {
          setSelectedAsset(res);
          if (res.status === AssetStatus.Unlocked) {
            setIsUnlocked(true);
          }
        }
      });
    } else {
      setSelectedAsset(null);
    }
  }, [selectedAssetId, fetchAssetById]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCertificateFile(e.target.files[0]);
      setVerificationResult(null);
      setErrorMessage('');
    }
  };

  const handleRunVerification = async (useSimulation: boolean = false) => {
    if (!certificateFile && !useSimulation) {
      setErrorMessage('Please select a death certificate file first.');
      return;
    }

    setErrorMessage('');
    setIsVerifying(true);

    try {
      let result: AiVerificationResult;
      if (useSimulation) {
        // Simulated AI analysis
        await new Promise((resolve) => setTimeout(resolve, 1600));
        result = getMockVerificationResult(certificateFile ? certificateFile.name : 'death_certificate_sample.pdf');
      } else {
        result = await verifyDeathCertificate(certificateFile!);
      }

      setVerificationResult(result);
    } catch (err: any) {
      console.warn('API error, offering simulated verification:', err);
      setErrorMessage(
        `Backend AI service unreachable (${err.message || 'connection error'}). You can click "Run Simulated AI Verification" below to preview the complete verification scorecard.`
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmitClaim = async () => {
    if (selectedAssetId == null) return;
    setErrorMessage('');
    setIsClaiming(true);
    try {
      const hash = await submitClaim(selectedAssetId);
      setClaimTxHash(hash);
      const updated = await fetchAssetById(selectedAssetId);
      if (updated) setSelectedAsset(updated);
    } catch (err: any) {
      console.error('Submit claim error:', err);
      setErrorMessage(err.message || 'Failed to submit claim on blockchain');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleUnlockAsset = async () => {
    if (selectedAssetId == null) return;
    setErrorMessage('');
    setIsUnlocking(true);
    try {
      // First try via backend unlock service (delegated signer), fallback to user wallet unlock
      const backendRes = await unlockAssetViaBackend(selectedAssetId);
      if (backendRes.success) {
        setIsUnlocked(true);
        const updated = await fetchAssetById(selectedAssetId);
        if (updated) setSelectedAsset(updated);
      } else {
        // Fallback directly to contract unlockAsset
        await unlockAsset(selectedAssetId);
        setIsUnlocked(true);
        const updated = await fetchAssetById(selectedAssetId);
        if (updated) setSelectedAsset(updated);
      }
    } catch (err: any) {
      console.error('Unlock error:', err);
      setErrorMessage(err.message || 'Failed to unlock asset');
    } finally {
      setIsUnlocking(false);
    }
  };

  const isApproved = verificationResult?.verification?.status === 'APPROVED';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous AI Verification Protocol</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            AI Inheritance Claim Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Validate official vital registry records, authenticate municipal digital signatures, and execute autonomous inheritance release onto the Ethereum blockchain.
          </p>
        </div>
      </div>

      {/* Main Grid: Wizard on Left/Middle, Result on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form & Steps */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Step 1: Select Asset */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">Step 1</span>
              {selectedAsset && (
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                  selectedAsset.status === AssetStatus.Unlocked ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                }`}>
                  Status: {selectedAsset.status === AssetStatus.Unlocked ? 'Unlocked' : selectedAsset.status === AssetStatus.ClaimPending ? 'Claim Pending' : 'Locked'}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white">Select Inherited Asset</h3>

            {nomineeAssets.length === 0 ? (
              <p className="text-xs text-slate-400">
                No active nominations found for your wallet. Please check the Nominee Portal or connect the nominee wallet.
              </p>
            ) : (
              <select
                value={selectedAssetId ?? ''}
                onChange={(e) => setSelectedAssetId(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                {nomineeAssets.map((a) => (
                  <option key={a.id} value={a.id}>
                    #{a.id} - {a.name} ({a.nomineeAccepted ? 'Nomination Accepted' : 'Pending Acceptance'})
                  </option>
                ))}
              </select>
            )}

            {selectedAsset && !selectedAsset.nomineeAccepted && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>You must accept nomination for this asset in the Nominee Portal before submitting a claim.</span>
              </div>
            )}
          </div>

          {/* Step 2: Upload Death Certificate */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">Step 2</span>
              <span className="text-xs text-slate-400">PDF, JPG, PNG, WEBP</span>
            </div>
            <h3 className="text-base font-bold text-white">Upload Vital Registry Death Certificate</h3>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl cursor-pointer text-center transition-all ${
                certificateFile
                  ? 'border-emerald-500/40 bg-emerald-950/10'
                  : 'border-white/10 hover:border-white/20 bg-slate-950/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-col items-center space-y-2">
                {certificateFile ? (
                  <>
                    <FileCheck2 className="w-8 h-8 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-300">{certificateFile.name}</span>
                    <span className="text-[11px] text-slate-400">Click to change document</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-cyan-400" />
                    <p className="text-xs text-slate-300 font-medium">Click to upload official certificate</p>
                    <p className="text-[10px] text-slate-500">Document will be analyzed for QR signatures, seals, and registry matches</p>
                  </>
                )}
              </div>
            </div>

            {/* Error notice */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2 text-xs text-rose-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => handleRunVerification(false)}
                disabled={isVerifying || !certificateFile}
                className="flex-1 min-w-[180px] flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Document...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run AI Verification</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleRunVerification(true)}
                disabled={isVerifying}
                title="Simulate analysis without running local backend/FastAPI"
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-white/10 transition-colors"
              >
                Simulate AI Result
              </button>
            </div>
          </div>

          {/* Step 3: Blockchain Claim & Unlock Execution */}
          {verificationResult && isApproved && (
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-emerald-500/30 shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-mono font-semibold uppercase">
                <ShieldCheck className="w-4 h-4" />
                <span>Step 3: Blockchain Execution</span>
              </div>
              <h3 className="text-base font-bold text-white">Execute Inheritance Claim</h3>
              <p className="text-xs text-slate-400">
                AI verification has approved this claim. You can now execute the on-chain claim and release the encrypted digital asset from the vault.
              </p>

              {/* Status Tracker */}
              <div className="space-y-3 pt-2">
                {/* 1. Submit Claim */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5 text-xs">
                  <div>
                    <span className="font-semibold text-white block">1. On-Chain Claim</span>
                    <span className="text-slate-400 text-[11px]">
                      {selectedAsset?.status === AssetStatus.ClaimPending || isUnlocked
                        ? 'Claim registered on-chain'
                        : 'Submit claim state to smart contract'}
                    </span>
                  </div>
                  {selectedAsset?.status === AssetStatus.ClaimPending || isUnlocked ? (
                    <span className="text-emerald-400 flex items-center space-x-1 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submitted</span>
                    </span>
                  ) : (
                    <button
                      onClick={handleSubmitClaim}
                      disabled={isClaiming || !selectedAsset?.nomineeAccepted}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold flex items-center space-x-1.5"
                    >
                      {isClaiming && <Loader2 className="w-3 h-3 animate-spin" />}
                      <span>Submit Claim</span>
                    </button>
                  )}
                </div>

                {/* 2. Unlock Asset */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5 text-xs">
                  <div>
                    <span className="font-semibold text-white block">2. Release & Unlock Asset</span>
                    <span className="text-slate-400 text-[11px]">
                      {isUnlocked ? 'Vault unlocked successfully' : 'Unlocks IPFS payload for beneficiary access'}
                    </span>
                  </div>
                  {isUnlocked ? (
                    <span className="text-emerald-400 flex items-center space-x-1 font-semibold">
                      <Unlock className="w-4 h-4" />
                      <span>Unlocked</span>
                    </span>
                  ) : (
                    <button
                      onClick={handleUnlockAsset}
                      disabled={isUnlocking || selectedAsset?.status !== AssetStatus.ClaimPending}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold flex items-center space-x-1.5"
                    >
                      {isUnlocking && <Loader2 className="w-3 h-3 animate-spin" />}
                      <span>Unlock Asset</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Unlocked celebration banner */}
              {isUnlocked && selectedAsset && (
                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/40 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Inheritance Claim Complete!</h4>
                  <p className="text-xs text-slate-300">
                    The smart contract has verified your eligibility and unsealed the inheritance vault.
                  </p>
                  <a
                    href={getIpfsUrl(selectedAsset.ipfsCid)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-2 py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/30 transition-all"
                  >
                    <span>Download Asset Payload</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: AI Verification Scorecard */}
        <div className="lg:col-span-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 shadow-xl space-y-6 sticky top-28">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">AI Verification Scorecard</h3>
              </div>
              {verificationResult?.verification && (
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                    isApproved
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {verificationResult.verification.status}
                </span>
              )}
            </div>

            {!verificationResult ? (
              <div className="py-16 text-center space-y-3 text-slate-500">
                <Database className="w-12 h-12 mx-auto text-slate-600" />
                <p className="text-sm font-medium text-slate-400">Awaiting Death Certificate Upload</p>
                <p className="text-xs max-w-xs mx-auto text-slate-500">
                  Upload an official death certificate and click "Run AI Verification" to inspect the OCR, QR, and civil registry diagnostics.
                </p>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in">
                
                {/* Confidence Meter */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-400 font-medium">Model Confidence Score</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {(verificationResult.verification!.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, verificationResult.verification!.confidence * 100)}%` }}
                    />
                  </div>
                </div>

                {/* AI Reason Summary */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/5 text-xs text-slate-300">
                  <span className="text-slate-400 block font-semibold mb-1">Verdict Summary:</span>
                  {verificationResult.verification!.reason}
                </div>

                {/* Key Extraction Findings */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Extracted Vital Records
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/5">
                      <span className="text-[10px] text-slate-500 block uppercase">Deceased Name</span>
                      <span className="font-medium text-slate-200">
                        {verificationResult.verification!.ai_analysis?.deceased_name ||
                          verificationResult.verification!.ocr?.deceased_name ||
                          'N/A'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/5">
                      <span className="text-[10px] text-slate-500 block uppercase">Certificate ID</span>
                      <span className="font-mono text-slate-200">
                        {verificationResult.verification!.ai_analysis?.certificate_number ||
                          verificationResult.verification!.ocr?.certificate_number ||
                          'N/A'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/5">
                      <span className="text-[10px] text-slate-500 block uppercase">Date of Demise</span>
                      <span className="font-mono text-slate-200">
                        {verificationResult.verification!.ai_analysis?.date_of_death ||
                          verificationResult.verification!.ocr?.date_of_death ||
                          'N/A'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/5">
                      <span className="text-[10px] text-slate-500 block uppercase">Issuing Authority</span>
                      <span className="truncate block text-slate-200" title={verificationResult.verification!.ai_analysis?.issuing_authority || ''}>
                        {verificationResult.verification!.ai_analysis?.issuing_authority ||
                          verificationResult.verification!.ocr?.issuing_authority ||
                          'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subsystem Diagnostics Checkmarks */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Security & Authenticity Checks
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-slate-300">OCR & Document Text Analysis</span>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40">
                      <div className="flex items-center space-x-2">
                        <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-slate-300">Cryptographic QR Code Validation</span>
                      </div>
                      {verificationResult.verification!.qr?.domain_verified || verificationResult.verification!.qr?.qr_detected ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <span className="text-[11px] text-amber-400">Bypassed / Not detected</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40">
                      <div className="flex items-center space-x-2">
                        <Database className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-slate-300">Civil Registry Database Cross-check</span>
                      </div>
                      {verificationResult.verification!.registry_check?.record_found ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <span className="text-[11px] text-amber-400">Simulated / Verified</span>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};
