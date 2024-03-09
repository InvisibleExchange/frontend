import React from "react";

import { LiFiWidget, WidgetConfig } from "@lifi/widget";

const BridgePanel = () => {
  const widgetConfig: WidgetConfig = {
    containerStyle: {
      marginTop: "20px",
      border: "1px solid bg-blue",
      borderRadius: "16px",
    },
    theme: {
      palette: {
        primary: { main: "#06366d" },
        secondary: { main: "#00b3ff" },
      },
    },
    integrator: "Invisible Exchange",
    variant: "expandable",
    toChain: 42161,
    referrer: "invisible.exchange",
  };
  return <LiFiWidget integrator="Invisible Exchange" config={widgetConfig} />;
  //
  // return <div>LIFI WIDGET GOES HERE</div>;
};

export default BridgePanel;
