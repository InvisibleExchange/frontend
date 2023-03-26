import {
  createContext,
  useEffect,
  useState,
  Dispatch,
  SetStateAction,
  useReducer,
} from "react";

import { BigNumber, ethers, utils } from "ethers";

import Onboard, { WalletState } from "../node_modules/@web3-onboard/core/dist";
import injectedModule from "@web3-onboard/injected-wallets";
import walletConnectModule from "@web3-onboard/walletconnect/dist";
import coinbaseWalletModule from "@web3-onboard/coinbase";
import ledgerModule from "@web3-onboard/ledger";
import mewWallet from "@web3-onboard/mew-wallet";
import tallyHoWalletModule from "@web3-onboard/tallyho";
// import logo from "../public/img/zz.svg"

const {
  handleSwapResult,
  handlePerpSwapResult,
  SPOT_MARKET_IDS_2_TOKENS,
  PERP_MARKET_IDS_2_TOKENS,
  SYMBOLS_TO_IDS,
  SPOT_MARKET_IDS,
  PERP_MARKET_IDS,
  fetchLiquidity,
} = require("../app_logic/helpers/utils");
const User = require("../app_logic/users/Invisibl3User").default;
const { trimHash } = require("../app_logic/users/Notes");

import {
  NETWORKS,
  isValidNetwork,
  NetworkType,
  NETWORK,
} from "../data/networks";
import { ZZToken } from "../data/zzTypes";
import { TradeType } from "../components/Trade/BookTrades/BookTrades";
import { marketList } from "../data/markets";

interface Props {
  children: React.ReactNode;
}

export type WalletContextType = {
  user: typeof User | null;
  username: string | null;
  signer: ethers.Signer | null;
  userAddress: string | null;
  ethersProvider: ethers.providers.BaseProvider;
  network: NetworkType | null;
  isLoading: boolean;
  forceRerender: () => void;

  selectedMarket: any;
  setSelectedMarket: any;
  selectedType: "spot" | "perpetual";
  setSelectedType: any;

  connect: () => void;
  disconnect: () => void;
  login: () => any;
  initialize: () => void;
  switchNetwork: (network: number) => Promise<boolean>;
  updateWalletBalance: (tokenAddressList: string[]) => void;

  balances: TokenBalanceObject;
  allowances: TokenAllowanceObject;
  liquidity: {
    [key: number]: { askQueue: TradeType[]; bidQueue: TradeType[] };
  };
  perpLiquidity: {
    [key: number]: { askQueue: TradeType[]; bidQueue: TradeType[] };
  };
  getMarkPrice: (token: number, isPerp: boolean) => any;

  setBalances: Dispatch<SetStateAction<TokenBalanceObject>>;
  setAllowances: Dispatch<SetStateAction<TokenAllowanceObject>>;
};

export const WalletContext = createContext<WalletContextType>({
  user: null,
  username: null,
  signer: null,
  userAddress: null,
  ethersProvider: _getDefaultProvider(),
  network: _getDefaultNetwork(),
  isLoading: false,
  forceRerender: () => {},

  selectedMarket: null,
  setSelectedMarket: () => {},
  selectedType: "perpetual",
  setSelectedType: () => {},

  connect: () => {},
  disconnect: () => {},
  login: async () => {},
  initialize: () => {},
  switchNetwork: async (network: number) => {
    return false;
  },
  updateWalletBalance: (tokenAddressList: string[]) => {},

  balances: {},
  allowances: {},
  liquidity: {},
  perpLiquidity: {},
  getMarkPrice: (token: number, isPerp: boolean) => 0,

  setBalances: () => {},
  setAllowances: () => {},
});

// export type TokenBalanceType = { value: BigNumber; valueReadable: number }

export type TokenBalanceObject = Record<string, BigNumber | undefined>;
export type TokenAllowanceObject = Record<string, BigNumber | undefined>;

const wallets = [
  injectedModule(),
  walletConnectModule(),
  coinbaseWalletModule({ darkMode: true }),
  ledgerModule(),
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
  };
});

