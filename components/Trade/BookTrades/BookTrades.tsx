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

interface Props {
  token: string;
  type: "perpetual" | "spot";
}

export default function BookTrades({ token, type }: Props) {
  const { liquidity, perpLiquidity, getMarkPrice } = useContext(WalletContext);

  const [initBq, setInitBq] = useState<any[]>([]);
  const [initAq, setInitAq] = useState<any[]>([]);

  let LIQ =
    type == "spot"
      ? liquidity[SYMBOLS_TO_IDS[token]]
      : perpLiquidity[SYMBOLS_TO_IDS[token]];

  let bidQueue = LIQ ? LIQ.bidQueue : [];
  let askQueue = LIQ ? LIQ.askQueue : [];

  useEffect(() => {
    const getLiquidity = async () => {
      let { bidQueue: bq, askQueue: aq } = await fetchLiquidity(
        SYMBOLS_TO_IDS[token],
        type == "spot" ? false : true
      );

      setInitBq(bq);
      setInitAq(aq);
    };

    getLiquidity();
  }, [token, type]);

  return (
    <div className="w-full h-[70vh]">
      <Book
        token={token}
        bidQueue={bidQueue && bidQueue.length > 0 ? bidQueue : initBq}
        askQueue={askQueue && askQueue.length > 0 ? askQueue : initAq}
        getMarkPrice={getMarkPrice}
      />
      <Trades token={token} type={type} />
    </div>
  );
}
