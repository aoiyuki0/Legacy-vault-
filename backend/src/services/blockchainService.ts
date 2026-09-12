import dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";

const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
const contractAddress = process.env.CONTRACT_ADDRESS;
const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;

if (!rpcUrl) {
  throw new Error("BLOCKCHAIN_RPC_URL is not defined");
}

if (!contractAddress) {
  throw new Error("CONTRACT_ADDRESS is not defined");
}

if (!privateKey) {
  throw new Error(
    "BLOCKCHAIN_PRIVATE_KEY is not defined"
  );
}

const provider = new ethers.JsonRpcProvider(
  rpcUrl
);

const wallet = new ethers.Wallet(
  privateKey,
  provider
);

const contractABI = [
  "function registerVault() external",
  "function createAsset(string,string) external returns (uint256)",
  "function assignNominee(uint256,address) external",
  "function acceptNomination(uint256) external",
  "function submitClaim(uint256) external",
  "function unlockAsset(uint256) external",
  "function getAsset(uint256) external view returns (uint256,address,address,string,string,uint8,bool)"
];

export const vaultContract = new ethers.Contract(
  contractAddress,
  contractABI,
  wallet
);

export async function unlockAsset(
  assetId: number
) {

  const transaction =
    await vaultContract.unlockAsset(assetId);

  const receipt =
    await transaction.wait();

  return receipt;
}