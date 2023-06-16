import { useContext, useState } from "react";
import LoadingSpinner from "../../../../Layout/LoadingSpinner/LoadingSpinner";
import { checkValidSizeIncrease, checkValidSizeFlip } from "./FormHelpers";

const {
  COLLATERAL_TOKEN_DECIMALS,
  DECIMALS_PER_ASSET,
  PRICE_DECIMALS_PER_ASSET,
  SYMBOLS_TO_IDS,
  DUST_AMOUNT_PER_ASSET,
  MAX_LEVERAGE,
  COLLATERAL_TOKEN,
} = require("../../../../../app_logic/helpers/utils");

const {
  sendSpotOrder,
  sendPerpOrder,
  sendSplitOrder,
} = require("../../../../../app_logic/transactions/constructOrders");

const {
  getCurrentLeverage,
  getMaxLeverage,
} = require("../../../../../app_logic/helpers/tradePriceCalculations");

const _renderActionButtons = (
  user,
  baseAmount,
  price,
  perpType,
  positionData,
  token,
  type,
  quoteAmount,
  expirationTime,
  maxSlippage,
  forceRerender,
  action,
  refundNow,
  isLoading,
  setIsLoading,
  setToastMessage
) => {
  return (
    <>
      {isLoading ? (
        <div className="mt-14 ml-32 mr-32">
          <LoadingSpinner />
        </div>
      ) : action === "none" ? (
        <div className="flex items-center gap-2 mt-14">
          {_renderBuyButton(
            user,
            baseAmount,
            price,
            perpType,
            positionData,
            token,
            type,
            quoteAmount,
            expirationTime,
            maxSlippage,
            forceRerender,
            refundNow,
            setIsLoading,
            setToastMessage
          )}
          {_renderAskButton(
            user,
            baseAmount,
            price,
            perpType,
            positionData,
            token,
            type,
            quoteAmount,
            expirationTime,
            maxSlippage,
            forceRerender,
            refundNow,
            setIsLoading,
            setToastMessage
          )}
        </div>
      ) : action === "buy" || action === "Long" ? (
        <div className="flex items-center gap-2 mt-14">
          {_renderBuyButton(
            user,
            baseAmount,
            price,
            perpType,
            positionData,
            token,
            type,
            quoteAmount,
            expirationTime,
            maxSlippage,
            forceRerender,
            refundNow,
            setIsLoading,
            setToastMessage
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 mt-14">
          {_renderAskButton(
            user,
            baseAmount,
            price,
            perpType,
            positionData,
            token,
            type,
            quoteAmount,
            expirationTime,
            maxSlippage,
            forceRerender,
            refundNow,
            setIsLoading,
            setToastMessage
          )}
        </div>
      )}
    </>
  );
};

const _renderBuyButton = (
  user,
  baseAmount,
  price,
  perpType,
  positionData,
  token,
  type,
  quoteAmount,
  expirationTime,
  maxSlippage,
  forceRerender,
  refundNow,
  setIsLoading,
  setToastMessage
) => {
  refundNow = type == "market" ? false : refundNow;

  return (
    <button
      onClick={async () => {
        setIsLoading(true);

        if (!user || !baseAmount || !price) {
          setToastMessage({
            type: "error",
            message: "Choose an amount&price to trade",
          });

          setIsLoading(false);
          return;
        }
        if (perpType == "perpetual") {
          try {
            // If "Modify"  order
            if (positionData) {
              // if increasing position size
              // if (positionData.order_side == "Long") {
              //   if (
              //     !checkValidSizeIncrease(
              //       user,
              //       true,
              //       positionData,
              //       token,
              //       baseAmount,
              //       price
              //     )
              //   ) {
              //     setToastMessage({
              //       type: "error",
              //       message:
              //         "Increase size too large for current margin (Add margin or close other open orders)",
              //     });

              //     setIsLoading(false);
              //     return;
              //   }
              // }

              // if decreasing/flipping position side
              // if (positionData.order_side == "Short") {
              //   if (
              //     !checkValidSizeFlip(
              //       user,
              //       false,
              //       positionData,
              //       token,
              //       baseAmount,
              //       price
              //     )
              //   ) {
              //     setToastMessage({
              //       type: "error",
              //       message:
              //         "Increase size too large for current margin (Add margin or close other open orders)",
              //     });

              //     setIsLoading(false);
              //     return;
              //   }
              // }
            } else {
              let leverage = getCurrentLeverage(price, baseAmount, quoteAmount);
              let maxLeverage = getMaxLeverage(
                SYMBOLS_TO_IDS[token],
                baseAmount
              );

              if (leverage > maxLeverage) {
                setToastMessage({
                  type: "error",
                  message: "Leverage too high",
                });

                setIsLoading(false);
                return;
              }
            }

            //

            let slippage = maxSlippage ? Number(maxSlippage) : 5;
            let expirationTimesamp = expirationTime ? expirationTime : 3600_000; // ~4 weeks
            let feeLimitPercent = 0.07;

            if (!positionData && refundNow) {
              await sendSplitOrder(user, COLLATERAL_TOKEN, [quoteAmount]);
            }

            let posEffectType = positionData ? "Modify" : "Open";
            if (positionData && positionData.order_side == "Short") {
              if (
                Math.abs(
                  positionData.position_size -
                    baseAmount * 10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]]
                ) <= DUST_AMOUNT_PER_ASSET[SYMBOLS_TO_IDS[token]]
              ) {
                posEffectType = "Close";
              }
            }

            await sendPerpOrder(
              user,
              "Long",
              expirationTimesamp,
              posEffectType,
              positionData ? positionData.position_address : null,
              SYMBOLS_TO_IDS[token],
              baseAmount,
              price,
              quoteAmount,
              feeLimitPercent,
              slippage,
              type == "market"
            );

            if (type != "market") {
              setToastMessage({
                type: "info",
                message:
                  "Long Order was placed successfuly: " +
                  baseAmount.toFixed(2) +
                  " " +
                  token +
                  " at price: " +
                  price.toFixed(2) +
                  " USD",
              });
            }
          } catch (error: any) {
            setToastMessage({
              type: "error",
              message: error.toString(),
            });
          }
        } else {
          try {
            let slippage = maxSlippage ? Number(maxSlippage) : 5;
            let expirationTimesamp = expirationTime ? expirationTime : 3600_000; // ~4 weeks
            let feeLimitPercent = 0.07;

            if (refundNow) {
              await sendSplitOrder(user, COLLATERAL_TOKEN, [quoteAmount]);
            }

            await sendSpotOrder(
              user,
              "Buy",
              expirationTimesamp,
              SYMBOLS_TO_IDS[token],
              COLLATERAL_TOKEN,
              baseAmount,
              quoteAmount,
              price,
              feeLimitPercent,
              slippage,
              type == "market"
            );

            if (type != "market") {
              setToastMessage({
                type: "info",
                message:
                  "Buy Order was placed successfuly: " +
                  quoteAmount.toFixed(2) +
                  " USDC for " +
                  baseAmount.toFixed(2) +
                  " " +
                  token,
              });
            }
          } catch (error: any) {
            setToastMessage({
              type: "error",
              message: error.toString(),
            });
          }
        }

        setIsLoading(false);

        forceRerender();
      }}
      className="w-full py-2 uppercase rounded-md bg-green_lighter shadow-green font-overpass hover:shadow-green_dark hover:opacity-90"
    >
      {perpType == "perpetual" ? "LONG" : "BUY"}
    </button>
  );
};

