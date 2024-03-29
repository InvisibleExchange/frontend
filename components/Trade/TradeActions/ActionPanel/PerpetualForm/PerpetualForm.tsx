import React, { useContext, useEffect, useState } from "react";

import DebouncedTooltipPerpetualSlider from "../TooltipPerpetualSlider";
import SettingsPopover from "../TradeFormHelpers/SettingsPopover";
import {
  UpdatedPositionInfo,
  EstimateLiquidationPriceInfo,
} from "../TradeFormHelpers/UpdatedPositionInfo";
import classNames from "classnames";

import {
  addCommasToNumber,
  formatInputNum,
} from "../TradeFormHelpers/FormHelpers";

import {
  _handlePriceChange,
  _handleBaseAmountChange,
  _handleQuoteAmountChange,
  _handleSliderChange,
} from "./formInputHandlers";
import { UserContext } from "../../../../../context/UserContext";
import { WalletContext } from "../../../../../context/WalletContext";

import _debounce from "lodash/debounce";

const {
  _renderActionButtons,
  _renderConnectButton,
  _renderLoginButton,
} = require("../TradeFormHelpers/FormButtons");

const {
  COLLATERAL_TOKEN_DECIMALS,
  SYMBOLS_TO_IDS,
  COLLATERAL_TOKEN,
  DECIMALS_PER_ASSET,
  PRICE_ROUNDING_DECIMALS,
  SIZE_ROUNDING_DECIMALS,
} = require("../../../../../app_logic/helpers/utils");

const {
  getCurrentLeverage,
  getNewMaxLeverage,
  MAX_LEVERAGE,
} = require("../../../../../app_logic/helpers/tradePriceCalculations");

type props = {
  type: string;
  token: string;
  action_: "Long" | "Short";
  positionData: any;
  formInputs: any;
};

