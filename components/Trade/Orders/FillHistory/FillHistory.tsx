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
    <table className="w-full table-fixed">
      <thead className="text-fg_middle_color text-[13px] font-overpass ">
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

      {user && user.userId
        ? user.fills.map((fill: any) => {
            let id = fill.time + Math.round(Math.random() * 1000);

            return (
              <tbody key={id}>
                <tr
                  className={classNames(
                    "border-t cursor-pointer border-border_color hover:bg-border_color text-sm"
                  )}
                >
                  <td className="py-2.5 pl-5 font-medium  flex items-center gap-3">
                    {fill.isPerp
                      ? IDS_TO_SYMBOLS[fill.base_token].toString() + "-PERP"
                      : IDS_TO_SYMBOLS[fill.base_token].toString() + "/USDC"}
                  </td>
                  <td className="font-medium text-left dark:text-white text-fg_below_color">
                    {fill.side}
                  </td>
                  <td className={classNames("pr-3 font-medium text-left")}>
                    {fill.amount / 10 ** DECIMALS_PER_ASSET[fill.base_token]}{" "}
                    {IDS_TO_SYMBOLS[fill.base_token]}
                  </td>
                  <td className={classNames("pr-3 font-medium text-left")}>
                    {fill.price /
                      10 ** PRICE_DECIMALS_PER_ASSET[fill.base_token]}{" "}
                    USD
                  </td>
                  <td className="pr-3 font-medium text-left">
                    {fill.isPerp ? "PERPETUAL" : "SPOT"}
                  </td>
                  <td className={classNames("pr-3 font-medium text-left")}>
                    {fill.time} format!
                  </td>
                </tr>
              </tbody>
            );
          })
        : null}
    </table>
  );
};

export default FillHistory;
