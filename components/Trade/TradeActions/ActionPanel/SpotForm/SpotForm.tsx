import React, { useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { WalletContext } from "../../../../../context/WalletContext";
import { tradeTypeSelector } from "../../../../../lib/store/features/apiSlice";

import TooltipPerpetualSlider from "../TooltipPerpetualSlider";
import TooltipSpotSlider from "../TooltipSpotSlider";
import SettingsPopover from "../TradeFormHelpers/SettingsPopover";
import UpdatedPositionInfo from "../TradeFormHelpers/UpdatedPositionInfo";
import classNames from "classnames";

import {
  addCommasToNumber,
  formatInputNum,
} from "../TradeFormHelpers/FormHelpers";

const {
  _renderActionButtons,
  _renderConnectButton,
  _renderLoginButton,
} = require("../TradeFormHelpers/FormButtons");

const {
  get_max_leverage,
  COLLATERAL_TOKEN_DECIMALS,
  DECIMALS_PER_ASSET,
  PRICE_DECIMALS_PER_ASSET,
  SYMBOLS_TO_IDS,
  MAX_LEVERAGE,
  COLLATERAL_TOKEN,
} = require("../../../../../app_logic/helpers/utils");

type props = {
  type: string;
  token: string;
  action_: string;
  formInputs: any;
};

const TradeForm = ({ type, token, action_, formInputs }: props) => {
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
  const [action, setAction] = useState<string>(action_);

  useEffect(() => {
    setAction(action_);
  }, [user, action_]);

  let markPrice = getMarkPrice(SYMBOLS_TO_IDS[token], false);

  useEffect(() => {
    if (type == "market") {
      handlePriceChange({ target: { value: markPrice.toString() } });
    }
  }, [type]);

  const maxBase = user
    ? user.getAvailableAmount(SYMBOLS_TO_IDS[token]) /
      10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]]
    : 0;
  const maxQuote = user
    ? user.getAvailableAmount(COLLATERAL_TOKEN) /
      10 ** COLLATERAL_TOKEN_DECIMALS
    : 0;

  let price_, baseAmount_, quoteAmount_;
  if (
    formInputs &&
    !formInputs.isPerp &&
    formInputs.token == SYMBOLS_TO_IDS[token]
  ) {
    price_ = formInputs.price
      ? formatInputNum(formInputs.price.toString(), 2)
      : null;

    if (action === "buy") {
      formInputs.quoteAmount = Math.min(
        Number(formInputs.quoteAmount),
        user.getAvailableAmount(COLLATERAL_TOKEN) /
          10 ** COLLATERAL_TOKEN_DECIMALS
      );
      quoteAmount_ = formInputs.quoteAmount
        ? formatInputNum(formInputs.quoteAmount.toString(), 2)
        : null;

      if (quoteAmount_ > 0) {
        baseAmount_ = Number((quoteAmount_ / price_).toFixed(4));
      }
    } else {
      formInputs.amount = Math.min(
        Number(formInputs.amount),
        user.getAvailableAmount(SYMBOLS_TO_IDS[token]) /
          10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]]
      );
      baseAmount_ = formInputs.amount
        ? formatInputNum(formInputs.amount.toString(), 4)
        : null;

      if (baseAmount_ > 0) {
        quoteAmount_ = Number((baseAmount_ * price_).toFixed(2));
      }
    }

    // ---------------------------------------------------------------

    // ---------------------------------------------------------------
  }

  function percentFormatter(v: any) {
    return `${v}`;
  }

  function renderActionButtons() {
    return _renderActionButtons(
      user,
      Number(baseAmount),
      Number(price),
      "spot",
      null,
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

  const [price, setPrice] = useState<string | null>(
    type == "market"
      ? getMarkPrice(SYMBOLS_TO_IDS[token], false).toFixed(2) ?? "0.00"
      : price_
  );
  const [baseAmount, setBaseAmount] = useState<string | null>(baseAmount_);
  const [quoteAmount, setQuoteAmount] = useState<string | null>(quoteAmount_);

  const handlePriceChange = (e: any) => {
    let price = formatInputNum(e.target.value, 2);
    setPrice(price);

    if (!price) {
      return;
    }

    if (baseAmount) {
      let quoteAmount = Number(baseAmount) * price;
      setQuoteAmount(formatInputNum(quoteAmount.toString(), 4));
    } else if (quoteAmount) {
      let baseAmount = Number(quoteAmount) / price;
      setBaseAmount(formatInputNum(baseAmount.toString(), 4));
    }
  };
  const handleBaseAmountChange = (e: any) => {
    let baseAmount_ = formatInputNum(e.target.value, 4);
    setBaseAmount(baseAmount_);

    if (!baseAmount_ || baseAmount_ == "0") {
      return;
    }

    if (price) {
      let quoteAmount = Number(baseAmount_) * Number(price);
      setQuoteAmount(formatInputNum(quoteAmount.toString(), 4));
    }
  };
  const handleQuoteAmountChange = (e: any) => {
    let quoteAmount = formatInputNum(e.target.value, 2);
    setQuoteAmount(quoteAmount);

    if (!quoteAmount || quoteAmount == "0") {
      return;
    }

    if (price) {
      let baseAmount_ = Number(quoteAmount) / Number(price);
      setBaseAmount(formatInputNum(baseAmount_.toString(), 4));
    } else {
      setBaseAmount(null);
    }
  };
  const handleSliderChange = (val: any) => {
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
  };

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
            setPrice(getMarkPrice(SYMBOLS_TO_IDS[token], false));
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
        />
        <div className="absolute top-0 right-0 w-16 px-3 py-1.5 text-base font-light text-center dark:font-medium font-overpass text-fg_below_color dark:text-white bg-border_color rounded-r-md">
          {token}
        </div>
      </div>
      {/* Available base ====================================== */}
      <div className="flex items-center justify-between mt-2 text-sm text-fg_below_color dark:text-white">
        <p className="text-[12px]">Available balance</p>
        <p>
          {addCommasToNumber(
            Number(formatInputNum(maxBase.toString(), 3)).toFixed(3)
          )}{" "}
          {token}
        </p>
      </div>
      {/* Quote input ====================================== */}
      <div className="relative mt-5">
        <input
          name="quote"
          className="w-full py-1.5 pl-4 font-light tracking-wider bg-white rounded-md outline-none ring-1 dark:bg-border_color ring-border_color no-arrows"
          placeholder={"Total"}
          type="number"
          step={0.001}
          value={quoteAmount?.toString()}
          onChange={handleQuoteAmountChange}
        />
        <div className="absolute top-0 right-0 w-16 px-3 py-1.5 text-base font-light text-center dark:font-medium font-overpass text-fg_below_color dark:text-white bg-border_color rounded-r-md">
          USDC
        </div>
      </div>
      {/* Available collateral ====================================== */}
      <div className="flex items-center justify-between mt-2 text-sm text-fg_below_color dark:text-white">
        <p className="text-[12px]">Available balance</p>
        <p>
          {addCommasToNumber(
            Number(formatInputNum(maxQuote.toString(), 2)).toFixed(2)
          )}{" "}
          USDC
        </p>
      </div>
      {/* Slider ====================================== */}

      <div className="mx-2 mt-12">
        <TooltipSpotSlider
          tipFormatter={percentFormatter}
          tipProps={{ overlayClassName: "foo" }}
          onChange={handleSliderChange}
        />
      </div>

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
    </div>
  );
};

export default TradeForm;
