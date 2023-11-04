import React from "react";
import { formatInputNum } from "../Trade/TradeActions/ActionPanel/TradeFormHelpers/FormHelpers";

const {
  SIZE_ROUNDING_DECIMALS,
  // PRICE_ROUNDING_DECIMALS,
} = require("../../app_logic/helpers/utils");

const AmountInput = ({ selected, setAmount, amount, tokenBalance }: any) => {
  let sizeRoundDec = SIZE_ROUNDING_DECIMALS[selected.id];

  tokenBalance = tokenBalance
    ? formatInputNum(Number(tokenBalance).toFixed(sizeRoundDec), sizeRoundDec)
    : 0.0;

  return (
    <div className="mt-5 ">
      <div className="flex items-center justify-end gap-2">
        <p className="text-sm">Available balance:</p>
        <p>
          {tokenBalance} {selected.name}
        </p>
      </div>
      <div className="relative mt-2 rounded-lg hover:ring-1 hover:dark:ring-fg_below_color">
        <input
          className="w-full py-3 pl-5 rounded-lg bg-border_color focus:outline-none"
          type="text"
          onChange={(e) => {
            setAmount(formatInputNum(e.target.value, sizeRoundDec + 1));
          }}
          value={amount}
        />
        <button
          className="absolute text-md dark:text-yellow text-blue mr-3 right-20 top-3 hover:opacity-70"
          onClick={() => setAmount(tokenBalance)}
        >
          Max
        </button>
        <div className="absolute top-0 bottom-0 right-0 text-white rounded-r-lg bg-blue">
          <p className="px-4 pt-3">{selected.name}</p>
        </div>
      </div>
    </div>
  );
};

export default AmountInput;
