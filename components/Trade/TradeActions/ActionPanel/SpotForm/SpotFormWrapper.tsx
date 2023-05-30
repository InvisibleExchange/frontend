import { useContext, useEffect, useState } from "react";
import { Tab, RadioGroup } from "@headlessui/react";
import classNames from "classnames";

import TradeForm from "./SpotForm";
import { WalletContext } from "../../../../../context/WalletContext";

const plans = [
  {
    name: "buy",
  },
  {
    name: "sell",
  },
];

const SpotFormWrapper = ({ token }: any) => {
  let { formInputs } = useContext(WalletContext);

  let [categories] = useState(["Limit", "Market"]);
  const [selected, setSelected] = useState<any>(plans[0]);

  const [rerenderCount, setRerenderCount] = useState<any>(0);
  const [selectedMarketType, setSelectedMarketType] = useState<
    "limit" | "market"
  >("limit");

  useEffect(() => {
    setRerenderCount(rerenderCount + 1);

    if (formInputs && formInputs.side) {
      if (formInputs.side == "Bid") {
        setSelected({ name: "sell" });
      } else {
        setSelected({ name: "buy" });
      }
    }
  }, [formInputs]);

  return (
    <div>
      {/* BUY / SELL ORDER SELECTOR */}
      <RadioGroup value={selected} onChange={setSelected}>
        <div className="flex items-center justify-center py-1 mx-3 mt-5 rounded-lg bg-fg_below_color">
          {plans.map((plan) => {
            let checked = selected.name === plan.name;

            return (
              <RadioGroup.Option
                key={plan.name}
                value={plan}
                className={() =>
                  `
                ${
                  checked &&
                  plan.name === "buy" &&
                  " text-white bg-green_lighter shadow-green"
                }
                ${
                  checked &&
                  plan.name === "sell" &&
                  " text-white bg-red_lighter shadow-red"
                } w-full rounded-lg py-1.5 cursor-pointer`
                }
              >
                {() => (
                  <>
                    <div className="text-center">
                      <RadioGroup.Label
                        as="p"
                        className={`font-medium block uppercase text-sm  ${
                          checked ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {plan.name}
                      </RadioGroup.Label>
                    </div>
                  </>
                )}
              </RadioGroup.Option>
            );
          })}
        </div>
      </RadioGroup>

      {/* MARKET / LIMIT ORDER SELECTOR */}
      <div className="flex pl-4 space-x-5  rounded-xl bg-blue-900/20">
        <div
          key={"Limit"}
          className={classNames(
            "rounded-lg pt-4 text-sm font-medium leading-5 cursor-pointer tracking-wider outline-none",
            selectedMarketType == "limit" ? "text-blue hover:outline-none" : ""
          )}
          onClick={() => setSelectedMarketType("limit")}
        >
          Limit
        </div>

        <div
          key={"Market"}
          className={classNames(
            "rounded-lg pt-4 text-sm font-medium leading-5 cursor-pointer tracking-wider outline-none",
            selectedMarketType == "market" ? "text-blue hover:outline-none" : ""
          )}
          onClick={() => setSelectedMarketType("market")}
        >
          Market
        </div>
      </div>

      <TradeForm
        key={rerenderCount}
        type={selectedMarketType}
        token={token}
        action={selected.name}
        formInputs={formInputs}
      />
    </div>
  );
};

export default SpotFormWrapper;
