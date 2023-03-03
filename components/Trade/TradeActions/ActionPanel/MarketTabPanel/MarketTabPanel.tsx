import React from "react";
import { Tab } from "@headlessui/react";
import classNames from "classnames";
import TradeForm from "../TradeForm";

const MarketTabPanel = () => {
  return (
    <Tab.Panel className={classNames("rounded-xl p-3")}>
      <TradeForm type="market" />
    </Tab.Panel>
  );
};

export default MarketTabPanel;
