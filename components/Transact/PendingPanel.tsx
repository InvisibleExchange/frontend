import React, { useContext } from "react";

const {
  sendDeposit,
  sendWithdrawal,
} = require("../../app_logic/transactions/constructOrders");

const {
  SYMBOLS_TO_IDS,
  DUST_AMOUNT_PER_ASSET,
  CHAIN_IDS,
} = require("../../app_logic/helpers/utils");

const PendingPanel = ({ type, user, showToast }: any) => {
  let deposits: any[] = [];

  let amounts = { ETH: 5, USDC: 15_000, BTC: 0.5 };
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
              <p className="w-full py-2.5 pl-5 text-gray_light">
                {deposit.amount.toFixed(2)} {deposit.token}
              </p>
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
