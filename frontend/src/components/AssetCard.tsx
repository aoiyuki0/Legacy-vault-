import React from 'react';
import { Asset, AssetStatus } from '../types';
import { getIpfsUrl } from '../services/api';

interface AssetCardProps {
  asset: Asset;
  userRole: 'owner' | 'nominee';
  onAssignNominee?: (asset: Asset) => void;
  onAcceptNomination?: (assetId: number) => void;
  onInitiateClaim?: (assetId: number) => void;
  isActionLoading?: boolean;
}

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  userRole,
  onAssignNominee,
  onAcceptNomination,
  onInitiateClaim,
  isActionLoading,
}) => {
  const isZeroAddress = (addr: string) => !addr || addr === '0x0000000000000000000000000000000000000000';

  const shortenAddress = (addr: string) => {
    if (isZeroAddress(addr)) return 'None assigned';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getStatusLabel = () => {
    switch (asset.status) {
      case AssetStatus.Locked:
        return 'Locked';
      case AssetStatus.ClaimPending:
        return 'Claim Pending';
      case AssetStatus.Unlocked:
        return 'Unlocked';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between gap-3 hover:border-slate-700 transition-colors">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400 font-medium">#{asset.id}</span>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              {asset.name}
            </h3>
          </div>
          {/* Unified single-color status badge */}
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
            {getStatusLabel()}
          </span>
        </div>

        <div className="text-xs text-slate-400">
          Nominee: <span className="font-mono text-slate-300">{shortenAddress(asset.nominee)}</span>
          {!isZeroAddress(asset.nominee) && (
            <span className="text-slate-400 text-[11px] ml-1">
              ({asset.nomineeAccepted ? 'Accepted' : 'Pending'})
            </span>
          )}
        </div>

        <div className="text-[11px] font-mono text-slate-400 truncate">
          IPFS CID: {asset.ipfsCid}
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800 flex items-center justify-end space-x-2">
        {asset.status === AssetStatus.Unlocked && (
          <a
            href={getIpfsUrl(asset.ipfsCid)}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition-colors"
          >
            View on IPFS
          </a>
        )}

        {userRole === 'owner' && asset.status === AssetStatus.Locked && onAssignNominee && (
          <button
            onClick={() => onAssignNominee(asset)}
            disabled={isActionLoading}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
          >
            {isZeroAddress(asset.nominee) ? 'Assign Nominee' : 'Change Nominee'}
          </button>
        )}

        {userRole === 'nominee' && asset.status === AssetStatus.Locked && (
          <>
            {!asset.nomineeAccepted && onAcceptNomination && (
              <button
                onClick={() => onAcceptNomination(asset.id)}
                disabled={isActionLoading}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition-colors"
              >
                Accept Nomination
              </button>
            )}

            {asset.nomineeAccepted && onInitiateClaim && (
              <button
                onClick={() => onInitiateClaim(asset.id)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition-colors"
              >
                File Claim →
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
