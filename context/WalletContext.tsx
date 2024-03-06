import {
  createContext,
  useEffect,
  useState,
  Dispatch,
  SetStateAction,
  useReducer,
  useMemo,
} from "react";

import { BigNumber, ethers } from "ethers";

import invLogo from "../public/tokenIcons/invisible-logo-small.png";

import Onboard, { WalletState } from "@web3-onboard/core";
import injectedModule from "@web3-onboard/injected-wallets";
import walletConnectModule from "@web3-onboard/walletconnect/dist";
import coinbaseWalletModule from "@web3-onboard/coinbase";
import ledgerModule from "@web3-onboard/ledger";
import mewWallet from "@web3-onboard/mew-wallet";
import tallyHoWalletModule from "@web3-onboard/tallyho";
// import logo from "../public/img/zz.svg"

import {
  NETWORKS,
  isValidNetwork,
  NetworkType,
  NETWORK,
} from "../data/networks";
import {
  invisibleContractAddress,
  tokenAddress2Id,
  tokenAddressList,
  tokenId2Address,
  tokenId2Name,
} from "../data/markets";

interface Props {
  children: React.ReactNode;
}

export type WalletContextType = {
  username: string | null;
  signer: ethers.Signer | null;
  userAddress: string | null;
  ethersProvider: ethers.providers.BaseProvider;
  network: NetworkType | null;
  isLoading: boolean;
  forceRerender: () => void;

  connect: () => void;
  disconnect: () => void;
  switchNetwork: (network: number) => Promise<boolean>;
  updateWalletBalances: (
    tokenAddressList_: string[],
    tokenIdsList_: number[]
  ) => void;
  getTokenBalance: (tokenId: number) => string | null;

  balances: TokenBalanceObject;
  allowances: TokenAllowanceObject;
  withdrawbleAmounts: any;

  setBalances: Dispatch<SetStateAction<TokenBalanceObject>>;
  setAllowances: Dispatch<SetStateAction<TokenAllowanceObject>>;

  smartContracts: any;
};

export const WalletContext = createContext<WalletContextType>({
  username: null,
  signer: null,
  userAddress: null,
  ethersProvider: _getDefaultProvider(),
  network: _getDefaultNetwork(),
  isLoading: false,
  forceRerender: () => {},

  connect: () => {},
  disconnect: () => {},
  switchNetwork: async (network: number) => {
    return false;
  },
  updateWalletBalances: async (
    tokenAddressList_: string[],
    tokenIdsList_: number[]
  ) => {},
  getTokenBalance: (tokenId: number) => null,

  balances: {},
  allowances: {},
  withdrawbleAmounts: {},

  setBalances: () => {},
  setAllowances: () => {},

  smartContracts: {},
});

// export type TokenBalanceType = { value: BigNumber; valueReadable: number }

export type TokenBalanceObject = Record<string, BigNumber | undefined>;
export type TokenAllowanceObject = Record<string, BigNumber | undefined>;

const wallets = [
  injectedModule(),
  coinbaseWalletModule({ darkMode: true }),
  ledgerModule({}),
  walletConnectModule({
    version: 2,
    projectId: "a86bb4a5507650c51d8a0e0c5ca0e158",
  }),
  mewWallet(),
  tallyHoWalletModule(),
];

const chains = Object.keys(NETWORKS).map((key: string) => {
  const network_ = NETWORKS[Number(key)];

  return {
    id: "0x" + network_.networkId.toString(16),
    token: network_.nativeCurrency.symbol,
    label: network_.name,
    rpcUrl: network_.rpcUrl,
    secondaryTokens: network_.secondaryTokens,
  };
});

const onboard = Onboard({
  wallets,
  chains,
  appMetadata: {
    name: "Invisible Exchange",
    icon: invLogo.src,
    logo: invLogo.src,

    description: "Invisible Exchange",
    recommendedInjectedWallets: [
      { name: "MetaMask", url: "https://metamask.io" },
    ],
    // gettingStartedGuide: "https://docs.zigzag.exchange",
  },

  accountCenter: {
    desktop: {
      enabled: false,
    },
    mobile: {
      enabled: false,
    },
  },
});

