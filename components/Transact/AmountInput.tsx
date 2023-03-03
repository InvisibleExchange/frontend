import React from "react";

const AmountInput = ({ selected }: any) => {
  return (
    <div className="mt-5 ">
      <div className="flex items-center justify-end gap-2">
        <p className="text-sm">Available balance:</p>
        <p>0.0025 ETH</p>
      </div>
      <div className="relative mt-2 rounded-lg hover:ring-1 hover:dark:ring-fg_below_color">
        <input
          className="w-full py-3 pl-5 rounded-lg bg-border_color focus:outline-none"
          type="text"
        />
        <button className="absolute text-sm dark:text-yellow text-blue right-20 top-3 hover:opacity-70">
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
