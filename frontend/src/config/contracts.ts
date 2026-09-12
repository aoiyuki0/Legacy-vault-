export const DEFAULT_CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const LEGACY_VAULT_ABI = [
  // Functions
  "function registerVault() external",
  "function createAsset(string calldata name, string calldata ipfsCid) external returns (uint256)",
  "function assignNominee(uint256 assetId, address nominee) external",
  "function acceptNomination(uint256 assetId) external",
  "function submitClaim(uint256 assetId) external",
  "function unlockAsset(uint256 assetId) external",
  "function getOwnerAssets(address owner) external view returns (uint256[])",
  "function getNomineeAssets(address nominee) external view returns (uint256[])",
  "function getAsset(uint256 assetId) external view returns (tuple(uint256 id, address owner, address nominee, string name, string ipfsCid, uint8 status, bool nomineeAccepted))",
  
  // Events
  "event VaultRegistered(address indexed owner)",
  "event AssetCreated(uint256 indexed assetId, address indexed owner, string name)",
  "event NomineeAssigned(uint256 indexed assetId, address indexed nominee)",
  "event NomineeAccepted(uint256 indexed assetId, address indexed nominee)",
  "event ClaimSubmitted(uint256 indexed assetId, address indexed nominee)",
  "event AssetUnlocked(uint256 indexed assetId, address indexed nominee)"
];

export const SUPPORTED_NETWORKS = {
  31337: {
    name: "Hardhat Localhost",
    rpcUrl: "http://127.0.0.1:8545",
    currency: "ETH"
  },
  11155111: {
    name: "Sepolia Testnet",
    rpcUrl: "https://rpc.sepolia.org",
    currency: "SepoliaETH"
  }
};
