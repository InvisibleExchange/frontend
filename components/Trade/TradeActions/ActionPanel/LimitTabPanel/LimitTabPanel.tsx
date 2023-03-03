import React from "react";
import { Tab } from "@headlessui/react";
import classNames from "classnames";
import TradeForm from "../TradeForm";

const LimitTabPanel = () => {
  return (
    <Tab.Panel className={classNames("rounded-xl p-3 outline-none")}>
      <TradeForm type="limit" />
    </Tab.Panel>
  );
};

export default LimitTabPanel;
