import React, { useContext, useState } from "react";
import { useSelector } from "react-redux";
import { WalletContext } from "../../../../../context/WalletContext";
import { tradeTypeSelector } from "../../../../../lib/store/features/apiSlice";

import TooltipPerpetualSlider from "../TooltipPerpetualSlider";
import TooltipSpotSlider from "../TooltipSpotSlider";

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
  checkViableSizeAfterIncrease,
  checkViableSizeAfterFlip,
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

const TradeForm = ({ type, perpType, token, action }: props) => {
  let { user, userAddress, login, connect, forceRerender } =
    useContext(WalletContext);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  let positionData =
    user && user.userId && perpType == "perpetual"
      ? user.positionData[SYMBOLS_TO_IDS[token]]
      : null;
  positionData = positionData ? positionData[0] : null;

  const maxBase = user
    ? user.getAvailableAmount(SYMBOLS_TO_IDS[token]) /
      10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]]
    : 0;
  const maxQuote = user
    ? user.getAvailableAmount(COLLATERAL_TOKEN) /
      10 ** COLLATERAL_TOKEN_DECIMALS
    : 0;

  const tradeType = useSelector(tradeTypeSelector);

  function percentFormatter(v: any) {
    return `${v}`;
  }

  function renderActionButtons() {
    return _renderActionButtons(
      user,
      baseAmount,
      price,
      perpType,
      positionData,
      token,
      type,
      quoteAmount,
      forceRerender,
      action,
      refundNow
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

  const [price, setPrice] = useState<number | null>(
    type == "market" ? 1000 : null
  );
  const [baseAmount, setBaseAmount] = useState<number | null>(null);
  const [quoteAmount, setQuoteAmount] = useState<number | null>(null);

  const handlePriceChange = (e: any) => {
    if (!e.target.value) {
      setPrice(null);
      return;
    }

    let price = Number(Number(e.target.value).toFixed(2));

    setPrice(price);
    if (perpType == "perpetual") {
      if (baseAmount) {
        let nominalValue = baseAmount * price;

        let initMargin = nominalValue / leverage;
        setQuoteAmount(Number(initMargin.toFixed(3)));
      }
    } else {
      if (baseAmount) {
        let quoteAmount = baseAmount * price;
        setQuoteAmount(Number(quoteAmount.toFixed(3)));
      } else if (quoteAmount) {
        let baseAmount = quoteAmount / price;
        setBaseAmount(Number(baseAmount.toFixed(3)));
      }
    }
  };
  const handleBaseAmountChange = (e: any) => {
    if (!e.target.value) {
      setBaseAmount(null);
      setMaxLeverage(MAX_LEVERAGE);
      return;
    }

    if (Number(e.target.value) == 0) {
      setBaseAmount(e.target.value);
      setMaxLeverage(MAX_LEVERAGE);
      return;
    }

    let baseAmount_ = Number(Number(e.target.value).toFixed(3));

    setBaseAmount(baseAmount_);
    if (perpType == "perpetual") {
      if (price) {
        let nominalValue = baseAmount_ * price;
        let initMargin = nominalValue / leverage;

        setQuoteAmount(Number(initMargin.toFixed(3)));
      }

      let max_leverage = get_max_leverage(SYMBOLS_TO_IDS[token], baseAmount_);
      setMaxLeverage(Number(max_leverage.toFixed(1)));
      if (leverage > max_leverage) {
        setLeverage(Number(max_leverage.toFixed(1)));
      }
    } else {
      if (price) {
        let quoteAmount = baseAmount_ * price;
        setQuoteAmount(Number(quoteAmount.toFixed(3)));
      }
    }
  };
  const handleQuoteAmountChange = (e: any) => {
    if (!e.target.value) {
      setQuoteAmount(null);
      return;
    }

    let quoteAmount = Number(Number(e.target.value).toFixed(3));

    setQuoteAmount(quoteAmount);
    if (perpType == "perpetual") {
      if (price && leverage) {
        let baseAmount = (quoteAmount * leverage) / price;
        setBaseAmount(Number(baseAmount.toFixed(3)));

        let max_leverage = get_max_leverage(SYMBOLS_TO_IDS[token], baseAmount);
        setMaxLeverage(Number(max_leverage.toFixed(1)));
      }
    } else {
      if (price) {
        let baseAmount_ = quoteAmount / price;
        setBaseAmount(Number(baseAmount_.toFixed(3)));
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
        let nominalValue = baseAmount * price;
        let initMargin = nominalValue / leverage;

        setQuoteAmount(Number(initMargin.toFixed(3)));
      }
    } else {
      if (action == "buy") {
        let quoteAmount = (val / 100) * maxQuote;
        setQuoteAmount(Number(quoteAmount.toFixed(3)));

        if (price) {
          let baseAmount_ = quoteAmount / price;
          setBaseAmount(Number(baseAmount_.toFixed(3)));
        }
      } else {
        let baseAmount_ = (val / 100) * maxBase;
        setBaseAmount(Number(baseAmount_.toFixed(3)));

        if (price) {
          let quoteAmount = baseAmount_ * price;
          setQuoteAmount(Number(quoteAmount.toFixed(3)));
        }
      }
    }
  };

  const [refundNow, setRefundNow] = useState<boolean>(true);

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
            {user && user.userId
              ? (
                  user.getAvailableAmount(SYMBOLS_TO_IDS[token]) /
                  10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]]
                ).toFixed(3)
              : 0}{" "}
            {token}
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
            {user && user.userId
              ? (
                  user.getAvailableAmount(COLLATERAL_TOKEN) /
                  10 ** COLLATERAL_TOKEN_DECIMALS
                ).toFixed(2)
              : 0}{" "}
            USDC
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

      {positionData ? (
        <div className="mt-5 pt-5 flex items-center justify-between mt-4 text-sm font-overpass text-fg_below_color dark:text-white">
          <p className="text-[13px]">
            <div>
              <div>
                New Size:{" "}
                {baseAmount && price
                  ? calculateNewSize(positionData, baseAmount, true)
                  : null}{" "}
                {baseAmount && price ? token : null}
              </div>
              <div className="mt-1">
                Average Entry Price:{" "}
                {baseAmount && price
                  ? calculateAvgEntryPrice(
                      positionData,
                      baseAmount,
                      price,
                      true
                    ).toFixed(2)
                  : ""}
                {baseAmount && price ? "USD" : null}
              </div>
              <div className="mt-1">
                Est. Liq. Price:{" "}
                {baseAmount && price
                  ? calculateNewLiqPrice(
                      positionData,
                      baseAmount,
                      price,
                      true
                    ).toFixed(2)
                  : ""}{" "}
                {baseAmount && price ? "USD" : null}
              </div>
            </div>
          </p>
          <div>
            <div>|</div>
            <div>|</div>
            <div>|</div>
          </div>

          <p className="text-[13px]">
            <div>
              <div>
                New Size:{" "}
                {baseAmount && price
                  ? calculateNewSize(positionData, baseAmount, false)
                  : null}{" "}
                {baseAmount && price ? token : null}
              </div>
              <div className="mt-1">
                Average Entry Price:{" "}
                {baseAmount && price
                  ? calculateAvgEntryPrice(
                      positionData,
                      baseAmount,
                      price,
                      false
                    ).toFixed(2)
                  : ""}{" "}
                {baseAmount && price ? "USD" : null}
              </div>
              <div className="mt-1">
                Est. Liq. Price:{" "}
                {baseAmount && price
                  ? calculateNewLiqPrice(
                      positionData,
                      baseAmount,
                      price,
                      false
                    ).toFixed(2)
                  : ""}{" "}
                {baseAmount && price ? "USD" : null}
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
