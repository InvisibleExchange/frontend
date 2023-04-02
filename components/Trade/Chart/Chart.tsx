import React, { useContext, useEffect, useRef } from "react";
import TradingViewWidget, { Themes } from "react-tradingview-widget";
import { WalletContext } from "../../../context/WalletContext";

const Chart = () => {
  const symbols = { BTC: "BINANCE:BTCUSD", ETH: "BINANCE:ETHUSD" };

  const chartRef = useRef<any>();

  const { selectedType, selectedMarket } = useContext(WalletContext);

  let token =
    selectedType == "perpetual"
      ? selectedMarket.perpetual.split("-")[0]
      : selectedMarket.pairs.split("/")[0];

  useEffect(() => {}, [token]);

  return (
    <div>
      {token}
      {selectedType}
      <TradingViewWidget
        ref={chartRef}
        symbol={symbols[token]}
        theme={Themes.DARK}
        save_image={false}
        hide_top_toolbar={false}
        container_id="tradingview_7f572"
        interval="60"
        timezone="Etc/UTC"
        locale="en"
        enable_publishing={false}
        hide_legend={false}
      />
    </div>
  );
};

export default Chart;
