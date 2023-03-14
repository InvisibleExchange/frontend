import React, { useContext } from "react";

const {
  sendDeposit,
  sendWithdrawal,
} = require("../../app_logic/transactions/constructOrders");

const { SYMBOLS_TO_IDS } = require("../../app_logic/helpers/utils");

const PendingPanel = ({ type, user }: any) => {
  const deposits = [
    { depositId: 1, amount: 3, token: "ETH", pubKey: 1234 },
    { depositId: 2, amount: 1000, token: "USDC", pubKey: 1234 },
  ];

  return (
    <div>
      <p className="uppercase">Pending {type}</p>

      {deposits.map((deposit) => {
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
                  console.log("deposit", deposit);
                  console.log("SYMBOLS_TO_IDS", SYMBOLS_TO_IDS[deposit.token]);

                  try {
                    await sendDeposit(
                      user,
                      deposit.depositId,
                      deposit.amount,
                      SYMBOLS_TO_IDS[deposit.token],
                      deposit.pubKey
                    );

                    alert("Deposit sucessful");
                  } catch (error) {
                    alert(error);
                  }
                } else {
                  // await sendWithdrawal(user, user.amount, user.token, pubKey);
                }
              }}
              className="px-8 py-2.5 rounded-lg bg-blue hover:opacity-70 text-white"
            >
              Claim
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default PendingPanel;
