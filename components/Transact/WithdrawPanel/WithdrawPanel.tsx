import React, { useContext, useState } from "react";

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

import "react-tooltip/dist/react-tooltip.css";
import { Tooltip as ReactTooltip } from "react-tooltip";
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

const WithdrawPanel = () => {
  let { userAddress, signer, connect } = useContext(WalletContext);
  let { user, login, forceRerender } = useContext(UserContext);

  const [token, setToken] = useState(tokens[0]);
  const [chain, setChain] = useState(chains[0]);
  const [amount, setAmount] = useState(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const makeWithdrawal = async () => {
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

      <div className="mt-5">
        <div className="w-full flex justify-between">
          <p className="text-sm">Ethereum Address</p>
        </div>

        <div className="flex">
          <input
            type="text"
            className="w-full py-3 pl-5 mt-2 rounded-lg outline-none bg-border_color hover:ring-1 hover:dark:ring-fg_below_color"
            placeholder={
              chain.name + " address to withdrawal your " + token.name
            }
            // disabled={true}
          />

          <ReactTooltip id="my-tooltip" opacity={1} />

          <a
            className="w-1/4 py-3 mt-2 ml-2 text-center text-white bg-blue rounded-lg hover:opacity-70 hover:cursor-pointer"
            data-tooltip-id="my-tooltip"
            data-tooltip-content="For your security, we ask you to sign a message to prevent accidental withdrawals to the wrong address."
            onClick={() => {
              console.log("sign");
            }}
          >
            Sign
          </a>
        </div>
      </div>

      {/* =============================================0 */}

      {userAddress ? (
        user && user.userId ? (
          <button
            disabled={true}
            className="w-full py-3 mt-8 text-center rounded-lg bg-red hover:opacity-70 opacity-70"
          >
            Make Withdrawal
          </button>
        ) : (
          renderLoginButton()
        )
      ) : (
        renderConnectButton()
      )}

      <div className="w-full h-[2px] my-5 bg-border_color"></div>
      <PendingPanel type="Withdrawal" />
    </div>
  );
};

export default WithdrawPanel;
