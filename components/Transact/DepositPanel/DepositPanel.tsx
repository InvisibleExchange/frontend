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

const {
  executeDepositTx,
} = require("../../../app_logic/helpers/onchainConnection");

const {
  storeDepositIds,
} = require("../../../app_logic/helpers/firebaseConnection");

const tokens = [
  { id: 54321, name: "ETH", icon: ethLogo },
  { id: 12345, name: "BTC", icon: btcLogo },
  { id: 55555, name: "USDC", icon: usdcLogo },
];

const chains = [
  { id: 1, name: "ETH Mainnet", icon: ethMainnet },
  // { id: 2, name: "Starknet", icon: starknet },
  // { id: 3, name: "ZkSync", icon: zksync },
];

const DepositPanel = ({ showToast }: any) => {
  let {
    userAddress,
    connect,
    signer,
    updateWalletBalances,
    getTokenBalance,
    smartContracts,
  } = useContext(WalletContext);
  let { user, login, forceRerender, setToastMessage, isLoading, setIsLoading } =
    useContext(UserContext);

  const [token, setToken] = useState(tokens[0]);
  const [chain, setChain] = useState(chains[0]);
  const [amount, setAmount] = useState(null);

  let tokenBalance = getTokenBalance(token.id);

  const makeDeposit = async () => {
    // TODO:

    let depositResponse = await executeDepositTx(
      user,
      smartContracts,
      amount,
      token.id,
      tokenBalance,
      userAddress
    );

    updateWalletBalances([], [token.id]);

    storeDepositIds(
      user.userId,
      user.depositIds,
      depositResponse.depositId,
      user.privateSeed
    );

    if (depositResponse) {
      setToastMessage({
        type: "info",
        message:
          "Deposit transaction was successful! Tx hash: " +
          depositResponse.txHash,
      });
    } else {
      setToastMessage({
        type: "error",
        message: "Deposit transaction failed!",
      });
    }
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

      <AmountInput
        selected={token}
        setAmount={setAmount}
        amount={amount}
        tokenBalance={tokenBalance}
      />

      {userAddress ? (
        user && user.userId ? (
          <button
            className="w-full py-3 mt-8 text-center rounded-lg bg-green  hover:opacity-70 opacity-70"
            disabled={true}
            onClick={makeDeposit}
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
