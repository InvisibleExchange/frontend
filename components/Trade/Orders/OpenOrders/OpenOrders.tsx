import React from "react";
import classNames from "classnames";

const OpenOrders = () => {
  return (
    <table className="w-full table-fixed">
      <thead className="text-fg_middle_color text-[13px] font-overpass ">
        <tr>
          <th className="py-2 pl-3 font-medium text-left font-overpass">
            Time
          </th>
          <th className="font-medium text-right">Type</th>
          <th className="font-medium text-right">Market</th>
          <th className="pr-3 font-medium text-right">Buy/Sell</th>
          <th className="pr-3 font-medium text-right">Price</th>
          <th className="pr-3 font-medium text-right">Filled</th>
          <th className="pr-3 font-medium text-right">Expiry</th>
          <th className="pr-3 font-medium text-right">Order status</th>
          <th className="pr-3 font-medium text-right">Action</th>
        </tr>
      </thead>
      <tbody>
        <tr
          className={classNames(
            "border-t cursor-pointer border-border_color hover:bg-border_color text-sm"
          )}
        >
          <td className="py-2.5 pl-3 font-medium  flex items-center gap-3">
            02/12/2023 00:00:00
          </td>
          <td className="font-medium text-right dark:text-white text-fg_below_color">
            Perpetual
          </td>
          <td className="font-medium text-right dark:text-white text-fg_below_color">
            ETH
          </td>
          <td className={classNames("pr-3 font-medium text-right")}>Buy</td>
          <td className={classNames("pr-3 font-medium text-right")}>19552</td>
          <td className={classNames("pr-3 font-medium text-right")}>filled</td>
          <td className={classNames("pr-3 font-medium text-right")}>
            02/12/2023 00:00:00
          </td>
          <td className={classNames("pr-3 font-medium text-right")}>Pending</td>
          <td className={classNames("pr-3 font-medium text-right")}>Close</td>
        </tr>
      </tbody>
    </table>
  );
};

export default OpenOrders;
