import React, { useContext } from "react";
import classNames from "classnames";
import { useState } from "react";
import { Tab } from "@headlessui/react";

import DepositPanel from "./DepositPanel";
import WithdrawPanel from "./WithdrawPanel";
import Toast from "../Layout/Toast/Toast";
import { WalletContext } from "../../context/WalletContext";

const Transact = () => {
  let [toasts, setToasts] = useState<any>([]);
  const showToast = (message) => {
    console.log("showToast", message);
    if (!message) return;

    const id = new Date().getTime();

    setToasts([...toasts, { id, message }]);
  };
  const onToastDismiss = (id) => {
    setToasts(toasts.filter((toast) => toast.id !== id));
  };

  let [categories] = useState(["Deposit", "Withdraw"]);

  return (
    <div className="flex justify-center w-full">
      <div className="w-[500px] mt-10  rounded-lg">
        <Tab.Group>
          <Tab.List className="flex p-1 space-x-2 rounded-xl bg-blue-900/20">
            {categories.map((category, index) => (
              <Tab
                key={index}
                className={({ selected }) =>
                  classNames(
                    "w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 text-white",
                    " uppercase rounded-md font-overpass hover:opacity-100 outline-none",
                    selected
                      ? classNames(
                          category === "Deposit"
                            ? "bg-green_lighter shadow-green "
                            : "bg-red_lighter shadow-red "
                        )
                      : classNames(
                          category === "Deposit"
                            ? "bg-green_lighter opacity-30 hover:opacity-70"
                            : "bg-red_lighter opacity-30  hover:opacity-70"
                        )
                  )
                }
              >
                {category}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-2">
            <Tab.Panel>
              <DepositPanel showToast={showToast} />
            </Tab.Panel>
            <Tab.Panel>
              <WithdrawPanel />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

      {/* TOASTS */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            onDismiss={() => onToastDismiss(toast.id)}
          />
        ))}
      </div>
      {/*  */}
    </div>
  );
};

export default Transact;
