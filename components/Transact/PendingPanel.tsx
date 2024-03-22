import React, { useContext, useEffect } from "react";

const { sendDeposit } = require("../../app_logic/transactions/constructOrders");

const {
  DECIMALS_PER_ASSET,
  IDS_TO_SYMBOLS,
  CHAIN_IDS,
} = require("../../app_logic/helpers/utils");

import ethMainnet from "../../public/tokenIcons/eth-mainnet.png";
import ArbitrumLogo from "../../public/tokenIcons/Arbitrum-logo.png";
import Image from "next/image";
import classNames from "classnames";
import { WalletContext } from "../../context/WalletContext";
import { ethers } from "ethers";
import { tokenId2Address } from "../../data/markets";

const chains = [
  // { id: 1, name: "ETH Mainnet", icon: ethMainnet, networkId: 1 },
  // { id: 33535, name: "localhost", icon: ethMainnet },

  { id: 11155111, name: "Sepolia", icon: ethMainnet },
  { id: 421614, name: "Arbitrum Sepolia", icon: ArbitrumLogo },
];

const PendingPanel = ({ type, user, showToast }: any) => {
  //

  let depositHelperMessage = "";
  // "** For ease of testing, we don't require you to have goerli eth given its scarcity, so you can mint yourself some test funds below. **";

  let withdrawalHelperMessage = "";
  // "** The funds will automatically be transfered to your desired address minus the gas fee (This can take up to 3 hours) **";

  return (
    <div>
      <p className="uppercase">
        <strong>Pending {type}s:</strong>{" "}
      </p>
      {type == "Deposit" ? (
        <em>{depositHelperMessage}</em>
      ) : (
        <em>{withdrawalHelperMessage}</em>
      )}

      {type == "Deposit" ? (
        <DepositPendingPanel user={user} showToast={showToast} />
      ) : (
        <WithdrawalPendingPanel user={user} showToast={showToast} />
      )}
    </div>
  );
};

export default PendingPanel;

const DepositPendingPanel = ({ user, showToast }: any) => {
  // Todo: remove this mock data -----------------------
  // let deposits: any[] = [];

  // let amounts = { ETH: 5, USDC: 15_000, BTC: 0.4 };
  // // let icons = { ETH: ethLogo, USDC: usdcLogo, BTC: btcLogo };
  // let chainIds = { ETH: "ETH Mainnet", USDC: "Starknet", BTC: "ZkSync" };
  // if (user?.userId) {
  //   for (let token_ of ["ETH", "USDC", "BTC"]) {
  //     let token = SYMBOLS_TO_IDS[token_];

  //     let bal = user.getAvailableAmount(token);
  //     if (bal < DUST_AMOUNT_PER_ASSET[token]) {
  //       deposits.push({
  //         deposit_id: CHAIN_IDS[chainIds[token_]] * 2 ** 32 + 12345,
  //         deposit_amount: amounts[token_] * 10 ** DECIMALS_PER_ASSET[token],
  //         deposit_token: token,
  //         stark_key: 1234,
  //       });
  //     }
  //   }
  // }
  // Todo: remove this mock data -----------------------

  // depositId:  starkKey: tokenId: amount: timestamp:  txHash:
  let deposits = user?.deposits ?? [];

  if (!deposits?.length) {
    return (
      <div className="pt-5 mt-5">
        <h1>No claimable Deposits</h1>
      </div>
    );
  }

  return (
    <div>
      {deposits.map((deposit: any) => {
        let depositAmount =
          Number(deposit.deposit_amount) /
          10 ** DECIMALS_PER_ASSET[deposit.deposit_token];

        return (
          <div
            key={deposit.deposit_id}
            className="flex items-center w-full mt-5 rounded-l-lg bg-border_color"
          >
            <div className="w-full flex py-2.5 pl-5 text-gray_light">
              <p> {depositAmount.toFixed(2)}</p>

              <p className="ml-3"> {IDS_TO_SYMBOLS[deposit.deposit_token]}</p>
            </div>
            <button
              onClick={async () => {
                // * DEPOSITS  =============
                try {
                  await sendDeposit(
                    user,
                    deposit.deposit_id,
                    depositAmount,
                    deposit.deposit_token,
                    deposit.stark_key
                  );

                  user.deposits = user.deposits.filter(
                    (d: any) => d.deposit_id != deposit.deposit_id
                  );

                  showToast({
                    type: "info",
                    message:
                      "Deposit successful: " +
                      depositAmount.toFixed(2) +
                      " " +
                      IDS_TO_SYMBOLS[deposit.deposit_token],
                  });
                } catch (error: any) {
                  console.log("error: ", error.message);

                  showToast({
                    type: "error",
                    message: error.message,
                  });
                }
              }}
              className="px-8 py-2.5 rounded-lg bg-blue  hover:opacity-70 text-white "
            >
              Claim
            </button>
          </div>
        );
      })}
    </div>
  );
};

