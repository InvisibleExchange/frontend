import React, { useState, useContext, useEffect } from "react";
import { WalletContext } from "../../../context/WalletContext";
import Book from "./Book/Book";
import Trades from "./Trades/Trades";

const {
  fetchLiquidity,
  SYMBOLS_TO_IDS,
} = require("../../../app_logic/helpers/utils");

export type TradeType = {
  amount: number;
  price: number;
  timestamp: number;
};

export default function BookTrades() {
  const {
    liquidity,
    perpLiquidity,
    fills,
    perpFills,
    forceRerender,
    selectedType,
    selectedMarket,
    setFormInputs,
  } = useContext(WalletContext);

  let token =
    selectedType == "perpetual"
      ? selectedMarket.perpetual.split("-")[0]
      : selectedMarket.pairs.split("/")[0];

  const [initBq, setInitBq] = useState<any[]>([]);
  const [initAq, setInitAq] = useState<any[]>([]);

  let LIQ =
    selectedType == "spot"
      ? liquidity[SYMBOLS_TO_IDS[token]]
      : perpLiquidity[SYMBOLS_TO_IDS[token]];

  let bidQueue = LIQ ? LIQ.bidQueue : [];
  let askQueue = LIQ ? LIQ.askQueue : [];

  useEffect(() => {
    const getLiquidity = async () => {
      let { bidQueue: bq, askQueue: aq } = await fetchLiquidity(
        SYMBOLS_TO_IDS[token],
        selectedType == "spot" ? false : true
      );

      setInitBq(bq);
      setInitAq(aq);
    };

    let LIQ =
      selectedType == "spot"
        ? liquidity[SYMBOLS_TO_IDS[token]]
        : perpLiquidity[SYMBOLS_TO_IDS[token]];

    if (LIQ) {
      setInitBq(LIQ.bidQueue);
      setInitAq(LIQ.askQueue);
    } else {
      getLiquidity();
    }
  }, [token, selectedType, liquidity, perpLiquidity]);

  useEffect(() => {}, [fills, perpFills]);

  return (
    <div className="w-full h-[70vh]">
      <Book
        token={token}
        isPerp={selectedType == "perpetual"}
        bidQueue={bidQueue && bidQueue.length > 0 ? bidQueue : initBq}
        askQueue={askQueue && askQueue.length > 0 ? askQueue : initAq}
        setFormInputs={setFormInputs}
        forceRerender={forceRerender}
      />
      <Trades
        token={token}
        type={selectedType}
        fills={
          selectedType == "spot"
            ? fills[SYMBOLS_TO_IDS[token]]
            : perpFills[SYMBOLS_TO_IDS[token]]
        }
      />
    </div>
  );
}
