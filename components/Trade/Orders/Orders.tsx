import React, { useState } from "react";
import { Tab } from "@headlessui/react";
import classNames from "classnames";
import OpenOrders from "./OpenOrders";
import Positions from "./Positions";
import FillHistory from "./FillHistory";
import Balances from "./Balances";

const Orders = () => {
  let [categories] = useState([
    "Positions",
    "Open Orders",
    "Fill History",
    "Balances",
  ]);

  return (
    <div className="border rounded-sm border-border_color ">
      <Tab.Group>
        <Tab.List className="flex pl-4 space-x-5 bg-blue-900/20 bg-fg_above_color">
          {categories.map((category) => (
            <Tab
              key={category}
              className={({ selected }) =>
                classNames(
                  "rounded-lg py-3 text-sm font-medium leading-5 tracking-wider outline-none",
                  selected
                    ? "dark:text-white text-blue hover:outline-none"
                    : "text-fg_below_color"
                )
              }
            >
              {category}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="min-h-[300px]">
          <Tab.Panel className={classNames("outline-none")}>
            <Positions />
          </Tab.Panel>
          <Tab.Panel className={classNames("outline-none")}>
            <OpenOrders />
          </Tab.Panel>
          <Tab.Panel className={classNames("outline-none")}>
            <FillHistory />
          </Tab.Panel>
          <Tab.Panel className={classNames("outline-none")}>
            <Balances />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default Orders;
