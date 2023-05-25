import React, { useContext, useEffect, useState } from "react";
import { WalletContext } from "../../../../../context/WalletContext";

import TooltipPerpetualSlider from "../TooltipPerpetualSlider";
import SettingsPopover from "../TradeFormHelpers/SettingsPopover";
import UpdatedPositionInfo from "../TradeFormHelpers/UpdatedPositionInfo";
import classNames from "classnames";

import { formatInputNum } from "../TradeFormHelpers/FormHelpers";

import {
  _handlePriceChange,
  _handleBaseAmountChange,
  _handleQuoteAmountChange,
  _handleSliderChange,
} from "./formInputHandlers";

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
} = require("../../../../../app_logic/helpers/utils");

const {
  getCurrentLeverage,
  getNewMaxLeverage,
  MAX_LEVERAGE,
} = require("../../../../../app_logic/helpers/tradePriceCalculations");

type props = {
  type: string;
  token: string;
  action: "Long" | "Short";
  positionData: any;
};

const TradeForm = ({ type, token, action, positionData }: props) => {
  let {
    user,
    userAddress,
    login,
    connect,
    forceRerender,
    getMarkPrice,
    setToastMessage,
  } = useContext(WalletContext);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {}, [user]);

  const maxQuote = user
    ? user.getAvailableAmount(COLLATERAL_TOKEN) /
      10 ** COLLATERAL_TOKEN_DECIMALS
    : 0;

  let markPrice = getMarkPrice(SYMBOLS_TO_IDS[token], true);

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
    _handlePriceChange(
      setPrice,
      baseAmount,
      setQuoteAmount,
      leverage,
      positionData,
      action,
      token,
      newMinMaxLeverage,
      setLeverage,
      e
    );
  }
  function handleBaseAmountChange(e: any) {
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
      e
    );
  }
  function handleQuoteAmountChange(e: any) {
    _handleQuoteAmountChange(
      setQuoteAmount,
      setBaseAmount,
      setMaxLeverage,
      price,
      token,
      leverage,
      e
    );
  }
  function handleSliderChange(val: any) {
    _handleSliderChange(
      setQuoteAmount,
      leverage,
      setLeverage,
      baseAmount,
      positionData,
      price,
      setBaseAmount,
      newMinMaxLeverage,
      val
    );
  }

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
    return _renderLoginButton(isLoading, setIsLoading, login, forceRerender);
  }

  const [leverage, setLeverage] = useState(1);
  const [maxLeverage, setMaxLeverage] = useState(MAX_LEVERAGE);

  const [price, setPrice] = useState<string | null>(
    type == "market"
      ? getMarkPrice(SYMBOLS_TO_IDS[token], true).toFixed(2) ?? "0.00"
      : null
  );
  const [baseAmount, setBaseAmount] = useState<string | null>(null);
  const [quoteAmount, setQuoteAmount] = useState<string | null>(null);

  const [refundNow, setRefundNow] = useState<boolean>(true);

  const [expirationTime, setExpirationTime] = useState<number | null>(null);
  const [maxSlippage, setMaxSlippage] = useState<number | null>(null);

  const lastPriceStyle = type == "market" ? "opacity-60" : "hover:opacity-75";

  const testLiquidations =
    require("../../../../../app_logic/transactions/test/liquidation_test").default;

  // if (user) {
  //   console.log(
  //     "positionData usdc",
  //     user.noteData[55555]?.map((note: any) => note.index + " - " + note.amount)
  //   );
  // console.log(
  //   "positionData eth",
  //   user.noteData[54321].map((note: any) => note.index + " - " + note.hash)
  // );
  // }

  return (
    <div className="mt-2">
      {/* // TODO */}

      {/* <button
        className="justify-center px-4 py-2 m-3 text-sm text-white font-medium  rounded-md bg-blue hover:opacity-90"
        onClick={async () => {
          await testLiquidations(user, markPrice);
        }}
      >
        {" "}
        Test Liquidations
      </button> */}

      {/* // TODO */}

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
          value={price?.toString()}
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
          <p>
            {Number(formatInputNum(maxQuote.toString(), 2)).toFixed(2)} USDC
          </p>
        </div>
      )}
      {/* Slider ====================================== */}

      <div className="mx-2 mt-12">
        <TooltipPerpetualSlider
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
      ) : null}
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
    let { newMaxLeverage, newMaxSize } = getNewMaxLeverage(
      positionData.margin / 10 ** COLLATERAL_TOKEN_DECIMALS,
      price,
      SYMBOLS_TO_IDS[token]
    );
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
