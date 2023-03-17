import React from "react";
import { Tab } from "@headlessui/react";
import classNames from "classnames";
import TradeForm from "../TradeForm";

const LimitTabPanel = ({ perpType, token, action }) => {
  return (
    <Tab.Panel className={classNames("rounded-xl p-3 outline-none")}>
      <TradeForm
        type="limit"
        perpType={perpType}
        token={token}
        action={action}
      />
    </Tab.Panel>
  );
};

export default LimitTabPanel;
