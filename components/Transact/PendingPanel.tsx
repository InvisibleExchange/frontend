import React from "react";

import btcLogo from "../../public/tokenIcons/bitcoin.png";
import ethLogo from "../../public/tokenIcons/ethereum-eth-logo.png";
import usdcLogo from "../../public/tokenIcons/usdc-logo.png";

const { sendDeposit } = require("../../app_logic/transactions/constructOrders");

const {
  SYMBOLS_TO_IDS,
  DUST_AMOUNT_PER_ASSET,
} = require("../../app_logic/helpers/utils");

const PendingPanel = ({ type, user, showToast }: any) => {
  let deposits: any[] = [];

  let amounts = { ETH: 5, USDC: 55_000, BTC: 2 };
  let icons = { ETH: ethLogo, USDC: usdcLogo, BTC: btcLogo };
  if (user?.userId) {
    for (let token_ of ["ETH", "USDC", "BTC"]) {
      let token = SYMBOLS_TO_IDS[token_];

      let bal = user.getAvailableAmount(token);
      if (bal < DUST_AMOUNT_PER_ASSET[token]) {
        deposits.push({
          depositId: 112412412412, //CHAIN_IDS["L1"] * 2 ** 32 + 12345,
          amount: amounts[token_],
          token: token_,
          pubKey: 1234,
        });
      }
    }
  }

  let helperMessage =
    "** For ease of testing, we don't require you to have goerli eth given its scarcity, so you can mint yourself some test funds below. **";

  return (
    <div>
      <p className="uppercase">
        <strong>Claim {type}s:</strong>{" "}
      </p>
      {type == "Deposit" ? <em>{helperMessage}</em> : null}
      {deposits?.length ? (
        deposits.map((deposit) => {
          return (
            <div
              key={deposit.depositId}
              className="flex items-center w-full mt-5 rounded-l-lg bg-border_color"
            >
              <div className="w-full flex py-2.5 pl-5 text-gray_light">
                <p> {deposit.amount.toFixed(2)}</p>

                <p className="ml-3"> {deposit.token}</p>

                {/* <img
                  src={icons[deposit.token].src}
                  alt="Currency Logo"
                  className="logo_icon"
                /> */}
              </div>
              <button
                onClick={async () => {
                  if (type == "Deposit") {
                    try {
                      await sendDeposit(
                        user,
                        deposit.depositId,
                        deposit.amount,
                        SYMBOLS_TO_IDS[deposit.token],
                        deposit.pubKey
                      );

                      showToast({
                        type: "info",
                        message:
                          "Deposit successful: " +
                          deposit.amount.toFixed(2) +
                          " " +
                          deposit.token,
                      });
                    } catch (error) {
                      showToast({
                        type: "error",
                        message: error,
                      });
                    }
                  } else {
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
