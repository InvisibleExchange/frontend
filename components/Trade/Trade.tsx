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
  const showToast = (message) => {
    console.log("showToast", message);
    if (!message) return;

    const id = new Date().getTime();

    setToasts([...toasts, { id, message }]);
    setToastMessage(null);
  };
  const onToastDismiss = (id) => {
    setToasts(toasts.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    console.log(toastMessage);

    // Make sure you have a valid message to display
    if (toastMessage) {
      showToast(toastMessage);
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
    </>
  );
}
