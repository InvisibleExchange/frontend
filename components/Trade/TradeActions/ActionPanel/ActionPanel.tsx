import { useContext, useState } from "react";
import { Tab } from "@headlessui/react";

import classNames from "classnames";
import LimitTabPanel from "./LimitTabPanel";
import MarketTabPanel from "./MarketTabPanel";
import WalletContext from "../../../../context/WalletContext";
import PerpetualForm from "./PerpetualForm/PerpetualForm";
import SpotForm from "./SpotForm";

const ActionPanel = ({ perpType, token }) => {
  let [categories] = useState(["Limit", "Market"]);

  return (
    <div>
      {perpType == "perpetual" ? (
        <PerpetualForm perpType={perpType} token={token} />
      ) : (
        <SpotForm perpType={perpType} token={token} />
      )}

      {/* <Tab.Group>
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
          <LimitTabPanel
            perpType={perpType}
            token={token}
          />
          <MarketTabPanel
            perpType={perpType}
            token={token}
          />
        </Tab.Panels>
      </Tab.Group> */}
    </div>
  );
};

export default ActionPanel;
