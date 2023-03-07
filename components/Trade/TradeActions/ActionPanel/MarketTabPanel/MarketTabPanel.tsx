import React from "react";
import { Tab } from "@headlessui/react";
import classNames from "classnames";
import TradeForm from "../TradeForm";

const MarketTabPanel = ({ perpType, token }) => {
  return (
    <Tab.Panel className={classNames("rounded-xl p-3")}>
      <TradeForm type="market" perpType={perpType} token={token} />
    </Tab.Panel>
  );
};

export default MarketTabPanel;
