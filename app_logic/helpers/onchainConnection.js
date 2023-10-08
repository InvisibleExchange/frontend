const ethers = require("ethers");

// const privateKey =
//   "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
// const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
// const signer = new ethers.Wallet(privateKey, provider);

// const invisibleL1Address = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; //Todo
// const invisibleL1Abi =
//   require("../../out/InvisibleL1.sol/InvisibleL1.json").abi;

// const invisibleL1Contract = new ethers.Contract(
//   invisibleL1Address,
//   invisibleL1Abi,
//   signer
// );

// const TestTokenAbi = require("../../out/TestToken.sol/TestToken.json").abi;

// const WbtcAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; //Todo
// const WbtcContract = new ethers.Contract(WbtcAddress, TestTokenAbi, signer);

// const UsdcAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; //Todo
// const UsdcContract = new ethers.Contract(UsdcAddress, TestTokenAbi, signer);

// const smartContracts = {
//   12345: WbtcContract,
//   55555: UsdcContract,
// };
const onChainErc20Decimals = {
  12345: 18,
  54321: 18,
  55555: 18,
};
async function executeDepositTx(
  user,
  smartContracts,
  amount,
  token,
  tokenBalance,
  userAddress
) {
  if (amount <= 0 || (!smartContracts[token] && token != 54321)) {
    alert("Set a valid amount and select a token");
    return null;
  }

  let invisibleL1Contract = smartContracts["invisibleL1"];

  let depositStarkKey = user.getDepositStarkKey(token);

  let depositAmount =
    BigInt(amount * 1000) * 10n ** BigInt(onChainErc20Decimals[token] - 3);

  // ! If ETH
  if (token == 54321) {
    if (tokenBalance < amount) {
      alert("Not enough balance");
      throw new Error("Not enough balance");
    }

    let txRes = await invisibleL1Contract.makeDeposit(
      "0x0000000000000000000000000000000000000000",
      0,
      depositStarkKey,
      { gasLimit: 3000000, value: depositAmount }
    );
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
      alert("Not enough balance");
      throw new Error("Not enough balance");
    }

    let allowance = await tokenContract.allowance(
      userAddress,
      invisibleL1Contract.address
    );

    if (allowance < depositAmount) {
      let txRes = await tokenContract.approve(
        invisibleL1Contract.address,
        depositAmount
      );
      await txRes.wait();
    }

    let txRes = await invisibleL1Contract.makeDeposit(
      tokenContract.address,
      depositAmount,
      depositStarkKey,
      { gasLimit: 3000000 }
    );
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
}

async function main() {
  let res = await makeDeposit(null, 0.01, 54321);
  // let res = await makeDeposit(null, 0.01, 12345);

  console.log("res: ", res);

  // listenForDeposit();
}

// main();

module.exports = {
  executeDepositTx,
};
