import React, { useContext, useState } from "react";
import { useSelector } from "react-redux";
import { WalletContext } from "../../../../../context/WalletContext";
import { tradeTypeSelector } from "../../../../../lib/store/features/apiSlice";

import TooltipPerpetualSlider from "../TooltipPerpetualSlider";
import TooltipSpotSlider from "../TooltipSpotSlider";
import LoadingSpinner from "../../../../Layout/LoadingSpinner/LoadingSpinner";

const {
  get_max_leverage,
  COLLATERAL_TOKEN_DECIMALS,
  DECIMALS_PER_ASSET,
  SYMBOLS_TO_IDS,
  MAX_LEVERAGE,
  COLLATERAL_TOKEN,
  checkViableSizeAfterIncrease,
  checkViableSizeAfterFlip,
} = require("../../../../../app_logic/helpers/utils");

const {
  sendSpotOrder,
  sendPerpOrder,
} = require("../../../../../app_logic/transactions/constructOrders");

type props = {
  type: string;
  perpType: string;
  token: string;
};

const TradeForm = ({ type, perpType, token }: props) => {
  let { user, userAddress, login, connect, forceRerender } =
    useContext(WalletContext);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  let positionData =
    user && user.userId ? user.positionData[SYMBOLS_TO_IDS[token]] : null;
  positionData = positionData ? positionData[0] : null;
  // console.log("positionData", positionData);

  const tradeType = useSelector(tradeTypeSelector);

  function percentFormatter(v: any) {
    return `${v}`;
  }

  const _renderActionButtons = () => {
    return (
      <div className="flex items-center gap-2 mt-14">
        <button
          onClick={async () => {
            if (!user || !baseAmount) {
              alert("Choose an amount to trade");
              return;
            }

            if (perpType == "perpetual") {
              try {
                //
                if (positionData && positionData.order_side == "Long") {
                  if (
                    // TODO: This should account for active orders as well
                    !checkViableSizeAfterIncrease(
                      positionData,
                      baseAmount,
                      price
                    )
                  ) {
                    alert("Increase size too large for current margin");
                    return;
                  }
                }

                if (positionData && positionData.order_side == "Short") {
                  if (
                    baseAmount * 10 ** DECIMALS_PER_ASSET[token] >
                    positionData.position_size
                  ) {
                    if (
                      // TODO: This should account for active orders as well
                      !checkViableSizeAfterFlip(positionData, baseAmount, price)
                    ) {
                      alert("Increase size too large for current margin");
                      return;
                    }
                  }
                }

                //

                let expirationTimesamp = 1000;
                let feeLimitPercent = 0.07;

                await sendPerpOrder(
                  user,
                  "Long",
                  expirationTimesamp,
                  positionData ? "Modify" : "Open",
                  SYMBOLS_TO_IDS[token],
                  baseAmount,
                  type == "market" ? null : price,
                  quoteAmount,
                  feeLimitPercent
                );
                alert("Success!");
              } catch (error) {
                alert("Error: " + error);
              }
            } else {
              try {
                let expirationTimesamp = 1000;
                let feeLimitPercent = 0.07;
                await sendSpotOrder(
                  user,
                  "Buy",
                  expirationTimesamp,
                  SYMBOLS_TO_IDS[token],
                  COLLATERAL_TOKEN,
                  baseAmount,
                  quoteAmount,
                  type == "market" ? null : price,
                  feeLimitPercent
                );
                alert("Success!");
              } catch (error) {
                alert("Error: " + error);
              }
            }

            forceRerender();
          }}
          className="w-full py-2 uppercase rounded-md bg-green_lighter shadow-green font-overpass hover:shadow-green_dark hover:opacity-90"
        >
          BUY
        </button>
        <button
          onClick={async () => {
            if (perpType == "perpetual") {
              try {
                if (positionData && positionData.order_side == "Short") {
                  if (
                    !checkViableSizeAfterIncrease(
                      positionData,
                      baseAmount,
                      price
                    )
                  ) {
                    alert("Increase size too large for current margin");
                    return;
                  }
                }

                let expirationTimesamp = 1000;
                let feeLimitPercent = 0.07;
                await sendPerpOrder(
                  user,
                  "Short",
                  expirationTimesamp,
                  positionData ? "Modify" : "Open",
                  SYMBOLS_TO_IDS[token],
                  baseAmount,
                  type == "market" ? null : price,
                  quoteAmount,
                  feeLimitPercent
                );
                alert("Success!");
              } catch (error) {
                alert("Error: " + error);
              }
            } else {
              let expirationTimesamp = 1000;
              let feeLimitPercent = 0.07;
              await sendSpotOrder(
                user,
                "Sell",
                expirationTimesamp,
                SYMBOLS_TO_IDS[token],
                COLLATERAL_TOKEN,
                baseAmount,
                quoteAmount,
                type == "market" ? null : price,
                feeLimitPercent
              );
              alert("Success!");
              try {
              } catch (error) {
                alert("Error: " + error);
              }
            }

            forceRerender();
          }}
          className="w-full py-2 uppercase rounded-md bg-red_lighter shadow-red font-overpass hover:shadow-red_dark hover:opacity-90"
        >
          SELL
        </button>
      </div>
    );
  };

  const _renderConnectButton = () => {
    return (
      <button
        className="w-full px-8 py-2 font-medium text-center text-white rounded-md mt-14 bg-blue hover:opacity-75"
        onClick={() => connect()}
      >
        Connect Wallet
      </button>
    );
  };
  const _renderLoginButton = () => {
    return (
      <div>
        {isLoading ? (
          <div className="mt-14 ml-32 mr-32">
            <LoadingSpinner />
          </div>
        ) : (
          <button
            className="w-full px-8 py-2 font-medium text-center text-white rounded-md mt-14 bg-blue hover:opacity-75"
            onClick={async () => {
              try {
                setIsLoading(true);
                user = await login();
                setIsLoading(false);
                forceRerender();
              } catch (error) {
                console.log(error);
              }
            }}
          >
            Login
          </button>
        )}
      </div>
    );
  };

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
      }
    }
  };
  const handleBaseAmountChange = (e: any) => {
    if (!e.target.value) {
      setBaseAmount(null);
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
    }
  };

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
          step={0.01}
          value={baseAmount?.toString()}
          onChange={handleBaseAmountChange}
          placeholder="Amount"
        />
        <div className="absolute top-0 right-0 w-16 px-3 py-1.5 text-base font-light text-center dark:font-medium font-overpass text-fg_below_color dark:text-white bg-border_color rounded-r-md">
          {token}
        </div>
      </div>
      {/* availbale base ====================================== */}
      {perpType == "spot" ? (
        <div className="flex items-center justify-between mt-2 text-sm text-fg_below_color dark:text-white">
          <p className="text-[12px]">Available balance</p>
          <p>
            {user && user.userId
              ? user.getAvailableAmount(SYMBOLS_TO_IDS[token]) /
                10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]]
              : 0}{" "}
            {token}
          </p>
        </div>
      ) : null}
      {/* Quote input ====================================== */}
      {perpType == "perpetual" && !!positionData ? null : (
        <div className="relative mt-5">
          <input
            name="price"
            className="w-full py-1.5 pl-4 font-light tracking-wider bg-white rounded-md outline-none ring-1 dark:bg-border_color ring-border_color"
            placeholder={perpType != "perpetual" ? "Total" : "Initial Margin"}
            type="number"
            step={0.01}
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
              ? user.getAvailableAmount(COLLATERAL_TOKEN) /
                10 ** COLLATERAL_TOKEN_DECIMALS
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
                onChange={console.log}
              />
            </div>
          )}
        </div>
      )}
      {/* Submit button ====================================== */}
      {userAddress
        ? user && user.userId
          ? _renderActionButtons()
          : _renderLoginButton()
        : _renderConnectButton()}
      {/* Fee ====================================== */}
      <div className="flex items-center justify-between mt-4 text-sm font-overpass text-fg_below_color dark:text-white">
        <p className="font-light text-[12px]">Protocol fee</p>
        <p>{"0.00%-0.05%"}</p>
      </div>
    </div>
  );
};

export default TradeForm;

// HELPERS ================================================================================================
