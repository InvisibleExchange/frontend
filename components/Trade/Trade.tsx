import Head from "next/head";
import BookTrades from "./BookTrades/BookTrades";
import MarketStats from "./MarketStats/MarketStats";
import Orders from "./Orders/Orders";
import Chart from "./Chart";
import TradeActions from "./TradeActions/TradeActions";
import { useContext, useReducer, useState } from "react";
import { WalletContext } from "../../context/WalletContext";

export default function Trade() {
  const { initialize } = useContext(WalletContext);

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [currentMarket, setCurrentMarket] = useState<any>({
    pairs: "ETH/USDC",
    perpetual: "ETH-Perpetual",
  });
  const [type, setType] = useState<any>("perpetual");

  function forceRerender() {
    console.log("rerender");
    forceUpdate();
  }

  initialize();

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
          <MarketStats />
          {/* <Chart /> */}
        </div>
        <div>
          <BookTrades
            token={
              type == "perpetual"
                ? currentMarket.perpetual.split("-")[0]
                : currentMarket.pairs.split("/")[0]
            }
            type={type}
          />
        </div>
        <div className="col-span-4 2xl:col-span-5">
          <Orders />
        </div>
      </div>
    </>
  );
}
