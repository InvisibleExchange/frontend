import React, { useContext, useReducer } from "react";
import classNames from "classnames";
import AdjustMarginModal from "./AdjustMarginModal";
import AdjustSizeModal from "./AdjustSizeModal";

import { WalletContext } from "../../../../context/WalletContext";

const {
  IDS_TO_SYMBOLS,
  DECIMALS_PER_ASSET,
  PRICE_DECIMALS_PER_ASSET,
  LEVERAGE_DECIMALS,
  COLLATERAL_TOKEN_DECIMALS,
} = require("../../../../app_logic/helpers/utils");

const Positions = (rerenderPage: any) => {
  let { user } = useContext(WalletContext);

  let positions: any[] = [];
  if (user && user.userId) {
    Object.values(user.positionData).forEach((posArr: any) => {
      posArr.forEach((val: any) => positions.push(val));
    });
  }

  return (
    <table className="w-full table-fixed">
      {/*  */}
      <thead className="text-fg_middle_color text-[13px] font-overpass text-left">
        <tr>
          <th className="py-2 pl-5 text-left font-overpass">Symbol</th>
          <th className="">Size</th>
          <th className="pr-3 ">Entry Price</th>
          <th className="pr-3 ">Mark Price</th>
          <th className="pr-3 ">Liq.Price</th>
          <th className="pr-3 ">Leverage</th>
          <th className="pr-3 ">Margin</th>
          <th className="pr-3 ">PNL(ROE %)</th>
          <th className="pr-3  w-96">Close All Positions</th>
        </tr>
      </thead>

      {/*  */}

      <tbody>
        {user && user.userId
          ? positions.map((pos) => {
              return (
                <tr
                  key={pos.position_address}
                  className={classNames(
                    "border-t cursor-pointer border-border_color hover:bg-border_color text-sm"
                  )}
                >
                  <td className="gap-3 py-1 pl-5 font-medium">
                    <p className="font-bold">
                      {IDS_TO_SYMBOLS[pos.synthetic_token] + "-PERP"}
                    </p>
                    <p className="text-[12px]">
                      ({pos.order_side.toLocaleUpperCase()})
                    </p>
                  </td>
                  <td className="font-medium">
                    <div className="flex items-center gap-2">
                      <p className="text-sm">
                        {(
                          pos.position_size /
                          10 ** DECIMALS_PER_ASSET[pos.synthetic_token]
                        ).toFixed(2)}{" "}
                        {IDS_TO_SYMBOLS[pos.synthetic_token]}
                      </p>
                      <AdjustSizeModal />
                    </div>
                  </td>
                  <td className={classNames("pr-3 font-medium ")}>
                    {(
                      pos.entry_price /
                      10 ** PRICE_DECIMALS_PER_ASSET[pos.synthetic_token]
                    ).toFixed(2)}
                  </td>
                  <td className={classNames("pr-3 font-medium ")}>
                    Mark Price
                  </td>
                  <td className={classNames("pr-3 font-medium ")}>
                    {(
                      pos.liquidation_price /
                      10 ** PRICE_DECIMALS_PER_ASSET[pos.synthetic_token]
                    ).toFixed(2)}
                  </td>
                  <td className={classNames("pr-3 font-medium ")}>Leverage</td>
                  <td className={classNames("pr-3 font-medium ")}>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-sm">
                          {(
                            pos.margin /
                            10 ** COLLATERAL_TOKEN_DECIMALS
                          ).toFixed(2)}{" "}
                          USDC
                        </p>
                        {/* <p className="text-[12px]">(Isolated)</p> */}
                      </div>
                      <AdjustMarginModal
                        position={pos}
                        forceRerender={rerenderPage.rerenderPage}
                      />
                    </div>
                  </td>
                  <td
                    className={classNames(
                      "pr-3 font-medium  text-green_lighter"
                    )}
                  >
                    <p>+PNL USDT</p>
                    <p className="text-[12px]">(+0.0%)</p>
                  </td>
                  <td className={classNames("pr-3 font-medium text-right")}>
                    <div className="flex items-center gap-1">
                      <p>Market</p> | <p>Limit</p>
                      <input
                        type="text"
                        className="w-20 pl-1 rounded-sm focus:outline focus:outline-yellow bg-border_color"
                      ></input>
                      <input
                        type="text"
                        className="w-20 pl-1 rounded-sm focus:outline focus:outline-yellow bg-border_color"
                      ></input>
                    </div>
                  </td>
                </tr>
              );
            })
          : null}
      </tbody>
    </table>
  );
};

export default Positions;
