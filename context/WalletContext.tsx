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

import init from "../pkg/starknet";

const {
  SERVER_URL,
  handleSwapResult,
  handlePerpSwapResult,
  handleFillResult,
  handleLiquidityUpdate,
  IDS_TO_SYMBOLS,
  SPOT_MARKET_IDS,
  PERP_MARKET_IDS,
  DECIMALS_PER_ASSET,
  fetchLiquidity,
} = require("../app_logic/helpers/utils");
const User = require("../app_logic/users/Invisibl3User").default;
const { trimHash } = require("../app_logic/users/Notes");
const { fetchLatestFills } = require("../app_logic/helpers/firebaseConnection");

import {
  NETWORKS,
  isValidNetwork,
  NetworkType,
  NETWORK,
} from "../data/networks";
import { ZZToken } from "../data/zzTypes";
import { TradeType } from "../components/Trade/BookTrades/BookTrades";
import { marketList, token2Market } from "../data/markets";

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

  getSelectedPosition: any;
  setSelectedPosition: any;

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

  setFormInputs: any;
  formInputs: any;
  liquidity: {
    [key: number]: { askQueue: TradeType[]; bidQueue: TradeType[] };
  };
  perpLiquidity: {
    [key: number]: { askQueue: TradeType[]; bidQueue: TradeType[] };
  };
  fills: {
    [key: number]: any[];
  };
  perpFills: {
    [key: number]: any[];
  };
  getMarkPrice: (token: number, isPerp: boolean) => any;

  toastMessage: string | null;
  setToastMessage: any;

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

  getSelectedPosition: null,
  setSelectedPosition: () => {},

  selectedMarket: null,
  setSelectedMarket: () => {},
  selectedType: "perpetual",
  setSelectedType: () => {},
  setFormInputs: () => {},
  formInputs: null,

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
  fills: {},
  perpFills: {},
  getMarkPrice: (token: number, isPerp: boolean) => 0,

  toastMessage: null,
  setToastMessage: null,

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
  const [selectedPosition, _setSelectedPosition] = useState<any>(null);
  function setSelectedPosition(pos: any) {
    _setSelectedPosition(pos);
    setSelectedType("perpetual");
    setSelectedMarket(token2Market[pos.synthetic_token]);
    forceRerender();
  }
  function getSelectedPosition() {
    if (!user || !selectedPosition) return null;

    // check that a position with the same index and position_address exists in the user's positionData
    const position = user.positionData[selectedPosition.synthetic_token].find(
      (pos) =>
        pos.index === selectedPosition.index &&
        pos.position_address === selectedPosition.position_address
    );
    if (!position) {
      _setSelectedPosition(null);
      return null;
    }

    return position;
  }

  const [balances, setBalances] = useState<TokenBalanceObject>({});
  const [allowances, setAllowances] = useState<TokenAllowanceObject>({});

  const [formInputs, setFormInputs] = useState<any>(null);

  const [liquidity, setLiquidity] = useState<{
    [key: number]: { askQueue: TradeType[]; bidQueue: TradeType[] };
  }>({});
  const [perpLiquidity, setPerpLiquidity] = useState<{
    [key: number]: { askQueue: TradeType[]; bidQueue: TradeType[] };
  }>({});

  let initLiquidity;
  let initPerpLiquidity;
  function updateLiquidity(msg: any) {
    let liq = Object.keys(liquidity).length == 0 ? initLiquidity : liquidity;
    let perpLiq =
      Object.keys(perpLiquidity).length == 0
        ? initPerpLiquidity
        : perpLiquidity;

    handleLiquidityUpdate(msg, liq, setLiquidity, perpLiq, setPerpLiquidity);
  }

  const [fills, setFills] = useState<{
    [token: number]: any[];
  }>({});
  const [perpFills, setPerpFills] = useState<{
    [token: number]: any[];
  }>({});

  let initFills;
  let initPerpFills;
  function updateFills(msg: any) {
    if (msg.type == "perpetual") {
      let perpFills_ =
        Object.keys(perpFills).length == 0 ? initPerpFills : perpFills;
      handleFillResult(user, msg, perpFills_, setPerpFills);
    } else {
      let fills_ = Object.keys(fills).length == 0 ? initFills : fills;
      handleFillResult(user, msg, fills_, setFills);
    }
  }

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
      listenToServerWebSocket(user_);
      return user_;
    }
  };

  const getMarkPrice = (token: number, isPerp: boolean) => {
    let bidLiq, askLiq;
    if (isPerp) {
      // Todo: Fetch it from cryptowatch
      if (!perpLiquidity[token]) return 1000;

      let { bidQueue, askQueue } = perpLiquidity[token];

      bidLiq = bidQueue;
      askLiq = askQueue;
    } else {
      // Todo: Fetch it from cryptowatch
      if (!liquidity[token]) return 1000;

      let { bidQueue, askQueue } = liquidity[token];

      bidLiq = bidQueue;
      askLiq = askQueue;
    }

    let topBidPrice = bidLiq[0]?.price;
    let topAskPrice = askLiq[askLiq.length - 1]?.price;

    // Todo: Fetch it from cryptowatch
    if (!topBidPrice || !topAskPrice) return 1000;

    let markPrice = (topBidPrice + topAskPrice) / 2;

    return markPrice;
  };

  const [initialized, setInitialized] = useState<boolean>(false);
  let initialized_ = false;
  const initialize = async () => {
    if (initialized || initialized_) {
      return;
    }
    setInitialized(true);
    initialized_ = true;

    await init();

    if (Object.keys(liquidity).length && Object.keys(perpLiquidity).length)
      return;

    let liquidity_: any = {};
    let perpLiquidity_: any = {};

    let fills_: any = {};
    let perpFills_: any = {};

    for (const [token, _] of Object.entries(SPOT_MARKET_IDS)) {
      let { bidQueue, askQueue } = await fetchLiquidity(token, false);
      let revAq: any[] = [];
      for (let i = askQueue.length - 1; i >= 0; i--) {
        revAq.push(askQueue[i]);
      }

      let fills = await fetchLatestFills(15, false, token);

      liquidity_[token] = { bidQueue, askQueue: revAq };
      fills_[token] = fills;
    }

    for (const [token, _] of Object.entries(PERP_MARKET_IDS)) {
      let { bidQueue, askQueue } = await fetchLiquidity(token, true);
      let revAq: any[] = [];
      for (let i = askQueue.length - 1; i >= 0; i--) {
        revAq.push(askQueue[i]);
      }

      let fills = await fetchLatestFills(15, true, token);

      perpLiquidity_[token] = { bidQueue, askQueue: revAq };
      perpFills_[token] = fills;
    }

    setLiquidity(liquidity_);
    setPerpLiquidity(perpLiquidity_);

    initLiquidity = liquidity_;
    initPerpLiquidity = perpLiquidity_;

    setFills(fills_);
    setPerpFills(perpFills_);

    initFills = fills_;
    initPerpFills = perpFills_;

    listenToRelayWebSocket();
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const listenToServerWebSocket = (user: any) => {
    // * SERVER WEBSOCKET (listens for fills, swaps, perp_swaps)
    let W3CWebSocket = require("websocket").w3cwebsocket;
    let serverClient = new W3CWebSocket(`ws://${SERVER_URL}:50053`);

    serverClient.onopen = function () {
      const ID = trimHash(user.userId, 64).toString();

      serverClient.send(JSON.stringify({ user_id: ID, config_code: "0" }));
    };

    serverClient.onmessage = function (e: any) {
      let msg = JSON.parse(e.data);
      // 2.)
      // "message_id": "PERPETUAL_SWAP",
      // "order_id": u64,
      // "swap_response": responseObject,
      // -> handlePerpSwapResult(user, responseObject)

      // 3.)
      // "message_id": "SWAP_RESULT",
      // "order_id": u64,
      // "market_id": u16,
      // "swap_response": responseObject,
      // -> handleSwapResult(user, responseObject)

      switch (msg.message_id) {
        case "SWAP_RESULT":
          handleSwapResult(user, msg.order_id, msg.swap_response);

          setToastMessage(
            "Swap executed successfully: " +
              (
                msg.swap_response.swap_note.amount /
                10 ** DECIMALS_PER_ASSET[msg.swap_response.swap_note.token]
              ).toFixed(3) +
              " " +
              IDS_TO_SYMBOLS[msg.swap_response.swap_note.token]
          );

          break;

        case "PERPETUAL_SWAP":
          handlePerpSwapResult(user, msg.order_id, msg.swap_response);
          setToastMessage(
            "Perpetual swap executed successfully: " +
              (
                msg.swap_response.qty /
                10 ** DECIMALS_PER_ASSET[msg.swap_response.synthetic_token]
              ).toFixed(3) +
              " " +
              IDS_TO_SYMBOLS[msg.swap_response.synthetic_token]
          );
          break;

        default:
          break;
      }

      forceRerender();
    };
  };

  const listenToRelayWebSocket = () => {
    // * RELAY WEBSOCKET (listens for liquidity)

    let W3CWebSocket = require("websocket").w3cwebsocket;
    let relayClient = new W3CWebSocket(`ws://${SERVER_URL}:4040`);

    relayClient.onopen = function () {};

    relayClient.onmessage = function (e: any) {
      let msg = JSON.parse(e.data);

      // 1.)
      // "message_id": LIQUIDITY_UPDATE,
      // "liquidity_updates": [ liquidityUpdate1, liquidityUpdate2, ... ]
      // => liquidityUpdate: {
      //    "type": "perpetual"/"spot"
      //    "market":  11 / 12 / 21 / 22
      //    "ask_diffs": [[index,[price, size, timestamp]], [index,[price, size, timestamp]], ... ]
      //    "bid_diffs": [[index,[price, size, timestamp]], [index,[price, size, timestamp]], ... ]
      // }

      // 4.)
      // "message_id": "SWAP_FILLED",
      // "type": "perpetual"/"spot"
      // "asset":  tokenId
      // "amount":  amount
      // "price":  price
      // "is_buy":  isBuy
      // "timestamp":  timestamp

      switch (msg.message_id) {
        case "LIQUIDITY_UPDATE":
          updateLiquidity(msg);
          break;

        case "SWAP_FILLED":
          updateFills(msg);

          break;

        default:
          break;
      }

      forceRerender();
    };
  };

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

        getSelectedPosition,
        setSelectedPosition,

        connect: connectWallet,
        disconnect: disconnectWallet,
        login: login,
        initialize: initialize,
        switchNetwork: _switchNetwork,
        updateWalletBalance: updateWalletBalance,

        balances,
        allowances,

        setFormInputs,
        formInputs,
        liquidity: liquidity,
        perpLiquidity: perpLiquidity,
        fills: fills,
        perpFills: perpFills,

        getMarkPrice: getMarkPrice,

        toastMessage,
        setToastMessage,

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
