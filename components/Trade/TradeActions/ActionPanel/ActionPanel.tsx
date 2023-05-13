import { useContext } from "react";

import PerpetualFormWrapper from "./PerpetualForm/PerpetualFormWrapper";
import SpotFormWrapper from "./SpotForm/SpotFormWrapper";
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
        <PerpetualFormWrapper token={token} />
      ) : (
        <SpotFormWrapper token={token} />
      )}
    </div>
  );
};

export default ActionPanel;
