import React, { useContext } from "react";

import btcLogo from "../../public/tokenIcons/bitcoin.png";
import ethLogo from "../../public/tokenIcons/ethereum-eth-logo.png";
import usdcLogo from "../../public/tokenIcons/usdc-logo.png";
import { WalletContext } from "../../context/WalletContext";
import { ethers } from "ethers";

const { sendDeposit } = require("../../app_logic/transactions/constructOrders");

const {
  DECIMALS_PER_ASSET,
  IDS_TO_SYMBOLS,
  SYMBOLS_TO_IDS,
  CHAIN_IDS,
  DUST_AMOUNT_PER_ASSET,
} = require("../../app_logic/helpers/utils");

const PendingPanel = ({ type, user, showToast }: any) => {
  //

  let depositHelperMessage =
    "** For ease of testing, we don't require you to have goerli eth given its scarcity, so you can mint yourself some test funds below. **";

  let withdrawalHelperMessage =
    "** The funds will automatically be transfered to your desired address minus the gas fee (This can take up to 3 hours) **";

  return (
    <div>
      <p className="uppercase">
        <strong>Claim {type}s:</strong>{" "}
      </p>
      {type == "Deposit" ? (
        <em>{depositHelperMessage}</em>
      ) : (
        <em>{withdrawalHelperMessage}</em>
      )}

      {type == "Deposit" ? (
        <DepositPendingPanel user={user} showToast={showToast} />
      ) : null}
    </div>
  );
};

export default PendingPanel;

const DepositPendingPanel = ({ user, showToast }: any) => {
  // Todo: remove this mock data -----------------------
  let deposits: any[] = [];

  let amounts = { ETH: 5, USDC: 15_000, BTC: 0.4 };
  // let icons = { ETH: ethLogo, USDC: usdcLogo, BTC: btcLogo };
  let chainIds = { ETH: "ETH Mainnet", USDC: "Starknet", BTC: "ZkSync" };
  if (user?.userId) {
    for (let token_ of ["ETH", "USDC", "BTC"]) {
      let token = SYMBOLS_TO_IDS[token_];

      let bal = user.getAvailableAmount(token);
      if (bal < DUST_AMOUNT_PER_ASSET[token]) {
        deposits.push({
          deposit_id: CHAIN_IDS[chainIds[token_]] * 2 ** 32 + 12345,
          deposit_amount: amounts[token_] * 10 ** DECIMALS_PER_ASSET[token],
          deposit_token: token,
          stark_key: 1234,
        });
      }
    }
  }
  // Todo: remove this mock data -----------------------

  // // depositId:  starkKey: tokenId: amount: timestamp:  txHash:
  // let deposits = user?.deposits ?? [];

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