const TradeForm = ({
  type,
  token,
  action_,
  positionData,
  formInputs,
}: props) => {
  let {
    user,
    login,
    isLoading,
    setIsLoading,
    forceRerender,
    getMarkPrice,
    setToastMessage,
  } = useContext(UserContext);
  let { userAddress, connect, signer } = useContext(WalletContext);

  // const [isLoading, setIsLoading] = useState<boolean>(false);
  const [action, setAction] = useState<"Long" | "Short">(action_);

  let priceRoundingDecimals = PRICE_ROUNDING_DECIMALS[SYMBOLS_TO_IDS[token]];
  let sizeRoundingDecimals = SIZE_ROUNDING_DECIMALS[SYMBOLS_TO_IDS[token]];

  useEffect(() => {
    setAction(action_);
  }, [user, action_]);

  let initLev = 1;
  let price_, baseAmount_, quoteAmount_;
  if (
    formInputs &&
    formInputs.isPerp &&
    formInputs.token == SYMBOLS_TO_IDS[token]
  ) {
    price_ = formInputs.price
      ? formatInputNum(formInputs.price.toString(), priceRoundingDecimals)
      : null;

    baseAmount_ = formInputs.amount
      ? formatInputNum(formInputs.amount.toString(), sizeRoundingDecimals)
      : null;

    if (!positionData && user) {
      formInputs.quoteAmount = Math.min(
        Number(formInputs.quoteAmount),
        user.getAvailableAmount(COLLATERAL_TOKEN) /
          10 ** COLLATERAL_TOKEN_DECIMALS
      );
    }
    quoteAmount_ = formInputs.quoteAmount
      ? formatInputNum(formInputs.quoteAmount.toString(), 2)
      : null;

    if (price_ && baseAmount_) {
      if (!positionData) {
        initLev = (baseAmount_ * price_) / quoteAmount_;
      } else {
        // let average_entry_price =
        //     (prev_nominal_usd + added_nominal_usd) / (self.position_size + added_size) as u128;
      }
    }
  }

  let markPrice = getMarkPrice(SYMBOLS_TO_IDS[token], true);

  useEffect(() => {
    if (type == "market") {
      handlePriceChange({ target: { value: markPrice.toString() } });
    }
  }, [type]);

  const maxQuote = user
    ? user.getAvailableAmount(COLLATERAL_TOKEN) /
      10 ** COLLATERAL_TOKEN_DECIMALS
    : 0;

  let newMinMaxLeverage = positionData
    ? getMinMaxLeverage(positionData, token, action, markPrice)
    : null;

  if (
    newMinMaxLeverage &&
    newMinMaxLeverage.lowerBound >= newMinMaxLeverage?.upperBound
  ) {
    newMinMaxLeverage.lowerBound = newMinMaxLeverage?.upperBound;
  }

  function percentFormatter(v: any) {
    return `${v}`;
  }

  // * Form input handles
  function handlePriceChange(e: any) {
    let price = formatInputNum(e.target.value, priceRoundingDecimals);

    newMinMaxLeverage = positionData
      ? getMinMaxLeverage(positionData, token, action, Number(price))
      : null;

    _handlePriceChange(
      setPrice,
      baseAmount,
      setBaseAmount,
      quoteAmount,
      leverage,
      positionData,
      action,
      token,
      newMinMaxLeverage,
      setLeverage,
      price,
      sizeRoundingDecimals
    );
  }
  function handleBaseAmountChange(e: any) {
    let baseAmount_ = formatInputNum(e.target.value, sizeRoundingDecimals);
    _handleBaseAmountChange(
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
      baseAmount_
    );
  }
  function handleQuoteAmountChange(e: any) {
    let quoteAmount = formatInputNum(e.target.value, 2);

    _handleQuoteAmountChange(
      setQuoteAmount,
      setLeverage,
      price,
      baseAmount,
      quoteAmount,
      maxQuote
    );
  }
  function _handleSliderChange_(val: any) {
    let leverage_ = Number(val[0]);

    _handleSliderChange(
      setLeverage,
      quoteAmount,
      positionData,
      price,
      setBaseAmount,
      newMinMaxLeverage,
      leverage_,
      sizeRoundingDecimals
    );
  }
  const handleSliderChange = _debounce(_handleSliderChange_, 10);

  function renderActionButtons() {
    return _renderActionButtons(
      user,
      Number(baseAmount),
      Number(price),
      "perpetual",
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
      setIsLoading,
      setToastMessage
    );
  }

  function renderConnectButton() {
    return _renderConnectButton(connect);
  }

  function renderLoginButton() {
    return _renderLoginButton(
      isLoading,
      setIsLoading,
      signer,
      login,
      forceRerender
    );
  }

  const [leverage, setLeverage] = useState(initLev);
  const [maxLeverage, setMaxLeverage] = useState(MAX_LEVERAGE);

  const [price, setPrice] = useState<string | null>(
    type == "market"
      ? getMarkPrice(SYMBOLS_TO_IDS[token], true).toFixed(
          priceRoundingDecimals
        ) ?? "0.00"
      : price_
  );

  const [baseAmount, setBaseAmount] = useState<string | null>(baseAmount_);
  const [quoteAmount, setQuoteAmount] = useState<string | null>(quoteAmount_);

  const [refundNow, setRefundNow] = useState<boolean>(true);

  const [expirationTime, setExpirationTime] = useState<number | null>(null);
  const [maxSlippage, setMaxSlippage] = useState<number | null>(null);

  const lastPriceStyle = type == "market" ? "opacity-60" : "hover:opacity-75";

  return (
    <div className="mt-2">
      {/* Price ====================================== */}
      <div className="relative">
        <input
          name="price"
          className={classNames(
            "w-full py-1.5 pl-4 font-light tracking-wider bg-white rounded-md outline-none ring-1 dark:bg-border_color ring-border_color disabled:opacity-40 no-arrows"
          )}
          readOnly={type === "market"}
          type="number"
          step={0.01}
          value={
            type == "market"
              ? markPrice.toFixed(priceRoundingDecimals)
              : price?.toString()
          }
          onChange={handlePriceChange}
          placeholder="Price"
        />
        <button
          className={
            "absolute top-0 py-2 text-sm right-3 dark:text-yellow text-blue " +
            lastPriceStyle
          }
          disabled={type === "market"}
          onClick={() => {
            setPrice(getMarkPrice(SYMBOLS_TO_IDS[token], true));
          }}
        >
          Last Price
        </button>
      </div>
      {/* Base input ====================================== */}
      <div className="relative mt-6">
        <input
          name="amount"
          className="w-full py-1.5 pl-4 font-light tracking-wider bg-white rounded-md outline-none ring-1 dark:bg-border_color ring-border_color no-arrows"
          type="number"
          step={0.001}
          value={baseAmount?.toString()}
          onChange={handleBaseAmountChange}
          placeholder="Amount"
          disabled={
            newMinMaxLeverage
              ? newMinMaxLeverage.lowerBound >= newMinMaxLeverage?.upperBound
              : false
          }
        />
        <div className="absolute top-0 right-0 w-16 px-3 py-1.5 text-base font-light text-center dark:font-medium font-overpass text-fg_below_color dark:text-white bg-border_color rounded-r-md">
          {token}
        </div>
      </div>

      {/* Quote input ====================================== */}
      {positionData ? null : (
        <div className="relative mt-5">
          <input
            name="quote"
            className="w-full py-1.5 pl-4 font-light tracking-wider bg-white rounded-md outline-none ring-1 dark:bg-border_color ring-border_color no-arrows"
            placeholder={"Initial Margin"}
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
      {positionData ? null : (
        <div className="flex items-center justify-between mt-2 text-sm text-fg_below_color dark:text-white">
          <p className="text-[12px]">Available balance</p>
          <p
            className="cursor-pointer"
            onClick={() => {
              handleQuoteAmountChange({
                target: { value: maxQuote.toString() },
              });
            }}
          >
            {addCommasToNumber(
              Number(formatInputNum(maxQuote.toString(), 2)).toFixed(2)
            )}{" "}
            USDC
          </p>
        </div>
      )}
      {/* Slider ====================================== */}

      <div className="mx-2 mt-12">
        <DebouncedTooltipPerpetualSlider
          tipFormatter={percentFormatter}
          tipProps={{ overlayClassName: "foo" }}
          minLeverage={newMinMaxLeverage ? newMinMaxLeverage.lowerBound : 0.1}
          maxLeverage={
            newMinMaxLeverage ? newMinMaxLeverage.upperBound : maxLeverage
          }
          value={leverage}
          onChange={handleSliderChange}
          defaultValue={
            positionData
              ? getCurrentLeverage(
                  markPrice,
                  positionData.position_size /
                    10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]],
                  positionData.margin / 10 ** COLLATERAL_TOKEN_DECIMALS
                )
              : 1
          }
          orderSide={positionData ? positionData.order_side : undefined}
        />
      </div>

      {/*  */}

      {/* Submit button ====================================== */}
      {userAddress
        ? user && user.userId
          ? renderActionButtons()
          : renderLoginButton()
        : renderConnectButton()}
      {/* Fee ====================================== */}
      <div className="flex items-center justify-between mt-5 text-sm font-overpass text-fg_below_color dark:text-white">
        <p className="font-light text-[13px]">Protocol fee</p>
        <p className="font-light text-[13px]">{"0.00%-0.05%"}</p>
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

      {/* Update position info */}
      {positionData ? (
        <div className="mt-5 pt-5 p-0 m-0">
          <div>{/* <em>New values after update:</em> */}</div>
          <UpdatedPositionInfo
            baseAmount={baseAmount}
            price={price}
            positionData={positionData}
            token={token}
            action={action}
          />
        </div>
      ) : (
        <div className="mt-5 pt-5 p-0 m-0">
          <div>{/* <em>New values after update:</em> */}</div>

          <EstimateLiquidationPriceInfo
            entryPrice_={price}
            margin_={quoteAmount}
            position_size_={baseAmount}
            orderSide={action}
            syntheticToken={SYMBOLS_TO_IDS[token]}
            is_partial_liquidation={true}
          />
        </div>
      )}
    </div>
  );
};

export default TradeForm;

function getMinMaxLeverage(
  positionData: any,
  token: string,
  side: "Long" | "Short",
  price: number
) {
  if (positionData) {
    let { newMaxLeverage, newMaxSize } = getNewMaxLeverage(positionData, price);
    newMaxLeverage = Math.ceil(newMaxLeverage * 10) / 10;

    // getCurrentLeverage(indexPrice, size, margin)
    let currentLeverage = getCurrentLeverage(
      price,
      positionData.position_size /
        10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]],
      positionData.margin / 10 ** COLLATERAL_TOKEN_DECIMALS
    );
    currentLeverage = Math.ceil(currentLeverage * 10) / 10;

    // ? If increasing position size
    if (positionData.order_side == side) {
      return {
        lowerBound: currentLeverage,
        upperBound: newMaxLeverage,
        newMaxSize,
      };
    }
    // ? If decreasing position size
    else {
      return {
        lowerBound: -newMaxLeverage,
        upperBound: currentLeverage,
        newMaxSize,
      };
    }
  }
}
