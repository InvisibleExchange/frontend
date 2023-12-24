import { ethers } from "ethers";

import btcLogo from "../public/tokenIcons/bitcoin.png";
import usdcLogo from "../public/tokenIcons/usdc-logo.png";
import { tokenId2Address } from "./markets";

export type NetworkType = {
  name: string;
  networkId: number;
  explorerUrl: string;
  rpcUrl: string;
  backendUrl: string;
  icon: JSX.Element;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
    address: string;
  };
  provider: ethers.providers.JsonRpcProvider;
  wethContractAddress?: string;
  offChainOracle?: string;
  usdcToken?: string;
};

export const NETWORK = {
  "ETH Mainnet": 1,
  Sepolia: 11155111,
  Starknet: 0,
  ZkSync: 324,
  Arbitrum: 42161,
  localhost: 33535,
};

type NetworkObject = {
  [key: number]: any; //NetworkType;
};

export const NETWORKS: NetworkObject = {
  1: {
    name: "ETH Mainnet",
    networkId: 1,
    explorerUrl: "https://etherscan.io/",
    rpcUrl: "https://eth.llamarpc.com",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      address: ethers.constants.AddressZero,
    },

    secondaryTokens: [],
  },

  11155111: {
    name: "Sepolia",
    networkId: 11155111,
    explorerUrl: "https://sepolia.etherscan.io/",
    rpcUrl: "https://ethereum-sepolia.publicnode.com",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      address: ethers.constants.AddressZero,
    },

    secondaryTokens: [
      {
        address: tokenId2Address[2413654107],
        icon: usdcLogo.src,
      },
      {
        address: tokenId2Address[3592681469],
        icon: btcLogo.src,
      },
    ],
  },
  

  33535: {
    name: "localhost",
    networkId: 33535,
    token: "ETH",
    label: "localhost",
    rpcUrl: "http://127.0.0.1:8545",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      address: ethers.constants.AddressZero,
    },

    secondaryTokens: [
      // {
      //   address: tokenId2Address[2413654107],
      //   icon: usdcLogo.src,
      // },
      // {
      //   address: tokenId2Address[3592681469],
      //   icon: btcLogo.src,
      // },
    ],
  },
};

export function isValidNetwork(networkId: number) {
  const validNetworks = Object.keys(NETWORKS);
  return validNetworks.includes(`${networkId}`);
}

export function getNetworkByName(networkName: string): NetworkType | null {
  const validNetworks = Object.values(NETWORKS);

  for (let i = 0; i < validNetworks.length; i++) {
    const network = validNetworks[i];
    if (network.name.toLowerCase() === networkName) {
      return network;
    }
  }
  return null;
}
