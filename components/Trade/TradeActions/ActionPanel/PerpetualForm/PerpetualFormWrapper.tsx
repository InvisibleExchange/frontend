import { useContext, useState } from "react";
import { RadioGroup, Tab } from "@headlessui/react";
import classNames from "classnames";
import TradeForm from "./PerpetualForm";
import { WalletContext } from "../../../../../context/WalletContext";

const { SYMBOLS_TO_IDS } = require("../../../../../app_logic/helpers/utils");

const plans = [
  {
    name: "Long",
  },
  {
    name: "Short",
  },
];

const PerpetualFormWrapper = ({ token }: any) => {
  let { user, getSelectedPosition } = useContext(WalletContext);

  let selectedPosition = getSelectedPosition();
  let positionData;
  if (selectedPosition) {
    positionData = selectedPosition;
  } else if (user && user.userId) {
    let posData = user.positionData[SYMBOLS_TO_IDS[token]];
    if (posData && posData.length > 0) {
      positionData = posData[0];
    }
  } else {
    positionData = null;
  }

  let defaultPlan =
    positionData && positionData.order_side == "Long" ? plans[0] : plans[1];

  let [categories] = useState(["Limit", "Market"]);
  const [selected, setSelected] = useState<any>(defaultPlan);

  return (
    <div>
      {/* BUY / SELL ORDER SELECTOR */}
      {positionData ? (
        <RadioGroup value={selected} onChange={setSelected}>
          <div className="flex items-center justify-center py-1 mx-3 mt-5 rounded-lg bg-fg_below_color">
            {plans.map((plan) => (
              <RadioGroup.Option
                key={plan.name}
                value={plan}
                className={({ active, checked }) =>
                  `${active ? "mx-1" : "mx-1"}
                  ${
                    checked &&
                    plan.name === "Long" &&
                    " text-white bg-green_lighter shadow-green"
                  }
                  ${
                    checked &&
                    plan.name === "Short" &&
                    " text-white bg-red_lighter shadow-red"
                  } w-full rounded-lg py-1.5 cursor-pointer`
                }
              >
                {({ active, checked }) => (
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
            ))}
          </div>
        </RadioGroup>
      ) : null}
      {/* MARKET / LIMIT ORDER SELECTOR */}
      <Tab.Group>
        <Tab.List className="flex pl-4 space-x-5 rounded-xl bg-blue-900/20">
          {categories.map((category) => (
            <Tab
              key={category}
              className={({ selected }) =>
                classNames(
                  "rounded-lg pt-4 text-sm font-medium leading-5 tracking-wider outline-none",
                  selected ? "text-blue hover:outline-none" : ""
                )
              }
            >
              {category}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-2">
          <Tab.Panel className={classNames("rounded-xl p-3")}>
            <TradeForm
              type="limit"
              token={token}
              action={!positionData ? "none" : selected.name}
              positionData={positionData}
            />
          </Tab.Panel>

          <Tab.Panel className={classNames("rounded-xl p-3")}>
            <TradeForm
              type="market"
              token={token}
              action={!positionData ? "none" : selected.name}
              positionData={positionData}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default PerpetualFormWrapper;
