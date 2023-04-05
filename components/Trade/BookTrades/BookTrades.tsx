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
    getMarkPrice,
    selectedType,
    selectedMarket,
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

      let revAq: any[] = [];
      for (let i = aq.length - 1; i >= 0; i--) {
        revAq.push(aq[i]);
      }

      setInitBq(bq);
      setInitAq(revAq);
    };

    getLiquidity();
  }, [token, selectedType]);

  return (
    <div className="w-full h-[70vh]">
      <Book
        token={token}
        bidQueue={bidQueue && bidQueue.length > 0 ? bidQueue : initBq}
        askQueue={askQueue && askQueue.length > 0 ? askQueue : initAq}
        getMarkPrice={getMarkPrice}
      />
      <Trades token={token} type={selectedType} />
    </div>
  );
}
