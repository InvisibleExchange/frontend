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
import { TradeType } from "../BookTrades";

const {
  SYMBOLS_TO_IDS,
  DECIMALS_PER_ASSET,
} = require("../../../../app_logic/helpers/utils");

interface Props {
  bidQueue: TradeType[];
  askQueue: TradeType[];
  token: string;
}

export default function Book({ token, bidQueue, askQueue: aq }: Props) {
  let askQueue: any[] = [];
  for (let i = aq.length - 1; i >= 0; i--) {
    askQueue.push(aq[i]);
  }

  let spread =
    !askQueue.length || !bidQueue.length
      ? 0
      : askQueue[askQueue.length - 1].price - bidQueue[0].price;
  let spreadPercentage = spread == 0 ? 0 : (spread / askQueue[0].price) * 100;

  return (
    <div className="border rounded-sm h-1/2 border-border_color">
      <div className="px-4 py-3 text-sm tracking-wider font-overpass bg-fg_above_color">
        Order Book
      </div>
      <div className="flex py-1 text-sm">
        <div className="flex items-center justify-center flex-grow text-[12px]  text-fg_below_color">
          Price <div className="px-1 py-0.5 ml-1">(USDC)</div>
        </div>
        <div className="flex items-center justify-center flex-grow text-[12px]  text-fg_below_color">
          Size{" "}
          <div className="px-1 py-0.5 ml-1 text-fg_below_color">({token})</div>
        </div>
        <div className="flex items-center justify-center flex-grow text-[12px]  text-fg_below_color">
          Total(USDC)
        </div>
      </div>
      <div className="overflow-x-hidden overflow-y-scroll table_contents ">
        {/* ASK QUEUE */}
        <div className="h-[120px] overflow-y-scroll table_contents">
          {askQueue.length > 0
            ? askQueue.map((order, index) => {
                let amount =
                  order.amount /
                  10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]];

                return (
                  <div className="flex" key={index}>
                    <div className="flex items-center justify-center flex-grow py-1 text-base  text-red">
                      {order.price.toFixed(2)}
                    </div>
                    <div className="flex items-center justify-center flex-grow py-1 text-base">
                      {amount.toFixed(3)}
                    </div>
                    <div className="flex items-center justify-center flex-grow py-1 text-sm">
                      {(amount * order.price).toFixed(2)}
                    </div>
                  </div>
                );
              })
            : null}
        </div>

        {/* SPREAD */}
        <div className="flex p-1 border-y-2 border-y-border_color">
          <div className="flex justify-center flex-1">{spread.toFixed(2)}</div>
          <div className="flex justify-center flex-1">
            {spreadPercentage.toFixed(2) + "%"}
          </div>
          <div className="flex justify-center flex-1">Spread</div>
        </div>

        {/* BID QUEUE */}
        <div className="h-[120px] overflow-y-scroll table_contents">
          {bidQueue
            ? bidQueue.map((order, index) => {
                let amount =
                  order.amount /
                  10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]];

                return (
                  <div className="flex" key={index}>
                    <div className="flex items-center justify-center flex-grow py-1 text-base text-green">
                      {order.price.toFixed(2)}
                    </div>
                    <div className="flex items-center justify-center flex-grow py-1 text-base">
                      {amount.toFixed(3)}
                    </div>
                    <div className="flex items-center justify-center flex-grow py-1 text-sm">
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

// {bidQueue
//   ? bidQueue.map((order) => {
//       let color = "text-green_lighter";

//       let amount =
//         order.amount /
//         10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]];

//       return (
//         <div key={order.timestamp}>
//           <p className={classNames("pr-3 font-medium " + color)}>
//             {amount.toFixed(3)} {"----"} {order.price.toFixed(2)}{" "}
//             {"----"} {(amount * order.price).toFixed(3)}{" "}
//           </p>
//         </div>
//       );
//     })
//   : null}

// {askQueue
//   ? askQueue.map((order) => {
//       let color = "text-red";

//       let amount =
//         order.amount /
//         10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]];

//       console.log("amount: ", amount);

//       return (
//         <div key={order.timestamp}>
//           <p className={classNames("pr-3 font-medium " + color)}>
//             {amount.toFixed(3)} {"----"} {order.price.toFixed(2)}{" "}
//             {"----"}
//             {(amount * order.price).toFixed(3)}{" "}
//           </p>
//         </div>
//       );
//     })
//   : null}
