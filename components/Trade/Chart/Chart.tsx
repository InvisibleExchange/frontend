import React, { useContext, useEffect, useRef, useState } from "react";
import TradingViewWidget from "react-ts-tradingview-widgets";
import { UserContext } from "../../../context/UserContext";

import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";

const Chart = () => {
  const { selectedType, selectedMarket } = useContext(UserContext);

  let token =
    selectedType == "perpetual"
      ? selectedMarket.perpetual.split("-")[0]
      : selectedMarket.pairs.split("/")[0];

  const divStyle: React.CSSProperties = {
    height: "96%",
  };

  const parentRef = useRef<HTMLDivElement>(null);

  return (
    <div style={divStyle} ref={parentRef}>
      <ChartInner token={token} />
    </div>
  );
};

export default Chart;

const ChartInner = ({ token }: any) => {
  const symbols = {
    BTC: "COINBASE:BTCUSD",
    ETH: "COINBASE:ETHUSD",
    SOL: "BINANCE:SOLUSDT",
  };

  useEffect(() => {
    console.log("token", token, symbols[token]);
  }, [token]);

  return (
    <>
      {Object.keys(symbols).map((key) => (
        <div
          style={{ height: "100%", display: key === token ? "block" : "none" }}
          key={key}
        >
          <AdvancedRealTimeChart
            theme="dark"
            autosize
            allow_symbol_change={true}
            container_id={`tradingview_${key}`}
            symbol={symbols[key]}
            interval="60"
            timezone="Etc/UTC"
            locale="en"
            enable_publishing={false}
            hide_legend={true}
            save_image={false}
            hide_side_toolbar={true}
            style="1"
          />
        </div>
      ))}
    </>
  );
};
