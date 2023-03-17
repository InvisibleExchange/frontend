import { useState } from "react";
import { Tab } from "@headlessui/react";
import { useSelector } from "react-redux";
import classNames from "classnames";
import LimitTabPanel from "../LimitTabPanel";
import MarketTabPanel from "../MarketTabPanel";

const PerpetualForm = ({ perpType, token }: any) => {
  let [categories] = useState(["Limit", "Market"]);

  return (
    <div>
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
          <LimitTabPanel perpType={perpType} token={token} action="none" />
          <MarketTabPanel perpType={perpType} token={token} action="none" />
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default PerpetualForm;
