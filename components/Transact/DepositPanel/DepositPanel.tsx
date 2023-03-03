import React, { useState } from "react";

import TokenSelector from "../TokenSelector";
import AmountInput from "../AmountInput";
import PendingPanel from "../PendingPanel";

const tokens = [
  { id: 1, name: "ETH" },
  { id: 2, name: "BTC" },
];

const DepositPanel = () => {
  const [token, setToken] = useState(tokens[0]);

  return (
    <div>
      <TokenSelector tokens={tokens} selected={token} onSelect={setToken} />
      <AmountInput selected={token} />
      <button className="w-full py-3 mt-8 text-center rounded-lg bg-green hover:opacity-70">
        Make Deposit
      </button>
      <div className="w-full h-[2px] my-5 bg-border_color"></div>
      <PendingPanel type="Deposit" />
    </div>
  );
};

export default DepositPanel;
