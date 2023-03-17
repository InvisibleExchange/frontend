import LoadingSpinner from "../../../../Layout/LoadingSpinner/LoadingSpinner";

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

const {
  sendSpotOrder,
  sendPerpOrder,
} = require("../../../../../app_logic/transactions/constructOrders");

const _renderActionButtons = (
  user,
  baseAmount,
  price,
  perpType,
  positionData,
  token,
  type,
  quoteAmount,
  forceRerender,
  action
) => {

  return (
    <>
      {action === "none" ? (
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
            forceRerender
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
            forceRerender
          )}
        </div>
      ) : action === "buy" ? (
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
            forceRerender
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
            forceRerender
          )}
        </div>
      )}

      <div className="flex items-center gap-2 mt-14"></div>
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
  forceRerender
) => {
  return (
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
                !checkViableSizeAfterIncrease(positionData, baseAmount, price)
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
  forceRerender
) => {
  return (
    <button
      onClick={async () => {
        if (perpType == "perpetual") {
          try {
            if (positionData && positionData.order_side == "Short") {
              if (
                !checkViableSizeAfterIncrease(positionData, baseAmount, price)
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
        <div className="mt-14 ml-32 mr-32">
          <LoadingSpinner />
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
          Login
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