function WalletProvider({ children }: Props) {
  const [_, forceUpdate] = useReducer((x) => x + 1, 0);

  function forceRerender() {
    forceUpdate();
  }

  const [username, setUsername] = useState<string | null>(null);
  let network_ = _getDefaultNetwork();
  let [network, setNetwork] = useState<NetworkType | null>(network_);
  const [ethersProvider, setEthersProvider] =
    useState<ethers.providers.BaseProvider>(_getDefaultProvider());
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [balances, setBalances] = useState<TokenBalanceObject>({});
  const [allowances, setAllowances] = useState<TokenAllowanceObject>({});

  const [withdrawbleAmounts, setWithdrawablAmounts] = useState<any>({});

  const [smartContracts, setSmartContracts] = useState<any>({});

  const walletsSub = onboard.state.select("wallets");
  walletsSub.subscribe((wallets) => {
    // this is used to store the last connected wallet
    const connectedWallets = wallets.map(({ label }) => label);
    if (!connectedWallets) return;

    sessionStorage.setItem(
      "connectedWallets",
      JSON.stringify(connectedWallets)
    );

    const primaryAddress = wallets[0]?.accounts?.[0]?.address;
    const primaryChain = parseInt(wallets[0]?.chains?.[0].id, 16);
    if (
      (primaryAddress && primaryAddress.toLowerCase() !== userAddress) ||
      (primaryChain && network && primaryChain !== network.networkId)
    ) {
      updateWallet(wallets[0]);
    }
  });

  // Reconnect if previously connected
  useEffect(() => {
    const previouslyConnectedWalletsString =
      sessionStorage.getItem("connectedWallets");
    if (!previouslyConnectedWalletsString) return;
    // JSON.parse()[0] => previously primary wallet
    const label = previouslyConnectedWalletsString
      ? JSON.parse(previouslyConnectedWalletsString)[0]
      : null;
    if (label !== null && label !== undefined) {
      connectWallet(label);
    }
  }, []);

  const connectWallet = async (label?: string) => {
    try {
      setIsLoading(true);
      let wallets;
      if (label !== null && label !== undefined) {
        wallets = await onboard.connectWallet({
          autoSelect: { label: label, disableModals: true },
        });
      } else {
        wallets = await onboard.connectWallet();
      }
      if (!wallets) throw new Error("No connected wallet found");
      let signer_ = updateWallet(wallets[0]);

      // TODO ==========================================
      let contracts = initContractConnections(signer_, network?.chainId ?? 0);
      setSmartContracts(contracts);

      updateWalletBalances(tokenAddressList(network?.chainId ?? 0), []);

      try {
        await getWithdrawableAmounts(
          wallets[0]?.accounts?.[0]?.address,
          contracts
        );
      } catch (error) {
        console.error("getWithdrawableAmounts error: ", error);
      }

      // TODO ==========================================

      setIsLoading(false);
    } catch (error: any) {
      console.error(error);
    }
  };

  const updateWallet = (wallet: WalletState) => {
    const { accounts, chains, provider } = wallet;
    setUserAddress(accounts[0].address.toLowerCase());
    if (accounts[0].ens?.name) setUsername(accounts[0].ens?.name);

    const network = parseInt(chains[0].id, 16);
    setNetwork(NETWORKS[network]);
    const ethersProvider = new ethers.providers.Web3Provider(provider, "any");
    if (ethersProvider) setEthersProvider(ethersProvider);

    const signer = ethersProvider?.getSigner();
    setSigner(signer);

    ethersProvider.on("network", (newNetwork, oldNetwork) => {
      if (oldNetwork) {
        updateWallet(wallet);
      }
    });

    return signer;
  };

  const switchNetwork = async (_networkId: number): Promise<boolean> => {
    const [primaryWallet] = onboard.state.get().wallets;
    if (!isValidNetwork(_networkId) || !primaryWallet) return false;

    const chainId = "0x" + _networkId.toString(16);
    const success = await onboard.setChain({ chainId });

    if (success) setNetwork(NETWORKS[_networkId]);

    let contracts = initContractConnections(
      signer,
      NETWORKS[_networkId]?.chainId ?? 0
    );
    setSmartContracts(contracts);

    return success;
  };

  const disconnectWallet = async () => {
    const [primaryWallet] = onboard.state.get().wallets;

    setUserAddress(null);
    setNetwork(_getDefaultNetwork());
    setEthersProvider(_getDefaultProvider());

    if (!primaryWallet) return;
    await onboard.disconnectWallet({ label: primaryWallet.label });
  };

  const updateWalletBalances = (
    tokenAddressList_: string[],
    tokenIdsList_: number[]
  ) => {
    if (tokenAddressList_.length > 0) {
      onboard.state.actions.updateBalances(tokenAddressList_);
    } else if (tokenIdsList_.length > 0) {
      let addresses_: string[] | undefined = [];
      for (let i = 0; i < tokenIdsList_.length; i++) {
        let tokenId = tokenIdsList_[i];
        let addr = tokenId2Address(network?.chainId ?? 0)[tokenId];

        if (!addr) continue;

        addresses_.push(addr);
      }

      addresses_ = addresses_.length > 0 ? addresses_ : undefined;
      onboard.state.actions.updateBalances(addresses_);
    } else {
      onboard.state.actions.updateBalances();
    }
  };

  const getTokenBalance = (tokenId: number) => {
    const currentState = onboard.state.get();
    if (!currentState || !currentState.wallets.length) return null;

    if (tokenId == 453755560) {
      let tokenBalance = currentState.wallets[0].accounts[0].balance?.ETH;

      return tokenBalance ?? null;
    }

    let symbol = tokenId2Name()[tokenId];

    let tokenBalance =
      currentState.wallets[0].accounts[0].secondaryTokens?.find((token: any) =>
        token.name.includes(symbol)
      )?.balance;

    return tokenBalance ?? null;
  };

  const getWithdrawableAmounts = async (
    userAddress: string,
    contracts: any
  ) => {
    let withdrawbleAmounts = {};
    let invisibleContract = contracts.invisibleL1;

    for (let address of tokenAddressList[network?.chainId ?? 0]) {
      const tokenId = tokenAddress2Id(network?.chainId ?? 0)[address];

      let amount = await invisibleContract?.getWithdrawableAmount(
        userAddress,
        address
      );

      withdrawbleAmounts[tokenId] = amount;
    }

    let amount = await invisibleContract?.getETHWithdrawableAmount(userAddress);

    withdrawbleAmounts[453755560] = amount;

    setWithdrawablAmounts(withdrawbleAmounts);
  };

  const initContractConnections = (
    signer: ethers.Signer | null,
    chainId: number
  ) => {
    const TestTokenAbi =
      require("../app_logic/helpers/abis/TestToken.json").abi;

    const WbtcAddress = tokenId2Address(chainId ?? 0)[3592681469];
    const WbtcContract = new ethers.Contract(
      WbtcAddress,
      TestTokenAbi,
      signer ?? undefined
    );

    const UsdcAddress = tokenId2Address(chainId ?? 0)[2413654107];
    const UsdcContract = new ethers.Contract(
      UsdcAddress,
      TestTokenAbi,
      signer ?? undefined
    );

    const invisibleAbi =
      chainId == _getDefaultNetwork().chainId
        ? require("../app_logic/helpers/abis/Invisible.json").abi
        : require("../app_logic/helpers/abis/InvisibleL2.json").abi;

    const invisibleContract = new ethers.Contract(
      invisibleContractAddress(chainId ?? 0),
      invisibleAbi,
      signer ?? undefined
    );

    const contracts = {
      invisible: invisibleContract,
      3592681469: WbtcContract,
      2413654107: UsdcContract,
    };

    return contracts;
  };

  const contextValue = useMemo(
    () => ({
      username,
      signer,
      userAddress,
      ethersProvider,
      network,
      isLoading,
      forceRerender,

      connect: connectWallet,
      disconnect: disconnectWallet,
      switchNetwork,
      updateWalletBalances,
      getTokenBalance,

      balances,
      allowances,
      withdrawbleAmounts,

      setBalances,
      setAllowances,

      smartContracts,
    }),
    [
      username,
      signer,
      userAddress,
      ethersProvider,
      network,
      isLoading,
      forceRerender,
      balances,
      allowances,
      withdrawbleAmounts,
      smartContracts,
    ]
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

export default WalletProvider;

function _getDefaultNetwork(): NetworkType {
  // return NETWORKS[NETWORK["ETH Mainnet"]];
  return NETWORKS[NETWORK["Sepolia"]];
  // return NETWORKS[NETWORK["ArbitrumSepolia"]];
}

function _getDefaultProvider(): ethers.providers.BaseProvider {
  const network = _getDefaultNetwork();
  return new ethers.providers.JsonRpcProvider(network.rpcUrl);
}