const WithdrawalPendingPanel = ({ user, showToast }: any) => {
  let { withdrawbleAmounts, userAddress, smartContracts } =
    useContext(WalletContext);

  let withdrawals = user?.withdrawals ?? [];

  // console.log("withdrawals: ", withdrawals);

  if (!withdrawals?.length) {
    return (
      <div className="pt-5 mt-5">
        <h1>No Pending Withdrawals</h1>
      </div>
    );
  }

  return (
    <div>
      {Object.entries(withdrawbleAmounts).map(([tokenId, amount], index) => {
        if (amount == 0) return;

        let withdrawalAmount = ethers.utils.formatUnits(
          amount as ethers.BigNumberish,
          18
        );

        return (
          <div
            key={index}
            className="flex items-center w-full mt-5 rounded-l-lg bg-border_color"
          >
            <div className="w-1/3 flex py-1.5 pl-2 text-gray_light">
              <Image
                src={chains[0].icon}
                alt="Network Logo"
                width={20}
                height={20}
                style={{
                  objectFit: "contain",
                  marginLeft: "0.5rem",
                  marginRight: "0.5rem",
                }}
              />

              <p> {Number(withdrawalAmount).toFixed(2)}</p>

              <p className="ml-0.5 font-bold"> {IDS_TO_SYMBOLS[tokenId]}</p>
            </div>

            <div className="w-full flex py-2.5 ml-3 text-gray_light">
              <p
                className="ml-0 pt-1"
                style={{
                  fontStyle: "italic",
                }}
              >
                {userAddress}
              </p>

              <p className="ml-auto mr-2">
                <button
                  onClick={async () => {
                    let invisibleL1Contract = smartContracts["invisible"];

                    console.log("chains[0]: ", chains[0]);

                    console.log(
                      userAddress,
                      tokenId2Address(CHAIN_IDS[chains[0].name])
                    );

                    let txRes = await invisibleL1Contract
                      .claimPendingWithdrawal(
                        userAddress,
                        tokenId2Address(CHAIN_IDS[chains[0].name])[tokenId] ??
                          ethers.constants.AddressZero
                      )
                      .catch((err) => {
                        if (err.message.includes("user rejected transaction")) {
                          showToast({
                            type: "error",
                            message: "User rejected transaction",
                          });
                        } else {
                          showToast({
                            type: "error",
                            message: err.message,
                          });
                        }

                        return null;
                      });

                    if (!txRes) return;

                    showToast({
                      type: "pending_tx",
                      message:
                        "Waiting for withdrawal confirmation: " + txRes.hash,
                    });

                    let receipt = await txRes.wait();
                    let txHash = receipt.transactionHash;

                    showToast({
                      type: "info",
                      message:
                        "Withdrawal transaction was successful! Tx hash: " +
                        txHash,
                    });
                  }}
                  className={classNames(
                    "px-4 py-1.5 rounded-lg bg-blue text-white",
                    "hover:opacity-70"
                  )}
                >
                  <strong>Claim</strong>
                </button>
              </p>
            </div>
          </div>
        );
      })}

      {withdrawals.map((withdrawal: any) => {
        let withdrawalAmount =
          Number(withdrawal.amount) /
          10 ** DECIMALS_PER_ASSET[withdrawal.token_id];

        return (
          <div
            key={withdrawal.withdrawalId}
            className="flex items-center w-full mt-5 rounded-l-lg bg-border_color"
          >
            <div className="w-1/3 flex py-1.5 pl-2 text-gray_light">
              <Image
                src={chains[withdrawal.chainId == 40161 ? 0 : 1].icon}
                alt="Network Logo"
                width={20}
                height={20}
                style={{
                  objectFit: "contain",
                  marginLeft: "0.5rem",
                  marginRight: "0.5rem",
                }}
              />

              <p> {withdrawalAmount.toFixed(2)}</p>

              <p className="ml-0.5 font-bold">
                {" "}
                {IDS_TO_SYMBOLS[withdrawal.token_id]}
              </p>
            </div>

            <div className="w-full flex py-2.5 ml-3 text-gray_light">
              <p
                className="ml-0 pt-1"
                style={{
                  fontStyle: "italic",
                }}
              >
                {"0x" + BigInt(withdrawal.recipient).toString(16)}
              </p>

              <p className="ml-auto mr-2">
                <button
                  onClick={() => {}}
                  disabled={true}
                  className={classNames(
                    "px-4 py-1.5 rounded-lg bg-blue text-white",
                    "opacity-70"
                  )}
                >
                  Pending
                </button>
              </p>
            </div>

            {/* <button
              onClick={() => {}}
              className="px-8 py-2.5 rounded-lg bg-blue  hover:opacity-70 text-white "
            >
              Claim
            </button> */}
          </div>
        );
      })}
    </div>
  );
};
