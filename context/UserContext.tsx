import { createContext, useState, useReducer, useContext } from "react";

import init from "../pkg/starknet";

const {
  handleSwapResult,
  handlePerpSwapResult,
  handleFillResult,
  handleLiquidityUpdate,
  IDS_TO_SYMBOLS,
  SPOT_MARKET_IDS,
  PERP_MARKET_IDS,
  DECIMALS_PER_ASSET,
  fetchLiquidity,
  EXPRESS_APP_URL,
  SERVER_WS_URL,
  RELAY_WS_URL,
} = require("../app_logic/helpers/utils");
const User = require("../app_logic/users/Invisibl3User").default;
const { trimHash } = require("../app_logic/users/Notes");
const { fetchLatestFills } = require("../app_logic/helpers/firebaseConnection");

const axios = require("axios");

import { TradeType } from "../components/Trade/BookTrades/BookTrades";
import { marketList, token2Market } from "../data/markets";
import { WalletContext } from "./WalletContext";

interface Props {
  children: React.ReactNode;
}

export type UserContextType = {
  user: typeof User | null;
  isLoading: boolean;
  forceRerender: () => void;

  getSelectedPosition: any;
  setSelectedPosition: any;

  selectedMarket: any;
  setSelectedMarket: any;
  selectedType: "spot" | "perpetual";
  setSelectedType: any;

  login: (signer: any) => any;
  initialize: () => void;
  initialized: boolean;

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

  priceChange24h: any;
  spot24hInfo: any;
  perp24hInfo: any;
  tokenFundingInfo: any;

  toastMessage: { type: string; message: string } | null;
  setToastMessage: any;
};

export const UserContext = createContext<UserContextType>({
  user: null,
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

  login: async () => {},
  initialize: () => {},
  initialized: false,

  liquidity: {},
  perpLiquidity: {},
  fills: {},
  perpFills: {},
  getMarkPrice: (token: number, isPerp: boolean) => 0,

  priceChange24h: {},
  spot24hInfo: null,
  perp24hInfo: null,
  tokenFundingInfo: null,

  toastMessage: null,
  setToastMessage: null,
});

// ================================================================================

