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
import LoadingSpinner from "../../Layout/LoadingSpinner/LoadingSpinner";

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
  { id: 453755560, name: "ETH", icon: ethLogo },
  { id: 3592681469, name: "BTC", icon: btcLogo },
  { id: 2413654107, name: "USDC", icon: usdcLogo },
];

const chains = [
  // { id: 1, name: "ETH Mainnet", icon: ethMainnet },
  // { id: 33535, name: "localhost", icon: ethMainnet },
  { id: 11155111, name: "Sepolia", icon: ethMainnet },
  // { id: 2, name: "Starknet", icon: starknet },
  // { id: 3, name: "ZkSync", icon: zksync },
];

const DepositPanel = ({ showToast }: any) => {
  let {
    userAddress,
    switchNetwork,
    connect,
    signer,
    updateWalletBalances,
    getTokenBalance,
    smartContracts,
  } = useContext(WalletContext);
  let { user, login, forceRerender, setToastMessage, isLoading, setIsLoading } =
    useContext(UserContext);

  const [token, setToken] = useState(tokens[0]);
  const [chain, _setChain] = useState(null);
  const [amount, setAmount] = useState(null);

  const [isTxPending, setIsTxPending] = useState<boolean>(false);

  const setChain = async (chain) => {
    _setChain(chain);

    let networkId = chain.id;

    await switchNetwork(networkId);
  };

  let tokenBalance = getTokenBalance(token.id);

  const makeDeposit = async () => {
    setIsTxPending(true);

    let depositResponse = await executeDepositTx(
      user,
      smartContracts,
      amount,
      token.id,
      tokenBalance,
      userAddress,
      setToastMessage
    ).catch((err) => {
      setToastMessage({
        type: "error",
        message: err.message,
      });
      return null;
    });

    setIsTxPending(false);

    if (!depositResponse) return;

    updateWalletBalances([], [token.id]);

    storeDepositIds(
      user.userId,
      user.depositIds,
      depositResponse.depositId,
      user.privateSeed
    );

    let deposit = {
      deposit_id: depositResponse.depositId.toString(),
      stark_key: depositResponse.starkKey.toString(),
      deposit_token: depositResponse.tokenId.toString(),
      deposit_amount: depositResponse.amount.toString(),
      timestamp: depositResponse.timestamp.toString(),
    };


    user.deposits.push(deposit);

    setToastMessage({
      type: "info",
      message:
        "Deposit transaction was successful! Tx hash: " +
        depositResponse.txHash,
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
            isWalletConnected={!!userAddress}
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
            isWalletConnected={!!userAddress}
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
          !isTxPending ? (
            <button
              className="w-full py-3 mt-8 text-center rounded-lg bg-green hover:opacity-70 "
              // disabled={true} opacity-70
              onClick={makeDeposit}
            >
              Make Deposit
            </button>
          ) : (
            <div className="mt-14 ml-32 mr-32">
              <LoadingSpinner />
            </div>
          )
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
