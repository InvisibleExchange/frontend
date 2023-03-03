import React, { CSSProperties, useContext } from "react";

import { prettyBalance, prettyBalanceUSD } from "../../../../utils/utils";
import { TradeType } from "../BookTrades";

interface Props {
  trades: TradeType[];
}

export default function Trades({ trades }: Props) {
  return (
    <div className="flex flex-col flex-1 mt-5 border rounded-sm h-[calc(50%-1.25rem)] border-border_color">
      <div className="px-4 py-3 text-sm tracking-wider font-overpass bg-fg_above_color">
        Market Trades
      </div>
      <div className="flex py-1 text-sm">
        <div className="flex items-center justify-center flex-grow text-[12px]  text-fg_below_color">
          Size <div className="px-1 py-0.5 ml-1 ">(ETH)</div>
        </div>
        <div className="flex items-center justify-center flex-grow text-[12px]  text-fg_below_color">
          Price <div className="px-1 py-0.5 ml-1 bg-border_color">(USDC)</div>
        </div>
        <div className="flex items-center justify-center flex-grow text-[12px]  text-fg_below_color">
          Time
        </div>
      </div>
      <div className="overflow-x-hidden overflow-y-scroll table_contents">
        {/* <div>{tradesElement}</div> */}
      </div>
    </div>
  );
}
