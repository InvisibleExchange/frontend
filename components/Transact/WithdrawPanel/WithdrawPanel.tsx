import React, { useState } from "react";

import TokenSelector from "../TokenSelector";
import AmountInput from "../AmountInput";
import PendingPanel from "../PendingPanel";

const tokens = [
  { id: 1, name: "ETH" },
  { id: 2, name: "BTC" },
];

const WithdrawPanel = () => {
  const [token, setToken] = useState(tokens[0]);

  return (
    <div>
      <TokenSelector tokens={tokens} selected={token} onSelect={setToken} />
      <AmountInput selected={token} />
      <div className="mt-5">
        <p className="text-sm">Ethereum Address</p>
        <input
          type="text"
          className="w-full py-3 pl-5 mt-2 rounded-lg outline-none bg-border_color hover:ring-1 hover:dark:ring-fg_below_color"
          placeholder="EThereum address to withdrawal to"
        />
      </div>
      <button
        disabled={true}
        className="w-full py-3 mt-8 text-center rounded-lg bg-red hover:opacity-70 opacity-70"
      >
        Make Withdrawal
      </button>
      <div className="w-full h-[2px] my-5 bg-border_color"></div>
      <PendingPanel type="Withdrawal" />
    </div>
  );
};

export default WithdrawPanel;