function UserProvider({ children }: Props) {
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  function forceRerender() {
    forceUpdate();
  }

  const [user, setUser] = useState<typeof User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
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

  const [priceChange24h, setPriceChange24h] = useState<any>({});
  const [spot24hInfo, setSpot24hInfo] = useState<any>({});
  const [perp24hInfo, setPerp24hInfo] = useState<any>({});
  const [tokenFundingInfo, setTokenFundingInfo] = useState<any>({});

  const [toastMessage, setToastMessage] = useState<{
    type: string;
    message: string;
  } | null>(null);

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
    let perpFills_ =
      Object.keys(perpFills).length == 0 ? initPerpFills : perpFills;
    let fills_ = Object.keys(fills).length == 0 ? initFills : fills;
    handleFillResult(user, msg, fills_, setFills, perpFills_, setPerpFills);
  }

  function update24hPrices(msg: any) {
    let changes = JSON.parse(msg.price_changes);

    setPriceChange24h(changes);
  }

  async function fetchMarketinfo() {
    await axios.post(`${EXPRESS_APP_URL}/get_market_info`, {}).then((res) => {
      let {
        fundingPrices,
        fundingRates,
        spot24hVolumes,
        spot24hTrades,
        perp24hVolumes,
        perp24hTrades,
      } = res.data.response;

      setTokenFundingInfo({ fundingPrices, fundingRates });

      let spot24hInfo_ = {};
      for (let token of Object.keys(spot24hVolumes)) {
        spot24hInfo_[token] = {
          volume: spot24hVolumes[token],
          trades: spot24hTrades[token],
        };
      }
      setSpot24hInfo(spot24hInfo_);

      let perp24hInfo_ = {};
      for (let token of Object.keys(perp24hVolumes)) {
        perp24hInfo_[token] = {
          volume: perp24hVolumes[token],
          trades: perp24hTrades[token],
        };
      }
      setPerp24hInfo(perp24hInfo_);
    });
  }

  // ============================================================================

  const login = async (signer: any) => {
    const { loginUser } = require("../app_logic/helpers/utils");

    let user_;
    try {
      user_ = await loginUser(signer);
    } catch (error) {
      setToastMessage({ type: "error", message: "Login failed - " + error });
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
      if (!perpLiquidity[token]) {
        if (priceChange24h[IDS_TO_SYMBOLS[token]])
          return priceChange24h[IDS_TO_SYMBOLS[token]].price;
        else return 0;
      }

      let { bidQueue, askQueue } = perpLiquidity[token];

      bidLiq = bidQueue;
      askLiq = askQueue;
    } else {
      // Todo: Fetch it from cryptowatch
      if (!liquidity[token]) {
        if (priceChange24h[IDS_TO_SYMBOLS[token]])
          return priceChange24h[IDS_TO_SYMBOLS[token]].price;
        else return 0;
      }

      let { bidQueue, askQueue } = liquidity[token];

      bidLiq = bidQueue;
      askLiq = askQueue;
    }

    let topBidPrice = bidLiq[0]?.price;
    let topAskPrice = askLiq[askLiq.length - 1]?.price ?? 0;

    // Todo: Fetch it from cryptowatch
    if (!topBidPrice || !topAskPrice) {
      if (priceChange24h[IDS_TO_SYMBOLS[token]])
        return priceChange24h[IDS_TO_SYMBOLS[token]].price;
      else return 0;
    }

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

    await fetchMarketinfo();

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

  const listenToServerWebSocket = (user: any) => {
    // * SERVER WEBSOCKET (listens for fills, swaps, perp_swaps)
    let W3CWebSocket = require("websocket").w3cwebsocket;

    let serverClient = new W3CWebSocket(SERVER_WS_URL);

    const ID = trimHash(user.userId, 64).toString();
    serverClient.onopen = function () {
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
          console.log("swap result: ", msg);

          handleSwapResult(user, msg.order_id, msg.swap_response);

          let swapNote = msg.swap_response.note_info_swap_response.swap_note;
          setToastMessage({
            type: "info",
            message:
              "Swap executed successfully: " +
              (
                swapNote.amount /
                10 ** DECIMALS_PER_ASSET[swapNote.token]
              ).toFixed(3) +
              " " +
              IDS_TO_SYMBOLS[swapNote.token],
          });

          break;

        case "PERPETUAL_SWAP":
          handlePerpSwapResult(user, msg.order_id, msg.swap_response);
          setToastMessage({
            type: "info",
            message:
              "Perpetual swap executed successfully: " +
              (
                msg.swap_response.qty /
                10 ** DECIMALS_PER_ASSET[msg.swap_response.synthetic_token]
              ).toFixed(3) +
              " " +
              IDS_TO_SYMBOLS[msg.swap_response.synthetic_token],
          });
          break;

        case "SPOT_SWAP_ERROR":
        case "PERP_SWAP_ERROR":
          setToastMessage({
            type: "error",
            message: msg.error_message,
          });
          break;

        default:
          break;
      }

      forceRerender();
    };

    serverClient.onclose = function () {
      listenToServerWebSocket(user);
    };

    serverClient.onerror = function (e) {
      console.log("server ws error: ", e);
    };
  };

  const listenToRelayWebSocket = () => {
    // * RELAY WEBSOCKET (listens for liquidity)

    let W3CWebSocket = require("websocket").w3cwebsocket;
    let relayClient = new W3CWebSocket(RELAY_WS_URL);

    relayClient.onopen = function () {};

    relayClient.onmessage = function (e: any) {
      let msg = JSON.parse(e.data);

      // console.log("relay ws message: ", msg.message_id);

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

        case "24H_PRICE_UPDATE":
          update24hPrices(msg);
          break;

        default:
          break;
      }

      forceRerender();
    };

    relayClient.onclose = function () {
      listenToRelayWebSocket();
    };
  };

  return (
    <UserContext.Provider
      value={{
        user: user,
        isLoading: isLoading,
        forceRerender: forceRerender,

        selectedType: selectedType,
        setSelectedType: setSelectedType,
        selectedMarket: selectedMarket,
        setSelectedMarket: setSelectedMarket,

        getSelectedPosition,
        setSelectedPosition,

        login: login,
        initialize: initialize,
        initialized,

        setFormInputs,
        formInputs,
        liquidity: liquidity,
        perpLiquidity: perpLiquidity,
        fills: fills,
        perpFills: perpFills,

        getMarkPrice: getMarkPrice,

        priceChange24h,
        spot24hInfo,
        perp24hInfo,
        tokenFundingInfo,

        toastMessage,
        setToastMessage,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export default UserProvider;
