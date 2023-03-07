import React, { useState, useContext } from "react";

import TokenSelector from "../TokenSelector";
import AmountInput from "../AmountInput";
import PendingPanel from "../PendingPanel";

import { WalletContext } from "../../../context/WalletContext";

const tokens = [
  { id: 1, name: "ETH" },
  { id: 2, name: "BTC" },
];

const DepositPanel = () => {
  const { user } = useContext(WalletContext);

  const [token, setToken] = useState(tokens[0]);
  const [amount, setAmount] = useState(null);

  const makeDeposit = async () => {
    // TODO:
  };

  return (
    <div>
      <TokenSelector tokens={tokens} selected={token} onSelect={setToken} />
      <AmountInput selected={token} setAmount={setAmount} user={user} />
      <button className="w-full py-3 mt-8 text-center rounded-lg bg-green hover:opacity-70">
        Make Deposit
      </button>
      <div className="w-full h-[2px] my-5 bg-border_color"></div>
      <PendingPanel user={user} type="Deposit" />
    </div>
  );
};

export default DepositPanel;
