import {
  createContext,
  useEffect,
  useState,
  Dispatch,
  SetStateAction,
  useReducer,
} from "react";

import { BigNumber, ethers, utils } from "ethers";

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
  ledgerModule({ walletConnectVersion: 1 }),
  walletConnectModule({
    version: 1,
    bridge: "https://bridge.walletconnect.org",
  }),
  mewWallet(),
  tallyHoWalletModule(),
];

const chains = Object.keys(NETWORKS).map((key: string) => {
  const network = NETWORKS[Number(key)];

  return {
    id: "0x" + network.networkId.toString(16),
    token: network.nativeCurrency.symbol,
    label: network.name,
    rpcUrl: network.rpcUrl,
    secondaryTokens: network.secondaryTokens,
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
    gettingStartedGuide: "https://docs.zigzag.exchange",
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
  const [network, setNetwork] = useState<NetworkType | null>(
    _getDefaultNetwork()
  );
  const [ethersProvider, setEthersProvider] =
    useState<ethers.providers.BaseProvider>(_getDefaultProvider());
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [balances, setBalances] = useState<TokenBalanceObject>({});
  const [allowances, setAllowances] = useState<TokenAllowanceObject>({});

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

      let contracts = initContractConnections(signer_);
      setSmartContracts(contracts);

      updateWalletBalances(tokenAddressList, []);

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

    return signer;
  };

  const _switchNetwork = async (_networkId: number): Promise<boolean> => {
    const [primaryWallet] = onboard.state.get().wallets;
    if (!isValidNetwork(_networkId) || !primaryWallet) return false;

    const chainId = "0x" + _networkId.toString(16);
    const success = await onboard.setChain({ chainId });
    if (success) setNetwork(NETWORKS[_networkId]);
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
        let addr = tokenId2Address[tokenId];

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

    if (tokenId == 54321) {
      // TODO: Change GO to ETH in prod
      let tokenBalance = currentState.wallets[0].accounts[0].balance?.GO;

      return tokenBalance ?? null;
    }

    let symbol = tokenId2Name[tokenId];

    let tokenBalance =
      currentState.wallets[0].accounts[0].secondaryTokens?.find(
        (token: any) => token.name == symbol
      )?.balance;

    return tokenBalance ?? null;
  };

  const initContractConnections = (signer: ethers.Signer | null) => {
    const invisibleL1Address = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; //Todo
    const invisibleL1Abi =
      require("../app_logic/helpers/abis/InvisibleL1.json").abi;

    const TestTokenAbi =
      require("../app_logic/helpers/abis/TestToken.json").abi;

    const WbtcAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; //Todo
    const WbtcContract = new ethers.Contract(
      WbtcAddress,
      TestTokenAbi,
      signer ?? undefined
    );

    const UsdcAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; //Todo
    const UsdcContract = new ethers.Contract(
      UsdcAddress,
      TestTokenAbi,
      signer ?? undefined
    );

    const invisibleL1Contract = new ethers.Contract(
      invisibleL1Address,
      invisibleL1Abi,
      signer ?? undefined
    );

    const contracts = {
      invisibleL1: invisibleL1Contract,
      12345: WbtcContract,
      55555: UsdcContract,
    };

    return contracts;
  };

  const signMessage = async () => {
    let wallet = await onboard.connectWallet();

    console.log("wallet", wallet);
  };

  return (
    <WalletContext.Provider
      value={{
        username,
        signer,
        userAddress,
        ethersProvider,
        network,
        isLoading,
        forceRerender,

        connect: connectWallet,
        disconnect: disconnectWallet,
        switchNetwork: _switchNetwork,
        updateWalletBalances,
        getTokenBalance,

        balances,
        allowances,

        setBalances,
        setAllowances,

        smartContracts,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export default WalletProvider;

function _getDefaultNetwork(): NetworkType {
  return NETWORKS[NETWORK["Arbitrum"]];
}

function _getDefaultProvider(): ethers.providers.BaseProvider {
  const network = _getDefaultNetwork();
  return new ethers.providers.JsonRpcProvider(network.rpcUrl);
}
