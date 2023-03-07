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

export default function TradeActions() {
  const [currentMarket, setCurrentMarket] = useState<any>(marketList[0]);
  const [type, setType] = useState<any>("perpetual");

  return (
    <div className="flex flex-col border rounded-sm border-border_color">
      <PairSelector
        setCurrentMarketParent={setCurrentMarket}
        setType={setType}
      />
      <ActionPanel
        perpType={type}
        token={
          type == "perpetual"
            ? currentMarket.perpetual.split("-")[0]
            : currentMarket.pairs.split("/")[0]
        }
      />
    </div>
  );
}
