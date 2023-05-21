const {
  formatInputNum,
  calculateNewSize,
  calculateAvgEntryPrice,
  calculateNewLiqPrice,
} = require("./FormHelpers");

const {
  DECIMALS_PER_ASSET,
  PRICE_DECIMALS_PER_ASSET,
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
        10 ** DECIMALS_PER_ASSET[positionData.synthetic_token]
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
                    10 ** DECIMALS_PER_ASSET[positionData.synthetic_token]
                  ).toFixed(3)}
                </a>
                {"  =>  "}
                <a style={{ color: colorAfter }}>
                  {newPositionSize.toFixed(3)}{" "}
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
                  10 ** PRICE_DECIMALS_PER_ASSET[positionData.synthetic_token]
                ).toFixed(3)}
                {"  =>  "}
                {calculateAvgEntryPrice(
                  positionData,
                  Number(baseAmount),
                  Number(price),
                  action == "Long"
                ).toFixed(2)}{" "}
                USD
              </strong>
            </div>

            {/* // * EST. LIQ PRICE */}
            <div className="mt-3 flex items-center justify-between px-1">
              <strong> Liq. Price: </strong>
              <strong>
                {(
                  positionData.liquidation_price /
                  10 ** PRICE_DECIMALS_PER_ASSET[positionData.synthetic_token]
                ).toFixed(3)}
                {"  =>   ~"}
                {calculateNewLiqPrice(
                  positionData,
                  Number(baseAmount),
                  Number(price),
                  action == "Long"
                ).toFixed(2)}{" "}
                USD
              </strong>
            </div>
          </div>
        </p>
      </div>
    </div>
  );
};

export default UpdatedPositionInfo;
