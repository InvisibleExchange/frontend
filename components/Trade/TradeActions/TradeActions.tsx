import React, { useState } from "react";
import PairSelector from "./PairSelector/PairSelector";
import ActionPanel from "./ActionPanel";

const marketList = [
  {
    pairs: "ETH/USDC",
    lastPrice: "0.0000202555",
    change: +1.58,
    perpetual: "ETH-Perpetual",
  },
  {
    pairs: "BTC/USDC",
    lastPrice: "1.0000202555",
    change: -1.58,
    perpetual: "BTC-Perpetual",
  },
];

export default function TradeActions({
  setGlobalMarket,
  globalMarket,
  setGlobalType,
  globalType,
}: any) {
  return (
    <div className="flex flex-col border rounded-sm border-border_color">
      <PairSelector
        setCurrentMarketParent={setGlobalMarket}
        setType={setGlobalType}
      />
      <ActionPanel
        perpType={globalType}
        token={
          globalType == "perpetual"
            ? globalMarket.perpetual.split("-")[0]
            : globalMarket.pairs.split("/")[0]
        }
      />
    </div>
  );
}
