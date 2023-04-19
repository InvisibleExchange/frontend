import React, { useContext, useEffect, useRef, useState } from "react";
import TradingViewWidget, { Themes } from "react-tradingview-widget";
import { WalletContext } from "../../../context/WalletContext";

const Chart = () => {
  // const symbols = { BTC: "BINANCE:BTCUSD", ETH: "BINANCE:ETHUSD" };

  const { selectedType, selectedMarket } = useContext(WalletContext);

  let token =
    selectedType == "perpetual"
      ? selectedMarket.perpetual.split("-")[0]
      : selectedMarket.pairs.split("/")[0];

  const divStyle: React.CSSProperties = {
    height: "100%",
  };

  const [parentHeight, setParentHeight] = useState<number | undefined>();
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (parentRef.current) {
      const height = parentRef.current.offsetHeight; // get height in pixels
      setParentHeight(height);
    }
  }, [selectedType, selectedMarket]);

  return (
    <div style={divStyle} ref={parentRef}>
      {parentHeight && <ChartInner token={token} height={parentHeight} />}
    </div>
  );
};

export default Chart;

const ChartInner = ({ token, height }: any) => {
  const symbols = { BTC: "BINANCE:BTCUSD", ETH: "BINANCE:ETHUSD" };

  useEffect(() => {}, [token, height]);

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
      height={Number.parseInt((height * 0.95).toString())}
    />
  );
};
