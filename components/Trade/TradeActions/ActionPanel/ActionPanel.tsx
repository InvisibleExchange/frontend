import { useContext, useState } from "react";
import { Tab } from "@headlessui/react";

import PerpetualForm from "./PerpetualForm/PerpetualForm";
import SpotForm from "./SpotForm";
import { WalletContext } from "../../../../context/WalletContext";

const ActionPanel = () => {
  const { selectedType, selectedMarket } = useContext(WalletContext);

  let token =
    selectedType == "perpetual"
      ? selectedMarket.perpetual.split("-")[0]
      : selectedMarket.pairs.split("/")[0];

  return (
    <div>
      {selectedType == "perpetual" ? (
        <PerpetualForm token={token} />
      ) : (
        <SpotForm token={token} />
      )}
    </div>
  );
};

export default ActionPanel;
