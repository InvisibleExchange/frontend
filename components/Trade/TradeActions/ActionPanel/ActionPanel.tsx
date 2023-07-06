import { useContext } from "react";

import PerpetualFormWrapper from "./PerpetualForm/PerpetualFormWrapper";
import SpotFormWrapper from "./SpotForm/SpotFormWrapper";
import { UserContext } from "../../../../context/UserContext";

const ActionPanel = () => {
  const { selectedType, selectedMarket } = useContext(UserContext);

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
