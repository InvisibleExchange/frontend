import React, { CSSProperties, useContext, useEffect, useState } from "react";

import { prettyBalance, prettyBalanceUSD } from "../../../../utils/utils";
import { TradeType } from "../BookTrades";
import classNames from "classnames";

const {
  fetchLatestFills,
} = require("../../../../app_logic/helpers/firebase/firebaseConnection");

const {
  SYMBOLS_TO_IDS,
  DECIMALS_PER_ASSET,
  PRICE_DECIMALS_PER_ASSET,
} = require("../../../../app_logic/helpers/utils");

interface Props {
  token: string;
  type: "perpetual" | "spot";
}

export default function Trades({ token, type }: Props) {
  let [fills, setFills] = useState<any>(null);

  useEffect(() => {
    const fetchFills = async () => {
      let fills_ = await fetchLatestFills(
        25,
        type == "perpetual",
        SYMBOLS_TO_IDS[token]
      );

      setFills(fills_);
    };

    // const interval = setInterval(() => {
    // TODO
    //   fetchFills();
    // }, 10000);

    fetchFills();

    // return () => clearInterval(interval);
  }, [token, type]);

  return (
    <div className="flex flex-col flex-1 mt-5 border rounded-sm h-[calc(50%-1.25rem)] border-border_color">
      <div className="px-4 py-3 text-sm tracking-wider font-overpass bg-fg_above_color">
        Market Trades
      </div>
      <div className="flex py-1 text-sm">
        <div className="flex items-center justify-center flex-grow text-[12px]  text-fg_below_color">
          Size <div className="px-1 py-0.5 ml-1 ">({token})</div>
        </div>
        <div className="flex items-center justify-center flex-grow text-[12px]  text-fg_below_color">
          Price <div className="px-1 py-0.5 ml-1 bg-border_color">(USDC)</div>
        </div>
        <div className="flex items-center justify-center flex-grow text-[12px]  text-fg_below_color">
          Time
        </div>
      </div>
      <div className="overflow-x-hidden overflow-y-scroll table_contents">
        {fills
          ? fills.map((fill: any) => {
              const timestamp = new Date(fill.timestamp * 1000);
              return (
                <div key={fill.timestamp + fill.user_id_a + fill.user_id_b}>
                  <p className={classNames("pr-3 font-medium")}>
                    {fill.amount /
                      10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]]}{" "}
                    ---{" "}
                    {fill.price /
                      10 **
                        PRICE_DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]]}{" "}
                    --- {timestamp.toLocaleTimeString()}
                  </p>
                </div>
              );
            })
          : null}
      </div>
    </div>
  );
}
