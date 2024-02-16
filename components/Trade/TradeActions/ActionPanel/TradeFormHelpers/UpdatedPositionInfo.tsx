import { getEstimatedNewLiqPrice } from "./FormHelpers";

const {
  formatInputNum,
  calculateNewSize,
  calculateAvgEntryPrice,
  calculateNewLiqPrice,
} = require("./FormHelpers");

const {
  DECIMALS_PER_ASSET,
  PRICE_DECIMALS_PER_ASSET,
  PRICE_ROUNDING_DECIMALS,
  SIZE_ROUNDING_DECIMALS,
} = require("../../../../../app_logic/helpers/utils");

const UpdatedPositionInfo = ({
  baseAmount,
  price,
  positionData,
  token,
  action,
}: any) => {
  if (!baseAmount) baseAmount = 0;
  if (!price) price = 0;

  let newPositionSize = calculateNewSize(
    positionData,
    Number(baseAmount),
    action == "Long"
  );

  let positionColor = positionData.order_side == "Long" ? "#3EE213" : "red";
  let colorAfter;
  if (
    action != positionData.order_side &&
    baseAmount >
      positionData.position_size /
        10 ** DECIMALS_PER_ASSET[positionData.position_header.synthetic_token]
  ) {
    if (positionData.order_side == "Long") {
      colorAfter = "red";
    }
    if (positionData.order_side == "Short") {
      colorAfter = "#3EE213";
    }
  } else {
    colorAfter = positionColor;
  }

  let priceRoundingDecimals =
    PRICE_ROUNDING_DECIMALS[positionData.position_header.synthetic_token];
  let sizeRoundingDecimals =
    SIZE_ROUNDING_DECIMALS[positionData.position_header.synthetic_token];

  return (
    <div>
      {/* <div className="ml-5 pl-5">Estimated:</div> */}
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.3)",
        }}
        className="py-5 px-3  flex items-center justify-between mt-1 font-overpass text-fg_below_color dark:text-white"
      >
        {/* // <div className="mt-1 flex items-center justify-between text-sm font-overpass text-fg_below_color dark:text-white"> */}
        <p className="text-[14px] w-full ">
          <div className="items-left justify-between">
            {/* // * SIZE */}
            <div className="flex items-center justify-between px-1">
              <strong> Size: </strong>

              <strong>
                <a
                  style={{
                    color: positionColor,
                  }}
                >
                  {(
                    positionData.position_size /
                    10 **
                      DECIMALS_PER_ASSET[
                        positionData.position_header.synthetic_token
                      ]
                  ).toFixed(sizeRoundingDecimals)}
                </a>
                {"  =>  "}
                <a style={{ color: colorAfter }}>
                  {newPositionSize.toFixed(sizeRoundingDecimals)}{" "}
                </a>
                {token}
              </strong>
            </div>

            {/* // * AVG ENTRY PRICE */}
            <div className="mt-3 flex items-center justify-between px-1">
              <strong> Avg. Entry: </strong>

              <strong>
                {(
                  positionData.entry_price /
                  10 **
                    PRICE_DECIMALS_PER_ASSET[
                      positionData.position_header.synthetic_token
                    ]
                ).toFixed(priceRoundingDecimals)}
                {"  =>  "}
                {calculateAvgEntryPrice(
                  positionData,
                  Number(baseAmount),
                  Number(price),
                  action == "Long"
                ).toFixed(priceRoundingDecimals)}{" "}
                USD
              </strong>
            </div>

            {/* // * EST. LIQ PRICE */}
            <div className="mt-3 flex items-center justify-between px-1">
              <strong> Liq. Price: </strong>
              <strong>
                {(
                  positionData.liquidation_price /
                  10 **
                    PRICE_DECIMALS_PER_ASSET[
                      positionData.position_header.synthetic_token
                    ]
                ).toFixed(priceRoundingDecimals)}
                {"  =>   ~"}
                {calculateNewLiqPrice(
                  positionData,
                  Number(baseAmount),
                  Number(price),
                  action == "Long"
                ).toFixed(priceRoundingDecimals)}{" "}
                USD
              </strong>
            </div>
          </div>
        </p>
      </div>
    </div>
  );
};

type inputArgs = {
  entryPrice_: string | null;
  margin_: string | null;
  position_size_: string | null;
  orderSide: any;
  syntheticToken: number;
  is_partial_liquidation: boolean;
};
const EstimateLiquidationPriceInfo = ({
  entryPrice_,
  margin_,
  position_size_,
  syntheticToken,
  is_partial_liquidation,
}: inputArgs) => {
  if (!entryPrice_ || !margin_ || !position_size_) return null;

  let entryPrice = Number(entryPrice_);
  let margin = Number(margin_);
  let position_size = Number(position_size_);

  let longLiqPrice = getEstimatedNewLiqPrice(
    entryPrice,
    margin,
    position_size,
    "Long",
    syntheticToken,
    is_partial_liquidation
  );

  let shortLiqPrice = getEstimatedNewLiqPrice(
    entryPrice,
    margin,
    position_size,
    "Short",
    syntheticToken,
    is_partial_liquidation
  );

  let priceRoundingDecimals = PRICE_ROUNDING_DECIMALS[syntheticToken];

  return (
    <div>
      {/* <div className="ml-5 pl-5">Estimated:</div> */}
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.3)",
        }}
        className="py-5 px-3  flex items-center justify-between mt-1 font-overpass text-fg_below_color dark:text-white"
      >
        {/* // <div className="mt-1 flex items-center justify-between text-sm font-overpass text-fg_below_color dark:text-white"> */}
        <p className="text-[14px] w-full ">
          <div className="items-left justify-between">
            {/* // * EST. LIQ PRICE */}

            <div className="mt-3 flex items-center justify-between px-1">
              <strong> Long Liq. Price: </strong>
              <strong>Short Liq.Price:</strong>
            </div>

            <div className="mt-3 flex items-center justify-between px-1">
              <strong>{longLiqPrice.toFixed(priceRoundingDecimals)} USD</strong>
              <strong>
                {shortLiqPrice.toFixed(priceRoundingDecimals)} USD
              </strong>
            </div>
          </div>
        </p>
      </div>
    </div>
  );
};

export { UpdatedPositionInfo, EstimateLiquidationPriceInfo };
