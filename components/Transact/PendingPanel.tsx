import React from "react";

const PendingPanel = ({ type }: any) => {
  return (
    <div>
      <p className="uppercase">Pending {type}</p>
      <div className="flex items-center w-full mt-5 rounded-l-lg bg-border_color">
        <p className="w-full py-2.5 pl-5 text-gray_light">10 ETH</p>
        <button className="px-8 py-2.5 rounded-lg bg-blue hover:opacity-70 text-white">
          Claim
        </button>
      </div>
      <div className="flex items-center w-full mt-5 rounded-l-lg bg-border_color">
        <p className="w-full py-2.5 pl-5 text-gray_light">10 USDC</p>
        <button className="px-8 py-2.5 rounded-lg bg-blue hover:opacity-70 text-white">
          Claim
        </button>
      </div>
    </div>
  );
};

export default PendingPanel;
