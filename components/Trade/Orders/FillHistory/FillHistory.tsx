import React, { useContext } from "react";
import classNames from "classnames";
import { WalletContext } from "../../../../context/WalletContext";

const {
  IDS_TO_SYMBOLS,
  DECIMALS_PER_ASSET,
  PRICE_DECIMALS_PER_ASSET,
} = require("../../../../app_logic/helpers/utils");

const FillHistory = () => {
  const { user } = useContext(WalletContext);
  // [{base_token, amount, price, side, time, isPerp}]

  return (
    <div className="block footer-table-wrp">
      <table className="w-full table-fixed">
        <thead className="text-fg_middle_color text-[13px] font-overpass bg-bg_color">
          <tr>
            <th className="py-2 pl-5  text-left font-overpass">Symbol</th>
            <th className="text-left">Side</th>
            <th className="text-left">Amount</th>
            <th className="text-left">Price</th>
            <th className="pr-3 text-left">Type</th>
            <th className="pr-3 text-left">Time</th>
            <th className="pr-3 text-left"></th>
          </tr>
        </thead>

        <tbody className="overflow-y-auto max-h-24">
          {user && user.userId
            ? user.fills.map((fill: any, idx) => {
                let color =
                  fill.side == "Buy" ? "text-green_lighter" : "text-red";

                const timestamp = new Date(fill.time * 1000);
                return (
                  <tr
                    key={idx}
                    className={classNames(
                      "border-t cursor-pointer border-border_color hover:bg-border_color text-sm"
                    )}
                  >
                    <td
                      className={classNames(
                        "py-2.5 pl-5 font-medium  flex items-center gap-3 " +
                          color
                      )}
                    >
                      {fill.isPerp
                        ? IDS_TO_SYMBOLS[fill.base_token].toString() + "-PERP"
                        : IDS_TO_SYMBOLS[fill.base_token].toString() + "/USDC"}
                    </td>
                    <td className="font-medium text-left dark:text-white text-fg_below_color">
                      {fill.side}
                    </td>
                    <td className={classNames("pr-3 font-medium text-left")}>
                      {(
                        fill.amount /
                        10 ** DECIMALS_PER_ASSET[fill.base_token]
                      ).toFixed(3)}{" "}
                      {IDS_TO_SYMBOLS[fill.base_token]}
                    </td>
                    <td className={classNames("pr-3 font-medium text-left")}>
                      {(
                        fill.price /
                        10 ** PRICE_DECIMALS_PER_ASSET[fill.base_token]
                      ).toFixed(2)}{" "}
                      USD
                    </td>
                    <td className="pr-3 font-medium text-left">
                      {fill.isPerp ? "PERPETUAL" : "SPOT"}
                    </td>
                    <td className={classNames("pr-3 font-medium ")}>
                      <p>{timestamp.toLocaleDateString()}</p>
                      <p className="text-[12px]">
                        {timestamp.toLocaleTimeString()}
                      </p>
                    </td>
                  </tr>
                );
              })
            : null}
        </tbody>
      </table>
    </div>
  );
};

export default FillHistory;
