import React, { useContext } from "react";
import { useSelector } from "react-redux";
import { WalletContext } from "../../../../../context/WalletContext";
import { tradeTypeSelector } from "../../../../../lib/store/features/apiSlice";

import TooltipPerpetualSlider from "../TooltipPerpetualSlider";
import TooltipSpotSlider from "../TooltipSpotSlider";

type props = {
  type: string;
};

const TradeForm = ({ type }: props) => {
  const { userAddress, username, network, connect, disconnect } =
    useContext(WalletContext);

  const tradeType = useSelector(tradeTypeSelector);

  function percentFormatter(v: any) {
    return `${v}`;
  }

  function log(value: any) {
    console.log(value); //eslint-disable-line
  }

  const _renderActionButtons = () => {
    return (
      <div className="flex items-center gap-2 mt-14">
        <button className="w-full py-2 uppercase rounded-md bg-green_lighter shadow-green font-overpass hover:shadow-green_dark hover:opacity-90">
          BUY
        </button>
        <button className="w-full py-2 uppercase rounded-md bg-red_lighter shadow-red font-overpass hover:shadow-red_dark hover:opacity-90">
          SELL
        </button>
      </div>
    );
  };

  const _renderConnectButton = () => {
    return (
      <button
        className="w-full px-8 py-2 font-medium text-center text-white rounded-md mt-14 bg-blue hover:opacity-75"
        onClick={() => connect()}
      >
        Connect Wallet
      </button>
    );
  };

  return (
    <div className="mt-2">
      <div className="relative">
        <input
          name="price"
          className="w-full py-1.5 pl-4 font-light tracking-wider bg-white rounded-md outline-none ring-1 dark:bg-border_color ring-border_color disabled:opacity-40"
          placeholder="Price"
          readOnly={type === "market"}
        />
        <button className="absolute top-0 py-2 text-sm right-3 dark:text-yellow text-blue hover:opacity-75">
          Last Price
        </button>
      </div>
      <div className="relative mt-6">
        <input
          name="price"
          className="w-full py-1.5 pl-4 font-light tracking-wider bg-white rounded-md outline-none ring-1 dark:bg-border_color ring-border_color"
          placeholder="Amount"
        />
        <div className="absolute top-0 right-0 w-16 px-3 py-1.5 text-base font-light text-center dark:font-medium font-overpass text-fg_below_color dark:text-white bg-border_color rounded-r-md">
          ETH
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 text-sm text-fg_below_color dark:text-white">
        <p className="text-[12px]">Available balance</p>
        <p>0 ETH</p>
      </div>
      <div className="relative mt-5">
        <input
          name="price"
          className="w-full py-1.5 pl-4 font-light tracking-wider bg-white rounded-md outline-none ring-1 dark:bg-border_color ring-border_color"
          placeholder="Total"
        />
        <div className="absolute top-0 right-0 w-16 px-3 py-1.5 text-base font-light text-center dark:font-medium font-overpass text-fg_below_color dark:text-white bg-border_color rounded-r-md">
          USDC
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 text-sm text-fg_below_color dark:text-white">
        <p className="text-[12px]">Available balance</p>
        <p>0 USDC</p>
      </div>
      <div className="mx-2 mt-12">
        {tradeType.name === "Perpetual" ? (
          <TooltipPerpetualSlider
            tipFormatter={percentFormatter}
            tipProps={{ overlayClassName: "foo" }}
            onChange={log}
          />
        ) : (
          <TooltipSpotSlider
            tipFormatter={percentFormatter}
            tipProps={{ overlayClassName: "foo" }}
            onChange={log}
          />
        )}
      </div>
      {userAddress ? _renderActionButtons() : _renderConnectButton()}
      <div className="flex items-center justify-between mt-4 text-sm font-overpass text-fg_below_color dark:text-white">
        <p className="font-light text-[12px]">Network fee</p>
        <p>0.0001408 ETH</p>
      </div>
    </div>
  );
};

export default TradeForm;
