import React, { useState } from "react";
import PairSelector from "./PairSelector/PairSelector";
import ActionPanel from "./ActionPanel";

export default function TradeActions() {
  return (
    <div className="flex flex-col border rounded-sm border-border_color">
      <PairSelector />
      <ActionPanel />
    </div>
  );
}
