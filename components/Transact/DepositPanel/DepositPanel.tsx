import React, { useState, useContext } from "react";

import TokenSelector from "../TokenSelector";
import AmountInput from "../AmountInput";
import PendingPanel from "../PendingPanel";

import btcLogo from "../../../public/tokenIcons/bitcoin.png";
import ethLogo from "../../../public/tokenIcons/ethereum-eth-logo.png";
import usdcLogo from "../../../public/tokenIcons/usdc-logo.png";

import ethMainnet from "../../../public/tokenIcons/eth-mainnet.png";
import starknet from "../../../public/tokenIcons/starknet.png";
import zksync from "../../../public/tokenIcons/zksync.png";

import { WalletContext } from "../../../context/WalletContext";
import { UserContext } from "../../../context/UserContext";

const {
  _renderConnectButton,
  _renderLoginButton,
} = require("../../Trade/TradeActions/ActionPanel/TradeFormHelpers/FormButtons");

const tokens = [
  { id: 1, name: "ETH", icon: ethLogo },
  { id: 2, name: "BTC", icon: btcLogo },
  { id: 3, name: "USDC", icon: usdcLogo },
];

const chains = [
  { id: 1, name: "ETH Mainnet", icon: ethMainnet },
  { id: 2, name: "Starknet", icon: starknet },
  { id: 3, name: "ZkSync", icon: zksync },
];

const DepositPanel = ({ showToast }: any) => {
  let { userAddress, connect, signer, forceRerender } =
    useContext(WalletContext);
  let { user, login } = useContext(UserContext);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [token, setToken] = useState(tokens[0]);
  const [chain, setChain] = useState(chains[0]);
  const [amount, setAmount] = useState(null);

  const makeDeposit = async () => {
    // TODO:
  };

  function renderConnectButton() {
    return _renderConnectButton(connect);
  }

  function renderLoginButton() {
    return _renderLoginButton(
      isLoading,
      setIsLoading,
      signer,
      login,
      forceRerender
    );
  }

  return (
    <div>
      <div className="w-full flex ">
        <div
          style={{
            width: "50%",
            marginRight: "5%",
          }}
        >
          <TokenSelector
            options={tokens}
            selected={token}
            onSelect={setToken}
            label={"Select an asset: "}
          />
        </div>

        <div
          style={{
            width: "50%",
          }}
        >
          <TokenSelector
            options={chains}
            selected={chain}
            onSelect={setChain}
            label={"Select chain: "}
          />
        </div>
      </div>

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
