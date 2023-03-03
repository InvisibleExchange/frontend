import React from "react";
import classNames from "classnames";

const FillHistory = () => {
  return (
    <table className="w-full table-fixed">
      <thead className="text-fg_middle_color text-[13px] font-overpass ">
        <tr>
          <th className="py-2 pl-3 font-medium text-left font-overpass">
            Amount
          </th>
          <th className="font-medium text-right">Price</th>
          <th className="pr-3 font-medium text-right">Base_asset</th>
          <th className="pr-3 font-medium text-right">Quote asset</th>
          <th className="pr-3 font-medium text-right">Type</th>
          <th className="pr-3 font-medium text-right">Time</th>
        </tr>
      </thead>
      <tbody>
        <tr
          className={classNames(
            "border-t cursor-pointer border-border_color hover:bg-border_color text-sm"
          )}
        >
          <td className="py-2.5 pl-3 font-medium  flex items-center gap-3">
            0.003 ETH
          </td>
          <td className="font-medium text-right dark:text-white text-fg_below_color">
            13.25
          </td>
          <td className={classNames("pr-3 font-medium text-right")}>ETH</td>
          <td className={classNames("pr-3 font-medium text-right")}>USDT</td>
          <th className="pr-3 font-medium text-right">Perpetual</th>
          <td className={classNames("pr-3 font-medium text-right")}>
            2023.2.23
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default FillHistory;