const _renderAskButton = (
  user,
  baseAmount,
  price,
  perpType,
  positionData,
  token,
  type,
  quoteAmount,
  expirationTime,
  maxSlippage,
  forceRerender,
  refundNow,
  setIsLoading,
  setToastMessage
) => {
  refundNow = type == "market" ? false : refundNow;

  return (
    <button
      onClick={async () => {
        setIsLoading(true);

        if (!user || !baseAmount || !price) {
          setToastMessage({
            type: "error",
            message: "Choose an amount to trade",
          });

          setIsLoading(false);
          return;
        }

        if (perpType == "perpetual") {
          try {
            // If "Modify"  order
            if (positionData) {
              // if increasing position size
              // if (positionData.order_side == "Short") {
              //   if (
              //     !checkValidSizeIncrease(
              //       user,
              //       false,
              //       positionData,
              //       token,
              //       baseAmount,
              //       price
              //     )
              //   ) {
              //     setToastMessage({
              //       type: "error",
              //       message:
              //         "Increase size too large for current margin (Add margin or close other open orders)",
              //     });
              //     setIsLoading(false);
              //     return;
              //   }
              // }
              // if decreasing/flipping position side
              // if (positionData.order_side == "Long") {
              //   if (
              //     !checkValidSizeFlip(
              //       user,
              //       true,
              //       positionData,
              //       token,
              //       baseAmount,
              //       price
              //     )
              //   ) {
              //     setToastMessage({
              //       type: "error",
              //       message:
              //         "Increase size too large for current margin (Add margin or close other open orders)",
              //     });
              //     setIsLoading(false);
              //     return;
              //   }
              // }
            } else {
              let leverage = getCurrentLeverage(price, baseAmount, quoteAmount);
              let maxLeverage = getMaxLeverage(
                SYMBOLS_TO_IDS[token],
                baseAmount
              );

              if (leverage > maxLeverage) {
                setToastMessage({
                  type: "error",
                  message: "Leverage too high",
                });

                setIsLoading(false);
                return;
              }
            }

            //

            let slippage = maxSlippage ? Number(maxSlippage) : 5;
            let expirationTimesamp = expirationTime ? expirationTime : 3600_000; // ~4 weeks
            let feeLimitPercent = 0.07;

            if (!positionData && refundNow) {
              await sendSplitOrder(user, COLLATERAL_TOKEN, [quoteAmount]);
            }

            let posEffectType = positionData ? "Modify" : "Open";
            if (positionData && positionData.order_side == "Long") {
              if (
                Math.abs(
                  positionData.position_size -
                    baseAmount * 10 ** DECIMALS_PER_ASSET[SYMBOLS_TO_IDS[token]]
                ) <= DUST_AMOUNT_PER_ASSET[SYMBOLS_TO_IDS[token]]
              ) {
                posEffectType = "Close";
              }
            }

            await sendPerpOrder(
              user,
              "Short",
              expirationTimesamp,
              posEffectType,
              positionData ? positionData.position_address : null,
              SYMBOLS_TO_IDS[token],
              baseAmount,
              price,
              quoteAmount,
              feeLimitPercent,
              slippage,
              type == "market"
            );
            if (type != "market") {
              setToastMessage({
                type: "info",
                message:
                  "Short Order was placed successfuly: " +
                  baseAmount.toFixed(2) +
                  " " +
                  token +
                  " at " +
                  price.toFixed(2) +
                  " USD",
              });
            }
          } catch (error: any) {
            setToastMessage({
              type: "error",
              message: error.toString(),
            });
          }
        } else {
          try {
            let slippage = maxSlippage ? Number(maxSlippage) : 5;
            let expirationTimesamp = expirationTime ? expirationTime : 3600_000; // ~4 weeks
            let feeLimitPercent = 0.07;

            if (refundNow) {
              await sendSplitOrder(user, SYMBOLS_TO_IDS[token], [baseAmount]);
            }

            await sendSpotOrder(
              user,
              "Sell",
              expirationTimesamp,
              SYMBOLS_TO_IDS[token],
              COLLATERAL_TOKEN,
              baseAmount,
              quoteAmount,
              price,
              feeLimitPercent,
              slippage,
              type == "market"
            );
            if (type != "market") {
              setToastMessage({
                type: "info",
                message:
                  "Sell Order was placed successfuly: " +
                  baseAmount.toFixed(2) +
                  " " +
                  token +
                  " for " +
                  quoteAmount.toFixed(2) +
                  " USDC",
              });
            }
          } catch (error: any) {
            setToastMessage({
              type: "error",
              message: error.toString(),
            });
          }
        }

        setIsLoading(false);

        forceRerender();
      }}
      className="w-full py-2 uppercase rounded-md bg-red_lighter shadow-red font-overpass hover:shadow-red_dark hover:opacity-90"
    >
      {perpType == "perpetual" ? "SHORT" : "SELL"}
    </button>
  );
};

const _renderConnectButton = (connect) => {
  return (
    <button
      className="w-full px-8 py-2 font-medium text-center text-white rounded-md mt-14 bg-blue hover:opacity-75"
      onClick={() => connect()}
    >
      Connect Wallet
    </button>
  );
};

const _renderLoginButton = (isLoading, setIsLoading, login, forceRerender) => {
  return (
    <div>
      {isLoading ? (
        <div className="mt-14  flex">
          <div className="flex items-center justify-center flex-grow">
            <LoadingSpinner />
          </div>
          <div className="flex  items-center justify-center flex-grow">
            Decrypting account ...
          </div>
        </div>
      ) : (
        <button
          className="w-full px-8 py-2 font-medium text-center text-white rounded-md mt-14 bg-blue hover:opacity-75"
          onClick={async () => {
            try {
              setIsLoading(true);
              await login();
              setIsLoading(false);
              forceRerender();
            } catch (error) {
              console.log(error);
            }
          }}
        >
          Access Account
        </button>
      )}
    </div>
  );
};

module.exports = {
  _renderActionButtons,
  _renderConnectButton,
  _renderLoginButton,
};
