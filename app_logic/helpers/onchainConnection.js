const EXCHANGE_CONFIG = require("../../exchange-config.json");
const ONCHAIN_DECIMALS_PER_ASSET =
  EXCHANGE_CONFIG["ONCHAIN_DECIMALS_PER_ASSET"];
const SYMBOLS_TO_IDS = EXCHANGE_CONFIG["SYMBOLS_TO_IDS"];

async function executeDepositTx(
  user,
  smartContracts,
  amount,
  token,
  tokenBalance,
  userAddress,
  setToastMessage
) {
  tokenBalance = Number(tokenBalance);
  amount = Number(amount);

  if (
    amount <= 0 ||
    (!smartContracts[token] && token != SYMBOLS_TO_IDS["ETH"])
  ) {
    alert("Set a valid amount and select a token");
    return null;
  }

  let invisibleL1Contract = smartContracts["invisibleL1"];

  let depositStarkKey = user.getDepositStarkKey(token);

  let depositAmount =
    BigInt(amount * 1000) *
    10n ** BigInt(ONCHAIN_DECIMALS_PER_ASSET[token] - 3);

  // ! If ETH
  if (token == SYMBOLS_TO_IDS["ETH"]) {
    if (tokenBalance < amount) {
      throw new Error("Not enough balance");
    }

    let txRes = await invisibleL1Contract
      .makeDeposit(
        "0x0000000000000000000000000000000000000000",
        0,
        depositStarkKey,
        { gasLimit: 3000000, value: depositAmount }
      )
      .catch((err) => {
        if (err.message.includes("user rejected transaction")) {
          throw Error("User rejected transaction");
        }
      });
    setToastMessage({
      type: "pending_tx",
      message: "Waiting for deposit confirmation: " + txRes.hash,
    });
    let receipt = await txRes.wait();
    let txHash = receipt.transactionHash;

    // ? Get the events emitted by the transaction
    let deposit;
    receipt.logs.forEach((log) => {
      try {
        const event = invisibleL1Contract.interface.parseLog(log);
        if (event) {
          if (event.name == "DepositEvent") {
            deposit = {
              depositId: event.args.depositId.toString(),
              starkKey: event.args.pubKey.toString(),
              tokenId: event.args.tokenId.toString(),
              amount: event.args.depositAmountScaled.toString(),
              timestamp: event.args.timestamp.toString(),
              txHash: txHash.toString(),
            };
            return;
          }
        }
      } catch (e) {
        console.log("e: ", e);
      }
    });

    return deposit;
  }
  // ! If ERC20
  else {
    // NOTE: Token has to be approved first!

    let tokenContract = smartContracts[token];

    if (tokenBalance < amount) {
      throw new Error("Not enough balance");
    }

    let allowance = await tokenContract.allowance(
      userAddress,
      invisibleL1Contract.address
    );

    if (allowance < depositAmount) {
      let txRes = await tokenContract
        .approve(invisibleL1Contract.address, depositAmount)
        .catch((err) => {
          if (err.message.includes("user rejected transaction")) {
            throw Error("User rejected transaction");
          }
        });
      setToastMessage({
        type: "pending_tx",
        message: "Waiting for approval confirmation: " + txRes.hash,
      });
      await txRes.wait();
    }

    let txRes = await invisibleL1Contract
      .makeDeposit(tokenContract.address, depositAmount, depositStarkKey, {
        gasLimit: 3000000,
      })
      .catch((err) => {
        if (err.message.includes("user rejected transaction")) {
          throw Error("User rejected transaction");
        }
      });
    setToastMessage({
      type: "pending_tx",
      message: "Waiting for deposit confirmation: " + txRes.hash,
    });
    let receipt = await txRes.wait().catch((err) => {
      throw Error("Deposit failed");
    });
    let txHash = receipt.transactionHash;

    // ? Get the events emitted by the transaction
    let deposit;

    receipt.logs.forEach((log) => {
      try {
        const event = invisibleL1Contract.interface.parseLog(log);
        if (event) {
          if (event.name == "DepositEvent") {
            deposit = {
              depositId: event.args.depositId.toString(),
              starkKey: event.args.pubKey.toString(),
              tokenId: event.args.tokenId.toString(),
              amount: event.args.depositAmountScaled.toString(),
              timestamp: event.args.timestamp.toString(),
              txHash: txHash.toString(),
            };
            return;
          }
        }
      } catch (e) {
        console.log("e: ", e);
      }
    });

    return deposit;
  }
}

async function main() {
  // let res = await makeDeposit(null, 0.01, SYMBOLS_TO_IDS["ETH"]);
  // let res = await makeDeposit(null, 0.01, SYMBOLS_TO_IDS["BTC"]);
  // listenForDeposit();
}

// main();

module.exports = {
  executeDepositTx,
};
