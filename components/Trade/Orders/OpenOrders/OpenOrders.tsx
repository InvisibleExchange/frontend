import React, { useContext } from "react";
import classNames from "classnames";
import { WalletContext } from "../../../../context/WalletContext";
import LoadingSpinner from "../../../Layout/LoadingSpinner/LoadingSpinner";

//
import { FaTrashAlt } from "react-icons/fa";

const {
  IDS_TO_SYMBOLS,
  DECIMALS_PER_ASSET,
  SPOT_MARKET_IDS,
  PERP_MARKET_IDS,
  COLLATERAL_TOKEN,
} = require("../../../../app_logic/helpers/utils");

const {
  sendCancelOrder,
} = require("../../../../app_logic/transactions/constructOrders");

const OpenOrders = () => {
  const { user, forceRerender } = useContext(WalletContext);

  let [cancelling, setCancelling] = React.useState(false);

  const cancelOrder = async (
    orderId: any,
    orderSide: boolean,
    isPerp: boolean,
    token: any
  ) => {
    setCancelling(true);

    let marketId: any;
    if (isPerp) {
      marketId = PERP_MARKET_IDS[token];
    } else {
      marketId = SPOT_MARKET_IDS[token];
    }

    await sendCancelOrder(user, orderId, orderSide, isPerp, marketId);

    setCancelling(false);
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
            <th className="pr-3">Cancel</th>
          </tr>
        </thead>

        {/*  */}

        {user && user.userId
          ? orders.map((order: any, idx) => {
              const isPerp = order.synthetic_token ? true : false;

              const expiry = new Date(
                Number(order.expiration_timestamp) * 3600 * 1000
              );
              let baseAsset = isPerp ? order.synthetic_token : order.base_asset;

              let receivedToken = isPerp
                ? order.synthetic_token
                : order.order_side === 1 || order.order_side === false
                ? order.quote_asset
                : order.base_asset;

              let color =
                order.order_side === 1 || order.order_side === false
                  ? "text-red"
                  : "text-green_lighter";
              return (
                <tbody key={idx} className="overflow-y-auto max-h-24">
                  <tr
                    className={classNames(
                      "border-t cursor-pointer border-border_color hover:bg-border_color text-sm"
                    )}
                  >
                    {/* SYMBOL */}
                    <td
                      className={classNames(
                        "gap-3 py-1 pl-5 font-medium " + color
                      )}
                    >
                      <p className="font-bold">
                        {IDS_TO_SYMBOLS[baseAsset]}
                        {isPerp ? "-PERP" : "/USDC"}
                      </p>
                      {/* <p className="text-[12px]">(Perpetual)</p> */}
                    </td>
                    {/* Market type */}
                    <td className="font-medium">
                      {isPerp ? "PERPETUAL" : "SPOT"}
                    </td>
                    {/* Buy sell */}
                    <td className={classNames("pr-3 font-medium")}>
                      {order.order_side === 1 || order.order_side === false
                        ? isPerp
                          ? "Short"
                          : "Sell"
                        : isPerp
                        ? "Long"
                        : "Buy"}
                    </td>
                    {/* Price */}
                    <td className={classNames("pr-3 font-medium")}>
                      {Number(order.price).toFixed(2)} USD
                    </td>
                    {/* Amount */}
                    <td className={classNames("pr-3 font-medium ")}>
                      {(
                        Number(order.qty_left) /
                        10 ** DECIMALS_PER_ASSET[receivedToken]
                      ).toFixed(3)}{" "}
                      {IDS_TO_SYMBOLS[receivedToken]}
                    </td>

                    {/* Action */}
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
                    {/* Expiry */}
                    <td className={classNames("pr-3 font-medium ")}>
                      <p>{expiry.toLocaleDateString()}</p>
                      <p className="text-[12px]">
                        {expiry.toLocaleTimeString()}
                      </p>
                    </td>
                    {/* Fee Limit */}
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
                    {/* Cancel order */}
                    <td className={classNames("pl-3 font-medium ")}>
                      {!cancelling ? (
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
                      ) : (
                        <LoadingSpinner />
                      )}
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
