import React from "react";

import classNames from "classnames";

const {
  SYMBOLS_TO_IDS,
  DECIMALS_PER_ASSET,
  PRICE_DECIMALS_PER_ASSET,
  PRICE_ROUNDING_DECIMALS,
  SIZE_ROUNDING_DECIMALS,
} = require("../../../../app_logic/helpers/utils");

interface Props {
  token: string;
  type: "perpetual" | "spot";
  fills: any[];
}

export default function Trades({ token, type, fills }: Props) {
  let priceRoundingDecimals = PRICE_ROUNDING_DECIMALS[SYMBOLS_TO_IDS[token]];
  let sizeRoundingDecimals = SIZE_ROUNDING_DECIMALS[SYMBOLS_TO_IDS[token]];

  return (
    <div className="flex flex-col flex-1 mt-2 border rounded-sm h-[calc(36%-1.25rem)] border-border_color">
      <div className="px-4 py-2 text-sm tracking-wider font-overpass bg-fg_above_color">
        Latest Fills
      </div>
      <div className="flex py-0.5 text-sm">
        <div className="flex items-center justify-center flex-grow text-[12px]  text-fg_below_color">
          Size <div className="px-1 py-0.5 ml-1 ">({token})</div>
        </div>
        <div className="flex items-center justify-center flex-grow text-[12px]  text-fg_below_color">
          Price <div className="px-1 ml-1 bg-border_color">(USDC)</div>
        </div>
        <div className="flex items-center justify-center flex-grow text-[12px]  text-fg_below_color">
          Time
        </div>
      </div>
      <div className="overflow-x-hidden overflow-y-scroll table_contents">
        {fills
          ? fills.map((fill: any, index: number) => {
              const timestamp = new Date(fill.timestamp * 1000);

              let amount =
                fill.amount / 10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]];

              let price =
                fill.price /
                10 ** PRICE_DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]];

              let color = fill.is_buy ? "text-green_lighter" : "text-red";

              return (
                <div className="flex" key={index}>
                  <div
                    className={classNames(
                      "flex items-center justify-center flex-grow py-0.5 text-sm " +
                        color
                    )}
                  >
                    {amount.toFixed(sizeRoundingDecimals)}
                  </div>
                  <div className="flex items-center justify-center flex-grow py-0.5 text-sm ">
                    {price.toFixed(priceRoundingDecimals)}
                  </div>
                  <div className="flex items-center justify-center flex-grow py-0.5 text-sm ">
                    {timestamp.toLocaleTimeString()}
                  </div>
                </div>
              );
            })
          : null}
      </div>
    </div>
  );
}
