import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { DEFAULT_CONTRACT_ADDRESS, LEGACY_VAULT_ABI, SUPPORTED_NETWORKS } from '../config/contracts';
import { Asset, AssetStatus } from '../types';

interface Web3ContextType {
  account: string | null;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  contract: ethers.Contract | null;
  contractAddress: string;
  setContractAddress: (address: string) => void;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (targetChainId: number) => Promise<void>;
  
  // Contract Actions
  registerVault: () => Promise<string>;
  createAsset: (name: string, ipfsCid: string) => Promise<{ assetId: number; txHash: string }>;
  assignNominee: (assetId: number, nominee: string) => Promise<string>;
  acceptNomination: (assetId: number) => Promise<string>;
  submitClaim: (assetId: number) => Promise<string>;
  unlockAsset: (assetId: number) => Promise<string>;
  
  // Views
  fetchOwnerAssets: (ownerAddr?: string) => Promise<Asset[]>;
  fetchNomineeAssets: (nomineeAddr?: string) => Promise<Asset[]>;
  fetchAssetById: (assetId: number) => Promise<Asset | null>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [contractAddress, setContractAddress] = useState<string>(DEFAULT_CONTRACT_ADDRESS);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Initialize or re-instantiate contract when signer or address changes
  useEffect(() => {
    if (signer && contractAddress && ethers.isAddress(contractAddress)) {
      try {
        const vaultContract = new ethers.Contract(contractAddress, LEGACY_VAULT_ABI, signer);
        setContract(vaultContract);
      } catch (err) {
        console.error('Failed to create contract instance:', err);
      }
    } else {
      setContract(null);
    }
  }, [signer, contractAddress]);

  // Handle Ethereum provider event listeners
  useEffect(() => {
    const { ethereum } = window as any;
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(ethers.getAddress(accounts[0]));
      } else {
        setAccount(null);
        setSigner(null);
      }
    };

    const handleChainChanged = (newChainId: string) => {
      setChainId(parseInt(newChainId, 16));
      window.location.reload();
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const connectWallet = useCallback(async () => {
    const { ethereum } = window as any;
    if (!ethereum) {
      alert('No Web3 wallet detected! Please install MetaMask or another EVM wallet extension.');
      return;
    }

    try {
      setIsConnecting(true);
      const browserProvider = new ethers.BrowserProvider(ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const network = await browserProvider.getNetwork();
      const currentSigner = await browserProvider.getSigner();

      setProvider(browserProvider);
      setAccount(ethers.getAddress(accounts[0]));
      setChainId(Number(network.chainId));
      setSigner(currentSigner);
    } catch (error: any) {
      console.error('Wallet connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setSigner(null);
    setProvider(null);
    setContract(null);
  }, []);

  const switchNetwork = async (targetChainId: number) => {
    const { ethereum } = window as any;
    if (!ethereum) return;

    const hexChainId = `0x${targetChainId.toString(16)}`;
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError: any) {
      // Chain not added to MetaMask
      if (switchError.code === 4902) {
        const net = SUPPORTED_NETWORKS[targetChainId as keyof typeof SUPPORTED_NETWORKS];
        if (net) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: hexChainId,
                chainName: net.name,
                rpcUrls: [net.rpcUrl],
                nativeCurrency: { name: net.currency, symbol: net.currency, decimals: 18 },
              },
            ],
          });
        }
      } else {
        console.error('Failed to switch network:', switchError);
      }
    }
  };

  // Contract Methods
  const registerVault = async (): Promise<string> => {
    if (!contract) throw new Error('Contract or wallet not connected');
    const tx = await contract.registerVault();
    const receipt = await tx.wait();
    return receipt.hash;
  };

  const createAsset = async (name: string, ipfsCid: string): Promise<{ assetId: number; txHash: string }> => {
    if (!contract) throw new Error('Contract or wallet not connected');
    const tx = await contract.createAsset(name, ipfsCid);
    const receipt = await tx.wait();

    let assetId = 0;
    // Extract assetId from AssetCreated event if present
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === 'AssetCreated') {
          assetId = Number(parsed.args[0]);
          break;
        }
      } catch (e) {}
    }

    return { assetId, txHash: receipt.hash };
  };

  const assignNominee = async (assetId: number, nominee: string): Promise<string> => {
    if (!contract) throw new Error('Contract or wallet not connected');
    if (!ethers.isAddress(nominee)) throw new Error('Invalid Ethereum address for nominee');
    const tx = await contract.assignNominee(assetId, nominee);
    const receipt = await tx.wait();
    return receipt.hash;
  };

  const acceptNomination = async (assetId: number): Promise<string> => {
    if (!contract) throw new Error('Contract or wallet not connected');
    const tx = await contract.acceptNomination(assetId);
    const receipt = await tx.wait();
    return receipt.hash;
  };

  const submitClaim = async (assetId: number): Promise<string> => {
    if (!contract) throw new Error('Contract or wallet not connected');
    const tx = await contract.submitClaim(assetId);
    const receipt = await tx.wait();
    return receipt.hash;
  };

  const unlockAsset = async (assetId: number): Promise<string> => {
    if (!contract) throw new Error('Contract or wallet not connected');
    const tx = await contract.unlockAsset(assetId);
    const receipt = await tx.wait();
    return receipt.hash;
  };

  const fetchAssetById = async (assetId: number): Promise<Asset | null> => {
    if (!contract) return null;
    try {
      const data = await contract.getAsset(assetId);
      return {
        id: Number(data[0]),
        owner: data[1],
        nominee: data[2],
        name: data[3],
        ipfsCid: data[4],
        status: Number(data[5]) as AssetStatus,
        nomineeAccepted: data[6],
      };
    } catch (err) {
      console.error(`Error fetching asset ${assetId}:`, err);
      return null;
    }
  };

  const fetchOwnerAssets = async (ownerAddr?: string): Promise<Asset[]> => {
    if (!contract) return [];
    const target = ownerAddr || account;
    if (!target) return [];

    try {
      const assetIds: bigint[] = await contract.getOwnerAssets(target);
      const list: Asset[] = [];
      for (const rawId of assetIds) {
        const item = await fetchAssetById(Number(rawId));
        if (item) list.push(item);
      }
      return list;
    } catch (err) {
      console.error('Error fetching owner assets:', err);
      return [];
    }
  };

  const fetchNomineeAssets = async (nomineeAddr?: string): Promise<Asset[]> => {
    if (!contract) return [];
    const target = nomineeAddr || account;
    if (!target) return [];

    try {
      const assetIds: bigint[] = await contract.getNomineeAssets(target);
      const list: Asset[] = [];
      for (const rawId of assetIds) {
        const item = await fetchAssetById(Number(rawId));
        if (item) list.push(item);
      }
      return list;
    } catch (err) {
      console.error('Error fetching nominee assets:', err);
      return [];
    }
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        provider,
        signer,
        contract,
        contractAddress,
        setContractAddress,
        isConnecting,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        registerVault,
        createAsset,
        assignNominee,
        acceptNomination,
        submitClaim,
        unlockAsset,
        fetchOwnerAssets,
        fetchNomineeAssets,
        fetchAssetById,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
