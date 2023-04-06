import React, { useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { WalletContext } from "../../../../../context/WalletContext";
import { tradeTypeSelector } from "../../../../../lib/store/features/apiSlice";

import TooltipPerpetualSlider from "../TooltipPerpetualSlider";
import TooltipSpotSlider from "../TooltipSpotSlider";
import SettingsPopover from "./SettingsPopover";

const {
  _renderActionButtons,
  _renderConnectButton,
  _renderLoginButton,
} = require("./FormHelpers");

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
  calcAvgEntryInIncreaseSize,
  calulateLiqPriceInIncreaseSize,
  calulateLiqPriceInDecreaseSize,
  calulateLiqPriceInFlipSide,
} = require("../../../../../app_logic/helpers/tradePriceCalculations");

type props = {
  type: string;
  perpType: string;
  token: string;
  action: string;
};

// TODO !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// TODO !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// TODO If there is already an open order modifying the position, then cancel that order and apply a new one

const TradeForm = ({ type, perpType, token, action }: props) => {
  let {
    user,
    userAddress,
    login,
    connect,
    forceRerender,
    getSelectedPosition,
    getMarkPrice,
  } = useContext(WalletContext);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {}, [user]);

  let selectedPosition = getSelectedPosition();
  let positionData;
  if (selectedPosition) {
    positionData = selectedPosition;
  } else if (user && user.userId && perpType == "perpetual") {
    let posData = user.positionData[SYMBOLS_TO_IDS[token]];
    if (posData && posData.length > 0) {
      positionData = posData[0];
    }
  } else {
    positionData = null;
  }

  const maxBase = user
    ? user.getAvailableAmount(SYMBOLS_TO_IDS[token]) /
      10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]]
    : 0;
  const maxQuote = user
    ? user.getAvailableAmount(COLLATERAL_TOKEN) /
      10 ** COLLATERAL_TOKEN_DECIMALS
    : 0;

  const tradeType = useSelector(tradeTypeSelector);

  // console.log(user ? user.noteData : null);

  function percentFormatter(v: any) {
    return `${v}`;
  }

  function renderActionButtons() {
    return _renderActionButtons(
      user,
      Number(baseAmount),
      Number(price),
      perpType,
      positionData,
      token,
      type,
      Number(quoteAmount),
      Number(expirationTime),
      Number(maxSlippage),
      forceRerender,
      action,
      refundNow,
      isLoading,
      setIsLoading
    );
  }

  function renderConnectButton() {
    return _renderConnectButton(connect);
  }

  function renderLoginButton() {
    return _renderLoginButton(isLoading, setIsLoading, login, forceRerender);
  }

  const [leverage, setLeverage] = useState(1);
  const [maxLeverage, setMaxLeverage] = useState(MAX_LEVERAGE);

  const [price, setPrice] = useState<string | null>(
    type == "market"
      ? getMarkPrice(SYMBOLS_TO_IDS[token], perpType == "perpetual").toFixed(
          2
        ) ?? "0.00"
      : null
  );
  const [baseAmount, setBaseAmount] = useState<string | null>(null);
  const [quoteAmount, setQuoteAmount] = useState<string | null>(null);

  const handlePriceChange = (e: any) => {
    let price = formatInputNum(e.target.value, 2);
    setPrice(price);

    if (!price) {
      return;
    }

    if (perpType == "perpetual") {
      if (baseAmount) {
        let nominalValue = Number(baseAmount) * price;

        let initMargin = nominalValue / leverage;
        setQuoteAmount(formatInputNum(initMargin.toString(), 4));
      }
    } else {
      if (baseAmount) {
        let quoteAmount = Number(baseAmount) * price;
        setQuoteAmount(formatInputNum(quoteAmount.toString(), 4));
      } else if (quoteAmount) {
        let baseAmount = Number(quoteAmount) / price;
        setBaseAmount(formatInputNum(baseAmount.toString(), 4));
      }
    }
  };
  const handleBaseAmountChange = (e: any) => {
    let baseAmount_ = formatInputNum(e.target.value, 4);
    setBaseAmount(baseAmount_);

    if (!baseAmount_ || baseAmount_ == "0") {
      setMaxLeverage(MAX_LEVERAGE);
      return;
    }

    if (perpType == "perpetual") {
      if (price) {
        let nominalValue = Number(baseAmount_) * Number(price);
        let initMargin = nominalValue / leverage;

        setQuoteAmount(formatInputNum(initMargin.toString(), 4));
      }

      let max_leverage = get_max_leverage(SYMBOLS_TO_IDS[token], baseAmount_);
      setMaxLeverage(Number(formatInputNum(max_leverage.toString(), 1)));
      if (leverage > max_leverage) {
        setLeverage(Number(formatInputNum(max_leverage.toString(), 1)));
      }
    } else {
      if (price) {
        let quoteAmount = Number(baseAmount_) * Number(price);
        setQuoteAmount(formatInputNum(quoteAmount.toString(), 4));
      }
    }
  };
  const handleQuoteAmountChange = (e: any) => {
    let quoteAmount = formatInputNum(e.target.value, 2);
    setQuoteAmount(quoteAmount);

    if (!quoteAmount || quoteAmount == "0") {
      return;
    }

    if (perpType == "perpetual") {
      if (price && leverage) {
        let baseAmount = (Number(quoteAmount) * leverage) / Number(price);
        setBaseAmount(formatInputNum(baseAmount.toString(), 4));

        let max_leverage = get_max_leverage(SYMBOLS_TO_IDS[token], baseAmount);
        setMaxLeverage(Number(formatInputNum(max_leverage.toString(), 1)));
      }
    } else {
      if (price) {
        let baseAmount_ = Number(quoteAmount) / Number(price);
        setBaseAmount(formatInputNum(baseAmount_.toString(), 4));
      } else {
        setBaseAmount(null);
      }
    }
  };
  const handleSliderChange = (val: any) => {
    if (perpType == "perpetual") {
      let leverage_ = Number(val[0]);

      setLeverage(leverage_);

      if (price && baseAmount) {
        let nominalValue = Number(baseAmount) * Number(price);
        let initMargin = nominalValue / leverage;

        setQuoteAmount(formatInputNum(initMargin.toString(), 4));
      }
    } else {
      if (action == "buy") {
        let quoteAmount = (val * maxQuote) / 100;
        setQuoteAmount(formatInputNum(quoteAmount.toString(), 4));

        if (price) {
          let baseAmount_ = quoteAmount / Number(price);
          setBaseAmount(formatInputNum(baseAmount_.toString(), 4));
        }
      } else {
        let baseAmount_ = (val / 100) * maxBase;
        setBaseAmount(formatInputNum(baseAmount_.toString(), 4));

        if (price) {
          let quoteAmount = baseAmount_ * Number(price);
          setQuoteAmount(formatInputNum(quoteAmount.toString(), 4));
        }
      }
    }
  };

  const [refundNow, setRefundNow] = useState<boolean>(true);

  const [expirationTime, setExpirationTime] = useState<number | null>(null);
  const [maxSlippage, setMaxSlippage] = useState<number | null>(null);

  return (
    <div className="mt-2">
      {/* Price ====================================== */}
      <div className="relative">
        <input
          name="price"
          className="w-full py-1.5 pl-4 font-light tracking-wider bg-white rounded-md outline-none ring-1 dark:bg-border_color ring-border_color disabled:opacity-40"
          readOnly={type === "market"}
          type="number"
          step={0.01}
          value={price?.toString()}
          onChange={handlePriceChange}
          placeholder="Price"
        />
        <button className="absolute top-0 py-2 text-sm right-3 dark:text-yellow text-blue hover:opacity-75">
          Last Price
        </button>
      </div>
      {/* Base input ====================================== */}
      <div className="relative mt-6">
        <input
          name="amount"
          className="w-full py-1.5 pl-4 font-light tracking-wider bg-white rounded-md outline-none ring-1 dark:bg-border_color ring-border_color"
          type="number"
          step={0.001}
          value={baseAmount?.toString()}
          onChange={handleBaseAmountChange}
          placeholder="Amount"
        />
        <div className="absolute top-0 right-0 w-16 px-3 py-1.5 text-base font-light text-center dark:font-medium font-overpass text-fg_below_color dark:text-white bg-border_color rounded-r-md">
          {token}
        </div>
      </div>
      {/* Available base ====================================== */}
      {perpType == "spot" ? (
        <div className="flex items-center justify-between mt-2 text-sm text-fg_below_color dark:text-white">
          <p className="text-[12px]">Available balance</p>
          <p>
            {Number(formatInputNum(maxBase.toString(), 3)).toFixed(3)} {token}
          </p>
        </div>
      ) : null}
      {/* Quote input ====================================== */}
      {perpType == "perpetual" && !!positionData ? null : (
        <div className="relative mt-5">
          <input
            name="quote"
            className="w-full py-1.5 pl-4 font-light tracking-wider bg-white rounded-md outline-none ring-1 dark:bg-border_color ring-border_color"
            placeholder={perpType != "perpetual" ? "Total" : "Initial Margin"}
            type="number"
            step={0.001}
            value={quoteAmount?.toString()}
            onChange={handleQuoteAmountChange}
          />
          <div className="absolute top-0 right-0 w-16 px-3 py-1.5 text-base font-light text-center dark:font-medium font-overpass text-fg_below_color dark:text-white bg-border_color rounded-r-md">
            USDC
          </div>
        </div>
      )}
      {/* Available collateral ====================================== */}
      {perpType == "perpetual" && !!positionData ? null : (
        <div className="flex items-center justify-between mt-2 text-sm text-fg_below_color dark:text-white">
          <p className="text-[12px]">Available balance</p>
          <p>
            {Number(formatInputNum(maxQuote.toString(), 2)).toFixed(2)} USDC
          </p>
        </div>
      )}
      {/* Slider ====================================== */}
      {perpType == "perpetual" && !!positionData ? null : (
        <div className="mx-2 mt-12">
          {tradeType.name === "Perpetual" ? (
            <TooltipPerpetualSlider
              tipFormatter={percentFormatter}
              tipProps={{ overlayClassName: "foo" }}
              maxLeverage={maxLeverage}
              onChange={handleSliderChange}
            />
          ) : (
            <div>
              <TooltipSpotSlider
                tipFormatter={percentFormatter}
                tipProps={{ overlayClassName: "foo" }}
                onChange={handleSliderChange}
              />
            </div>
          )}
        </div>
      )}
      {/*  */}

      {/* <div className="pt-5 mt-5 pb-0 mb-0">
        <Toggle
          label={"refund immediately"}
          toggled={refundNow}
          onClick={setRefundNow}
        />
      </div> */}

      {/* Submit button ====================================== */}
      {userAddress
        ? user && user.userId
          ? renderActionButtons()
          : renderLoginButton()
        : renderConnectButton()}
      {/* Fee ====================================== */}
      <div className="flex items-center justify-between mt-4 text-sm font-overpass text-fg_below_color dark:text-white">
        <p className="font-light text-[12px]">Protocol fee</p>
        <p>{"0.00%-0.05%"}</p>
      </div>

      <div className="mt-5">
        <SettingsPopover
          expirationTime={expirationTime}
          setExpirationTime={setExpirationTime}
          maxSlippage={maxSlippage}
          setMaxSlippage={setMaxSlippage}
          isMarket={type == "market"}
        />
      </div>

      {positionData && perpType == "perpetual" ? (
        <div className="mt-5 pt-5 flex items-center justify-between mt-4 text-sm font-overpass text-fg_below_color dark:text-white">
          <p className="text-[15px]">
            <div>
              <div>
                New Size:{" "}
                <strong>
                  {" "}
                  {baseAmount && price
                    ? formatInputNum(
                        calculateNewSize(
                          positionData,
                          Number(baseAmount),
                          true
                        ).toString(),
                        2
                      )
                    : null}{" "}
                  {baseAmount && price ? token : null}
                </strong>
              </div>
              <div className="mt-1">
                Average Entry Price:{" "}
                <strong>
                  {" "}
                  {baseAmount && price
                    ? formatInputNum(
                        calculateAvgEntryPrice(
                          positionData,
                          Number(baseAmount),
                          Number(price),
                          true
                        ).toString(),
                        2
                      )
                    : ""}{" "}
                  {baseAmount && price ? "USD" : null}
                </strong>
              </div>
              <div className="mt-1">
                Est. Liq. Price:{" "}
                <strong>
                  {" "}
                  {baseAmount && price
                    ? formatInputNum(
                        calculateNewLiqPrice(
                          positionData,
                          Number(baseAmount),
                          Number(price),
                          true
                        ).toString(),
                        2
                      )
                    : ""}{" "}
                  {baseAmount && price ? "USD" : null}
                </strong>
              </div>
            </div>
          </p>
          <div>
            <div>|</div>
            <div>|</div>
            <div>|</div>
          </div>

          <p className="text-[15px]">
            <div>
              <div>
                New Size:{" "}
                <strong>
                  {" "}
                  {baseAmount && price
                    ? formatInputNum(
                        calculateNewSize(
                          positionData,
                          Number(baseAmount),
                          false
                        ).toString(),
                        2
                      )
                    : null}
                  {baseAmount && price ? token : null}
                </strong>
              </div>
              <div className="mt-1">
                Average Entry Price:{" "}
                <strong>
                  {baseAmount && price
                    ? formatInputNum(
                        calculateAvgEntryPrice(
                          positionData,
                          Number(baseAmount),
                          Number(price),
                          false
                        ).toString(),
                        2
                      )
                    : ""}{" "}
                  {baseAmount && price ? "USD" : null}
                </strong>
              </div>
              <div className="mt-1">
                Est. Liq. Price:{" "}
                <strong>
                  {" "}
                  {baseAmount && price
                    ? formatInputNum(
                        calculateNewLiqPrice(
                          positionData,
                          Number(baseAmount),
                          Number(price),
                          false
                        ).toString(),
                        2
                      )
                    : ""}{" "}
                  {baseAmount && price ? "USD" : null}
                </strong>
              </div>
            </div>
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default TradeForm;

// HELPERS ================================================================================================

function calculateNewSize(
  position: any,
  increaseSize: number,
  isBuy: boolean
): number {
  let size =
    position.position_size / 10 ** DECIMALS_PER_ASSET[position.synthetic_token];

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
  if (isBuy) {
    if (position.order_side == "Long") {
      return calcAvgEntryInIncreaseSize(position, increaseSize, price);
    } else {
      if (
        increaseSize >
        position.size / 10 ** DECIMALS_PER_ASSET[position.synthetic_token]
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
        position.size / 10 ** DECIMALS_PER_ASSET[position.synthetic_token]
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
  if (isBuy) {
    if (position.order_side == "Long") {
      return (
        calulateLiqPriceInIncreaseSize(position, increaseSize, price) /
        10 ** PRICE_DECIMALS_PER_ASSET[position.synthetic_token]
      );
    } else {
      if (
        increaseSize >
        position.size / 10 ** DECIMALS_PER_ASSET[position.synthetic_token]
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
        position.size / 10 ** DECIMALS_PER_ASSET[position.synthetic_token]
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
