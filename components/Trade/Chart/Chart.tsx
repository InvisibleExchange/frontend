import React from "react";
import TradingViewWidget, { Themes } from "react-tradingview-widget";

const Chart = ({ token }: any) => {
  const symbols = { BTC: "BINANCE:BTCUSD", ETH: "BINANCE:ETHUSD" };

  return (
    <div>
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
      />
    </div>
  );
};

export default Chart;
