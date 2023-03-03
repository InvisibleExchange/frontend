import React from "react";
import classNames from "classnames";

const Balances = () => {
  return (
    <table className="w-1/3 table-fixed">
      <thead className="text-fg_middle_color text-[13px] font-overpass ">
        <tr>
          <th className="py-2 pl-3 font-medium text-left font-overpass">
            Token
          </th>
          <th className="font-medium text-right">Token balance</th>
          <th className="pr-3 font-medium text-right">Available balance</th>
          <th className="pr-3 font-medium text-right">USD balance</th>
        </tr>
      </thead>
      <tbody>
        <tr
          className={classNames("cursor-pointer hover:bg-border_color text-sm")}
        >
          <td className="py-2.5 pl-3 font-medium  flex items-center gap-3">
            ETH
          </td>
          <td className="font-medium text-right dark:text-white text-fg_below_color">
            13.25
          </td>
          <td className={classNames("pr-3 font-medium text-right")}>13.25</td>
          <td className={classNames("pr-3 font-medium text-right")}>13.25</td>
        </tr>
        <tr
          className={classNames("cursor-pointer hover:bg-border_color text-sm")}
        >
          <td className="py-2.5 pl-3 font-medium  flex items-center gap-3">
            BTC
          </td>
          <td className="font-medium text-right dark:text-white text-fg_below_color">
            13.25
          </td>
          <td className={classNames("pr-3 font-medium text-right")}>13.25</td>
          <td className={classNames("pr-3 font-medium text-right")}>13.25</td>
        </tr>
      </tbody>
    </table>
  );
};

export default Balances;
