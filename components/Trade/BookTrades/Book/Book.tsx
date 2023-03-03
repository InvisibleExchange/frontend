import React, {
  CSSProperties,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import classNames from "classnames";

import { utils } from "ethers";
import {
  prettyBalance,
  prettyBalanceUSD,
  truncateDecimals,
} from "../../../../utils/utils";
import { WalletContext } from "../../../../context/WalletContext";

type OrderData = {
  user: string;
  price: number;
  size: number;
};

export default function Book() {
  const { userAddress } = useContext(WalletContext);

  return (
    <div className="border rounded-sm h-1/2 border-border_color">
      <div className="px-4 py-3 text-sm tracking-wider font-overpass bg-fg_above_color">
        Order Book
      </div>
      <div className="flex py-1 text-sm">
        <div className="flex items-center justify-center flex-grow text-[12px]  text-fg_below_color">
          Size <div className="px-1 py-0.5 ml-1 text-fg_below_color">(ETH)</div>
        </div>
        <div className="flex items-center justify-center flex-grow text-[12px]  text-fg_below_color">
          Price <div className="px-1 py-0.5 ml-1">(USDC)</div>
        </div>
        <div className="flex items-center justify-center flex-grow text-[12px]  text-fg_below_color">
          Mine
        </div>
      </div>
      <div className="overflow-x-hidden overflow-y-scroll table_contents">
        <div className=""></div>
        <div className="flex p-1 border-y-2 border-y-border_color">
          <div className="flex justify-center flex-1">Spread</div>
          <div className="flex justify-center flex-1">
            {/* {prettyBalance(spread)} */}
          </div>
          <div className="flex justify-center flex-1">
            {/* {prettyBalance(spreadPercentage, 2)}% */}
          </div>
        </div>
        <div className=""></div>
      </div>
    </div>
  );
}
