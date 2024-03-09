import React, { useContext, useState } from "react";

import TokenSelector from "../TokenSelector";
import AmountInput from "../AmountInput";
import PendingPanel from "../PendingPanel";

import btcLogo from "../../../public/tokenIcons/bitcoin.png";
import ethLogo from "../../../public/tokenIcons/ethereum-eth-logo.png";
import usdcLogo from "../../../public/tokenIcons/usdc-logo.png";

import ethMainnet from "../../../public/tokenIcons/eth-mainnet.png";
import ArbitrumLogo from "../../../public/tokenIcons/Arbitrum-logo.png";

import { WalletContext } from "../../../context/WalletContext";

import "react-tooltip/dist/react-tooltip.css";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { UserContext } from "../../../context/UserContext";

import { utils } from "ethers";

const {
  _renderConnectButton,
  _renderLoginButton,
} = require("../../Trade/TradeActions/ActionPanel/TradeFormHelpers/FormButtons");

const {
  DECIMALS_PER_ASSET,
  CHAIN_IDS,
} = require("../../../app_logic/helpers/utils");

const {
  sendWithdrawal,
} = require("../../../app_logic/transactions/constructOrders");

const tokens = [
  { id: 453755560, name: "ETH", icon: ethLogo },
  { id: 3592681469, name: "BTC", icon: btcLogo },
  { id: 2413654107, name: "USDC", icon: usdcLogo },
];

const chains = [
  // { id: 1, name: "ETH Mainnet", icon: ethMainnet, networkId: 1 },
  // { id: 33535, name: "localhost", icon: ethMainnet },

  { id: 11155111, name: "Sepolia", icon: ethMainnet },
  { id: 421614, name: "Arbitrum Sepolia", icon: ArbitrumLogo },
];

const WithdrawPanel = () => {
  let { userAddress, signer, connect } = useContext(WalletContext);
  let { user, login, forceRerender, setToastMessage } = useContext(UserContext);

  const [token, setToken] = useState(tokens[0]);
  const [chain, setChain] = useState(chains[0]);

  const [amount, setAmount] = useState(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [withdrawalAddress, setWithdrawalAddress] = useState("");

  const makeWithdrawal = async () => {
    // TODO: for testing only
    let chainId =
      CHAIN_IDS[chain.name == "Arbitrum Sepolia" ? "Arbitrum" : "ETH Mainnet"];

    await sendWithdrawal(user, amount, token.id, withdrawalAddress, chainId)
      .then((_) => {
        setToastMessage({
          type: "info",
          message:
            "Withdrawal transaction was successful: " +
            amount +
            " " +
            token.name,
        });
      })
      .catch((err) => {
        setToastMessage({
          type: "error",
          message: err.message,
        });
      });
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
            isWalletConnected={!!user}
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
            isWalletConnected={!!user}
            label={"Select network: "}
          />
        </div>
      </div>

      <AmountInput
        selected={token}
        setAmount={setAmount}
        amount={amount}
        tokenBalance={
          (user?.getAvailableAmount(token.id) ?? 0) /
          10 ** DECIMALS_PER_ASSET[token.id]
        }
      />

      <div className="mt-5">
        <div className="w-full flex justify-between">
          <p className="text-sm">Ethereum Address</p>
        </div>

        <div className="flex">
          <input
            type="text"
            className="w-full py-3 pl-4 mt-2 rounded-lg outline-none bg-border_color hover:ring-1 hover:dark:ring-fg_below_color"
            placeholder={
              chain.name + " address to withdrawal your " + token.name
            }
            onChange={(e) => {
              setWithdrawalAddress(e.target.value);
            }}
            value={withdrawalAddress}
          />

          <ReactTooltip id="my-tooltip" opacity={1} />

          <a
            className="w-1/4 py-3 mt-2 ml-3 text-center text-white bg-blue rounded-lg hover:opacity-70 hover:cursor-pointer"
            data-tooltip-id="my-tooltip"
            data-tooltip-content="You can connect wallet to prevent signing with wrong address."
            onClick={() => {
              setWithdrawalAddress(userAddress ?? "");
            }}
          >
            connected wallet
          </a>
        </div>
      </div>

      {/* ============================================= */}

      {userAddress ? (
        user && user.userId ? (
          <button
            // disabled={true}
            className="w-full py-3 mt-8 text-center rounded-lg bg-red hover:opacity-70"
            onClick={makeWithdrawal}
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
