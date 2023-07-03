import React, { useState, useContext } from "react";

import TokenSelector from "../TokenSelector";
import AmountInput from "../AmountInput";
import PendingPanel from "../PendingPanel";

import { WalletContext } from "../../../context/WalletContext";

const {
  _renderConnectButton,
  _renderLoginButton,
} = require("../../Trade/TradeActions/ActionPanel/TradeFormHelpers/FormButtons");

const tokens = [
  { id: 1, name: "ETH" },
  { id: 2, name: "BTC" },
];

const DepositPanel = ({ showToast }: any) => {
  let { user, userAddress, login, connect, forceRerender } =
    useContext(WalletContext);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [token, setToken] = useState(tokens[0]);
  const [amount, setAmount] = useState(null);

  const makeDeposit = async () => {
    // TODO:
  };

  function renderConnectButton() {
    return _renderConnectButton(connect);
  }

  function renderLoginButton() {
    return _renderLoginButton(isLoading, setIsLoading, login, forceRerender);
  }

  return (
    <div>
      <TokenSelector tokens={tokens} selected={token} onSelect={setToken} />
      <AmountInput selected={token} setAmount={setAmount} amount={amount} />

      {userAddress ? (
        user && user.userId ? (
          <button
            className="w-full py-3 mt-8 text-center rounded-lg bg-green hover:opacity-70 opacity-70"
            disabled={true}
          >
            Make Deposit
          </button>
        ) : (
          renderLoginButton()
        )
      ) : (
        renderConnectButton()
      )}

      <div className="w-full h-[2px] my-5 bg-border_color"></div>
      <PendingPanel user={user} type="Deposit" showToast={showToast} />
    </div>
  );
};

export default DepositPanel;