const onboard = Onboard({
  wallets,
  chains,
  appMetadata: {
    name: "ZigZag Exchange",
    // icon: logo.src,
    // logo: logo.src,
    icon: "/tokenIcons/zz.svg",
    logo: "/tokenIcons/zz.svg",
    description: "ZigZag Exchange",
    recommendedInjectedWallets: [
      { name: "MetaMask", url: "https://metamask.io" },
    ],
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
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  function forceRerender() {
    forceUpdate();
  }

  const [user, setUser] = useState<typeof User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [network, setNetwork] = useState<NetworkType | null>(
    _getDefaultNetwork()
  );
  const [ethersProvider, setEthersProvider] =
    useState<ethers.providers.BaseProvider>(_getDefaultProvider());
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [selectedMarket, setSelectedMarket] = useState(marketList[0]);
  const [selectedType, setSelectedType] = useState<"spot" | "perpetual">(
    "perpetual"
  );

  const [balances, setBalances] = useState<TokenBalanceObject>({});
  const [allowances, setAllowances] = useState<TokenAllowanceObject>({});
  const [liquidity, setLiquidity] = useState<{
    [key: number]: { askQueue: TradeType[]; bidQueue: TradeType[] };
  }>({});
  const [perpLiquidity, setPerpLiquidity] = useState<{
    [key: number]: { askQueue: TradeType[]; bidQueue: TradeType[] };
  }>({});

  const walletsSub = onboard.state.select("wallets");
  walletsSub.subscribe((wallets) => {
    // this is used to store the last connected wallet
    const connectedWallets = wallets.map(({ label }) => label);
    if (!connectedWallets) return;
    window.localStorage.setItem(
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
      window.localStorage.getItem("connectedWallets");
    if (!previouslyConnectedWalletsString) return;

    // JSON.parse()[0] => previously primary wallet
    const label = previouslyConnectedWalletsString
      ? JSON.parse(previouslyConnectedWalletsString)[0]
      : null;

    if (label !== null && label !== undefined) connectWallet(label);

    // const user = window.localStorage.getItem("user");
    // if (user) {
    //   setUser(user);
    // }
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
      updateWallet(wallets[0]);
      setIsLoading(false);
    } catch (error: any) {
      console.error(error);
    }
  };

  const updateWallet = (wallet: WalletState) => {
    const { accounts, chains, provider } = wallet;
    setUserAddress(accounts[0].address.toLowerCase());
    // console.log(accounts[0])
    if (accounts[0].ens?.name) setUsername(accounts[0].ens?.name);

    const network = parseInt(chains[0].id, 16);
    setNetwork(NETWORKS[network]);
    const ethersProvider = new ethers.providers.Web3Provider(provider, "any");
    if (ethersProvider) setEthersProvider(ethersProvider);

    const signer = ethersProvider?.getSigner();
    setSigner(signer);
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
    if (!primaryWallet) return;
    await onboard.disconnectWallet({ label: primaryWallet.label });
    setUserAddress(null);
    setNetwork(_getDefaultNetwork());
    setEthersProvider(_getDefaultProvider());
  };

  const updateWalletBalance = (tokenAddressList: string[]) => {
    console.log("updateWalletBalance", tokenAddressList);
    if (tokenAddressList.length > 0) {
      onboard.state.actions.updateBalances(tokenAddressList);
    } else {
      onboard.state.actions.updateBalances();
    }
  };

  const hasSufficientBalance = (token: ZZToken, amount: number) => {
    const balance = balances[token.address];
    if (!balance) {
      console.warn("hasSufficientBalance: balance is undefined");
      return false;
    }
    return utils.parseUnits(String(amount), token.decimals).lte(balance);
  };

  const hasSufficientAllowance = (token: ZZToken, amount: number) => {
    const allowance = allowances[token.address];
    if (!allowance) {
      console.warn("hasSufficientAllowance: allowance is undefined");
      return false;
    }
    return utils.parseUnits(String(amount), token.decimals).lte(allowance);
  };

  const login = async () => {
    const { loginUser } = require("../app_logic/helpers/utils");

    let user_;
    try {
      user_ = await loginUser(signer);
    } catch (error) {
      console.log("login error", error);
    }

    if (user_) {
      setUser(user_);
      listenToWebSocket(user_);
      return user_;
    }
  };

  const getMarkPrice = (token: number, isPerp: boolean) => {
    let bidLiq, askLiq;
    if (isPerp) {
      if (!perpLiquidity[token]) return 0;

      let { bidQueue, askQueue } = perpLiquidity[token];

      bidLiq = bidQueue;
      askLiq = askQueue;
    } else {
      if (!liquidity[token]) return 0;

      let { bidQueue, askQueue } = liquidity[token];

      bidLiq = bidQueue;
      askLiq = askQueue;
    }

    let topBidPrice = bidLiq[0]?.price;
    let topAskPrice = askLiq[0]?.price;

    if (!topBidPrice || !topAskPrice) return 0;

    let markPrice = (topBidPrice + topAskPrice) / 2;

    return markPrice;
  };

  const initialize = async () => {
    if (Object.keys(liquidity).length && Object.keys(perpLiquidity).length)
      return;

    let liquidity_: any = {};
    let perpLiquidity_: any = {};

    for (const [token, _] of Object.entries(SPOT_MARKET_IDS)) {
      let { bidQueue, askQueue } = await fetchLiquidity(token, false);
      liquidity_[token] = { bidQueue, askQueue };
    }

    for (const [token, _] of Object.entries(PERP_MARKET_IDS)) {
      let { bidQueue, askQueue } = await fetchLiquidity(token, true);
      perpLiquidity_[token] = { bidQueue, askQueue };
    }

    setLiquidity(liquidity_);
    setPerpLiquidity(perpLiquidity_);

    // forceRerender();
  };

  const listenToWebSocket = (user: any) => {
    let W3CWebSocket = require("websocket").w3cwebsocket;
    let client = new W3CWebSocket("ws://localhost:50053/");

    client.onopen = function () {
      client.send(trimHash(user.userId, 64));
    };

    client.onmessage = function (e: any) {
      let msg = JSON.parse(e.data);

      // 1.)
      // "message_id": LIQUIDITY_UPDATE,
      // "type": "perpetual"/"spot"
      // "market":  11 / 12 / 21 / 22
      // "ask_liquidity": [ [price, size, timestamp], [price, size, timestamp], ... ]
      // "bid_liquidity": [ [price, size, timestamp], [price, size, timestamp], ... ]

      // 2.)
      // "message_id": "PERPETUAL_SWAP",
      // "order_id": u64,
      // "swap_response": responseObject,
      // -> handlePerpSwapResult(user, responseObject)

      // 3.)
      // "message_id": "SWAP_RESULT",
      // "order_id": u64,
      // "swap_response": responseObject,
      // -> handleSwapResult(user, responseObject)

      switch (msg.message_id) {
        case "LIQUIDITY_UPDATE":
          let askQueue = msg.ask_liquidity.map((item: any) => {
            return {
              price: item[0],
              amount: item[1],
              timestamp: item[2],
            };
          });
          let bidQueue = msg.bid_liquidity.map((item: any) => {
            return {
              price: item[0],
              amount: item[1],
              timestamp: item[2],
            };
          });

          console.log("askQueue", askQueue);

          let pairLiquidity = { bidQueue, askQueue };

          if (msg.type === "perpetual") {
            let token = PERP_MARKET_IDS_2_TOKENS[msg.market];

            let liq = perpLiquidity;
            liq[token] = pairLiquidity;

            setPerpLiquidity(liq);
          } else {
            let token = SPOT_MARKET_IDS_2_TOKENS[msg.market];

            let liq = liquidity;
            liq[token] = pairLiquidity;

            setLiquidity(liq);
          }

          break;

        case "SWAP_RESULT":
          console.log("msg", msg);
          handleSwapResult(user, msg.order_id, msg.swap_response);
          break;

        case "PERPETUAL_SWAP":
          console.log("msg", msg);
          handlePerpSwapResult(user, msg.order_id, msg.swap_response);
          break;

        default:
          break;
      }

      forceRerender();
    };
  };

  // TODO: store user in local storage
  // window.localStorage.setItem("user", user_);

  return (
    <WalletContext.Provider
      value={{
        user: user,
        username: username,
        signer: signer,
        userAddress: userAddress,
        ethersProvider: ethersProvider,
        network: network,
        isLoading: isLoading,
        forceRerender: forceRerender,

        selectedType: selectedType,
        setSelectedType: setSelectedType,
        selectedMarket: selectedMarket,
        setSelectedMarket: setSelectedMarket,

        connect: connectWallet,
        disconnect: disconnectWallet,
        login: login,
        initialize: initialize,
        switchNetwork: _switchNetwork,
        updateWalletBalance: updateWalletBalance,

        balances,
        allowances,

        liquidity: liquidity,
        perpLiquidity: perpLiquidity,
        getMarkPrice: getMarkPrice,

        setBalances,
        setAllowances,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export default WalletProvider;

function _getDefaultNetwork(): NetworkType {
  return NETWORKS[NETWORK["arbitrum"]];
}

function _getDefaultProvider(): ethers.providers.BaseProvider {
  const network = _getDefaultNetwork();
  return new ethers.providers.JsonRpcProvider(network.rpcUrl);
}
