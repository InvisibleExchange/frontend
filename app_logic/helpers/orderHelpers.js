const { get_max_leverage, LEVERAGE_DECIMALS } = require("./utils");

function consistencyChecks(orderA, orderB, spentAmountA, spentAmountB) {
  // ? Check that the tokens swapped match
  if (
    orderA.token_spent !== orderB.token_received ||
    orderA.token_received !== orderB.token_spent
  ) {
    alert("Tokens swapped do not match");
    throw "Tokens swapped do not match";
  }

  // ? Check that the amounts swapped dont exceed the order amounts
  if (
    orderA.amount_spent < spentAmountA ||
    orderB.amount_spent < spentAmountB
  ) {
    alert("Amounts swapped exceed order amounts");
    throw "Amounts swapped exceed order amounts";
  }

  // Todo: Fees taken

  // ? Verify consistency of amounts swaped
  if (
    spentAmountA * orderA.amount_received >
      spentAmountB * orderA.amount_spent ||
    spentAmountB * orderB.amount_received > spentAmountA * orderB.amount_spent
  ) {
    alert("Amount swapped ratios");
  }
}

function perpConsisencyChecks(orderA, orderB, spentCollateral, spentSynthetic) {
  if (orderA.synthetic_token != orderB.synthetic_token) {
    alert("Tokens swapped do not match");
    throw "Tokens swapped do not match";
  }

  // ? Checks if order sides are different and returns the long order as orderA
  if (orderA.order_side != "Long" || orderB.order_side != "Short") {
    let tempOrder = orderA;
    orderA = orderB;
    orderB = tempOrder;

    if (orderA.order_side != "Long" || orderB.order_side != "Short") {
      alert("Order side missmatch");
      throw "Order side missmatch";
    }
  }

  // ? Check that the amounts swapped don't exceed the order amounts
  if (
    orderA.collateral_amount < spentCollateral ||
    orderB.synthetic_amount < spentSynthetic
  ) {
    alert("Amounts swapped exceed order amounts");
    throw "Amounts swapped exceed order amounts";
  }

  if (
    spentCollateral * orderA.synthetic_amount >
      spentSynthetic * orderA.collateral_amount ||
    spentSynthetic * orderB.collateral_amount >
      spentCollateral * orderB.synthetic_amount
  ) {
    alert("Amount swapped ratios are inconsistent");
    throw "Amount swapped ratios are inconsistent";
  }

  // Todo: Fees taken
}

// ===================================================================================

function checkPerpOrderValidity(
  user,
  orderSide,
  posEffectType,
  expirationTime,
  syntheticToken,
  syntheticAmount,
  collateralToken,
  collateralAmount,
  initialMargin,
  feeLimit
) {
  if (
    !expirationTime ||
    !syntheticToken ||
    !syntheticAmount ||
    feeLimit == null ||
    !orderSide
  ) {
    console.log("Please fill in all fields");
    throw "Unfilled fields";
  }

  if (posEffectType == "Open") {
    if (!collateralToken || !initialMargin) {
      console.log("Please fill in all fields");
      throw "Unfilled fields";
    }

    if (initialMargin > user.getAvailableAmount(collateralToken)) {
      throw "Insufficient balance";
    }
  } else {
    if (!user.positionData[syntheticToken]) {
      console.log("Position does not exist. Try opening a position first");
      throw "order invalid";
    }
  }

  if (expirationTime <= 3 || expirationTime > 1000) {
    console.log("Expiration time must be between 4 and 1000 hours");
    throw "Exipration time invalid";
  }
}

module.exports = {
  checkPerpOrderValidity,
};
