import React, { useState } from "react";
import PairSelector from "./PairSelector/PairSelector";
import ActionPanel from "./ActionPanel";

export default function TradeActions({
  setGlobalMarket,
  globalMarket,
  setGlobalType,
  globalType,
}: any) {
  return (
    <div className="flex flex-col border rounded-sm border-border_color">
      <PairSelector
        currentMarketParent={globalMarket}
        setCurrentMarketParent={setGlobalMarket}
        type={globalType}
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
