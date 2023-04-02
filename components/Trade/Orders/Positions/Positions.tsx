import React, { useContext, useState } from "react";
import classNames from "classnames";
import AdjustMarginModal from "./AdjustMarginModal";

import { WalletContext } from "../../../../context/WalletContext";

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

const Positions = () => {
  let { user, getMarkPrice, setSelectedPosition, forceRerender } =
    useContext(WalletContext);

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
            <th className="pr-3 ">PNL(ROE %)</th>
            <th className="pr-3  w-96">Close All Positions</th>
          </tr>
        </thead>

        {/*  */}

        <tbody className="overflow-y-auto max-h-24">
          {/* */}
          {user && user.userId
            ? positions.map((pos, idx) => {
                let markPrice = getMarkPrice(pos.synthetic_token, true);
                let entryPrice =
                  pos.entry_price /
                  10 ** PRICE_DECIMALS_PER_ASSET[pos.synthetic_token];
                let size =
                  pos.position_size /
                  10 ** DECIMALS_PER_ASSET[pos.synthetic_token];
                let margin = pos.margin / 10 ** COLLATERAL_TOKEN_DECIMALS;

                let pnl =
                  pos.order_side == "Long"
                    ? (markPrice - entryPrice) * size
                    : (entryPrice - markPrice) * size;
                let pnlPercent = (pnl / margin) * 100;

                let symbolColor =
                  pos.order_side == "Long" ? "text-green_lighter" : "text-red";
                let pnlColor = pnl >= 0 ? "text-green_lighter" : "text-red";

                return (
                  <tr
                    key={idx}
                    className={classNames(
                      "border-t cursor-pointer border-border_color hover:bg-border_color text-sm"
                    )}
                    onClick={() => {
                      setSelectedPosition(pos);
                      // setSelectedType("perpetual");
                      // setSelectedMarket(token2Market[pos.synthetic_token]);
                      // console.log("pos", pos);
                    }}
                  >
                    <td className={classNames("gap-3 py-1 pl-5 font-medium")}>
                      <p
                        className={classNames(
                          "font-bold " + symbolColor.toString()
                        )}
                      >
                        {IDS_TO_SYMBOLS[pos.synthetic_token] + "-PERP"}
                      </p>
                      <p
                        className={classNames(
                          "text-[12px] " + symbolColor.toString()
                        )}
                      >
                        ({pos.order_side})
                      </p>
                    </td>
                    <td className="font-medium ">
                      <div className="flex items-center gap-2">
                        <p className="text-sm">
                          {size.toFixed(3)}{" "}
                          {IDS_TO_SYMBOLS[pos.synthetic_token]}
                        </p>
                        {/* <AdjustSizeModal /> */}
                      </div>
                    </td>
                    <td className={classNames("pr-3 font-medium")}>
                      {entryPrice.toFixed(2)}
                    </td>
                    <td className={classNames("pr-3 font-medium ")}>
                      {markPrice.toFixed(2)} USD
                    </td>
                    <td className={classNames("pr-3 font-medium ")}>
                      {(
                        pos.liquidation_price /
                        10 ** PRICE_DECIMALS_PER_ASSET[pos.synthetic_token]
                      ).toFixed(2)}{" "}
                      USD
                    </td>
                    <td className={classNames("pr-3 font-medium ")}>
                      Leverage
                    </td>
                    <td className={classNames("pr-3 font-medium ")}>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-sm">{margin.toFixed(2)} USDC</p>
                          {/* <p className="text-[12px]">(Isolated)</p> */}
                        </div>
                        <AdjustMarginModal position={pos} />
                      </div>
                    </td>
                    <td className={classNames("pr-3 font-medium " + pnlColor)}>
                      <p>{pnl.toFixed(2)} USD</p>
                      <p className="text-[12px]">({pnlPercent.toFixed(2)}%)</p>
                    </td>
                    {/*  */}
                    <CloseField
                      user={user}
                      marketPrice={getMarkPrice(pos.synthetic_token, true)}
                      pos={pos}
                      forceRerender={forceRerender}
                    />
                    {/*  */}
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

const CloseField = ({ user, marketPrice, pos, forceRerender }: any) => {
  const [closeQty, setCloseQty] = useState<number | null>(null);
  const [closePrice, setClosePrice] = useState<number | null>(null);

  const onChangeQty = (e: any) => {
    if (!e.target.value) {
      setCloseQty(null);
      return;
    }

    let qty_ = parseFloat(e.target.value);

    qty_ = Math.max(0, qty_);
    qty_ = Math.min(
      qty_,
      pos.position_size / 10 ** DECIMALS_PER_ASSET[pos.synthetic_token]
    );

    setCloseQty(qty_);
  };

  const onSumbitCloseOrder = async (isMarket: boolean) => {
    try {
      console.log("pos.order_side", pos.order_side);

      await sendPerpOrder(
        user,
        pos.order_side == "Long" ? "Short" : "Long",
        1000, // expiration time in hours
        "Close",
        pos.position_address, // position address
        pos.synthetic_token, //token
        closeQty, //amount
        // Todo: isMarket ? marketPrice : closePrice,
        isMarket ? 1000 : closePrice, // close price
        0, // initial margin
        0.07, // fee_limit %
        3, // slippage %
        isMarket
      );
    } catch (error) {
      alert(error);
    }
  };

  return (
    <td className={classNames("pr-3 font-medium text-right")}>
      <div className="flex items-center gap-1">
        <button
          onClick={async () => {
            await onSumbitCloseOrder(true);
            forceRerender();
          }}
        >
          Market
        </button>
        |{" "}
        <button
          onClick={async () => {
            await onSumbitCloseOrder(false);
            forceRerender();
          }}
        >
          Limit
        </button>
        <input
          className="w-20 pl-1 rounded-sm focus:outline focus:outline-yellow bg-border_color"
          placeholder="price"
          type="number"
          step={0.01}
          value={closePrice?.toString()}
          onChange={(e) => {
            setClosePrice(parseFloat(e.target.value));
          }}
        ></input>
        <input
          className="w-20 pl-1 rounded-sm focus:outline focus:outline-yellow bg-border_color"
          placeholder="qty"
          type="number"
          step={0.001}
          value={closeQty?.toString()}
          onChange={onChangeQty}
        ></input>
      </div>
    </td>
  );
};
