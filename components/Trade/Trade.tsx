import Head from "next/head";
import BookTrades from "./BookTrades/BookTrades";
import MarketStats from "./MarketStats/MarketStats";
import Orders from "./Orders/Orders";
// import Chart from "./Chart";
import TradeActions from "./TradeActions/TradeActions";
import { useContext, useEffect, useReducer, useState } from "react";
import { WalletContext } from "../../context/WalletContext";

import dynamic from "next/dynamic";
import Toast from "../Layout/Toast/Toast";
const DynamicHomeWithNoSSR = dynamic(() => import("./Chart"), { ssr: false });
const Chart = DynamicHomeWithNoSSR;

export default function Trade() {
  const { initialize, toastMessage, setToastMessage } =
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

  function onToastDismiss(_id) {
    //delay to allow animation to finish
    setTimeout(() => {
      _toasts_ = [];
      setToasts(_toasts_);
    }, 3000);
  }

  useEffect(() => {
    // Make sure you have a valid message to display
    if (toastMessage) {
      let message = toastMessage;
      setToastMessage(null);

      showToast(message);
    }
  }, [toastMessage]);

  initialize();

  return (
    <>
      <Head>
        <title>{`ZigZag Exchange`}</title>
      </Head>
      <div className="grid w-full grid-cols-4 gap-4 m-4 2xl:grid-cols-5 fadeIn">
        <TradeActions />
        <div className="w-full col-span-2 2xl:col-span-3 bg-bg_color ">
          <MarketStats />
          <Chart />
        </div>
        <div>
          <BookTrades />
        </div>
        <div className="col-span-4 2xl:col-span-5">
          <Orders />
        </div>
        {/* TOASTS */}
        {toasts ? toasts.length : null}
        {toasts && toasts.length > 0 ? (
          <div className="toast-container">
            {_toasts_.map((toast, idx) => (
              <Toast
                key={toast.id}
                id={toast.id}
                message={toast.message}
                expiry={toast.expiry}
                onDismiss={onToastDismiss}
              />
            ))}
          </div>
        ) : null}
        {/*  */}
      </div>
    </>
  );
}
