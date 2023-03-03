import React from "react";
import classNames from "classnames";
import AdjustMarginModal from "./AdjustMarginModal";
import AdjustSizeModal from "./AdjustSizeModal";

const Positions = () => {
  return (
    <table className="w-full table-fixed">
      <thead className="text-fg_middle_color text-[13px] font-overpass text-left">
        <tr>
          <th className="py-2 pl-3 font-medium text-left font-overpass">
            Symbol
          </th>
          <th className="font-medium ">Size</th>
          <th className="pr-3 font-medium ">Entry Price</th>
          <th className="pr-3 font-medium ">Mark Price</th>
          <th className="pr-3 font-medium ">Liq.Price</th>
          <th className="pr-3 font-medium ">Margin Ratio</th>
          <th className="pr-3 font-medium ">Margin</th>
          <th className="pr-3 font-medium ">PNL(ROE %)</th>
          <th className="pr-3 font-medium w-96">Close All Positions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          className={classNames(
            "border-t cursor-pointer border-border_color hover:bg-border_color text-sm"
          )}
        >
          <td className="gap-3 py-1 pl-3 font-medium">
            <p className="font-bold">ETHUSDT</p>
            <p className="text-[12px]">(Perpetual)</p>
          </td>
          <td className="font-medium ">
            <div className="flex items-center gap-2">
              <p className="text-sm">0.993 ETH</p>
              <AdjustSizeModal />
            </div>
          </td>
          <td className={classNames("pr-3 font-medium ")}>1,475.53</td>
          <td className={classNames("pr-3 font-medium ")}>1,675.66</td>
          <td className={classNames("pr-3 font-medium ")}>--</td>
          <td className={classNames("pr-3 font-medium ")}>0.05%</td>
          <td className={classNames("pr-3 font-medium ")}>
            <div className="flex items-center gap-2">
              <div>
                <p className="text-sm">83.10 USDT</p>
                <p className="text-[12px]">(Isolated)</p>
              </div>
              <AdjustMarginModal />
            </div>
          </td>
          <td className={classNames("pr-3 font-medium  text-green_lighter")}>
            <p>+196.87USDT</p>
            <p className="text-[12px]">(+236.79%)</p>
          </td>
          <td className={classNames("pr-3 font-medium text-right ")}>
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
      </tbody>
    </table>
  );
};

export default Positions;
