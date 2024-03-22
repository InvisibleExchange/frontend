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

import { ethers, utils } from "ethers";
import ConfirmWithdrawalModal from "./ConfirmWithdrawalModal";

const {
  _renderConnectButton,
  _renderLoginButton,
} = require("../../Trade/TradeActions/ActionPanel/TradeFormHelpers/FormButtons");

const {
  DECIMALS_PER_ASSET,
  COLLATERAL_TOKEN_DECIMALS,
  CHAIN_IDS,
} = require("../../../app_logic/helpers/utils");

const {
  storeWithdrawalIds,
} = require("../../../app_logic/helpers/firebaseConnection");

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
  let { userAddress, signer, connect, switchNetwork } =
    useContext(WalletContext);
  let { user, login, forceRerender, setToastMessage, priceChange24h } =
    useContext(UserContext);

  const [token, setToken] = useState(tokens[0]);
  const [chain, setChain] = useState(chains[0]);

  const [amount, setAmount] = useState(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [withdrawalAddress, setWithdrawalAddress] = useState("");

  const makeWithdrawal = async (isManual: boolean) => {
    let chainId = CHAIN_IDS[chain.name];

    let maxGasPrice = ["Arbitrum Sepolia", "Arbitrum"].includes(chain.name)
      ? 1
      : 100; // TODO: get Better estimates (something time weighted)

    let maxGasFee = getGasFeeInToken(token, maxGasPrice, priceChange24h);

    let withdrawalId = BigInt(Math.floor(Math.random() * 2 ** 64));

    await sendWithdrawal(
      user,
      amount,
      token.id,
      withdrawalAddress,
      chainId,
      withdrawalId,
      isManual ? BigInt(0) : maxGasFee
    )
      .then((_) => {
        setToastMessage({
          type: "info",
          message:
            "Withdrawal transaction was successful: " +
            amount +
            " " +
            token.name,
        });

        storeWithdrawalIds(
          user.userId,
          user.withdrawalIds,
          withdrawalId,
          user.privateSeed
        );

        let tokenDecimals = DECIMALS_PER_ASSET[token.id];
        let withdrawalAmount = amount! * 10 ** tokenDecimals;
        let withdrawal = {
          amount: withdrawalAmount,
          is_automatic: !isManual,
          recipient: withdrawalAddress,
          token_id: token.id,
          active: false,
        };

        user.withdrawals.push(withdrawal);

        forceRerender();
      })

      .catch((err) => {
        setToastMessage({
          type: "error",
          message: err.message,
        });

        return null;
      });
  };

  const setNetwork = async (chain) => {
    let networkId = chain.id;

    await switchNetwork(networkId);

    setChain(chain);
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
            onSelect={setNetwork}
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

          <button
            className="w-1/4 py-3 mt-2 ml-3 text-center text-white bg-blue rounded-lg hover:opacity-70 hover:cursor-pointer"
            data-tooltip-id="my-tooltip"
            data-tooltip-content="You can connect wallet to prevent signing with wrong address."
            onClick={() => {
              setWithdrawalAddress(userAddress ?? "");
            }}
          >
            connected wallet
          </button>
        </div>
      </div>

      {/* ============================================= */}

      {userAddress ? (
        user && user.userId ? (
          <div className="flex">
            <ConfirmWithdrawalModal
              isManual={false}
              token={token.name}
              chain={chain.id}
              makeWithdrawal={makeWithdrawal}
              setToastMessage={setToastMessage}
            />

            <ConfirmWithdrawalModal
              isManual={true}
              token={token.name}
              chain={chain.id}
              makeWithdrawal={makeWithdrawal}
              setToastMessage={setToastMessage}
            />
          </div>
        ) : (
          renderLoginButton()
        )
      ) : (
        renderConnectButton()
      )}

      <div className="w-full h-[2px] my-5 bg-border_color"></div>
      <PendingPanel user={user} type="Withdrawal" showToast={setToastMessage} />
    </div>
  );
};

function getGasFeeInToken(
  token: any,
  maxGasPriceGwei: number,
  priceChange24h: any
) {
  // TODO: Figure out gasPrices
  let maxGasPrice = ethers.utils.parseUnits(maxGasPriceGwei.toString(), "gwei");

  if (token.name == "ETH") {
    let ethFeeWei = BigInt(21000) * maxGasPrice.toBigInt();
    let ethFee = Number(ethers.utils.formatUnits(ethFeeWei, "ether"));

    let ethDecimals = DECIMALS_PER_ASSET[token.id];
    return ethers.utils
      .parseUnits(ethFee.toFixed(ethDecimals), ethDecimals)
      .toBigInt();
  } else if (token.name == "BTC") {
    let ethFeeWei = BigInt(100_000) * maxGasPrice.toBigInt();
    let ethFee = Number(ethers.utils.formatUnits(ethFeeWei, "ether"));

    let ethPrice = priceChange24h["ETH"].price;
    let btcPrice = priceChange24h["BTC"].price;

    let btcFee = (ethFee * ethPrice) / btcPrice;

    let btcDecimals = DECIMALS_PER_ASSET[token.id];
    return ethers.utils
      .parseUnits(btcFee.toFixed(btcDecimals), btcDecimals)
      .toBigInt();
  } else {
    let ethFeeWei = BigInt(100_000) * maxGasPrice.toBigInt();
    let ethFee = Number(ethers.utils.formatUnits(ethFeeWei, "ether"));

    let ethPrice = priceChange24h["ETH"].price;

    let usdcFee = ethFee * ethPrice;

    let usdcDecimals = COLLATERAL_TOKEN_DECIMALS;
    return ethers.utils
      .parseUnits(usdcFee.toFixed(usdcDecimals), usdcDecimals)
      .toBigInt();
  }
}

export default WithdrawPanel;
