const {
  formatInputNum,
  calculateNewSize,
  calculateAvgEntryPrice,
  calculateNewLiqPrice,
} = require("./FormHelpers");

const UpdatedPositionInfo = ({
  baseAmount,
  price,
  positionData,
  token,
}: any) => {
  return (
    <div className="mt-1 flex items-center justify-between text-sm font-overpass text-fg_below_color dark:text-white">
      <p className="text-[12px] w-full">
        <div className="items-left justify-between">
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
            Avg Entry:{" "}
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
            ~Liq. Price:{" "}
            <strong>
              {" "}
              {baseAmount && price
                ? formatInputNum(
                    calculateNewLiqPrice(
                      positionData,
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
      <div
        className="text-[1px] border m-2"
        style={{ height: "60px" } as React.CSSProperties}
      >
        <p style={{ height: "100%" } as React.CSSProperties}>|</p>
      </div>
      <p className="text-[12px] w-full">
        <div className="items-start justify-start">
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
                : null}{" "}
              {baseAmount && price ? token : null}
            </strong>
          </div>
          <div className="mt-1">
            Avg Entry:{" "}
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
            ~Liq. Price:{" "}
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
  );
};

export default UpdatedPositionInfo;
