import Head from "next/head";
import BookTrades from "./BookTrades/BookTrades";
import MarketStats from "./MarketStats/MarketStats";
import Orders from "./Orders/Orders";
// import Chart from "./Chart";
import TradeActions from "./TradeActions/TradeActions";
import { useContext, useEffect, useReducer, useState } from "react";
import { WalletContext } from "../../context/WalletContext";

import { marketList } from "../../data/markets";

import dynamic from "next/dynamic";
const DynamicHomeWithNoSSR = dynamic(() => import("./Chart"), { ssr: false });
const Chart = DynamicHomeWithNoSSR;

export default function Trade() {
  const {
    initialize,
    selectedType,
    setSelectedType,
    selectedMarket,
    setSelectedMarket,
  } = useContext(WalletContext);

  const [currentMarket, setCurrentMarket] = useState<any>(() => {
    return selectedMarket ? selectedMarket : marketList[0];
  });
  const [type, setType] = useState<any>(() => {
    return selectedType ? selectedType : "perpetual";
  });

  useEffect(() => {
    setSelectedType(type);
    setSelectedMarket(currentMarket);
  }, [type, currentMarket]);

  initialize();

  let token =
    type == "perpetual"
      ? currentMarket.perpetual.split("-")[0]
      : currentMarket.pairs.split("/")[0];

  return (
    <>
      <Head>
        <title>{`ZigZag Exchange`}</title>
      </Head>
      <div className="grid w-full grid-cols-4 gap-4 m-4 2xl:grid-cols-5 fadeIn">
        <TradeActions
          setGlobalMarket={setCurrentMarket}
          globalMarket={currentMarket}
          setGlobalType={setType}
          globalType={type}
        />
        <div className="w-full col-span-2 2xl:col-span-3 bg-bg_color ">
          <MarketStats token={token} perpType={type} />
          {/* <Chart token={token} /> */}
        </div>
        <div>
          <BookTrades token={token} type={type} />
        </div>
        <div className="col-span-4 2xl:col-span-5">
          <Orders />
        </div>
      </div>
    </>
  );
}
