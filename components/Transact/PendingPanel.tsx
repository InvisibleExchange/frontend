import React from "react";

import btcLogo from "../../public/tokenIcons/bitcoin.png";
import ethLogo from "../../public/tokenIcons/ethereum-eth-logo.png";
import usdcLogo from "../../public/tokenIcons/usdc-logo.png";

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

  let deposits: any[] = [];

  let amounts = { ETH: 5, USDC: 15_000, BTC: 0.4 };
  let icons = { ETH: ethLogo, USDC: usdcLogo, BTC: btcLogo };
  let chainIds = { ETH: "ETH Mainnet", USDC: "Starknet", BTC: "ZkSync" };
  if (user?.userId) {
    for (let token_ of ["ETH", "USDC", "BTC"]) {
      let token = SYMBOLS_TO_IDS[token_];

      let bal = user.getAvailableAmount(token);
      if (bal < DUST_AMOUNT_PER_ASSET[token]) {
        deposits.push({
          depositId: CHAIN_IDS[chainIds[token_]] * 2 ** 32 + 12345,
          amount: amounts[token_] * 10 ** DECIMALS_PER_ASSET[token],
          tokenId: token,
          starkKey: 1234,
        });
      }
    }
  }

  // depositId:  starkKey: tokenId: amount: timestamp:  txHash:
  // let deposits = user?.deposits ?? [];

  let helperMessage =
    "** For ease of testing, we don't require you to have goerli eth given its scarcity, so you can mint yourself some test funds below. **";

  return (
    <div>
      <p className="uppercase">
        <strong>Claim {type}s:</strong>{" "}
      </p>
      {type == "Deposit" ? <em>{helperMessage}</em> : null}
      {deposits?.length ? (
        deposits.map((deposit: any) => {
          let depositAmount =
            Number(deposit.amount) / 10 ** DECIMALS_PER_ASSET[deposit.tokenId];

          return (
            <div
              key={deposit.depositId}
              className="flex items-center w-full mt-5 rounded-l-lg bg-border_color"
            >
              <div className="w-full flex py-2.5 pl-5 text-gray_light">
                <p> {depositAmount.toFixed(2)}</p>

                <p className="ml-3"> {IDS_TO_SYMBOLS[deposit.tokenId]}</p>

                {/* <img
                  src={icons[deposit.token].src}
                  alt="Currency Logo"
                  className="logo_icon"
                /> */}
              </div>
              <button
                onClick={async () => {
                  if (type == "Deposit") {
                    // * DEPOSITS  ==================================================
                    try {
                      await sendDeposit(
                        user,
                        deposit.depositId,
                        depositAmount,
                        deposit.tokenId,
                        deposit.starkKey
                      );

                      // console.log("deposit Executed: ", user.deposits);

                      // user.deposits = user.deposits.filter(
                      //   (d: any) => d.depositId != deposit.depositId
                      // );

                      // console.log("user.deposits: ", depositAmount);
                      // console.log("symbol: ", IDS_TO_SYMBOLS[deposit.tokenId]);

                      showToast({
                        type: "info",
                        message:
                          "Deposit successful: " +
                          depositAmount.toFixed(2) +
                          " " +
                          IDS_TO_SYMBOLS[deposit.tokenId],
                      });
                    } catch (error) {
                      showToast({
                        type: "error",
                        message: error,
                      });
                    }
                  } else {
                    // * WITHDRAWAL  ================================================
                    // await sendWithdrawal(user, user.amount, user.token, pubKey);
                  }
                }}
                className="px-8 py-2.5 rounded-lg bg-blue  hover:opacity-70 text-white "
              >
                Claim
              </button>
            </div>
          );
        })
      ) : (
        <div className="pt-5 mt-5">
          <h1>No claimable {type}s</h1>
        </div>
      )}
    </div>
  );
};

export default PendingPanel;
