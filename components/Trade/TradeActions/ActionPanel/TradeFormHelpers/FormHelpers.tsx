const {
  get_max_leverage,
  COLLATERAL_TOKEN_DECIMALS,
  DECIMALS_PER_ASSET,
  PRICE_DECIMALS_PER_ASSET,
  SYMBOLS_TO_IDS,
  MAX_LEVERAGE,
  COLLATERAL_TOKEN,
} = require("../../../../../app_logic/helpers/utils");

const {
  checkViableSizeAfterIncrease,
  checkViableSizeAfterFlip,
  calcAvgEntryInIncreaseSize,
  calulateLiqPriceInIncreaseSize,
  calulateLiqPriceInDecreaseSize,
  calulateLiqPriceInFlipSide,
} = require("../../../../../app_logic/helpers/tradePriceCalculations");

function checkValidSizeIncrease(
  user,
  order_side,
  positionData,
  token,
  baseAmount,
  price
) {
  // TODO: TEST THIS =================================================
  // Find other orders trying to increase this position
  let activeModifyOrders = user.perpetualOrders.filter((order) => {
    return (
      order.position_effect_type == 1 &&
      order.order_side == order_side &&
      order.position_address == positionData.position_address
    );
  });

  // sum up the total amount of base tokens being added to the position
  let totalBaseAmount = activeModifyOrders.reduce((acc, order) => {
    return acc + Number(order.qty_left);
  }, 0);

  totalBaseAmount =
    totalBaseAmount / 10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]] +
    baseAmount;

  let totalNominal = activeModifyOrders.reduce((acc, order) => {
    return (
      acc +
      (Number(order.qty_left) /
        10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]]) *
        Number(order.price)
    );
  }, 0);
  totalNominal = totalNominal + baseAmount * price;
  let avgPrice = totalNominal / totalBaseAmount;

  // TODO: TEST THIS =================================================

  if (
    // TODO: This should account for active orders as well

    !checkViableSizeAfterIncrease(positionData, totalBaseAmount, avgPrice)
  ) {
    return false;
  }

  return true;
}

function checkValidSizeFlip(
  user,
  order_side,
  positionData,
  token,
  baseAmount,
  price
) {
  // Find other orders trying to decrease(flip) this position
  let activeModifyOrders = user.perpetualOrders.filter((order) => {
    return (
      order.position_effect_type == 1 &&
      order.order_side != order_side &&
      order.position_address == positionData.position_address
    );
  });

  // sum up the total amount of base tokens being added to the position
  let totalBaseAmount = activeModifyOrders.reduce((acc, order) => {
    return acc + Number(order.qty_left);
  }, 0);

  totalBaseAmount =
    totalBaseAmount / 10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]] +
    baseAmount;

  let totalNominal = activeModifyOrders.reduce((acc, order) => {
    return (
      acc +
      (Number(order.qty_left) /
        10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]]) *
        Number(order.price)
    );
  }, 0);
  totalNominal = totalNominal + baseAmount * price;
  let avgPrice = totalNominal / totalBaseAmount;

  if (
    totalBaseAmount * 10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]] >
    positionData.position_size
  ) {
    if (!checkViableSizeAfterFlip(positionData, totalBaseAmount, avgPrice)) {
      return false;
    }
  }

  return true;
}

// HELPERS ================================================================================================

function calculateNewSize(
  position: any,
  increaseSize: number,
  isBuy: boolean
): number {
  let size =
    position.position_size / 10 ** DECIMALS_PER_ASSET[position.synthetic_token];

  if (!increaseSize) {
    return size;
  }

  if (isBuy) {
    if (position.order_side == "Long") {
      return size + increaseSize;
    } else {
      if (increaseSize > size) {
        return increaseSize - size;
      } else {
        return size - increaseSize;
      }
    }
  } else {
    if (position.order_side == "Short") {
      return size + increaseSize;
    } else {
      if (increaseSize > size) {
        return increaseSize - size;
      } else {
        return size - increaseSize;
      }
    }
  }
}

