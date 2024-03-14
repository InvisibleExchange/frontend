import React, { use, useContext, useEffect } from "react";
import classNames from "classnames";
import LoadingSpinner from "../../../Layout/LoadingSpinner/LoadingSpinner";

//
import { FaTrashAlt } from "react-icons/fa";
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
  SPOT_MARKET_IDS,
  PERP_MARKET_IDS,
  COLLATERAL_TOKEN,
  PRICE_ROUNDING_DECIMALS,
  SIZE_ROUNDING_DECIMALS,
} = require("../../../../app_logic/helpers/utils");

const {
  sendCancelOrder,
} = require("../../../../app_logic/transactions/constructOrders");

const OpenOrders = () => {
  const { user, forceRerender } = useContext(UserContext);

  const cancelOrder = async (
    orderId: any,
    orderSide: boolean,
    isPerp: boolean,
    token: any
  ) => {
    let marketId: any;
    if (isPerp) {
      marketId = PERP_MARKET_IDS[token];
    } else {
      marketId = SPOT_MARKET_IDS[token];
    }

    await sendCancelOrder(user, orderId, orderSide, isPerp, marketId);

    user.orders = user.orders.filter((order) => {
      return order.order_id != orderId;
    });
  };

  let orders: any[] = [];
  if (user) {
    orders = [...user.orders];
    orders = orders.concat(user.perpetualOrders);
    orders.sort((a: any, b: any) => {
      return a.expiration_timestamp - b.expiration_timestamp;
    });
  }

  return (
    <div className="block footer-table-wrp">
      <table className="w-full table-fixed">
        <thead className="text-fg_middle_color text-[13px] font-overpass text-left bg-bg_color">
          <tr>
            <th className="py-2 pl-5 text-left font-overpass">Symbol</th>
            <th className="">Market Type</th>
            <th className="pr-3">Buy/Sell</th>
            <th className="pr-3">Price</th>
            <th className="pr-3">Base Amount</th>
            <th className="pr-3">Action</th>
            <th className="pr-3">Expiry</th>
            <th className="pr-3">Fee Limit</th>
            <th className="pr-3">
              <button
                disabled={!orders || orders.length == 0}
                style={{
                  fontWeight: 900,
                  opacity: !orders || orders.length == 0 ? 0.7 : 1,
                }}
                className="mb-1 hover:opacity-70 text-red"
                onClick={async () => {
                  await cancelAllOrders(user, orders);
                  forceRerender();
                }}
              >
                Cancel All
              </button>
            </th>
          </tr>
        </thead>

        {/*  */}

        {user && user.userId
          ? orders.map((order: any, idx) => {
              const isPerp = order.synthetic_token ? true : false;

              const expiry = new Date(
                Number(order.expiration_timestamp) * 1000
              );
              let baseAsset = isPerp ? order.synthetic_token : order.base_asset;

              let receivedToken = isPerp
                ? order.synthetic_token
                : order.order_side
                ? order.base_asset
                : order.quote_asset;

              let color = !order.order_side ? "text-red" : "text-green_lighter";

              let priceRoundingDecimals = PRICE_ROUNDING_DECIMALS[baseAsset];
              let sizeRoundingDecimals = SIZE_ROUNDING_DECIMALS[baseAsset];

              return (
                <tbody key={idx} className="overflow-y-auto max-h-24">
                  <tr
                    className={classNames(
                      "border-t cursor-pointer border-border_color hover:bg-border_color text-sm"
                    )}
                  >
                    {/* SYMBOL  ==================*/}
                    <td
                      className={classNames(
                        "gap-3 py-1 pl-5 font-medium " + color
                      )}
                    >
                      <div className="flex">
                        {/* <img
                          src={tokenLogos[baseAsset].src}
                          alt="Currency Logo"
                          className="logo_icon"
                        /> */}
                        <Image
                          src={tokenLogos[baseAsset].src}
                          alt="Currency Logo"
                          width={25}
                          height={20}
                          style={{
                            objectFit: "contain",
                            marginLeft: "1rem",
                            marginRight: "1rem",
                          }}
                        />
                        <p className="font-bold">
                          {IDS_TO_SYMBOLS[baseAsset]}
                          {isPerp ? "-PERP" : "/USDC"}
                        </p>
                      </div>

                      {/* <p className="text-[12px]">(Perpetual)</p> */}
                    </td>
                    {/* Market type  ============*/}
                    <td className="font-medium">
                      {isPerp ? "PERPETUAL" : "SPOT"}
                    </td>
                    {/* Buy sell  ============*/}
                    <td className={classNames("pr-3 font-medium")}>
                      {!order.order_side
                        ? isPerp
                          ? "Short"
                          : "Sell"
                        : isPerp
                        ? "Long"
                        : "Buy"}
                    </td>
                    {/* Price ============= */}
                    <td className={classNames("pr-3 font-medium")}>
                      {Number(order.price).toFixed(priceRoundingDecimals)} USD
                    </td>
                    {/* Amount  =============*/}
                    <td className={classNames("pr-3 font-medium ")}>
                      {(
                        Number(order.qty_left) /
                        10 ** DECIMALS_PER_ASSET[receivedToken]
                      ).toFixed(sizeRoundingDecimals)}{" "}
                      {IDS_TO_SYMBOLS[receivedToken]}
                    </td>

                    {/* Action ============= */}
                    <td className={classNames("pr-3 font-medium ")}>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-sm">
                            {isPerp
                              ? getPosEffectType(order.position_effect_type)
                              : "Swap"}
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* Expiry  =============*/}
                    <td className={classNames("pr-3 font-medium ")}>
                      <p>{expiry.toLocaleDateString()}</p>
                      <p className="text-[12px]">
                        {expiry.toLocaleTimeString()}
                      </p>
                    </td>
                    {/* Fee Limit =================*/}
                    <td className={classNames("pr-3 font-medium ")}>
                      {order.fee_limit /
                        10 **
                          DECIMALS_PER_ASSET[
                            isPerp ? COLLATERAL_TOKEN : receivedToken
                          ]}{" "}
                      {
                        IDS_TO_SYMBOLS[
                          isPerp ? COLLATERAL_TOKEN : receivedToken
                        ]
                      }
                    </td>
                    {/* Cancel order ==================*/}
                    <td className={classNames("pl-3 font-medium ")}>
                      <button
                        onClick={async () => {
                          await cancelOrder(
                            order.order_id,
                            order.order_side,
                            isPerp,
                            isPerp ? order.synthetic_token : baseAsset
                          );
                          forceRerender();
                        }}
                      >
                        <FaTrashAlt color="#C83131" size={20} />
                      </button>
                      {/* {!cancelling ? () : (
                        <LoadingSpinner />
                      )} */}
                    </td>
                  </tr>
                </tbody>
              );
            })
          : null}

        {/*  */}
      </table>
    </div>
  );
};

export default OpenOrders;

function getPosEffectType(position_effect_type: number) {
  switch (position_effect_type) {
    case 0:
      return "Open Position";

    case 1:
      return "Modify Position";

    case 2:
      return "Close Position";

    case 3:
      return "Liquidate Position";

    default:
      throw Error("invalid pos_effect_type");
  }
}

async function cancelAllOrders(user, orders) {
  for (let order of orders) {
    let isPerp = !!order.synthetic_token;

    let marketId: any;
    if (isPerp) {
      marketId = PERP_MARKET_IDS[order.synthetic_token];
    } else {
      marketId = SPOT_MARKET_IDS[order.base_asset];
    }

    await sendCancelOrder(
      user,
      order.order_id,
      order.order_side,
      isPerp,
      marketId
    );
  }
}
