const {
  DECIMALS_PER_ASSET,
  PRICE_DECIMALS_PER_ASSET,
  COLLATERAL_TOKEN_DECIMALS,
  get_max_leverage,
} = require("./utils");

function _getBankruptcyPrice(
  entryPrice,
  margin,
  size,
  orderSide,
  syntheticToken
) {
  const syntheticDecimals = DECIMALS_PER_ASSET[syntheticToken];
  const syntheticPriceDecimals = PRICE_DECIMALS_PER_ASSET[syntheticToken];

  const decConversion1 =
    syntheticPriceDecimals - COLLATERAL_TOKEN_DECIMALS + syntheticDecimals;
  const multiplier1 = 10 ** decConversion1;

  if (orderSide == "Long" || orderSide == 0) {
    return Math.floor(entryPrice) - Math.floor((margin * multiplier1) / size);
  } else {
    const bp =
      Math.floor(entryPrice) + Math.floor((margin * multiplier1) / size);
    return bp;
  }
}

function _getLiquidationPrice(entryPrice, bankruptcyPrice, orderSide) {
  if (bankruptcyPrice == 0) {
    return 0;
  }

  // maintnance margin
  let mm_rate = 3; // 3% of 100

  // liquidation price is 2% above/below the bankruptcy price
  if (orderSide == "Long" || orderSide == 0) {
    return bankruptcyPrice + Math.floor((mm_rate * entryPrice) / 100);
  } else {
    return bankruptcyPrice - Math.floor((mm_rate * entryPrice) / 100);
  }
}

function calulateLiqPriceInMarginChangeModal(position, marginChange) {
  marginChange = marginChange * 10 ** COLLATERAL_TOKEN_DECIMALS;

  let bankruptcyPrice = _getBankruptcyPrice(
    position.entry_price,
    position.margin + marginChange,
    position.position_size,
    position.order_side,
    position.synthetic_token
  );

  let liqPrice = _getLiquidationPrice(
    position.entry_price,
    bankruptcyPrice,
    position.order_side
  );

  return Math.max(liqPrice, 0);
}

function calcAvgEntryInIncreaseSize(position, sizeChange, indexPrice) {
  let scaledPrice =
    indexPrice * 10 ** PRICE_DECIMALS_PER_ASSET[position.synthetic_token];
  let scaledSize =
    sizeChange * 10 ** DECIMALS_PER_ASSET[position.synthetic_token];

  let avgEntryPrice =
    (position.position_size * position.entry_price + scaledSize * scaledPrice) /
    (position.position_size + scaledSize);

  return (
    avgEntryPrice / 10 ** PRICE_DECIMALS_PER_ASSET[position.synthetic_token]
  );
}

function calulateLiqPriceInIncreaseSize(position, sizeChange, indexPrice) {
  let scaledPrice =
    indexPrice * 10 ** PRICE_DECIMALS_PER_ASSET[position.synthetic_token];
  let scaledSize =
    sizeChange * 10 ** DECIMALS_PER_ASSET[position.synthetic_token];

  let avgEntryPrice =
    (position.position_size * position.entry_price + scaledSize * scaledPrice) /
    (position.position_size + scaledSize);

  let bankruptcyPrice = _getBankruptcyPrice(
    avgEntryPrice,
    position.margin,
    position.position_size + scaledSize,
    position.order_side,
    position.synthetic_token
  );

  let liqPrice = _getLiquidationPrice(
    avgEntryPrice,
    bankruptcyPrice,
    position.order_side
  );

  return Math.max(liqPrice, 0);
}

function calulateLiqPriceInDecreaseSize(position, sizeChange) {
  let scaledSize =
    sizeChange * 10 ** DECIMALS_PER_ASSET[position.synthetic_token];

  let new_size = position.position_size - scaledSize;

  let bankruptcyPrice = _getBankruptcyPrice(
    position.entry_price,
    position.margin,
    new_size,
    position.order_side,
    position.synthetic_token
  );

  let liqPrice = _getLiquidationPrice(
    position.entry_price,
    bankruptcyPrice,
    position.order_side
  );

  return Math.max(liqPrice, 0);
}

