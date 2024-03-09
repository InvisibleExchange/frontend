import type { NextPage } from "next";
import dynamic from "next/dynamic";

import LoadingSpinner from "../../Layout/LoadingSpinner/LoadingSpinner";

export const LiFiWidgetNext = dynamic(
  () => import("./BridgePanel").then((module) => module.default) as any,
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          paddingTop: "10rem",
          paddingLeft: "15rem",
        }}
      >
        <LoadingSpinner />
      </div>
    ),
  }
);

const BridgePanel: NextPage = () => {
  return <LiFiWidgetNext />;
};

export default BridgePanel;
