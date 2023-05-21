import { formatInputNum } from "../TradeFormHelpers/FormHelpers";

const {
  COLLATERAL_TOKEN_DECIMALS,
  SYMBOLS_TO_IDS,

  COLLATERAL_TOKEN,
  DECIMALS_PER_ASSET,
} = require("../../../../../app_logic/helpers/utils");

const {
  getCurrentLeverage,
  getMaxLeverage,
  getSizeFromLeverage,
  MAX_LEVERAGE,
} = require("../../../../../app_logic/helpers/tradePriceCalculations");

const _handlePriceChange = (
  setPrice,
  baseAmount,
  setQuoteAmount,
  leverage,
  positionData,
  action,
  token,
  newMinMaxLeverage,
  setLeverage,
  e: any
) => {
  let price = formatInputNum(e.target.value, 2);
  setPrice(price);

  if (!price) {
    return;
  }

  if (positionData) {
    if (Number(baseAmount)) {
      let size;
      if (action == positionData.order_side) {
        // ? Increasing position size
        size =
          positionData.position_size /
            10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]] +
          Number(baseAmount);
      } else {
        size =
          positionData.position_size /
            10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]] -
          Number(baseAmount);
      }

      if (Math.abs(size) > newMinMaxLeverage?.newMaxSize) {
        console.log("size too large");
      }

      let margin = positionData.margin / 10 ** COLLATERAL_TOKEN_DECIMALS;

      //indexPrice, size, margin
      let leverage_ = getCurrentLeverage(Number(price), size, margin);
      leverage_ = Math.min(leverage_, newMinMaxLeverage?.upperBound);
      leverage_ = Math.max(leverage_, newMinMaxLeverage?.lowerBound);

      setLeverage(Number(formatInputNum(leverage_.toString(), 1)));
    }
  } else {
    if (baseAmount) {
      let nominalValue = Number(baseAmount) * price;

      let initMargin = nominalValue / leverage;
      setQuoteAmount(formatInputNum(initMargin.toString(), 4));
    }
  }
};
const _handleBaseAmountChange = (
  setQuoteAmount,
  setBaseAmount,
  setMaxLeverage,
  positionData,
  price,
  action,
  token,
  newMinMaxLeverage,
  leverage,
  setLeverage,
  e: any
) => {
  let baseAmount_ = formatInputNum(e.target.value, 4);
  setBaseAmount(baseAmount_);

  if (!baseAmount_ || baseAmount_ == "0") {
    setMaxLeverage(MAX_LEVERAGE);
    return;
  }

  if (positionData) {
    if (Number(price)) {
      let size;
      if (action == positionData.order_side) {
        // ? Increasing position size
        size =
          positionData.position_size /
            10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]] +
          Number(baseAmount_);
      } else {
        size =
          positionData.position_size /
            10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]] -
          Number(baseAmount_);
      }

      if (Math.abs(size) > newMinMaxLeverage?.newMaxSize) {
        console.log("size too large");
      }

      let margin = positionData.margin / 10 ** COLLATERAL_TOKEN_DECIMALS;

      //indexPrice, size, margin
      let leverage_ = getCurrentLeverage(Number(price), size, margin);
      leverage_ = Math.min(leverage_, newMinMaxLeverage?.upperBound);
      leverage_ = Math.max(leverage_, newMinMaxLeverage?.lowerBound);

      setLeverage(Number(formatInputNum(leverage_.toString(), 1)));
    }
  } else {
    if (price) {
      let nominalValue = Number(baseAmount_) * Number(price);
      let initMargin = nominalValue / leverage;

      setQuoteAmount(formatInputNum(initMargin.toString(), 4));
    }

    let max_leverage = getMaxLeverage(SYMBOLS_TO_IDS[token], baseAmount_);
    setMaxLeverage(Number(formatInputNum(max_leverage.toString(), 1)));
    if (leverage > max_leverage) {
      setLeverage(Number(formatInputNum(max_leverage.toString(), 1)));
    }
  }
};
const _handleQuoteAmountChange = (
  setQuoteAmount,
  setBaseAmount,
  setMaxLeverage,
  price,
  token,
  leverage,
  e: any
) => {
  let quoteAmount = formatInputNum(e.target.value, 2);
  setQuoteAmount(quoteAmount);

  if (!quoteAmount || quoteAmount == "0") {
    return;
  }

  if (price && leverage) {
    let baseAmount = (Number(quoteAmount) * leverage) / Number(price);
    setBaseAmount(formatInputNum(baseAmount.toString(), 4));

    let max_leverage = getMaxLeverage(SYMBOLS_TO_IDS[token], baseAmount);
    setMaxLeverage(Number(formatInputNum(max_leverage.toString(), 1)));
  }
};
const _handleSliderChange = (
  setQuoteAmount,
  leverage,
  setLeverage,
  baseAmount,
  positionData,
  price,
  setBaseAmount,
  newMinMaxLeverage,
  val: any
) => {
  let leverage_ = Number(val[0]);

  if (newMinMaxLeverage) {
    leverage_ = Math.min(leverage_, newMinMaxLeverage?.upperBound);
    leverage_ = Math.max(leverage_, newMinMaxLeverage?.lowerBound);
  } else {
    leverage_ = Math.min(leverage_, MAX_LEVERAGE);
    leverage_ = Math.max(leverage_, 0.1);
  }

  setLeverage(leverage_);

  if (positionData) {
    if (Number(price)) {
      let margin = positionData.margin / 10 ** COLLATERAL_TOKEN_DECIMALS;

      let newSize = getSizeFromLeverage(Number(price), leverage_, margin);
      let sizeChange = Math.abs(
        newSize -
          positionData.position_size /
            10 ** DECIMALS_PER_ASSET[positionData.synthetic_token]
      );

      setBaseAmount(Number(formatInputNum(sizeChange.toString(), 3)));
    }
  } else {
    if (price && baseAmount) {
      let nominalValue = Number(baseAmount) * Number(price);
      let initMargin = nominalValue / leverage_;

      setQuoteAmount(formatInputNum(initMargin.toString(), 4));
    }
  }
};

export {
  _handlePriceChange,
  _handleBaseAmountChange,
  _handleQuoteAmountChange,
  _handleSliderChange,
};