function calulateLiqPriceInFlipSide(position, sizeChange, indexPrice) {
  let scaledSize =
    sizeChange * 10 ** DECIMALS_PER_ASSET[position.synthetic_token];
  let scaledPrice =
    indexPrice * 10 ** PRICE_DECIMALS_PER_ASSET[position.synthetic_token];

  let new_size = scaledSize - position.position_size;

  let newOrderSide = position.order_side == "Long" ? "Short" : "Long";

  let bankruptcyPrice = _getBankruptcyPrice(
    scaledPrice,
    position.margin,
    new_size,
    newOrderSide,
    position.synthetic_token
  );

  let liqPrice = _getLiquidationPrice(
    scaledPrice,
    bankruptcyPrice,
    newOrderSide
  );

  return Math.max(liqPrice, 0);
}

function getCurrentLeverage(indexPrice, size, margin, syntheticToken) {
  if (indexPrice == 0) {
    throw "Index price cannot be 0";
  }

  const syntheticDecimals = DECIMALS_PER_ASSET[syntheticToken];
  const syntheticPriceDecimals = PRICE_DECIMALS_PER_ASSET[syntheticToken];

  const decimalConversion =
    syntheticDecimals +
    syntheticPriceDecimals -
    (COLLATERAL_TOKEN_DECIMALS + LEVERAGE_DECIMALS);

  const multiplier = 10 ** decimalConversion;

  const currentLeverage = (indexPrice * size) / (margin * multiplier);

  return currentLeverage;
}

function getMinViableMargin(position) {
  const maxLeverage = get_max_leverage(
    position.synthetic_token,
    position.position_size / 10 ** DECIMALS_PER_ASSET[position.synthetic_token]
  );

  let maxLiquidationPrice = (1 - 1 / maxLeverage) * position.entry_price;

  let multiplier =
    10 **
    (DECIMALS_PER_ASSET[position.synthetic_token] +
      PRICE_DECIMALS_PER_ASSET[position.synthetic_token] -
      COLLATERAL_TOKEN_DECIMALS);

  let minMargin = (position.position_size * maxLiquidationPrice) / maxLeverage;
  minMargin = minMargin / multiplier;

  return minMargin;
}

function checkViableSizeAfterIncrease(position, added_size, added_price) {
  let new_size =
    position.position_size /
      10 ** DECIMALS_PER_ASSET[position.synthetic_token] +
    added_size;
  const maxLeverage = get_max_leverage(position.synthetic_token, new_size);

  let scaledPrice =
    added_price * 10 ** PRICE_DECIMALS_PER_ASSET[position.synthetic_token];
  let scaledSize =
    added_size * 10 ** DECIMALS_PER_ASSET[position.synthetic_token];

  let avgEntryPrice =
    (position.position_size * position.entry_price + scaledSize * scaledPrice) /
    (position.position_size + scaledSize);

  let leverage =
    ((position.position_size + scaledSize) * avgEntryPrice) / position.margin;

  let multiplier =
    10 **
    (DECIMALS_PER_ASSET[position.synthetic_token] +
      PRICE_DECIMALS_PER_ASSET[position.synthetic_token] -
      COLLATERAL_TOKEN_DECIMALS);

  leverage = leverage / multiplier;

  return leverage <= maxLeverage;
}

function checkViableSizeAfterFlip(position, added_size, added_price) {
  let new_size =
    added_size * 10 ** DECIMALS_PER_ASSET[position.synthetic_token] -
    position.position_size;
  const maxLeverage = get_max_leverage(position.synthetic_token, new_size);

  let scaledPrice =
    added_price * 10 ** PRICE_DECIMALS_PER_ASSET[position.synthetic_token];

  let leverage = (new_size * scaledPrice) / position.margin;

  let multiplier =
    10 **
    (DECIMALS_PER_ASSET[position.synthetic_token] +
      PRICE_DECIMALS_PER_ASSET[position.synthetic_token] -
      COLLATERAL_TOKEN_DECIMALS);

  leverage = leverage / multiplier;

  return leverage <= maxLeverage;
}

module.exports = {
  calulateLiqPriceInMarginChangeModal,
  calcAvgEntryInIncreaseSize,
  calulateLiqPriceInIncreaseSize,
  calulateLiqPriceInDecreaseSize,
  calulateLiqPriceInFlipSide,
  getCurrentLeverage,
  getMinViableMargin,
  checkViableSizeAfterFlip,
  checkViableSizeAfterIncrease,
  _getBankruptcyPrice,
  _getLiquidationPrice,
};
