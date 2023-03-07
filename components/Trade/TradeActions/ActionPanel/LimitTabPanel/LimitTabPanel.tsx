import React from "react";
import { Tab } from "@headlessui/react";
import classNames from "classnames";
import TradeForm from "../TradeForm";

const LimitTabPanel = ({ perpType, token }) => {
  return (
    <Tab.Panel className={classNames("rounded-xl p-3 outline-none")}>
      <TradeForm type="limit" perpType={perpType} token={token} />
    </Tab.Panel>
  );
};

export default LimitTabPanel;
