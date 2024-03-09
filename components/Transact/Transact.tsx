import React, { useContext, useEffect } from "react";
import classNames from "classnames";
import { useState } from "react";
import { Tab } from "@headlessui/react";

import DepositPanel from "./DepositPanel";
import WithdrawPanel from "./WithdrawPanel";
import Toast from "../Layout/Toast/Toast";
import { UserContext } from "../../context/UserContext";
import LandingModal from "../Layout/LandingModal/LandingModal";
import BridgePanel from "./BridgePanel";

const Transact = () => {
  const { initialize, initialized, setToastMessage, toastMessage } =
    useContext(UserContext);

  let [toasts, setToasts] = useState<any>([]);
  let _toasts_: any[] = toasts;

  const showToast = (type, message) => {
    if (!message) return;

    const id = new Date().getTime();

    let exp = type == "pending_tx" ? 7500 : 3000;
    let expiry = new Date().getTime() + exp;

    _toasts_ = [..._toasts_, { id, type, message, expiry }];

    _toasts_ = _toasts_.filter((toast) => toast.expiry > new Date().getTime());

    setToasts(_toasts_);
  };

  const onToastDismiss = () => {
    //delay to allow animation to finish
    setTimeout(() => {
      _toasts_ = [];
      setToasts(_toasts_);
    }, 3000);
  };

  useEffect(() => {
    // Make sure you have a valid message to display
    if (toastMessage) {
      let type = toastMessage.type;
      let message = toastMessage.message;

      setToastMessage(null);

      showToast(type, message);
    }
  }, [toastMessage]);

  let [categories] = useState(["Deposit", "Withdraw", "Bridge"]);

  initialize();

  const getCategoryColor = (category: string) => {
    let selectedColor: string;
    if (category === "Deposit") {
      selectedColor = " bg-green_lighter shadow-green";
    } else if (category === "Withdraw") {
      selectedColor = " bg-red_lighter shadow-red";
    } else {
      selectedColor = "bg-blue shadow-blue";
    }

    return selectedColor;
  };

  return (
    <div className="flex justify-center w-full">
      <LandingModal shouldOpen={!initialized} />

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
                      ? getCategoryColor(category)
                      : getCategoryColor(category) +
                          " opacity-30 hover:opacity-70"
                  )
                }
              >
                {category}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="mt-2">
            <Tab.Panel>
              <DepositPanel showToast={setToastMessage} />
            </Tab.Panel>
            <Tab.Panel>
              <WithdrawPanel />
            </Tab.Panel>
            <Tab.Panel>
              <BridgePanel />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

      {/* TOASTS */}
      {toasts && toasts.length > 0 ? (
        <div className="toast-container">
          {_toasts_.map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              expiry={toast.expiry}
              onDismiss={() => onToastDismiss}
              type={toast.type}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default Transact;