function calculateAvgEntryPrice(
  position: any,
  increaseSize: number,
  price: number,
  isBuy: boolean
): number {
  if (!increaseSize) {
    return (
      position.entry_price /
      10 ** PRICE_DECIMALS_PER_ASSET[position.synthetic_token]
    );
  }

  if (isBuy) {
    if (position.order_side == "Long") {
      return calcAvgEntryInIncreaseSize(position, increaseSize, price);
    } else {
      if (
        increaseSize >
        position.position_size /
          10 ** DECIMALS_PER_ASSET[position.synthetic_token]
      ) {
        return price;
      } else {
        return (
          position.entry_price /
          10 ** PRICE_DECIMALS_PER_ASSET[position.synthetic_token]
        );
      }
    }
  } else {
    if (position.order_side == "Short") {
      return calcAvgEntryInIncreaseSize(position, increaseSize, price);
    } else {
      if (
        increaseSize >
        position.position_size /
          10 ** DECIMALS_PER_ASSET[position.synthetic_token]
      ) {
        return price;
      } else {
        return (
          position.entry_price /
          10 ** PRICE_DECIMALS_PER_ASSET[position.synthetic_token]
        );
      }
    }
  }
}

function calculateNewLiqPrice(
  position: any,
  increaseSize: number,
  price: number,
  isBuy: boolean
): number {
  if (!increaseSize) {
    return (
      position.liquidation_price /
      10 ** PRICE_DECIMALS_PER_ASSET[position.synthetic_token]
    );
  }

  if (isBuy) {
    if (position.order_side == "Long") {
      return (
        calulateLiqPriceInIncreaseSize(position, increaseSize, price) /
        10 ** PRICE_DECIMALS_PER_ASSET[position.synthetic_token]
      );
    } else {
      if (
        increaseSize >
        position.position_size /
          10 ** DECIMALS_PER_ASSET[position.synthetic_token]
      ) {
        return (
          calulateLiqPriceInFlipSide(position, increaseSize, price) /
          10 ** PRICE_DECIMALS_PER_ASSET[position.synthetic_token]
        );
      } else {
        return (
          calulateLiqPriceInDecreaseSize(position, increaseSize) /
          10 ** PRICE_DECIMALS_PER_ASSET[position.synthetic_token]
        );
      }
    }
  } else {
    if (position.order_side == "Short") {
      return (
        calulateLiqPriceInIncreaseSize(position, increaseSize, price) /
        10 ** PRICE_DECIMALS_PER_ASSET[position.synthetic_token]
      );
    } else {
      if (
        increaseSize >
        position.position_size /
          10 ** DECIMALS_PER_ASSET[position.synthetic_token]
      ) {
        return (
          calulateLiqPriceInFlipSide(position, increaseSize, price) /
          10 ** PRICE_DECIMALS_PER_ASSET[position.synthetic_token]
        );
      } else {
        return (
          calulateLiqPriceInDecreaseSize(position, increaseSize) /
          10 ** PRICE_DECIMALS_PER_ASSET[position.synthetic_token]
        );
      }
    }
  }
}

function formatInputNum(val: any, decimals: number) {
  if (!val) {
    return null;
  }

  val = val.toString();
  let decimalPointIndex = val.indexOf(".");
  if (decimalPointIndex == 0) {
    return "0" + val;
  }

  if (decimalPointIndex > -1) {
    let numDigitsAfterDecimalPoint = val.length - decimalPointIndex - 1;
    if (numDigitsAfterDecimalPoint > decimals) {
      let valArr = val.split("");
      let end = Math.min(decimalPointIndex + decimals + 1, valArr.length - 1);
      valArr = valArr.slice(0, end);
      return valArr.join("");
    } else {
      return val;
    }
  } else {
    return val;
  }
}

function addCommasToNumber(num) {
  // I want to receive a number and return a string with commas every third place from the right like so 12,234,567.89

  // First I want to split the number into two parts, the whole number and the decimal
  let numArr = num.toString().split(".");
  let wholeNum = numArr[0];
  let decimal = numArr[1];

  // Next I want to split the whole number into an array of strings
  let wholeNumArr = wholeNum.split("");

  // Next I want to loop through the wholeNumArr backwards and add a comma every third place
  let newWholeNumArr: any = [];
  let count = 0;
  for (let i = wholeNumArr.length - 1; i >= 0; i--) {
    if (count == 3) {
      newWholeNumArr.push(",");
      count = 0;
    }
    newWholeNumArr.push(wholeNumArr[i]);
    count++;
  }

  // Next I want to reverse the newWholeNumArr and join it into a string
  let newWholeNum = newWholeNumArr.reverse().join("");

  // Next I want to add the decimal back on if it exists
  if (decimal) {
    newWholeNum = newWholeNum + "." + decimal;
  }

  return newWholeNum;
}

export {
  calculateNewSize,
  calculateAvgEntryPrice,
  calculateNewLiqPrice,
  formatInputNum,
  addCommasToNumber,
  checkValidSizeIncrease,
  checkValidSizeFlip,
};
