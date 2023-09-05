import React, { useContext, useEffect, useRef, useState } from "react";
import TradingViewWidget, { Themes } from "react-tradingview-widget";
import { UserContext } from "../../../context/UserContext";

const Chart = () => {
  const { selectedType, selectedMarket } = useContext(UserContext);

  let token =
    selectedType == "perpetual"
      ? selectedMarket.perpetual.split("-")[0]
      : selectedMarket.pairs.split("/")[0];

  const divStyle: React.CSSProperties = {
    height: "100%",
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
    PEPE: "BINANCE:PEPEUSDT",
  };

  useEffect(() => {}, [token]);

  return (
    <TradingViewWidget
      symbol={symbols[token]}
      theme={Themes.DARK}
      save_image={false}
      hide_top_toolbar={false}
      container_id="tradingview_7f572"
      interval="60"
      timezone="Etc/UTC"
      locale="en"
      enable_publishing={false}
      hide_legend={true}
      autosize
    />
  );
};
