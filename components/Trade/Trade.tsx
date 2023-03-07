import Head from "next/head";
import BookTrades from "./BookTrades/BookTrades";
import MarketStats from "./MarketStats/MarketStats";
import Orders from "./Orders/Orders";
import Chart from "./Chart";
import TradeActions from "./TradeActions/TradeActions";
import { useReducer } from "react";

export default function Trade() {
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  function forceRerender() {
    forceUpdate();
  }

  return (
    <>
      <Head>
        <title>{`ZigZag Exchange`}</title>
      </Head>
      <div className="grid w-full grid-cols-4 gap-4 m-4 2xl:grid-cols-5 fadeIn">
        <TradeActions />
        <div className="w-full col-span-2 2xl:col-span-3 bg-bg_color ">
          <MarketStats />
          {/* <Chart /> */}
        </div>
        <div>
          <BookTrades />
        </div>
        <div className="col-span-4 2xl:col-span-5">
          <Orders rerenderPage={forceRerender} />
        </div>
      </div>
    </>
  );
}
