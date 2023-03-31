import React, {
  CSSProperties,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import classNames from "classnames";

const {
  SYMBOLS_TO_IDS,
  DECIMALS_PER_ASSET,
  PRICE_DECIMALS_PER_ASSET,
} = require("../../../../app_logic/helpers/utils");

import { WalletContext } from "../../../../context/WalletContext";

type Props = {
  token: string;
  bidQueue: any;
  askQueue: any;
  getMarkPrice: any;
};

export default function Book({
  token,
  bidQueue,
  askQueue,
  getMarkPrice,
}: Props) {
  // const { userAddress } = useContext(WalletContext);

  askQueue = askQueue.slice(-7);
  bidQueue = bidQueue.slice(0, 7);

  let spread =
    !askQueue.length || !bidQueue.length
      ? 0
      : askQueue[askQueue.length - 1].price - bidQueue[0].price;
  let spreadPercentage = spread == 0 ? 0 : (spread / askQueue[0].price) * 100;

  return (
    <div className="border rounded-sm h-2/3 border-border_color">
      <div className="px-4 py-2 text-sm tracking-wider font-overpass bg-fg_above_color">
        Order Book
      </div>
      <div className="flex py-0.5 text-sm">
        <div className="flex items-center justify-center flex-grow text-[12px]  text-fg_below_color">
          Price <div className="px-1 py-0.5 ml-1">(USDC)</div>
        </div>
        <div className="flex items-center justify-center flex-grow text-[12px]  text-fg_below_color">
          Size{" "}
        </div>
        <div className="flex items-center justify-center flex-grow text-[12px]  text-fg_below_color">
          Total(USDC)
        </div>
      </div>
      <div className=" table_contents">
        {/* ASK QUEUE */}
        <div className=" table_contents">
          {askQueue.length > 0
            ? askQueue.map((order, index) => {
                let amount =
                  order.amount /
                  10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]];

                return (
                  <div className="flex" key={index}>
                    <div className="flex items-center justify-center flex-grow py-0.5 text-sm text-red">
                      {order.price.toFixed(2)}
                    </div>
                    <div className="flex items-center justify-center flex-grow py-0.5 text-sm text-red">
                      {amount.toFixed(4)}
                    </div>
                    <div className="flex items-center justify-center flex-grow py-0.5 text-sm text-red">
                      {(amount * order.price).toFixed(2)}
                    </div>
                  </div>
                );
              })
            : null}
        </div>

        {/* SPREAD */}
        <div className="flex my-2 p-1 border-y-2 border-y-border_color">
          <div className="flex justify-center flex-1">{spread.toFixed(2)}</div>
          <div className="flex justify-center flex-1">
            {spreadPercentage.toFixed(2) + "%"}
          </div>
          <div className="flex justify-center flex-1">Spread</div>
        </div>

        {/* BID QUEUE */}
        <div className=" table_contents">
          {bidQueue.length > 0
            ? bidQueue.map((order, index) => {
                let amount =
                  order.amount /
                  10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]];

                return (
                  <div className="flex" key={index}>
                    <div className="flex items-center justify-center flex-grow py-0.5 text-sm text-green_lighter">
                      {order.price.toFixed(2)}
                    </div>
                    <div className="flex items-center justify-center flex-grow py-0.5 text-sm text-green_lighter">
                      {amount.toFixed(4)}
                    </div>
                    <div className="flex items-center justify-center flex-grow py-0.5 text-sm text-green_lighter">
                      {(amount * order.price).toFixed(2)}
                    </div>
                  </div>
                );
              })
            : null}
        </div>
      </div>
    </div>
  );
}
