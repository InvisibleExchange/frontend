import React, { useContext, useState } from "react";
import classNames from "classnames";
import AdjustMarginModal from "./AdjustMarginModal";
import CloseModal from "./CloseModal";

import btcLogo from "../../../../public/tokenIcons/bitcoin.png";
import ethLogo from "../../../../public/tokenIcons/ethereum-eth-logo.png";
import { UserContext } from "../../../../context/UserContext";

const {
  IDS_TO_SYMBOLS,
  DECIMALS_PER_ASSET,
  PRICE_DECIMALS_PER_ASSET,
  LEVERAGE_DECIMALS,
  COLLATERAL_TOKEN_DECIMALS,
} = require("../../../../app_logic/helpers/utils");

const {
  sendPerpOrder,
} = require("../../../../app_logic/transactions/constructOrders");

const {
  getCurrentLeverage,
} = require("../../../../app_logic/helpers/tradePriceCalculations");

const Positions = () => {
  let {
    user,
    getMarkPrice,
    setSelectedPosition,
    setToastMessage,
    tokenFundingInfo,
  } = useContext(UserContext);

  let positions: any[] = [];
  if (user && user.userId) {
    Object.values(user.positionData).forEach((posArr: any) => {
      posArr.forEach((val: any) => positions.push(val));
    });
  }

  return (
    <div className="block footer-table-wrp">
      <table className="w-full table-fixed">
        {/*  */}
        <thead className="text-fg_middle_color text-[13px] font-overpass text-left bg-bg_color">
          <tr>
            <th className="py-2 pl-5 text-left font-overpass">Symbol</th>
            <th className="">Size</th>
            <th className="pr-3 ">Avg. Entry Price</th>
            <th className="pr-3 ">Mark Price</th>
            <th className="pr-3 ">Liq.Price</th>
            <th className="pr-3 ">Leverage</th>
            <th className="pr-3 ">Margin</th>
            <th className="pr-3 ">Unrealized PNL(%)</th>
            <th className="pr-3 ">Realized PNL(%)</th>
            <th className="pr-3"></th>
          </tr>
        </thead>

        {/*  */}

        <tbody className="overflow-y-auto max-h-24">
          {/* */}
          {user && user.userId
            ? positions.map((pos, idx) => {
                let markPrice = getMarkPrice(
                  pos.position_header.synthetic_token,
                  true
                );
                let entryPrice =
                  pos.entry_price /
                  10 **
                    PRICE_DECIMALS_PER_ASSET[
                      pos.position_header.synthetic_token
                    ];
                let size =
                  pos.position_size /
                  10 ** DECIMALS_PER_ASSET[pos.position_header.synthetic_token];
                let margin = pos.margin / 10 ** COLLATERAL_TOKEN_DECIMALS;

                let pnl =
                  pos.order_side == "Long"
                    ? (markPrice - entryPrice) * size
                    : (entryPrice - markPrice) * size;
                let pnlPercent = (pnl / margin) * 100;

                let symbolColor =
                  pos.order_side == "Long" ? "text-green_lighter" : "text-red";
                let pnlColor = pnl >= 0 ? "text-green_lighter" : "text-red";

                let { fundingPrices, fundingRates } = tokenFundingInfo;

                let fundingPnl = calculateFundingPnl(
                  pos,
                  fundingRates[pos.position_header.synthetic_token],
                  fundingPrices[pos.position_header.synthetic_token]
                );
                let fundingPnlPercent = (fundingPnl / margin) * 100;

                let logo;

                switch (pos.position_header.synthetic_token) {
                  case 12345:
                    logo = btcLogo;
                    break;

                  case 54321:
                    logo = ethLogo;
                    break;

                  default:
                    break;
                }

                return (
                  <tr
                    key={idx}
                    className={classNames(
                      "border-t cursor-pointer border-border_color hover:bg-border_color text-sm"
                    )}
                    onClick={() => {
                      setSelectedPosition(pos);
                    }}
                  >
                    <td className={classNames("gap-3 py-1 pl-5 font-medium")}>
                      <p
                        className={classNames(
                          "font-bold " + symbolColor.toString()
                        )}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <img
                            src={logo.src}
                            alt="Currency Logo"
                            className="logo_icon"
                          />
                          <div className="ml-3">
                            {IDS_TO_SYMBOLS[
                              pos.position_header.synthetic_token
                            ] + "-PERP"}
                            <p
                              className={classNames(
                                "text-[12px] " + symbolColor.toString()
                              )}
                              style={{
                                fontStyle: "italic",
                              }}
                            >
                              ({pos.order_side})
                            </p>
                          </div>
                        </div>
                      </p>
                    </td>
                    <td className="font-medium ">
                      <div className="flex items-center gap-2">
                        <p className="text-sm">
                          {size.toFixed(3)}{" "}
                          {IDS_TO_SYMBOLS[pos.position_header.synthetic_token]}
                        </p>
                        {/* <AdjustSizeModal /> */}
                      </div>
                    </td>
                    {/*  */}
                    <td className={classNames("pr-3 font-medium")}>
                      {entryPrice.toFixed(2)}
                    </td>
                    {/*  */}
                    <td className={classNames("pr-3 font-medium ")}>
                      {markPrice.toFixed(2)} USD
                    </td>
                    {/*  */}
                    <td className={classNames("pr-3 font-medium ")}>
                      {(
                        pos.liquidation_price /
                        10 **
                          PRICE_DECIMALS_PER_ASSET[
                            pos.position_header.synthetic_token
                          ]
                      ).toFixed(2)}{" "}
                      USD
                    </td>
                    {/*  */}
                    <td className={classNames("pr-3 font-medium ")}>
                      {getCurrentLeverage(markPrice, size, margin).toFixed(2)}
                    </td>
                    {/*  */}
                    <td className={classNames("pr-3 font-medium ")}>
                      <div className="flex items-center gap-2">
                        <div>
                          <p
                            className="text-sm"
                            style={{
                              color: "whitesmoke",
                              fontWeight: "bold",
                              textShadow: "2px 2px 0px rgba(0, 0, 0, 0.5)",
                            }}
                          >
                            {margin.toFixed(2)} USDC
                          </p>
                          {/* <p className="text-[12px]">(Isolated)</p> */}
                        </div>
                        <AdjustMarginModal position={pos} />
                      </div>
                    </td>
                    {/* Unrealized PNL */}
                    <td
                      className={classNames("pr-3 font-medium " + pnlColor)}
                      style={{
                        fontStyle: "italic",
                      }}
                    >
                      <p>{pnl.toFixed(2)} USD</p>
                      <p className="text-[12px]">({pnlPercent.toFixed(2)}%)</p>
                    </td>
                    {/* Realized PNL */}
                    <td
                      className={classNames("pr-3 font-medium " + pnlColor)}
                      style={{
                        fontStyle: "italic",
                      }}
                    >
                      <p>{fundingPnl.toFixed(2)} USD</p>
                      <p className="text-[12px]">
                        ({fundingPnlPercent.toFixed(2)}%)
                      </p>
                    </td>
                    {/* Close Button */}
                    <td className={classNames("pr-3")}>
                      <CloseModal
                        position={pos}
                        setToastMessage={setToastMessage}
                      ></CloseModal>
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

export default Positions;

function calculateFundingPnl(positionData, fundingRates, prices) {
  let applicableFundingRates =
    fundingRates && fundingRates.length > 0
      ? fundingRates.slice(positionData.last_funding_index)
      : [];
  let applicablePrices =
    prices && prices.length > 0
      ? prices.slice(positionData.last_funding_index)
      : [];
  let size =
    positionData.position_size /
    10 ** DECIMALS_PER_ASSET[positionData.position_header.synthetic_token];

  let fundingSum = 0;
  for (let i = 0; i < applicableFundingRates.length; i++) {
    let fundingRate = applicableFundingRates[i] / 100_000;
    let fundingPrice =
      applicablePrices[i] /
      10 **
        PRICE_DECIMALS_PER_ASSET[positionData.position_header.synthetic_token];

    let funding = size * fundingRate;
    let fundingInUsd = funding * fundingPrice;
    fundingSum += fundingInUsd;
  }

  return fundingSum;
}
