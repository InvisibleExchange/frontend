import React, { useContext, useEffect } from "react";
import classNames from "classnames";
import { UserContext } from "../../../../context/UserContext";

import btcLogo from "../../../../public/tokenIcons/bitcoin.png";
import ethLogo from "../../../../public/tokenIcons/ethereum-eth-logo.png";
import usdcLogo from "../../../../public/tokenIcons/usdc-logo.png";
import solLogo from "../../../../public/tokenIcons/solanaLogo.png";
import Image from "next/image";

const tokenLogos = {
  453755560: ethLogo,
  3592681469: btcLogo,
  2413654107: usdcLogo,
  277158171: solLogo,
};

const {
  IDS_TO_SYMBOLS,
  DECIMALS_PER_ASSET,
  PRICE_DECIMALS_PER_ASSET,
  PRICE_ROUNDING_DECIMALS,
  SIZE_ROUNDING_DECIMALS,
} = require("../../../../app_logic/helpers/utils");

const FillHistory = () => {
  const { user } = useContext(UserContext);

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

                let priceRoundingDecimals =
                  PRICE_ROUNDING_DECIMALS[fill.base_token];
                let sizeRoundingDecimals =
                  SIZE_ROUNDING_DECIMALS[fill.base_token];

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
                      <div className="flex">
                        {/* <img
                          src={tokenLogos[fill.base_token].src}
                          alt="Currency Logo"
                          className="logo_icon"
                        /> */}
                        <Image
                          src={tokenLogos[fill.base_token].src}
                          alt="Currency Logo"
                          width={25}
                          height={20}
                          style={{
                            objectFit: "contain",
                            marginLeft: "1rem",
                            marginRight: "1rem",
                          }}
                        />
                        <p className="pt-1">
                          {fill.isPerp
                            ? IDS_TO_SYMBOLS[fill.base_token].toString() +
                              "-PERP"
                            : IDS_TO_SYMBOLS[fill.base_token].toString() +
                              "/USDC"}
                        </p>
                      </div>
                    </td>
                    <td className="font-medium text-left dark:text-white text-fg_below_color">
                      {fill.side}
                    </td>
                    <td className={classNames("pr-3 font-medium text-left")}>
                      {(
                        fill.amount /
                        10 ** DECIMALS_PER_ASSET[fill.base_token]
                      ).toFixed(sizeRoundingDecimals)}{" "}
                      {IDS_TO_SYMBOLS[fill.base_token]}
                    </td>
                    <td className={classNames("pr-3 font-medium text-left")}>
                      {(
                        fill.price /
                        10 ** PRICE_DECIMALS_PER_ASSET[fill.base_token]
                      ).toFixed(priceRoundingDecimals)}{" "}
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
