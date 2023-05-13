import React, { useContext, useEffect } from "react";
import classNames from "classnames";
import { useState } from "react";
import { Tab } from "@headlessui/react";

import DepositPanel from "./DepositPanel";
import WithdrawPanel from "./WithdrawPanel";
import Toast from "../Layout/Toast/Toast";
import { WalletContext } from "../../context/WalletContext";

const Transact = () => {
  const { initialize, setToastMessage, toastMessage } =
    useContext(WalletContext);

  let [toasts, setToasts] = useState<any>([]);
  let _toasts_: any[] = toasts;

  const showToast = (message) => {
    if (!message) return;

    const id = new Date().getTime();

    let expiry = new Date().getTime() + 3000;

    _toasts_ = [..._toasts_, { id, message, expiry }];

    _toasts_ = _toasts_.filter((toast) => toast.expiry > new Date().getTime());

    setToasts(_toasts_);
  };

  const onToastDismiss = (id) => {
    _toasts_ = _toasts_.filter((toast) => toast.id !== id);

    let now = new Date().getTime();

    setToastMessage(null);
  };

  useEffect(() => {
    // Make sure you have a valid message to display
    if (toastMessage) {
      let message = toastMessage;
      setToastMessage(null);

      showToast(message);
    }
  }, [toastMessage]);

  let [categories] = useState(["Deposit", "Withdraw"]);

  initialize();

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
        {_toasts_.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            expiry={toast.expiry}
            onDismiss={() => onToastDismiss(toast.id)}
          />
        ))}
      </div>
      {/*  */}
    </div>
  );
};

export default Transact;
